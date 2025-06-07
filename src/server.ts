import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import axiosInstance from './api/axiosInstance';
import axios from 'axios';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

io.on('connection', (socket) => {
  console.log('A user connected' + socket.id);
  socket.on('disconnect', () => {
    console.log('A user disconnected' + socket.id);
  });

  socket.on('user-id', (data) => {
    console.log('User ID received:', data);
  });

  socket.on('driver-location', (data) => {
    axiosInstance.post('/driver-location', data)
      .then((response) => {
        console.log('Location updated:', response.data);
      })
      .catch((error) => {
        console.error('[Error] updating location:', error.response.data);
      });
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});