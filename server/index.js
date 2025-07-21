const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { validateConfig } = require("./validate");
const { generateConfigFromPrompt } = require("./openai");
const winston = require("winston");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");

// Winston logger setup
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "server.log" })
  ]
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: "Too many requests, please try again later."
});
app.use(limiter);

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
      const { prompt } = req.body;
      const rawJson = await generateConfigFromPrompt(prompt);
      const parsed = JSON.parse(rawJson);
      const valid = validateConfig(parsed);

      if (!valid.valid) {
        logger.warn({ event: "config-invalid", error: valid.error });
        return res.status(400).json({ error: valid.error });
      }

      logger.info({ event: "config-generated", config: parsed });
      res.json({ config: parsed });
    } catch (err) {
      logger.error({ event: "server-error", error: err.message });
      res.status(500).json({ error: err.message });
    }
  }
);

app.listen(5000, () => logger.info("Server running on http://localhost:5000"));
