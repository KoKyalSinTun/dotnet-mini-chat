import React, { useEffect, useRef, useState } from "react";
import * as SignalR from "@microsoft/signalr";
import { motion } from "framer-motion";

interface Message {
  user: string;
  text: string;
}

function Chat() {
  const connectionRef = useRef<SignalR.HubConnection | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [joined, setJoined] = useState<boolean>(false);
  const [onlineUser, setOnlineUser] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Initialize SignalR connection
  useEffect(() => {
    if (!joined) return;

    const startConnection = async () => {
      const newConnection = new SignalR.HubConnectionBuilder()
        .withUrl("http://localhost:5249/chathub")
        .withAutomaticReconnect()
        .build();

      try {
        await newConnection.start();

        console.log("Connected to SignalR");

        await newConnection.invoke("RegisterUser", username);

        newConnection.on("UpdateUsers", (users: string[]) => {
          setOnlineUser(users);
        });

        newConnection.on("ReceiveMessage", (user: string, text: string) => {
          setMessages(prev => [...prev, { user, text }]);
        });

        newConnection.on("UserTyping", (user: string, isTyping: boolean) => {
          if (user === username) return;

          setTypingUsers(prev => {
            if (isTyping) {
              return prev.includes(user) ? prev : [...prev, user];
            } else {
              return prev.filter(u => u !== user);
            }
          });
        });

        connectionRef.current = newConnection;

      } catch (err) {
        console.error(err);
      }
    };

    startConnection();

    return () => {
      connectionRef.current?.stop();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

  }, [joined, username]);

  const sendMessage = async () => {
    if (connectionRef.current && message.trim()) {

      await connectionRef.current.invoke("SendMessage", username, message);

      await connectionRef.current.invoke("SendTyping", username, false);

      isTypingRef.current = false;

      setMessage("");
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (!connectionRef.current) return;

    // send typing=true only once
    if (!isTypingRef.current) {
      connectionRef.current.invoke("SendTyping", username, true)
        .catch(err => console.error(err));

      isTypingRef.current = true;
    }

    // reset debounce timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      connectionRef.current?.invoke("SendTyping", username, false)
        .catch(err => console.error(err));

      isTypingRef.current = false;
    }, 1200);
  };

  if (!joined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white">
        <div className="w-88 p-8 rounded-3xl bg-neutral-900 shadow-xl border border-neutral-800 backdrop-blur">

          <h2 className="text-2xl font-semibold text-center mb-6">
            Join Chat
          </h2>

          <input
            placeholder="Enter your name"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     placeholder:text-neutral-400 mb-4"
          />

          <button
            onClick={() => setJoined(true)}
            disabled={!username.trim()}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500
                     transition disabled:bg-neutral-700 disabled:cursor-not-allowed"
          >
            Join Chat
          </button>

        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-row items-center justify-evenly min-h-screen bg-neutral-950 text-white">

      {/* Online users */}
      <div className="flex flex-col border-neutral-800 h-100 bg-neutral-900 border shadow-xl p-5 rounded-3xl">
        <div className="text-xs text-neutral-400 mb-1">
          <h3 className="mb-2">Online Users</h3>
          <div className="flex flex-wrap gap-2 p-2">
            {onlineUser.map((user, i) => (
              <div
                key={i}
                className="relative flex items-center px-3 py-1 rounded-full bg-white text-black text-xs font-medium shadow-sm"
              >
                {user}
                <span className="w-3 h-3 ms-2 bg-green-500 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat box */}
      <div className="w-105 h-150 flex flex-col bg-neutral-900 rounded-3xl shadow-xl border border-neutral-800">

        <div className="p-4 border-b border-neutral-800 text-center font-semibold text-lg">
          Mini Chat
        </div>

        {typingUsers.length > 0 && (
          <div className="text-xs text-neutral-400 px-4 pb-2 italic">
            {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {messages.map((msg, idx) => {
            const isMe = msg.user === username;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[70%] text-sm
                  ${isMe
                      ? "bg-blue-600 rounded-br-md"
                      : "bg-neutral-800 rounded-bl-md"
                    }`}
                >
                  {!isMe && (
                    <div className="text-xs text-neutral-400 mb-1">
                      {msg.user}
                    </div>
                  )}
                  {msg.text}
                </div>
              </motion.div>
            )
          })}

        </div>

        {/* Input */}
        <div className="p-3 border-t border-neutral-800 flex gap-2">

          <input
            type="text"
            value={message}
            onChange={handleTyping}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     placeholder:text-neutral-400"
          />

          <button
            onClick={sendMessage}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 transition"
          >
            Send
          </button>

        </div>

      </div>

    </div>
  )
}

export default Chat;