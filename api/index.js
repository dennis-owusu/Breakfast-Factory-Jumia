import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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
import paystackRoute from './routes/paystack.route.js';
import Feedback from './models/feedback.js';
 
dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'https://breakfast-factory-jumia-1.onrender.com',
];
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
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

      const feedback = new Feedback({
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
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Methods', corsOptions.methods.join(','));
  res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from the uploads directory
app.use('/uploads', [
  express.static(path.join(__dirname, 'uploads')),
  express.static(path.join(__dirname, 'Uploads'))
]);
 
// MongoDB Connection with retry logic
const connectDB = async (retries = 5) => {
  try {
    console.log('🔍 Attempting MongoDB connection...');
    console.log('📋 Connection URI:', process.env.MONGO_URI ? 'SET' : 'NOT SET');
    
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
      ssl: true,
      authSource: 'admin'
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('🔍 Connection string preview:', process.env.MONGO_URI?.substring(0, 50) + '...');
    
    if (retries > 0) {
      console.log(`🔄 Retrying MongoDB connection... (${retries} attempts left)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      console.error('🚨 MongoDB connection failed after all retries');
      console.error('💡 Please check:');
      console.error('   - MongoDB Atlas cluster is running');
      console.error('   - Your IP address is whitelisted in Atlas');
      console.error('   - Connection string is correct');
      console.error('   - Internet connection is stable');
      console.error('   - Atlas username/password are correct');
    }
  }
};

connectDB();

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const status = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus === 1 ? 'connected' : 'disconnected',
      readyState: dbStatus
    },
    server: 'running'
  };
  res.status(dbStatus === 1 ? 200 : 503).json(status);
});

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
app.use('/api/paystack', paystackRoute);

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
