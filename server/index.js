require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const uploadRoutes = require("./routes/upload");
const path = require("path");
const { Server } = require("socket.io");   // ✅ FIX

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB Connection Successful"))
  .catch((err) => console.log(err.message));

app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server started on ${port}`);
  });

  const io = new Server(server, {    // ✅ FIX
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  global.onlineUsers = new Map();

  io.on("connection", (socket) => {
    global.chatSocket = socket;

    socket.on("add-user", (userId) => {
      onlineUsers.set(userId, socket.id);
    });

    socket.on("send-msg", (data) => {
      const sendUserSocket = onlineUsers.get(data.to);
      if (sendUserSocket) {
        socket.to(sendUserSocket).emit("msg-recieve", data.msg);
      }
    });

    // ✅ Read receipt
    socket.on("message-seen", ({ to, from, messageId }) => {
      const sendUserSocket = onlineUsers.get(to);
      if (sendUserSocket) {
        socket.to(sendUserSocket).emit("message-seen", { from, messageId });
      }
    });

    // Typing indicator
    socket.on("typing", ({ to, from }) => {
      const sendUserSocket = onlineUsers.get(to);
      if (sendUserSocket) {
        socket.to(sendUserSocket).emit("typing", { from });
      }
    });

    socket.on("stop-typing", ({ to, from }) => {
      const sendUserSocket = onlineUsers.get(to);
      if (sendUserSocket) {
        socket.to(sendUserSocket).emit("stop-typing", { from });
      }
    });
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      throw err;
    }
  });
};

const port = parseInt(process.env.PORT, 10) || 5000;
startServer(port);
