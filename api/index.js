import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import productRoute from './routes/product.route.js';
import userRoute from './routes/users.route.js';
import imageRoute from './routes/image.route.js';
import analyticsRoute from './routes/analytics.route.js';
import orderRoute from './routes/order.route.js';
import categoryRoute from './routes/categories.route.js';
import feedbackRoute from './routes/feedbackRoutes.js';
import paymentRoute from './routes/payment.route.js';
import dashboardRoute from './routes/dashboard.route.js';
import subscriptionRoute from './routes/subscription.route.js';
import restockRoute from './routes/restock.route.js'
import aiRoute from './routes/ai.route.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import searchRoute from './routes/search.route.js';
 
dotenv.config();

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://breakfast-factory-jumia-1.onrender.com',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.use((socket, next) => {   
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
    socket.user = user;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.id}`);
  socket.join(socket.user.id);

  // Handle real-time feedback submission via Socket.IO
  socket.on('submitFeedback', async (data, callback) => {
    try {
      const { message, rating } = data;
      if (!message || !rating) {
        return callback({ error: 'Message and rating are required' });
      }

      const feedback = new feedback({
        message,
        rating,
        userId: socket.user.id, // Associate feedback with authenticated user
      });

      await feedback.save();
      io.emit('newFeedback', feedback); // Broadcast to all connected clients
      callback({ message: 'Feedback submitted successfully', feedback });
    } catch (error) {
      callback({ error: 'Server error', details: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.id}`);
  });
});

// Make io accessible in routes/controllers if needed
app.set('io', io);

// ES module __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'https://breakfast-factory-jumia-1.onrender.com'],
  methods: ['GET', 'DELETE', 'PUT', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from the uploads directory
app.use('/uploads', [
  express.static(path.join(__dirname, 'uploads')),
  express.static(path.join(__dirname, 'Uploads'))
]);

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection failed:', err));

// Routes
app.use('/api/route', productRoute);
app.use('/api/auth', userRoute);
app.use('/api/route', imageRoute);
app.use('/api/route', orderRoute);
app.use('/api/route', categoryRoute);
app.use('/api/route', analyticsRoute);
app.use('/api/feedback', feedbackRoute);
app.use('/api/route', paymentRoute);
app.use('/api/route/dashboard', dashboardRoute);
app.use('/api/route', subscriptionRoute);
app.use('/api/route', restockRoute);
app.use('/api/ai', aiRoute);
app.use('/api/route', searchRoute);

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    statusCode,
    message
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});
