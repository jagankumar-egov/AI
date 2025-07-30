const express = require('express');
const OpenAI = require('openai');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize AJV for validation
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load schema cache
let schemaCache = {};

async function loadSchema(section) {
  if (schemaCache[section]) {
    return schemaCache[section];
  }

  try {
    const { getSectionSchema } = require('../schemas');
    const schema = await getSectionSchema(section);
    
    if (schema) {
      schemaCache[section] = schema;
      return schema;
    } else {
      throw new Error(`Schema not found for section: ${section}`);
    }
  } catch (error) {
    console.error('Error loading schema:', error);
    throw new Error(`Failed to load schema for section: ${section}`);
  }
}

function buildPrompt(section, details, schema) {
  const schemaDescription = JSON.stringify(schema, null, 2);
  
  // Check if the schema expects a primitive type (string, number, boolean)
  const isPrimitiveType = schema.type && ['string', 'number', 'boolean'].includes(schema.type);
  
  let outputFormat = '';
  if (isPrimitiveType) {
    outputFormat = `IMPORTANT: Since the schema expects a ${schema.type}, return ONLY the ${schema.type} value, not an object. For example, if schema expects a string, return "value" not {"key": "value"}.`;
  }
  
  return `You are a service configuration generator. Generate a valid JSON configuration for the "${section}" section based on the following details and schema.

Schema for ${section}:
${schemaDescription}

User Details:
${JSON.stringify(details, null, 2)}

${outputFormat}

Requirements:
1. Generate ONLY valid JSON that matches the schema exactly
2. Include all required fields from the schema
3. Use the provided details to populate the configuration
4. Ensure the output is properly formatted and valid
5. Do not include any explanations or markdown formatting
6. If the schema expects a primitive type (string, number, boolean), return ONLY that value, not an object

Generate the configuration:`;
}

router.post('/', async (req, res) => {
  try {
    const { section, details, serviceName } = req.body;

    if (!section) {
      return res.status(400).json({
        error: 'Missing required field: section'
      });
    }

    if (!details) {
      return res.status(400).json({
        error: 'Missing required field: details'
      });
    }

    // Load schema for the section
    const schema = await loadSchema(section);
    
    // Build the prompt
    const prompt = buildPrompt(section, details, schema);

    // Generate configuration using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a JSON configuration generator. Always respond with valid JSON only, no explanations or markdown. If the schema expects a primitive type (string, number, boolean), return ONLY that value, not an object."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });

    const generatedConfig = completion.choices[0].message.content;

    // Parse and validate the generated config
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(generatedConfig);
    } catch (parseError) {
      return res.status(500).json({
        error: 'Failed to parse generated configuration',
        details: parseError.message,
        generated: generatedConfig
      });
    }

    // Validate against schema
    const validate = ajv.compile(schema);
    const isValid = validate(parsedConfig);

    if (!isValid) {
      return res.status(400).json({
        error: 'Generated configuration is invalid',
        validationErrors: validate.errors,
        generated: parsedConfig
      });
    }

    // Return the generated configuration
    res.json({
      success: true,
      section,
      config: parsedConfig,
      serviceName: serviceName || 'GeneratedService',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating config:', error);
    res.status(500).json({
      error: 'Failed to generate configuration',
      message: error.message
    });
  }
});

module.exports = router; 