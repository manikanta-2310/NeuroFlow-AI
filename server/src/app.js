const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');
const { httpError } = require('./utils/errors');

// Route imports
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const workspaceRoutes = require('./routes/workspace.routes');
const { documentRouter, workspaceDocumentRouter } = require('./routes/document.routes');
const chatRoutes = require('./routes/chat.routes');
const { runRouter, workspaceRunRouter } = require('./routes/run.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development origins or no-origin (curl/tools)
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving (if needed)
app.use('/uploads', express.static(config.uploadsDir));

// API Routes Mounting
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces/:workspaceId/documents', workspaceDocumentRouter);
app.use('/api/documents', documentRouter);
app.use('/api/workspaces/:workspaceId/chat', chatRoutes);
app.use('/api/workspaces/:workspaceId/runs', workspaceRunRouter);
app.use('/api/runs', runRouter);

// 404 Handler for API
app.use('/api/*', (req, res, next) => {
  next(httpError(404, `Endpoint ${req.method} ${req.originalUrl} not found`));
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
