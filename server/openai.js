
const fs = require("fs");
const path = require("path");
const logger = require("./logger");
require("dotenv").config();

const { OpenAI } = require("openai");
const { log } = require("console");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!process.env.OPENAI_API_KEY) {
  logger.error("Missing OPENAI_API_KEY in environment. Please check your .env file.");
  throw new Error("OPENAI_API_KEY not found.");
}

const refusal = "Sorry, I can only answer questions related to the provided DIGIT Studio configuration.";

exports.chatAssist = async (prompt) => {
  try {
    // Step 1: Load local config JSON
    const configPath = path.join(__dirname, "assets/helper.json");
    const configRaw = fs.readFileSync(configPath, "utf-8");
    const configJson = JSON.parse(configRaw);
    console.log({ event: "config-loaded", config: configJson });

    // Step 2: Extract relevant config sections based on prompt
    const relevantContent = extractRelevantSections(configJson, prompt);

    // Step 3: Build system context for the LLM
    const context = `You are an expert AI assistant for the DIGIT Studio project.

STRICT RULES:
- You must ONLY answer questions that are directly and explicitly answered by the provided config sections below.
- If the answer is not found in this context, you MUST reply: "${refusal}"
- Do NOT make up answers, do NOT speculate, do NOT answer outside the provided context.

---
Relevant Config Content:
${JSON.stringify(relevantContent, null, 2)}
---
Always answer only based on this configuration.`;

    // Step 4: OpenAI Chat Completion Call
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: context },
        { role: "user", content: prompt }
      ],
      temperature: 0,
      max_tokens: 500
    });

    let reply = response.choices[0].message.content.trim();

    // Step 5: Fallback for generic/uncertain replies
    if (
      !reply ||
      reply.length < 10 ||
      /i (don't|do not) know|not sure|cannot help|no idea|not covered/i.test(reply.toLowerCase())
    ) {
      reply = refusal;
    }

    logger.info({ event: "chat-assist-reply", reply });
    return reply;
  } catch (err) {
    logger.error({ event: "chat-assist-error", error: err.message });
    return refusal; // Optional: Still return refusal instead of throwing
  }
};

// Helper function to extract relevant sections
// Helper function to extract relevant config sections from JSON based on prompt
function extractRelevantSections(configJson, prompt) {
  const promptWords = prompt.toLowerCase().split(/\W+/).filter(Boolean);
  const matchedSections = {};

  // Recursive search
  function search(obj, currentPath = "") {
    for (const key in obj) {
      const value = obj[key];
      const pathKey = currentPath ? `${currentPath}.${key}` : key;

      const valueStr = typeof value === "string"
        ? value.toLowerCase()
        : JSON.stringify(value).toLowerCase();

      const keyStr = key.toLowerCase();

      const isRelevant = promptWords.some(word =>
        keyStr.includes(word) || valueStr.includes(word)
      );

      if (isRelevant) {
        matchedSections[pathKey] = value;
      }

      if (typeof value === "object" && value !== null) {
        search(value, pathKey);
      }
    }
  }

  search(configJson);

  // Limit the final object length to ~12000 characters
  const resultStr = JSON.stringify(matchedSections, null, 2);
  const trimmedStr = resultStr.slice(0, 12000);
  console.log(trimmedStr);
  
  return JSON.parse(trimmedStr || "{}");
}





// // 🔹 Chat assistant - for help / docs
exports.chatAssistInternal = async (prompt) => {
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
