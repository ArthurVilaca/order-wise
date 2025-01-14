import { PrismaClient } from "@prisma/client";
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const prisma = new PrismaClient();

async function getMessages(email: string) {
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return;

  const messages = await prisma.message.findMany({
    where: { userId: user!.id },
    include: {
      user: true,
    },
  });

  console.log({ messages });
  return messages;
}

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    socket.on(
      "chat_messages",
      async (messageData: { session: { email: string } }) => {
        const {
          session: { email },
        } = messageData;

        io.emit("chat_messages", await getMessages(email));
      }
    );

    // Handle incoming chat messages
    socket.on(
      "chat_message",
      async (messageData: { content: string; session: { email: string } }) => {
        const {
          content,
          session: { email },
        } = messageData;

        // Ensure the user is authenticated before saving the message
        try {
          const user = await prisma.user.findFirst({ where: { email } });

          await prisma.message.create({
            data: {
              content,
              userId: user!.id,
            },
          });

          io.emit("chat_messages", await getMessages(email));
        } catch (error) {
          console.error("Error saving message:", error);
        }
      }
    );

    socket.on("disconnect", () => {});
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
