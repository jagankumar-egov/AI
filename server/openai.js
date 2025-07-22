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
  "documents": array,
  "workflow": object,
  "bill": object (optional)
}

All of the required fields (module, service, fields, workflow) must be present and non-empty. Use the user's instruction to fill in the values. Do not include any explanation or markdown, only return the raw JSON.

User Instruction:
${userInput}
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  const jsonOutput = res.choices[0].message.content;
  logger.info({ event: "openai-response", response: jsonOutput });
  return jsonOutput.replace(/```json|```/g, "").trim();
};
