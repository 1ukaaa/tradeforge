// backend/src/server.js
require("dotenv").config();
const app = require("./app");
const { API_PORT } = require("./config/server.config");

const PORT = API_PORT;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
