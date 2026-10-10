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

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Initialize WebSocket
const io = initializeSocket(httpServer);
app.locals.io = io;

// ✅ Serve static files from frontend dist
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', authMiddleware, campaignRoutes);
app.use('/api/campaigns/:campaignId/domains', domainRoutes);
app.use('/api/campaigns/:campaignId/fase3', fase3Routes);

// ✅ SPA fallback - serve index.html for non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = parseInt(process.env.PORT || '3001', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 API ready at http://localhost:${PORT}/api`);
  console.log(`🔧 Prisma query engine (libssl1.1) ready`);
});

export { httpServer, io };
