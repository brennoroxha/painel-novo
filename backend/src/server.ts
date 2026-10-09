import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { initializeSocket } from './websocket/socketHandler';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/authMiddleware';
import authRoutes from './routes/auth';
import campaignRoutes from './routes/campaigns';
import domainRoutes from './routes/domains';
import fase3Routes from './routes/fase3';

const app = express();
const httpServer = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Initialize WebSocket
const io = initializeSocket(httpServer);
app.locals.io = io;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', authMiddleware, campaignRoutes);
app.use('/api/campaigns/:campaignId/domains', domainRoutes);
app.use('/api/campaigns/:campaignId/fase3', fase3Routes);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 API ready at http://localhost:${PORT}/api`);
  console.log(`🔧 Prisma query engine (libssl1.1) ready`);
});

export { httpServer, io };
