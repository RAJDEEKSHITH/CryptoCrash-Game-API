// server.js
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const gameRoutes = require('./routes/gameRoutes');
const { startGameEngine, setIO } = require('./utils/gameEngine');

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});


app.use(cors({
  origin: "http://localhost:5173" // no credentials needed
}));

app.use(express.json());
app.use('/api', gameRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    setIO(io);
    startGameEngine();
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('cashout_request', (data) => {
    require('./controllers/gameController').cashOutSocket(data, socket);
  });

  socket.on('disconnect', () => {
    console.log('❎ Client disconnected:', socket.id);
  });
});

