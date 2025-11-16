// backend/src/routes/integrations.routes.js
const { Router } = require("express");
const { listIntegrations } = require("../controllers/integrations.controller");

const integrationsRouter = Router();

integrationsRouter.get("/", listIntegrations);

module.exports = integrationsRouter;
