import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import { initializeSocket } from './socket/socket.js';
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use('/auth', authRoutes);
app.get('/', (req, res) => {
    res.send('Server is running');
});
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
initializeSocket(server);
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Database connection failed:', error);
    throw error;
});
