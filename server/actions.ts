import { getUser } from "./prismaService";
import { PrismaClient } from "@prisma/client";
import { Socket } from "socket.io";

import { getAIResponse } from "./aiService";

const prisma = new PrismaClient();

const actions = {
  "recommend:createOrder": createOrder,
  "recommend:updateOrder": updateOrder,
  "recommend:checkStatus": lastOrderStatus,
  "recommend:finalizeOrder": finalizeOrder,
  "recommend:refund": refund,
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

    // socket.emit("order:created", newOrder); // Emit the newly created order
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
