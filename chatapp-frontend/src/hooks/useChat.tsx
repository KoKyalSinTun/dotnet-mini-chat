import React, { useEffect, useRef, useState } from "react";
import * as SignalR from "@microsoft/signalr";
import type { Message, ServerMessage, ServerReaction } from "../types/Message";

export default function useChat() {
  const connectionRef = useRef<SignalR.HubConnection | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const messageEndRef = useRef<HTMLDivElement | null>(null)

  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [onlineUser, setOnlineUser] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!joined) return;

    const startConnection = async () => {

      const newConnection = new SignalR.HubConnectionBuilder()
        .withUrl("http://10.154.213.147:5249/chathub")
        .withAutomaticReconnect()
        .build();

      newConnection.on("LoadMessages", (messages: ServerMessage[], reactions: ServerReaction[]) => {
        const mapped: Message[] = messages.map(( m ) => ({
          id: m.id,
          user: m.user,
          text: m.text,
          time: new Date(m.createdAt).toLocaleDateString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          reactions: {}
        }));

        reactions.forEach((r) => {
          const msg = mapped.find( m => m.id === r.messageId )
          if (!msg) return;

          if (!msg.reactions[r.emoji])
            msg.reactions[r.emoji] = []

          msg.reactions[r.emoji].push(r.username)
        })
        setMessages(mapped)
        
      })

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

      newConnection.on("ReceiveReaction", (messageId, emoji, username, add) => {
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

  return {
    onlineUser,
    typingUsers,
    username,
    setUsername,
    joined,
    setJoined,
    messages,
    message,
    handleTyping,
    sendMessage,
    sendReaction,
    messageEndRef
  };
}
