// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const { CORS_ALLOWED_ORIGINS, CORS_ALLOW_ALL } = require('./config/server.config');
const apiRoutes = require('./routes'); // Importe le routeur principal

const app = express();

// Set trust proxy (if deployed behind a proxy like Vercel, Render)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// Middlewares globaux
const corsOptions = {
  origin(origin, callback) {
    if (!origin || CORS_ALLOW_ALL || CORS_ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(
      new Error(`Origine ${origin} non autorisée par le serveur (CORS).`)
    );
  },
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '15mb' }));

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Global Rate Limiting (Protection anti-DDoS / Scraping agressif)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 1000, // Limite chaque IP à 1000 requêtes par fenêtre
  message: { error: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Route de santé
app.get('/', (req, res) => {
  res.send('Backend OK - TradeForge Securisé');
});

// Montage des routes de l'API
app.use('/api', apiRoutes);

// Gestion basique des erreurs (à améliorer plus tard)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Une erreur interne est survenue!' });
});

module.exports = app;
