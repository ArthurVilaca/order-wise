import { Server } from "socket.io";
import { getMessages } from "./prismaService";
import { handleChatMessage } from "./actions";

export const handleSocketConnection = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("A user connected");

    // Get and send messages for the user
    socket.on(
      "messages",
      async (messageData: { session: { email: string } }) => {
        const { email } = messageData.session;
        const messages = await getMessages(email);
        io.emit("messages", messages);
      }
    );

    // Handle sending messages
    socket.on("message:send", async (messageData) => {
      handleChatMessage(messageData, socket);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};
