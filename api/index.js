import mongoose from 'mongoose';
import express from 'express'; 
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import productRoute from './routes/product.route.js';
import userRoute from './routes/users.route.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config(); 

const PORT = 3000;
const app = express();

// ES module __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors({
  methods: ['GET', 'DELETE', 'PUT', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
 
// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection failed:', err));

// Routes
app.use('/api/route', productRoute); 
app.use('/api/auth', userRoute); 


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
app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});
