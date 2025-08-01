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
    // Try to load schema from the main schemas directory
    let schemaPath = path.join(__dirname, '..', 'schemas', `${section}.json`);
    let schema;
    
    try {
      const schemaContent = await fs.readFile(schemaPath, 'utf8');
      schema = JSON.parse(schemaContent);
    } catch (error) {
      // Try test schemas if not found in main schemas
      const testPaths = [
        path.join(__dirname, '..', 'test', 'schemas', 'simple', `${section}.json`),
        path.join(__dirname, '..', 'test', 'schemas', 'medium', `${section}.json`)
      ];
      
      for (const testPath of testPaths) {
        try {
          const schemaContent = await fs.readFile(testPath, 'utf8');
          schema = JSON.parse(schemaContent);
          break;
        } catch (testError) {
          continue;
        }
      }
    }
    
    if (!schema) {
      throw new Error(`Schema not found for section: ${section}`);
    }
    
    // Create a clean schema for validation by removing custom fields
    const cleanSchema = { ...schema };
    delete cleanSchema.documentation;
    delete cleanSchema.guidedQuestions;
    delete cleanSchema.generationLogic;
    
    // Convert required field to array format for AJV validation
    if (cleanSchema.required === true) {
      cleanSchema.required = [];
    } else if (cleanSchema.required === false) {
      delete cleanSchema.required;
    }
    
    // Store both the full schema (for prompts) and clean schema (for validation)
    schemaCache[section] = {
      full: schema,
      clean: cleanSchema
    };
    
    return schemaCache[section];
  } catch (error) {
    console.error('Error loading schema:', error);
    throw new Error(`Failed to load schema for section: ${section}`);
  }
}

