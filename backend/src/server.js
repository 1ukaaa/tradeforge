// backend/src/server.js
require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});