import { motion } from "framer-motion";
import useChat from "../hooks/useChat";



function Chat() {
  const {
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
  } = useChat();
  

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
      <div className="flex flex-col lg:h-dvh p-5">
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
                  {Object.entries(msg.reactions || {}).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(msg.reactions || {}).map(([emoji, users]) => (
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