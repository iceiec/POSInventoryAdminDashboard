const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const itemRoutes = require('./routes/items');
const categoryRoutes = require('./routes/categories');
const modifierRoutes = require('./routes/modifiers');
const discountRoutes = require('./routes/discounts');
const saleRoutes = require('./routes/sales');
const analyticsRoutes = require('./routes/analytics');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// HTTP request logger (skip in test env)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/items', itemRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/modifiers', modifierRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central error handler — must be last
app.use(errorHandler);

module.exports = app;
