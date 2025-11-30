// backend/src/server.js
require("dotenv").config();
const app = require("./app");
const { API_PORT } = require("./config/server.config");

const { startScheduler } = require("./services/scheduler.service");

const PORT = API_PORT;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  startScheduler();
});
