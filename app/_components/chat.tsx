"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import io from "socket.io-client";

export const socket = io();

interface Message {
  user: {
    name: string;
  };
  content: string;
}

const Chat = () => {
  const { data: session } = useSession();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    socket.emit("chat_messages", { session });
  }, []);

  socket.on("chat_messages", (messages: Message[]) => {
    setMessages(messages);
  });

  const handleSendMessage = () => {
    if (message.trim()) {
      socket.emit("chat_message", { content: message, session });
      setMessage("");
    }
  };

  return (
    <div style={{ width: "400px", margin: "0 auto", padding: "10px" }}>
      <h2>Chat</h2>
      <div
        style={{
          height: "300px",
          overflowY: "scroll",
          border: "1px solid #ccc",
          padding: "10px",
          backgroundColor: "#f9f9f9",
          marginBottom: "10px",
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} style={{ padding: "5px 0" }}>
            <strong>{msg.user.name}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message here"
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
          boxSizing: "border-box",
        }}
      />
      <button
        onClick={handleSendMessage}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Send
      </button>
    </div>
  );
};

export default Chat;
