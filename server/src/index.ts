import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import publicRoutes from './routes/publicRoutes';
import adminRoutes from './routes/adminRoutes';
import { startExpirationCron } from './services/expirationWorker';
import { getEventConfig } from './services/queueService';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// CORS configuration
app.use(
  cors({
    origin: [APP_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// API Routes
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files in production (Render compatibility)
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    next();
    return;
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Client build index.html not found. Run npm run build in client directory.');
    }
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Server Initialization
async function startServer() {
  try {
    // Initialize default event configuration in database
    await getEventConfig();
    console.log('[SERVER] Event configuration initialized.');

    // Start expiration cron background task
    startExpirationCron();

    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`\n======================================================`);
        console.log(`🚀 MSC Event Registration & Attendance Server Running!`);
        console.log(`Port: ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`URL: http://localhost:${PORT}`);
        console.log(`======================================================\n`);
      });
    }
  } catch (error) {
    console.error('[SERVER BOOT ERROR] Failed to start server:', error);
  }
}

startServer();

export default app;
