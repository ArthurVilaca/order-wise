"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io();

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

  // Fetch previous messages on component mount
  useEffect(() => {
    if (session) {
      socket.emit("messages", { session });
    }
  }, [session]);

  // Listen for incoming messages
  useEffect(() => {
    socket.on("messages", (messages: Message[]) => {
      setMessages(messages);
    });

    socket.on("message:sent", (newMessage: Message) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      socket.off("message:sent");
    };
  }, []);

  // Send message to the server
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form default behavior (page reload)
    if (message.trim()) {
      socket.emit("message:send", {
        session,
        content: message,
      });
      setMessage(""); // Clear message input
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
          borderRadius: "8px",
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} style={{ padding: "5px 0" }}>
            <strong>
              {msg.role === "assistant" ? "AI Customer Support" : msg.user.name}
              :
            </strong>{" "}
            {msg.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSendMessage}>
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
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "14px",
          }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
