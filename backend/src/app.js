// backend/src/app.js
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes'); // Importe le routeur principal

const app = express();

// Middlewares globaux
app.use(cors());
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