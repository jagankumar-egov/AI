require('dotenv').config(); // Load .env first
const { OpenAI } = require("openai");
const logger = require("./logger"); // Make sure logger is set up
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!process.env.OPENAI_API_KEY) {
  logger.error("Missing OPENAI_API_KEY in environment. Please check your .env file.");
  throw new Error("OPENAI_API_KEY not found.");
}

// 🔹 Chat assistant - for help / docs
exports.chatAssist = async (prompt) => {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 300,
    });

    const reply = res.choices[0].message.content.trim();
    logger.info({ event: "chat-assist-reply", reply });
    return reply;
  } catch (err) {
    logger.error({ event: "chat-assist-error", error: err.message });
    throw err;
  }
};

// 🔹 Config generator from NL prompt
exports.generateConfigFromPrompt = async (userInput) => {
  const prompt = `
You are a configuration expert. Convert the following user instruction into a valid JSON object that strictly matches this schema:

{
  "module": string,
  "service": string,
  "fields": array,
  "idgen": array,
  "documents": array of objects (each object must include a 'module' field with the same value as the root 'module'),
  "workflow": object,
  "bill": object (optional)
}

All of the required fields (module, service, fields, workflow) must be present and non-empty. In the 'documents' array, each document object must include a 'module' field with the same value as the root 'module'. Use the user's instruction to fill in the values. Do not include any explanation or markdown, only return the raw JSON.

User Instruction:
${userInput}
`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    let jsonOutput = res.choices[0].message.content;
    logger.info({ event: "openai-response", response: jsonOutput });

    // Clean markdown fences like ```json
    jsonOutput = jsonOutput.replace(/```json|```/g, "").trim();

    // Safe parse and patch `documents[].module`
    let parsed = JSON.parse(jsonOutput);
    if (parsed && parsed.module && Array.isArray(parsed.documents)) {
      parsed.documents = parsed.documents.map((doc) => ({
        ...doc,
        module: parsed.module,
      }));
      logger.info({ event: "postprocess-documents", documents: parsed.documents });
    }

    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    logger.error({ event: "generate-config-error", error: e.message });
    throw new Error("Failed to generate or parse config JSON.");
  }
};
