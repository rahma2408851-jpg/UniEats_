/**
 * server.js
 * UniEats Backend — Entry Point
 */

// 1. THIS IS THE FIX FOR YOUR MONGODB CRASH 
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

// 2. Load environment variables
require('dotenv').config();

// 3. Your imports
const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const path         = require('path');
const fs           = require('fs');
const https        = require('https');
const http         = require('http');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const connectDB    = require('./config/db');

// Routes
const authRoutes         = require('./routes/authRoutes');
const userRoutes         = require('./routes/userRoutes');
const restaurantRoutes   = require('./routes/restaurantRoutes');
const orderRoutes        = require('./routes/orderRoutes');
const ownerMappingRoutes = require('./routes/ownerMappingRoutes');

// Error handlers & Localization
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const localizationMiddleware = require('./middleware/localizationMiddleware');
const { getTranslations } = require('./utils/i18n');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
// Connect to MongoDB first, then start server
// ─────────────────────────────────────────────

connectDB().then(() => {

  // ─────────────────────────────────────────────
  // View Engine — EJS
  // ─────────────────────────────────────────────

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // ─────────────────────────────────────────────
  // Security Middleware
  // ─────────────────────────────────────────────

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true
  }));

  const authLimiter = rateLimit({
    windowMs      : 15 * 60 * 1000,
    max           : 20,
    standardHeaders: true,
    legacyHeaders : false,
    message       : { error: 'Too many requests from this IP. Please try again in 15 minutes.' }
  });

  // ─────────────────────────────────────────────
  // Body Parsing
  // ─────────────────────────────────────────────

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // ─────────────────────────────────────────────
  // Localization Middleware
  // ─────────────────────────────────────────────

  app.use(localizationMiddleware);

  // ─────────────────────────────────────────────
  // Static Files (CSS, JS, assets)
  // ─────────────────────────────────────────────

  app.use(express.static(path.join(__dirname)));
  // Serve root-level script/ and styles/ directories (JS/CSS assets)
  app.use(express.static(path.join(__dirname, '..')));
  // Serve uploaded files (menu images, profile pictures)
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  // ─────────────────────────────────────────────
  // API Routes
  // ─────────────────────────────────────────────

  app.use('/api/auth',           authLimiter, authRoutes);
  app.use('/api/users',          userRoutes);
  app.use('/api/restaurants',    restaurantRoutes);
  app.use('/api/orders',         orderRoutes);
  app.use('/api/owner-mappings', ownerMappingRoutes);

  // ── Localization API ───────────────────────────────────────────────────
  // GET /api/translations?lang=en|ar
  app.get('/api/translations', (req, res) => {
    const lang = req.query.lang || req.language || 'en';
    res.json({
      language: lang,
      translations: getTranslations(lang)
    });
  });

  // ── External API: live EGP → USD exchange rate ────────────────────────────
  // Uses the free open.er-api.com endpoint (no API key required).
  // Called by the checkout page to show the USD equivalent of the order total.
  app.get('/api/exchange-rate', async (req, res) => {
    try {
      const data = await new Promise((resolve, reject) => {
        https.get('https://open.er-api.com/v6/latest/EGP', r => {
          let body = '';
          r.on('data', chunk => body += chunk);
          r.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch { reject(new Error('Invalid JSON from exchange API')); }
          });
        }).on('error', reject);
      });
      const usdRate = data?.rates?.USD || null;
      res.json({ base: 'EGP', USD: usdRate, timestamp: data?.time_last_update_utc || null });
    } catch (err) {
      res.status(502).json({ error: 'Could not fetch exchange rate.', USD: null });
    }
  });

  app.use('/api', notFoundHandler);

  // ─────────────────────────────────────────────
  // EJS Page Routes
  // Each route renders the matching EJS view.
  // Legacy .html URLs are also supported for
  // backwards compatibility with existing links.
  // ─────────────────────────────────────────────

  const pages = [
    'index',
    'student-home',
    'login',
    'register',
    'logout-confirm',
    'forgot-password',
    'reset-password',
    'profile',
    'orders',
    'order-tracking',
    'cart',
    'checkout',
    'restaurant-details',
    'owner-dashboard',
    'manage-menu',
    'manage-restaurant',
    'all-orders',
    'owner-orders',
    'admin-dashboard',
    'manage-users',
  ];

  // Root → index.ejs
  app.get('/', (req, res) => res.render('index'));

  pages.forEach(page => {
    // Clean URL: /student-home
    app.get(`/${page}`, (req, res) => res.render(page));

    // Legacy .html URL: /pages/student-home.html  or  /student-home.html
    app.get(`/${page}.html`,       (req, res) => res.redirect(301, `/${page}`));
    app.get(`/pages/${page}.html`, (req, res) => res.redirect(301, `/${page}`));
  });

  // ─────────────────────────────────────────────
  // Global Error Handler (must be last)
  // ─────────────────────────────────────────────

  app.use(errorHandler);

  // ─────────────────────────────────────────────
  // HTTPS Support
  // Set ENABLE_HTTPS=true in .env and provide
  // SSL_KEY_PATH and SSL_CERT_PATH to use HTTPS.
  // ─────────────────────────────────────────────

  const useHttps = process.env.ENABLE_HTTPS === 'true';

  if (useHttps) {
    const keyPath  = process.env.SSL_KEY_PATH;
    const certPath = process.env.SSL_CERT_PATH;

    if (!keyPath || !certPath) {
      console.error('❌ ENABLE_HTTPS is true but SSL_KEY_PATH or SSL_CERT_PATH is missing in .env');
      process.exit(1);
    }

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      console.error('❌ SSL certificate files not found. Check SSL_KEY_PATH and SSL_CERT_PATH.');
      process.exit(1);
    }

    const sslOptions = {
      key : fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };

    const HTTPS_PORT = process.env.HTTPS_PORT || 443;

    // Redirect all HTTP traffic to HTTPS
    http.createServer((req, res) => {
      res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
      res.end();
    }).listen(PORT, () => {
      console.log(`↪️  HTTP → HTTPS redirect running on port ${PORT}`);
    });

    https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
      console.log(`✅ UniEats running securely → https://localhost:${HTTPS_PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } else {
    // Normal HTTP (development)
    app.listen(PORT, () => {
      console.log(`✅ UniEats backend running → http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
   });
  }

});