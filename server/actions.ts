import { getUser } from "./prismaService";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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
        data: { items: items.split(",") },
      });

      const message = await prisma.message.create({
        data: {
          userId: user.id,
          content: "order updated",
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
        content: `Your last order status is: ${lastOrder.status}`,
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
