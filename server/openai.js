const { OpenAI } = require("openai");
const { log, Logger } = require("winston");
require('dotenv').config();
const logger = require("./logger");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  const res = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  let jsonOutput = res.choices[0].message.content;
  logger.info({ event: "openai-response", response: jsonOutput });
  jsonOutput = jsonOutput.replace(/```json|```/g, "").trim();

  // Post-process to ensure each document's module matches root module
  try {
    const parsed = JSON.parse(jsonOutput);
    if (parsed && parsed.module && Array.isArray(parsed.documents)) {
      parsed.documents = parsed.documents.map(doc => ({ ...doc, module: parsed.module }));
      console.log("Post-processed documents:", parsed);
      return JSON.stringify(parsed);
    }
  } catch (e) {
    logger.warn({ event: "openai-postprocess-error", error: e.message });
  }
  return jsonOutput;
};
