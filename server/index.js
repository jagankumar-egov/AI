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


      // Enrich default config's documents array with root module value
      if (defaultConfig.module && Array.isArray(defaultConfig.documents)) {
        defaultConfig.documents = defaultConfig.documents.map(doc => ({ ...doc, module: defaultConfig.module }));
      }

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

// Chat assist endpoint (must be after app is initialized)
app.post("/chat-assist", body("message").isString().trim().notEmpty(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Invalid message." });
  }
  try {
    const { message } = req.body;
    const openai = require("./openai");
    // Use a more general prompt for chat assist
    const prompt = `You are a helpful assistant for configuring service configs. Answer user questions, provide hints, and explain config concepts in simple terms.\n\nUser: ${message}`;
    const response = await openai.chatAssist(prompt);
    res.json({ reply: response });
  } catch (err) {
    logger.error({ event: "chat-assist-error", error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// 🎛️ Service configuration wizard endpoints
const ServiceConfigHelper = require("./serviceConfigHelper");

// List all wizard sections (sequence order)
app.get(
  "/wizard/sections",
  async (_req, res) => {
    try {
      const helper = new ServiceConfigHelper();
      res.json({ sections: Object.keys(helper.sections) });
    } catch (err) {
      logger.error({ event: "wizard-sections-error", error: err.message });
      res.status(500).json({ error: err.message });
    }
  }
);

// Start the wizard: return first section prompt and example
app.post(
  "/wizard/start",
  async (_req, res) => {
    try {
      const helper = new ServiceConfigHelper();
      const sectionId = Object.keys(helper.sections)[0];
      const next = helper.getNextPrompt(sectionId, {});
      return res.json({ sectionId, id: next.id, question: next.question, example: next.example });
    } catch (err) {
      logger.error({ event: "wizard-start-error", error: err.message });
      res.status(500).json({ error: err.message });
    }
  }
);

// Advance to next question or return section config when done
app.post(
  "/wizard/next",
  async (req, res) => {
    const { sectionId, answers } = req.body;
    try {
      const helper = new ServiceConfigHelper();
      const next = helper.getNextPrompt(sectionId, answers || {});
      if (next) {
        return res.json({ sectionId, id: next.id, question: next.question, example: next.example });
      }
      // section completed: generate section config
      const sectionConfig = helper.generateSectionConfig(sectionId, answers || {});
      return res.json({ done: true, sectionConfig });
    } catch (err) {
      logger.error({ event: "wizard-next-error", error: err.message });
      res.status(500).json({ error: err.message });
    }
  }
);

// Explain a section or provide hints
app.post(
  "/wizard/explain",
  async (req, res) => {
    const { sectionId } = req.body;
    try {
      const helper = new ServiceConfigHelper();
      const explanation = helper.explainSection(sectionId);
      res.json({ explanation });
    } catch (err) {
      logger.error({ event: "wizard-explain-error", error: err.message });
      res.status(500).json({ error: err.message });
    }
  }
);

// Suggest example values for a specific field via AI
app.post(
  "/wizard/suggest",
  async (req, res) => {
    const { sectionId, fieldId } = req.body;
    try {
      const prompt = `Provide three concise example values for the configuration field "${fieldId}" in the "${sectionId}" section. Return only a JSON array of values.`;
      const reply = await openai.chatAssist(prompt);
      let suggestions = [];
      try { suggestions = JSON.parse(reply); } catch {}
      res.json({ suggestions });
    } catch (err) {
      logger.error({ event: "wizard-suggest-error", error: err.message });
      res.status(500).json({ error: err.message });
    }
  }
);

app.listen(5001, () => logger.info("Server running on http://localhost:5001"));
