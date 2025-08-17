import React, { useState, useEffect, useRef } from "react";
import loader from "../assets/loader.gif";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import Logout from "./Logout";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute, deleteMessageRoute, reactMessageRoute } from "../utils/APIRoutes";
import { LOCALHOST_KEY } from "../utils/constants";
const markSeenRoute = `${recieveMessageRoute.replace("getmsg", "markseen")}`;

export default function ChatContainer({ currentChat, socket }) {
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, msgId: null, canDelete: false });
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef();
  const [arrivalMessage, setArrivalMessage] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const data = await JSON.parse(localStorage.getItem(LOCALHOST_KEY));
        setUserId(data._id);
        // Mark messages as seen
        await axios.post(markSeenRoute, {
          from: data._id,
          to: currentChat._id,
        });
        const response = await axios.post(recieveMessageRoute, {
          from: data._id,
          to: currentChat._id,
        });
        // If backend does not return reactions, fallback to empty array
        const msgs = response.data.map((msg) => ({ ...msg, reactions: msg.reactions || [] }));
        setMessages(msgs);
      } catch (err) {
        alert("Failed to load messages. Please try again.");
      }
      setLoading(false);
    };
    fetchMessages();
  }, [currentChat]);
  // Delete message handler
  const handleDeleteMsg = async (msgId) => {
    try {
      await axios.post(deleteMessageRoute, { messageId: msgId, userId });
      setMessages((prev) => prev.filter((msg) => msg._id !== msgId));
    } catch (err) {
      alert("Failed to delete message.");
    }
  };

  // Emoji react handler
  const handleReactMsg = async (msgId, emoji) => {
    try {
      const res = await axios.post(reactMessageRoute, { messageId: msgId, userId, emoji });
      // Update reactions for the message in UI
      setMessages((prevMsgs) =>
        prevMsgs.map((msg) =>
          msg._id === msgId ? { ...msg, reactions: res.data.reactions } : msg
        )
      );
      setEmojiPickerMsgId(null);
    } catch (err) {
      alert("Failed to react to message.");
    }
  };

  // Emoji picker UI (simple)
  const emojiList = ["👍", "😂", "❤️", "😮", "😢", "😡", "🙏", "🔥", "🎉"];

  // Handle right click on message
  const handleMessageContextMenu = (e, msg) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      msgId: msg._id,
      canDelete: msg.fromSelf,
    });
  };

  // Hide context menu on click elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu((cm) => ({ ...cm, visible: false }));
    if (contextMenu.visible) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [contextMenu.visible]);

  useEffect(() => {
    const getCurrentChat = async () => {
      if (currentChat) {
        await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        )._id;
      }
    };
    getCurrentChat();
  }, [currentChat]);

  const handleSendMsg = async (msg) => {
    try {
      const data = await JSON.parse(localStorage.getItem(LOCALHOST_KEY));
      socket.current.emit("send-msg", {
        to: currentChat._id,
        from: data._id,
        msg,
      });
      // If chatting with the bot, handle bot reply
      if (currentChat._id === "SOUL_BOT") {
        const res = await axios.post(sendMessageRoute, {
          from: data._id,
          to: currentChat._id,
          message: msg,
        });
        const msgs = [...messages];
        msgs.push({ fromSelf: true, message: msg });
        // Add bot's reply
        if (res.data && res.data.botReply) {
          msgs.push({ fromSelf: false, message: res.data.botReply });
        }
        setMessages(msgs);
      } else {
        await axios.post(sendMessageRoute, {
          from: data._id,
          to: currentChat._id,
          message: msg,
        });
        const msgs = [...messages];
        msgs.push({ fromSelf: true, message: msg });
        setMessages(msgs);
      }
    } catch (err) {
      alert("Failed to send message. Please try again.");
    }
  };

  useEffect(() => {
    arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img
              src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
              alt=""
            />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
          </div>
        </div>
        <Logout />
      </div>
      <div className="chat-messages">
        {loading ? (
          <div className="loader-container">
            <img src={loader} alt="Loading..." className="loader" />
          </div>
        ) : (
          messages.map((message) => {
            return (
              <div ref={scrollRef} key={message._id}>
                <div
                  className={`message ${
                    message.fromSelf ? "sended" : "recieved"
                  }`}
                  onContextMenu={(e) => handleMessageContextMenu(e, message)}
                >
                  <div className="content ">
                    <p>{message.message}</p>
                    {/* Emoji reactions display */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="reactions-bar" style={{ marginTop: 6 }}>
                        {message.reactions.map((r, idx) => (
                          <span key={idx} style={{ fontSize: 18, marginRight: 4 }}>
                            {r.emoji}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="timestamp">{message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                    {message.fromSelf && message.seen && (
                      <span className="seen-indicator">Seen</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="custom-context-menu"
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            background: "#23235b",
            color: "#fff",
            borderRadius: 8,
            boxShadow: "0 2px 8px #0008",
            zIndex: 9999,
            minWidth: 120,
            padding: 0,
          }}
        >
          {contextMenu.canDelete && (
            <div
              style={{ padding: "10px 18px", cursor: "pointer", borderBottom: "1px solid #444" }}
              onClick={() => {
                handleDeleteMsg(contextMenu.msgId);
                setContextMenu({ ...contextMenu, visible: false });
              }}
            >
              🗑️ Delete
            </div>
          )}
          <div
            style={{ padding: "10px 18px", cursor: "pointer" }}
            onClick={() => {
              setEmojiPickerMsgId(contextMenu.msgId);
              setContextMenu({ ...contextMenu, visible: false });
            }}
          >
            😊 React with Emoji
          </div>
        </div>
      )}

      {/* Emoji Picker Popup (positioned center of screen for simplicity) */}
      {emojiPickerMsgId && (
        <div
          className="emoji-picker-popup"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "#fff",
            color: "#222",
            borderRadius: 10,
            boxShadow: "0 2px 12px #0006",
            padding: 16,
            zIndex: 10000,
            minWidth: 220,
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: 8, fontWeight: 600 }}>React with Emoji</div>
          {emojiList.map((emoji) => (
            <span
              key={emoji}
              style={{ fontSize: 28, cursor: 'pointer', margin: 6 }}
              onClick={() => handleReactMsg(emojiPickerMsgId, emoji)}
            >
              {emoji}
            </span>
          ))}
          <div>
            <span
              style={{ fontSize: 18, marginLeft: 6, cursor: 'pointer', color: '#888', display: 'inline-block', marginTop: 10 }}
              onClick={() => setEmojiPickerMsgId(null)}
            >✖ Cancel</span>
          </div>
        </div>
      )}

      <ChatInput handleSendMsg={handleSendMsg} />
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }
  }
  .loader-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
  .loader {
    height: 4rem;
  }
  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .message {
      display: flex;
      align-items: center;
      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
  font-size: 1.1rem;
  position: relative;
        .timestamp {
          display: block;
          font-size: 0.75rem;
          color: #bdbdbd;
          margin-top: 0.3rem;
          text-align: right;
        }
        border-radius: 1rem;
        color: #d1d1d1;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
      }
    }
    .sended {
      justify-content: flex-end;
      .content {
        background-color: #4f04ff21;
      }
    }
    .recieved {
      justify-content: flex-start;
      .content {
        background-color: #9900ff20;
      }
    }
  }
  .seen-indicator {
    display: block;
    font-size: 0.75rem;
    color: #4e0eff;
    margin-top: 0.1rem;
    text-align: right;
    font-weight: bold;
  }
  .seen-indicator {
    display: block;
    font-size: 0.75rem;
    color: #4e0eff;
    margin-top: 0.1rem;
    text-align: right;
    font-weight: bold;
  }
`;
