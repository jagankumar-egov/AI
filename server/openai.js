const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.generateConfigFromPrompt = async (userInput) => {
  const prompt = `
You are a configuration expert. Convert the following user instruction into a valid JSON as per the given serviceConfigSchema.

User Instruction:
${userInput}

Only return raw JSON without explanation.
  `;

  const res = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  const jsonOutput = res.choices[0].message.content;
  return jsonOutput.replace(/```json|```/g, "").trim();
};
