/* eslint-disable @typescript-eslint/ban-ts-comment */
// src/services/socketHandler.ts

import { Server } from "socket.io";
import { getMessages, getUser } from "./prismaService";
import { PrismaClient } from "@prisma/client";
import {
  createOrder,
  finalizeOrder,
  lastOrderStatus,
  refund,
  updateOrder,
} from "./actions";
import { getAIResponse } from "./aiService";

const prisma = new PrismaClient();

const actions = {
  "recommend:createOrder": createOrder,
  "recommend:updateOrder": updateOrder,
  "recommend:checkStatus": lastOrderStatus,
  "recommend:finalizeOrder": finalizeOrder,
  "recommend:refund": refund,
};

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
      const {
        session: {
          user: { email, name },
        },
        content,
      } = messageData;

      try {
        // Save the message and AI response to the database
        const message = await prisma.message.create({
          data: {
            userId: (await getUser(email))!.id,
            content,
          },
        });

        socket.emit("message:sent", { ...message, user: { name, email } });

        // Get AI response to handle the query
        const aiResponse = await getAIResponse(content);

        // If the AI determines that a recommendation is needed, trigger it
        if (aiResponse?.includes("recommend:")) {
          const recommendAction = aiResponse.split(" ");

          // @ts-ignore
          actions[recommendAction[0]](
            {
              session: messageData.session,
              items: recommendAction[1],
            },
            socket
          );
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
};
