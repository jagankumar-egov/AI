const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { validateConfig } = require("./validate");
const { generateConfigFromPrompt } = require("./openai");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/generate-config", async (req, res) => {
  try {
    const { prompt } = req.body;
    const rawJson = await generateConfigFromPrompt(prompt);
    const parsed = JSON.parse(rawJson);
    const valid = validateConfig(parsed);

    if (!valid.valid) {
      return res.status(400).json({ error: valid.error });
    }

    res.json({ config: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
