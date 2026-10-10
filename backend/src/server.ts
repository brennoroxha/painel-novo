import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { initializeSocket } from './websocket/socketHandler';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/authMiddleware';
import authRoutes from './routes/auth';
import campaignRoutes from './routes/campaigns';
import domainRoutes from './routes/domains';
import fase3Routes from './routes/fase3';

const app = express();
const httpServer = http.createServer(app);

// System Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Initialize WebSocket
const io = initializeSocket(httpServer);
app.locals.io = io;

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', authMiddleware, campaignRoutes);
app.use('/api/campaigns/:campaignId/domains', domainRoutes);
app.use('/api/campaigns/:campaignId/fase3', fase3Routes);

// Frontend Static Files & SPA Fallback
const frontendDistPath = '/app/frontend/dist';

// Serve static assets (JS, CSS, images, etc)
app.use(express.static(frontendDistPath));

// ✅ SPA Fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = parseInt(process.env.PORT || '3001', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 API ready at http://localhost:${PORT}/api`);
  console.log(`🔧 Prisma query engine (libssl1.1) ready`);
});

export { httpServer, io };
