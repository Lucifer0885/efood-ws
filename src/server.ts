import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import bodyParser from "body-parser";
import axiosInstance from "./api/axiosInstance";

async function main() {
  console.log("Starting the server...");
  try {
    console.log('Deleting old socket IDs from the database...');
    await axiosInstance.delete("/delete-all-socket");
    console.log("Old socket IDs deleted successfully.");
  } catch (error) {
    console.error("[Error] deleting old socket IDs: ", error);
  }

  console.log('Starting the Express server with Socket.IO...');
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  io.on("connection", (socket) => {
    console.log("A user connected " + socket.id);

    socket.on("user-id", (data) => {
      try {
        axiosInstance
          .post("/set-user-socket", {
            user_id: data.user_id,
            socket_id: socket.id,
          })
          .then((response) => {
            console.log("User ID socket set: ", response.data);
          })
          .catch((error) => {
            console.error(
              "[Error] setting socket for user ID: ",
              error.response.data
            );
          });
      } catch (error) {
        console.error("[Error] setting user ID socket: ", error);
      }
    });

    socket.on("driver-location", (data) => {
      try {
        axiosInstance
          .post("/driver-location", data)
          .then((response) => {
            console.log("Location updated: ", response.data);
            if (response.data.success){
              for (let msg of response.data.data){
                for (let socketId of msg.socket_ids) {
                  io.to(socketId).emit(msg.channel, msg.data);
                }
              }
            }
          })
          .catch((error) => {
            console.error("[Error] updating location: ", error);
          });
      } catch (error) {
        console.error("[Error] updating driver location: ", error);
      }
    });

    socket.on("disconnect", () => {
      try {
        console.log("User disconnected " + socket.id);
        axiosInstance.delete("/delete-user-socket", {
          params: { socket_id: socket.id },
        });
      } catch (error) {
        console.error("[Error] on disconnect: ", error);
      }
    });
  });

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

main();
