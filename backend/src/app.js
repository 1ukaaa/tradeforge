// backend/src/app.js
const express = require('express');
const cors = require('cors');
const { CORS_ALLOWED_ORIGINS, CORS_ALLOW_ALL } = require('./config/server.config');
const apiRoutes = require('./routes'); // Importe le routeur principal

const app = express();

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

// Route de santé
app.get('/', (req, res) => {
  res.send('Backend OK - Journal Trading IA');
});

// Montage des routes de l'API
app.use('/api', apiRoutes);

// Gestion basique des erreurs (à améliorer plus tard)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Une erreur interne est survenue!' });
});

module.exports = app;
