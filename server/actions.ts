import { getUser } from "./prismaService";
import { PrismaClient, raw } from "@prisma/client";
import { Socket } from "socket.io";

import { getAIResponse, searchEmbedding } from "./aiService";

const prisma = new PrismaClient();

const actions = {
  "recommend:createOrder": createOrder,
  "recommend:updateOrder": updateOrder,
  "recommend:checkStatus": lastOrderStatus,
  "recommend:finalizeOrder": finalizeOrder,
  "recommend:refund": refund,
  "recommend:search": handleRecommendations,
};

export async function createOrder(orderData, socket) {
  const {
    session: {
      user: { email, name },
    },
  } = orderData;

  try {
    await prisma.order.create({
      data: {
        userId: (await getUser(email))!.id,
        items: orderData.items.split(","),
        status: "pending",
      },
    });

    const message = await prisma.message.create({
      data: {
        userId: (await getUser(email))!.id,
        content: "order created",
        role: "assistant",
      },
    });
    socket.emit("message:sent", { ...message, user: { name, email } });
  } catch (error) {
    console.error("Error creating order:", error);
  }
}

export async function updateOrder(orderData, socket) {
  const {
    session: {
      user: { email, name },
    },
    items,
  } = orderData;

  try {
    const user = await getUser(email);
    const lastOrder = await prisma.order.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (lastOrder) {
      await prisma.order.update({
        where: { id: lastOrder.id },
        data: { items: lastOrder.items.concat(items.split(",")) },
      });

      const message = await prisma.message.create({
        data: {
          userId: user.id,
          content: "order updated",
          role: "assistant",
        },
      });

      socket.emit("message:sent", { ...message, user: { name, email } });
    } else {
      socket.emit("message:error", "No order found to update.");
    }
  } catch (error) {
    console.error("Error updating order:", error);
  }
}

export async function lastOrderStatus(orderData, socket) {
  const {
    session: {
      user: { email, name },
    },
  } = orderData;

  try {
    const user = await getUser(email);
    const lastOrder = await prisma.order.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (lastOrder) {
      socket.emit("message:sent", {
        content: `Your last order status is: ${
          lastOrder.status
        }. ${lastOrder.items.join(", ")}`,
        user: { name, email },
      });
    } else {
      socket.emit("message:error", "No orders found.");
    }
  } catch (error) {
    console.error("Error checking order status:", error);
  }
}

export async function finalizeOrder(orderData, socket) {
  const {
    session: {
      user: { email, name },
    },
  } = orderData;

  try {
    const user = await getUser(email);
    const lastOrder = await prisma.order.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (lastOrder) {
      await prisma.order.update({
        where: { id: lastOrder.id },
        data: { status: "completed" },
      });

      const message = await prisma.message.create({
        data: {
          userId: user.id,
          content: "Order finalized",
          role: "assistant",
        },
      });

      socket.emit("message:sent", { ...message, user: { name, email } });
    } else {
      socket.emit("message:error", "No order found to finalize.");
    }
  } catch (error) {
    console.error("Error finalizing order:", error);
  }
}

export async function refund(orderData, socket) {
  const {
    session: {
      user: { email, name },
    },
  } = orderData;

  try {
    const user = await getUser(email);
    const lastOrder = await prisma.order.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (lastOrder) {
      await prisma.order.update({
        where: { id: lastOrder.id },
        data: { status: "canceled" },
      });

      const message = await prisma.message.create({
        data: {
          userId: user.id,
          content: "Order refunded",
          role: "assistant",
        },
      });

      socket.emit("message:sent", { ...message, user: { name, email } });
    } else {
      socket.emit("message:error", "No order found to refund.");
    }
  } catch (error) {
    console.error("Error processing refund:", error);
  }
}

export const handleChatMessage = async (messageData: any, socket: Socket) => {
  const {
    session: {
      user: { email, name },
    },
    content,
  } = messageData;

  try {
    // Step 1: Save the user's message to the database
    await prisma.message.create({
      data: {
        userId: (await prisma.user.findUnique({ where: { email } }))!.id,
        content,
        role: "user",
      },
    });

    // Emit the user's message
    socket.emit("message:sent", {
      content,
      user: { name },
    });

    // Step 2: Get the AI response
    const aiResponse = await getAIResponse(content);

    // Step 3: Check if the AI response includes an actionable instruction
    if (aiResponse.action) {
      // If an action exists, execute it with the parsed content
      const actionHandler = actions[aiResponse.action];
      if (actionHandler) {
        await actionHandler(
          {
            session: messageData.session,
            items: aiResponse.content, // For create or update orders
            originalMessage: content,
          },
          socket
        );
      } else {
        console.error(`Unknown action: ${aiResponse.action}`);
      }
    }
  } catch (error) {
    console.error("Error handling chat message:", error);

    // Emit an error message to the client
    socket.emit("message:sent", {
      content: "I'm sorry, something went wrong. Please try again later.",
      user: { name: "AI Customer Support" },
    });
  }
};

export async function handleRecommendations(orderData, socket) {
  const {
    originalMessage,
    session: {
      user: { email, name },
    },
  } = orderData;

  try {
    // Generate embedding for the input message
    const queryEmbeddingArray = await searchEmbedding(originalMessage);

    if (!queryEmbeddingArray || !Array.isArray(queryEmbeddingArray)) {
      throw new Error("Invalid embedding generated.");
    }

    // Format embedding for PostgreSQL
    const queryEmbedding = `[${queryEmbeddingArray.join(",")}]`;

    // Perform similarity search in the database
    const items = await prisma.$queryRaw`
      SELECT id, name, description, category, price, embedding <-> ${queryEmbedding}::vector AS distance
      FROM "MenuItem"
      ORDER BY distance ASC
      LIMIT 5
    `;

    let content = "We have these suggestions for you:";
    items.forEach((element) => {
      content += `\n- ${element.name}: $${element.price.toFixed(2)}`;
    });

    const message = await prisma.message.create({
      data: {
        userId: (await getUser(email))!.id,
        content: content,
        role: "assistant",
      },
    });

    socket.emit("message:sent", { ...message, user: { name, email } });
  } catch (error) {
    console.error("Error performing search:", error);

    // Emit error to the client
    socket.emit("search:error", {
      message: "Search failed. Please try again.",
    });
  }
}