// Enhanced input sanitization and attribute extraction
async function sanitizeAndExtractAttributes(userInput, section, schema, context = {}) {
  const OpenAI = require('openai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  // Build context about what we're looking for
  const schemaInfo = {
    section: section,
    type: schema.type,
    properties: schema.properties || {},
    required: schema.required || [],
    examples: schema.examples || [],
    description: schema.description || `Configure ${section}`
  };

  const promptForExtraction = `You are an intelligent input processor for service configuration. Your job is to extract and structure multiple attributes from user input.

USER INPUT: "${userInput}"

SECTION: ${section}
SCHEMA TYPE: ${schemaInfo.type}
SCHEMA DESCRIPTION: ${schemaInfo.description}

SCHEMA PROPERTIES: ${JSON.stringify(schemaInfo.properties, null, 2)}
REQUIRED FIELDS: ${JSON.stringify(schemaInfo.required, null, 2)}
EXAMPLES: ${JSON.stringify(schemaInfo.examples, null, 2)}

CONTEXT: ${JSON.stringify(context, null, 2)}

TASK: Extract ALL relevant attributes from the user input. Look for:
1. Direct attribute assignments (e.g., "module called tradelicence" → module: "tradelicence")
2. Service names and identifiers
3. Configuration values and settings
4. Any other relevant information that matches the schema

EXAMPLES OF WHAT TO EXTRACT:
- "create a module called tradelicence and service as NewTl" → { module: "tradelicence", service: "NewTl" }
- "module tradelicence service NewTl" → { module: "tradelicence", service: "NewTl" }
- "workflow with states DRAFT, PENDING, APPROVED" → { states: ["DRAFT", "PENDING", "APPROVED"] }
- "form fields: name (text), email (email), age (number)" → { fields: [{ name: "name", type: "text" }, { name: "email", type: "email" }, { name: "age", type: "number" }] }
- "billing with tax head TL_FEE amount 1000" → { taxHead: [{ code: "TL_FEE", amount: 1000 }] }
- "access control with roles CITIZEN, EMPLOYEE" → { roles: ["CITIZEN", "EMPLOYEE"] }

INSTRUCTIONS:
1. Extract ALL attributes mentioned in the input
2. Map them to appropriate schema properties
3. Use common sense to fill in missing required fields
4. Return a structured object with all extracted information
5. If the input is unclear, ask for clarification

RESPONSE FORMAT:
Return ONLY a JSON object with extracted attributes. No explanations, no markdown.

Example response:
{
  "extractedAttributes": {
    "module": "tradelicence",
    "service": "NewTl"
  },
  "missingRequired": ["field1", "field2"],
  "needsClarification": false,
  "clarificationQuestion": null
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an intelligent input processor. Extract all relevant attributes from user input and return structured JSON. Be thorough and extract everything mentioned."
        },
        {
          role: "user",
          content: promptForExtraction
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    const response = completion.choices[0].message.content.trim();
    
    // Try to parse the response as JSON
    try {
      const parsedResponse = JSON.parse(response);
      return parsedResponse;
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          console.error('Error parsing extracted attributes:', secondParseError);
          throw new Error('Failed to parse extracted attributes');
        }
      } else {
        // Fallback: return basic extraction
        return {
          extractedAttributes: {},
          missingRequired: schemaInfo.required,
          needsClarification: true,
          clarificationQuestion: "Could you please provide more specific details about the configuration you need?"
        };
      }
    }
  } catch (error) {
    console.error('Error in input sanitization:', error);
    throw new Error('Failed to process user input');
  }
}

// Enhanced prompt building for AI-guided experience
async function buildPrompt(section, details, schema, context = {}) {
  // First, sanitize and extract attributes from user input
  const sanitizedInput = await sanitizeAndExtractAttributes(details.prompt || details, section, schema, context);
  
  // If we need clarification, return early
  if (sanitizedInput.needsClarification) {
    return {
      type: 'clarification',
      question: sanitizedInput.clarificationQuestion,
      missingRequired: sanitizedInput.missingRequired
    };
  }

      // Use extracted attributes to build a more specific prompt
    const extractedAttributes = sanitizedInput.extractedAttributes || {};
    const schemaDescription = JSON.stringify(schema, null, 2);
    
    // Check if user wants to use default configuration
    const useDefault = context.useDefault || details.prompt?.toLowerCase().includes('default');
    
    // Check for affirmative responses
    const isAffirmative = details.prompt?.toLowerCase().match(/^(yes|yeah|yep|ok|okay|fine|good|sure|alright|right|correct)$/);
  
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
  
  // Add extracted attributes to context
  if (Object.keys(extractedAttributes).length > 0) {
    contextInfo += `\nExtracted attributes from user input: ${JSON.stringify(extractedAttributes, null, 2)}`;
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
  
  // Handle affirmative responses
  if (isAffirmative) {
    return `You are an intelligent service configuration generator. The user has given an affirmative response (like "yes", "ok", "fine") for the ${section} section.

Schema for ${section}:
${schemaDescription}

CONTEXT: User gave affirmative response${contextInfo}

TASK: Generate a sensible configuration for ${section} that:
1. Follows the schema structure exactly
2. Uses common, sensible values
3. Includes all required fields
4. Uses industry-standard patterns
5. Is ready for production use

INSTRUCTIONS:
- Generate a complete, valid JSON configuration
- Use sensible values based on the section type
- Ensure all required fields are included
- Follow common patterns for this type of configuration
- Make it production-ready with standard values

CRITICAL OUTPUT FORMAT:
- Return ONLY valid JSON, no markdown formatting, no code blocks
- Do not wrap the JSON in \`\`\`json\`\`\` or any other formatting
- Return the raw JSON object or array

Generate the configuration for ${section}:`;
  }

  // Handle default configuration request
  if (useDefault) {
    return `You are an intelligent service configuration generator. The user wants to use DEFAULT settings for the ${section} section.

Schema for ${section}:
${schemaDescription}

CONTEXT: User requested default configuration${contextInfo}

TASK: Generate a sensible DEFAULT configuration for ${section} that:
1. Follows the schema structure exactly
2. Uses common, sensible default values
3. Includes all required fields
4. Uses industry-standard patterns
5. Is ready for production use

INSTRUCTIONS:
- Generate a complete, valid JSON configuration
- Use sensible defaults based on the section type
- Ensure all required fields are included
- Follow common patterns for this type of configuration
- Make it production-ready with standard values

CRITICAL OUTPUT FORMAT:
- Return ONLY valid JSON, no markdown formatting, no code blocks
- Do not wrap the JSON in \`\`\`json\`\`\` or any other formatting
- Return the raw JSON object or array

Generate the DEFAULT configuration for ${section}:`;
  }

  return `You are an intelligent service configuration generator. Your job is to understand user intent and generate valid JSON configurations.

IMPORTANT: Be flexible and intelligent in understanding user inputs. Users may provide:
- Natural language descriptions
- Partial information that you should complete intelligently
- Examples or patterns they want to follow
- Specific requirements or constraints
- References to common patterns or standards

Schema for ${section}:
${schemaDescription}

User Input (be flexible in understanding this):
${JSON.stringify(details, null, 2)}${contextInfo}${guidedQuestionsInfo}${schemaRequirements}

${outputFormat}

YOUR APPROACH:
1. **Understand Intent**: Analyze what the user is trying to achieve, even if not perfectly formatted
2. **Be Helpful**: If user provides partial information, intelligently complete it based on common patterns
3. **Follow Examples**: If user provides examples, use them as templates
4. **Ask for Missing Info**: If critical information is missing, ask specific questions
5. **Generate Valid JSON**: Always return valid JSON that matches the schema
6. **Be Conversational**: If user input is unclear, ask clarifying questions in a helpful way

SPECIFIC INSTRUCTIONS:
- If the user provides a clear configuration, generate it
- If the user provides partial information, complete it intelligently
- If the user provides examples or patterns, use them as templates
- If the user asks for help, provide specific guidance
- If the user input is unclear, ask for clarification
- Always ensure the output matches the schema structure
- Include all required fields from the schema
- Use proper data types as specified in the schema

CRITICAL OUTPUT FORMAT:
- Return ONLY valid JSON, no markdown formatting, no code blocks
- Do not wrap the JSON in \`\`\`json\`\`\` or any other formatting
- Return the raw JSON object or array
- If asking for clarification, return a conversational response

Generate the configuration or ask for clarification:`;
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
    
    // Build the enhanced prompt with context and input sanitization
    const prompt = await buildPrompt(section, details, fullSchema, context);
    
    // Check if we need clarification from input sanitization
    if (prompt.type === 'clarification') {
      return res.json({
        success: false,
        type: 'clarification_needed',
        message: prompt.question,
        missingRequired: prompt.missingRequired,
        section,
        context: context,
        timestamp: new Date().toISOString()
      });
    }

    // Generate configuration using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an intelligent and helpful AI assistant for service configuration. Your role is to:

1. **Understand User Intent**: Be flexible in understanding what users want, even if their input isn't perfectly formatted
2. **Be Conversational**: If user input is unclear, ask helpful clarifying questions
3. **Generate Valid Configurations**: When you understand the intent, generate valid JSON that matches the schema
4. **Be Helpful**: Provide specific guidance and examples when needed
5. **Follow Patterns**: If users provide examples or patterns, use them as templates
6. **Complete Missing Information**: Intelligently fill in missing details based on common patterns

CRITICAL OUTPUT FORMAT:
- Return ONLY valid JSON when generating configurations
- NO markdown formatting, NO code blocks, NO \`\`\`json\`\`\` wrappers
- Return raw JSON object or array
- If asking for clarification, return conversational text

IMPORTANT: 
- If the user provides clear configuration details, generate the JSON
- If the user provides partial information, complete it intelligently
- If the user asks for help or clarification is needed, ask specific questions
- Always return valid JSON when generating configurations
- Be conversational and helpful, not rigid or error-prone`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const generatedConfig = completion.choices[0].message.content;

    // Check if the response is asking for clarification or providing help
    const responseText = generatedConfig.trim();
    
    // First, try to extract JSON from the response
    let jsonMatch = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const extractedJson = JSON.parse(jsonMatch[0]);
        // If we successfully parsed JSON, use it as the configuration
        parsedConfig = extractedJson;
        
        // Validate against clean schema
        const validate = ajv.compile(cleanSchema);
        const isValid = validate(parsedConfig);
        
        if (isValid) {
          // Return the generated configuration with enhanced info
          return res.json({
            success: true,
            section,
            config: parsedConfig,
            context: context,
            timestamp: new Date().toISOString(),
            suggestions: generateNextStepSuggestions(section, context.completedSections, parsedConfig)
          });
        } else {
          console.log('Validation failed:', validate.errors);
          console.log('Generated config:', parsedConfig);
          console.log('Clean schema:', cleanSchema);
        }
      } catch (parseError) {
        // Continue to clarification check
      }
    }
    
    // If the response looks like it's asking for clarification or providing help
    if (responseText.toLowerCase().includes('clarification') || 
        responseText.toLowerCase().includes('help') ||
        responseText.toLowerCase().includes('could you') ||
        responseText.toLowerCase().includes('please provide') ||
        responseText.toLowerCase().includes('i need') ||
        responseText.toLowerCase().includes('missing') ||
        (!responseText.startsWith('{') && !responseText.startsWith('[') && !responseText.startsWith('"'))) {
      
      return res.json({
        success: false,
        type: 'clarification_needed',
        message: responseText,
        section,
        context: context,
        timestamp: new Date().toISOString()
      });
    }

    // Parse and validate the generated config
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(generatedConfig);
    } catch (parseError) {
      // If parsing fails, it might be a conversational response
      return res.json({
        success: false,
        type: 'conversational_response',
        message: responseText,
        section,
        context: context,
        timestamp: new Date().toISOString()
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

    // Check if we have multi-attributes from input sanitization
    const multiAttributes = {};
    if (context.multiAttributes) {
      // Use the extracted attributes to generate configurations for multiple sections
      for (const [attrName, attrValue] of Object.entries(context.multiAttributes)) {
        try {
          // Generate configuration for each attribute
          const attrSchemaData = await loadSchema(attrName);
          const attrCleanSchema = attrSchemaData.clean;
          
          // Create a simple configuration for the attribute
          let attrConfig;
          if (attrCleanSchema.type === 'string') {
            attrConfig = attrValue;
          } else if (attrCleanSchema.type === 'object') {
            attrConfig = { [attrName]: attrValue };
          } else {
            attrConfig = attrValue;
          }
          
          // Validate the attribute configuration
          const validateAttr = ajv.compile(attrCleanSchema);
          const isValidAttr = validateAttr(attrConfig);
          
          if (isValidAttr) {
            multiAttributes[attrName] = attrConfig;
          }
        } catch (error) {
          console.warn(`Error generating config for attribute ${attrName}:`, error);
        }
      }
    }
    
    // Return the generated configuration with enhanced info
    res.json({
      success: true,
      section,
      config: parsedConfig,
      context: context,
      timestamp: new Date().toISOString(),
      suggestions: generateNextStepSuggestions(section, context.completedSections, parsedConfig),
      multiAttributes: Object.keys(multiAttributes).length > 0 ? multiAttributes : undefined
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
module.exports.sanitizeAndExtractAttributes = sanitizeAndExtractAttributes; 