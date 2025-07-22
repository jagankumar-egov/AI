const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { validateConfig } = require("./validate");
const { generateConfigFromPrompt } = require("./openai");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const logger = require("./logger");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
require('dotenv').config(); // 👈 Add at the top

// Winston logger is now imported from logger.js

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Rate limiting middleware (disabled for local development)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // allow 100 requests per minute per IP
    message: "Too many requests, please try again later."
  });
  app.use(limiter);
}

app.post(
  "/generate-config",
  // Prompt validation and sanitization
  body("prompt")
    .isString()
    .trim()
    .notEmpty()
    .isLength({ min: 10, max: 1000 })
    .escape(),
  async (req, res) => {
    logger.info({ event: "generate-config", body: req.body });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn({ event: "validation-error", errors: errors.array() });
      return res.status(400).json({ error: "Invalid prompt." });
    }
    try {
      // Load default config
      const defaultConfigPath = path.join(__dirname, "assets", "servicConfig.json");
      const defaultConfig = JSON.parse(fs.readFileSync(defaultConfigPath, "utf-8"));

      // Get OpenAI-generated partial config
      const { prompt } = req.body;
      const rawJson = await generateConfigFromPrompt(prompt);
      const partialConfig = JSON.parse(rawJson);

      // Deep merge OpenAI output into default config
      const mergedConfig = _.merge({}, defaultConfig, partialConfig);

      // Validate merged config
      const valid = validateConfig(mergedConfig);
      if (!valid.valid) {
        logger.warn({ event: "config-invalid", error: valid.error });
        return res.status(400).json({ error: valid.error });
      }

      logger.info({ event: "config-generated", config: mergedConfig });
      res.json({ config: mergedConfig });
    } catch (err) {
      logger.error({ event: "server-error", error: err.message });
      res.status(500).json({ error: err.message });
    }
  }
);

app.listen(5001, () => logger.info("Server running on http://localhost:5001"));
