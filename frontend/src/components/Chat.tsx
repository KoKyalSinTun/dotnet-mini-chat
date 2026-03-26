import React, { useEffect, useRef, useState } from "react";
import * as SignalR from "@microsoft/signalr";
import { motion } from "framer-motion";

interface Message {
  id: string;
  user: string;
  text: string;
  time: string;
  reactions: { [emoji: string]: string[] }
}

function Chat() {
  const connectionRef = useRef<SignalR.HubConnection | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const messageEndRef = useRef<HTMLDivElement | null>(null)

  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [onlineUser, setOnlineUser] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!joined) return;

    const startConnection = async () => {

      const newConnection = new SignalR.HubConnectionBuilder()
        .withUrl("http://10.154.213.146:5249/chathub")
        .withAutomaticReconnect()
        .build();

      newConnection.on("UpdateUsers", (users: string[]) => {
        setOnlineUser(users);
      });

      newConnection.on("ReceiveMessage", (id: string, user: string, text: string) => {
        const time = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })

        const newMessage: Message = {
          id,
          user,
          text,
          time,
          reactions: {}
        }

        setMessages(prev => [...prev, newMessage]);
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

      newConnection.on("ReceiveReaction", (messageId, emoji, user, add) => {
        setMessages(prev =>
          prev.map(msg => {
            if (msg.id !== messageId) return msg;

            const reactions = { ...msg.reactions };

            if (!reactions[emoji]) reactions[emoji] = [];

            if (add) {
              if (!reactions[emoji].includes(username)) reactions[emoji].push(username);
            } else {
              reactions[emoji] = reactions[emoji].filter(user => user !== username)
              if (reactions[emoji].length === 0) delete reactions[emoji];
            }

            return { ...msg, reactions }
          }))
      })

      try {

        // ✅ START CONNECTION AFTER LISTENERS
        await newConnection.start();

        connectionRef.current = newConnection;

        // ✅ REGISTER USER AFTER START
        await newConnection.invoke("RegisterUser", username);

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

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!connectionRef.current || !message.trim()) return;

    await connectionRef.current.invoke("SendMessage", username, message);

    await connectionRef.current.invoke("SendTyping", username, false);

    isTypingRef.current = false;

    setMessage("");
  };

  const sendReaction = async (messageId: string, emoji: string) => {
    if (!connectionRef.current) return;

    const message = messages.find(msg => msg.id === messageId);
    if (!message) return;

    const userHasReacted = message.reactions[emoji]?.includes(username);

    await connectionRef.current.invoke(
      "AddReaction",
      messageId,
      emoji,
      username,
      !userHasReacted
    )
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {

    const value = e.target.value;
    setMessage(value);

    if (!connectionRef.current) return;

    if (!isTypingRef.current) {

      connectionRef.current.invoke("SendTyping", username, true);

      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {

      connectionRef.current?.invoke("SendTyping", username, false);

      isTypingRef.current = false;

    }, 1200);
  };

  if (!joined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white">
        <div className="w-88 p-8 rounded-3xl bg-neutral-900 shadow-xl border border-neutral-800">

          <h2 className="text-2xl font-semibold text-center mb-6">
            Join Chat
          </h2>

          <input
            placeholder="Enter your name"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 mb-4"
          />

          <button
            onClick={() => setJoined(true)}
            disabled={!username.trim()}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500"
          >
            Join Chat
          </button>

        </div>
      </div>
    );
  }

  return (
    <div className=" flex flex-col lg:flex-row items-center justify-evenly min-h-screen bg-neutral-950 text-white">

      {/* Online users */}
      <div className="flex flex-col">
        <h3 className="mb-2 text-neutral-400 text-sm">Online Users</h3>

        <div className="flex flex-wrap gap-2">
          {onlineUser.map((user, i) => (
            <div
              key={i}
              className="flex items-center px-3 py-1 rounded-full bg-white text-black text-xs"
            >
              {user}
              <span className="w-2 h-2 bg-green-500 rounded-full ml-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="w-105 h-150 flex flex-col bg-neutral-900 rounded-3xl border border-neutral-800">

        <div className="p-4 border-b border-neutral-800 text-center font-semibold">
          Mini Chat
          <div className="text-xs text-neutral-400 italic h-3 flex justify-center items-center">
            {typingUsers.length > 0 && (
              <>
                <span>{typingUsers.join(", ")} typing </span>

                <span className="flex gap-0.5 ml-1 mt-2">
                  <span className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce"></span>
                  <span className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">

          {messages.map((msg) => {

            const isMe = msg.user === username;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {/* Message Bubble */}
                <div className={`px-4 py-2 rounded-2xl max-w-[70%] relative
                  ${isMe ? "bg-blue-600 text-white" : "bg-neutral-800 text-white"}`}
                >
                  {!isMe && (
                    <div className="text-xs text-neutral-400 mb-1">{msg.user}</div>
                  )}
                  <div>{msg.text}</div>
                  <div className="text-[10px] text-neutral-400 mt-1 text-right">
                    {msg.time}
                  </div>

                  {/* Reactions inside bubble */}
                  {Object.entries(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(msg.reactions).map(([emoji, users]) => (
                        <button
                          key={emoji}
                          className={`flex items-center text-[10px] px-2 py-0.5 rounded-full
              ${users.includes(username) ? "bg-blue-500" : "bg-neutral-700"}`}
                          title={users.join(", ")} // hover tooltip
                          onClick={() => sendReaction(msg.id, emoji)} // toggle reaction
                        >
                          <span className="mr-1">{emoji}</span>
                          <span>{users.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Reaction Buttons */}
                <div className="flex gap-1 mt-1">
                  {["👍", "❤️", "😂"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(msg.id, emoji)}
                      className="text-xs opacity-60 hover:opacity-100"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            );
          })}

          <div ref={messageEndRef}></div>
        </div>

        {/* Input */}
        <div className="p-3 border-t border-neutral-800 flex gap-2">
          <input
            value={message}
            onChange={handleTyping}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700"
          />

          <button
            onClick={sendMessage}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500"
          >
            Send
          </button>

        </div>

      </div>
    </div>
  );
}

export default Chat;