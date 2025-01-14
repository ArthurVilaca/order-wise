// src/services/socketHandler.ts

import { Server } from "socket.io";
import { getMessages, saveMessage } from "./prismaService";

export const handleSocketConnection = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("A user connected");

    // Get and send messages for the user
    socket.on(
      "chat_messages",
      async (messageData: { session: { email: string } }) => {
        const { email } = messageData.session;
        const messages = await getMessages(email);
        io.emit("chat_messages", messages);
      }
    );

    // Handle incoming chat messages and save to DB
    socket.on(
      "chat_message",
      async (messageData: { content: string; session: { email: string } }) => {
        const { content, session: { email } } = messageData;
        try {
          await saveMessage(content, email);
          const messages = await getMessages(email);
          io.emit("chat_messages", messages);
        } catch (error) {
          console.error("Error saving message:", error);
        }
      }
    );

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};
