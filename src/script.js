const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMesaage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUserInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const filter = new Filter();

const port = process.env.PORT || 3000;
const publicAdress = path.join(__dirname, "../public");

app.use(express.static(publicAdress));

app.get("/", (req, res) => {
  res.send("Hello world");
});

io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  // Room
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) return callback(error);

    socket.join(room);

    socket.emit("message", generateMesaage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMesaage("Admin", `${user.username} has joined`));
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUserInRoom(user.room),
    });
    callback();
  });

  // Listening to message sent
  socket.on("sendMessage", (textMessage, callback) => {
    const user = getUser(socket.id);
    if (filter.isProfane(textMessage))
      return callback("Profanity is not allowed");

    io.to(user.room).emit(
      "message",
      generateMesaage(user.username, textMessage)
    );

    callback("Message delivered!");
  });

  // Listening to sendLocation
  socket.on("sendLocation", ({ latitude, longitude }, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${latitude},${longitude}`
      )
    );
    callback("Location shared!");
  });

  // Listenig to disconnection
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMesaage(user.username, `${user.username} has left!`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUserInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => console.log("Server is up on port " + port));
