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
      // Create a clean schema for validation by removing custom fields
      const cleanSchema = { ...schema };
      delete cleanSchema.documentation;
      delete cleanSchema.guidedQuestions;
      delete cleanSchema.generationLogic;
      
      // Store both the full schema (for prompts) and clean schema (for validation)
      schemaCache[section] = {
        full: schema,
        clean: cleanSchema
      };
      
      return schemaCache[section];
    } else {
      throw new Error(`Schema not found for section: ${section}`);
    }
  } catch (error) {
    console.error('Error loading schema:', error);
    throw new Error(`Failed to load schema for section: ${section}`);
  }
}

// Enhanced prompt building for AI-guided experience
async function buildPrompt(section, details, schema, context = {}) {
  const schemaDescription = JSON.stringify(schema, null, 2);
  
  // Check if the schema expects a primitive type (string, number, boolean)
  const isPrimitiveType = schema.type && ['string', 'number', 'boolean'].includes(schema.type);
  
  let outputFormat = '';
  if (isPrimitiveType) {
    outputFormat = `IMPORTANT: Since the schema expects a ${schema.type}, return ONLY the ${schema.type} value, not an object. For example, if schema expects a string, return "value" not {"key": "value"}.`;
  }
  
  // Build context information
  let contextInfo = '';
  if (context.completedSections && context.completedSections.length > 0) {
    contextInfo = `\nPreviously configured sections: ${context.completedSections.join(', ')}`;
  }
  if (context.existingConfig && Object.keys(context.existingConfig).length > 0) {
    contextInfo += `\nExisting configuration: ${JSON.stringify(context.existingConfig, null, 2)}`;
  }
  
  // Add guided questions if available
  let guidedQuestionsInfo = '';
  if (schema.guidedQuestions && schema.guidedQuestions.length > 0) {
    guidedQuestionsInfo = `\n\nGuided Questions for this section:\n${schema.guidedQuestions.map(q => `- ${q.question}`).join('\n')}`;
  }
  
  // Add schema-specific requirements
  let schemaRequirements = '';
  
  // Generate dynamic schema requirements using AI
  try {
    schemaRequirements = await generateSchemaRequirements(section, schema, context);
  } catch (error) {
    console.error('Error generating schema requirements:', error);
    // Fallback to basic requirements
    schemaRequirements = `
IMPORTANT REQUIREMENTS:
- Follow the schema structure exactly
- Include all required fields
- Ensure proper data types
- Validate against schema patterns`;
  }
  
  return `You are a service configuration generator. Generate a valid JSON configuration for the "${section}" section based on the following details and schema.

Schema for ${section}:
${schemaDescription}

User Details:
${JSON.stringify(details, null, 2)}${contextInfo}${guidedQuestionsInfo}${schemaRequirements}

${outputFormat}

Requirements:
1. Generate ONLY valid JSON that matches the schema exactly
2. Include all required fields from the schema
3. Use the provided details to populate the configuration
4. Consider the context from previously configured sections
5. Ensure the output is properly formatted and valid
6. Do not include any explanations or markdown formatting
7. If the schema expects a primitive type (string, number, boolean), return ONLY that value, not an object
8. If guided questions are provided, use them to structure the configuration appropriately
9. Follow the schema-specific requirements above exactly

Generate the configuration:`;
}

// Generate dynamic schema requirements using AI
async function generateSchemaRequirements(section, schema, context) {
  const OpenAI = require('openai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const promptForAI = `You are a schema requirements generator. Based on the following schema information, generate specific requirements and an example structure that the AI should follow when generating configurations.

Schema Information:
- Section: ${section}
- Schema Type: ${schema.type}
- Schema Properties: ${JSON.stringify(schema.properties || {}, null, 2)}
- Required Fields: ${JSON.stringify(schema.required || [], null, 2)}
- Context: ${JSON.stringify(context, null, 2)}

Requirements:
1. Generate specific requirements for this schema
2. Include an example structure that follows the schema exactly
3. Highlight required fields and validation rules
4. Consider the section type and common patterns
5. Include context-aware suggestions

Generate in this format:
IMPORTANT [SECTION] REQUIREMENTS:
- [specific requirement 1]
- [specific requirement 2]
- [specific requirement 3]

EXAMPLE [SECTION] STRUCTURE:
[valid JSON example that follows the schema exactly]

Focus on practical, actionable requirements that ensure valid configuration generation.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a schema requirements generator. Generate specific, actionable requirements and examples for configuration generation."
        },
        {
          role: "user",
          content: promptForAI
        }
      ],
      temperature: 0.2,
      max_tokens: 800
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI for schema requirements:', error);
    throw error;
  }
}

// Enhanced route for AI-guided generation
router.post('/ai-guided', async (req, res) => {
  try {
    const { section, details, context = {} } = req.body;

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
    const schemaData = await loadSchema(section);
    const fullSchema = schemaData.full;
    const cleanSchema = schemaData.clean;
    
    // Build the enhanced prompt with context
    const prompt = await buildPrompt(section, details, fullSchema, context);

    // Generate configuration using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a JSON configuration generator for service configuration. Always respond with valid JSON only, no explanations or markdown. If the schema expects a primitive type (string, number, boolean), return ONLY that value, not an object. Consider the context from previously configured sections to create coherent configurations."
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

    // Validate against clean schema
    const validate = ajv.compile(cleanSchema);
    const isValid = validate(parsedConfig);

    if (!isValid) {
      return res.status(400).json({
        error: 'Generated configuration is invalid',
        validationErrors: validate.errors,
        generated: parsedConfig
      });
    }

    // Return the generated configuration with enhanced info
    res.json({
      success: true,
      section,
      config: parsedConfig,
      context: context,
      timestamp: new Date().toISOString(),
      suggestions: generateNextStepSuggestions(section, context.completedSections, parsedConfig)
    });

  } catch (error) {
    console.error('Error generating AI-guided config:', error);
    res.status(500).json({
      error: 'Failed to generate configuration',
      message: error.message
    });
  }
});

// Generate contextual suggestions for next steps
function generateNextStepSuggestions(completedSection, completedSections, currentConfig) {
  const suggestions = [];
  
  // Get available sections dynamically
  const { getAvailableSections } = require('../schemas');
  
  getAvailableSections().then(availableSections => {
    // Find next section based on schema order
    const currentIndex = availableSections.indexOf(completedSection);
    if (currentIndex < availableSections.length - 1) {
      const nextSection = availableSections[currentIndex + 1];
      suggestions.push(`Now let's configure the ${nextSection} section`);
    }
    
    // Generate contextual suggestions based on completed sections
    if (completedSections.includes('module') || completedSections.includes('service')) {
      suggestions.push('Now let\'s configure the form fields for your service');
      suggestions.push('We can set up the workflow states next');
    }
    
    if (completedSections.includes('fields')) {
      suggestions.push('Great! Now let\'s create a workflow that matches your form fields');
      suggestions.push('We can also set up validation rules for your fields');
    }
    
    if (completedSections.includes('workflow')) {
      suggestions.push('Perfect! Now let\'s configure the billing structure');
    }
    
    // Add generic suggestions for remaining sections
    const remainingSections = availableSections.filter(section => 
      !completedSections.includes(section)
    );
    
    if (remainingSections.length > 0) {
      suggestions.push(`We can also configure: ${remainingSections.slice(0, 3).join(', ')}`);
    }
  }).catch(error => {
    console.error('Error getting available sections:', error);
    // Fallback suggestions
    suggestions.push('Let\'s continue with the next section');
    suggestions.push('We can configure additional sections as needed');
  });
  
  return suggestions;
}

module.exports = router; 