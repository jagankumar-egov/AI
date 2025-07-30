const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { 
  getAvailableSections, 
  getSectionOrder, 
  getSectionDocumentation,
  getSectionSchema,
  getPreConfiguredSections,
  getSectionGenerationLogic,
  getSectionPreConfigTemplate
} = require('../schemas');

const router = express.Router();

// Schema documentation cache
let docsCache = {};

// Function to generate creation steps dynamically based on schema
async function generateCreationSteps(sections, requiredSections) {
  const steps = [];
  
  // Step 1: Required Schema Fields (from schema)
  const requiredFields = [];
  
  // Get all required sections from schema
  for (const sectionName of requiredSections) {
    // Find section by name (case-insensitive)
    const section = sections.find(s => s.name.toLowerCase() === sectionName.toLowerCase());
    if (section) {
      const fieldType = getFieldTypeForSection(section);
      const validation = await getValidationForSection(section);
      
      requiredFields.push({
        name: sectionName,
        label: section.name,
        type: fieldType,
        required: true,
        helperText: section.documentation || `Enter the ${section.name} value`,
        validation: validation
      });
    }
  }

  if (requiredFields.length > 0) {
    steps.push({
      label: 'Required Configuration',
      description: 'Configure the required schema fields',
      fields: requiredFields
    });
  }

  // Step 2: Optional Schema Fields (from schema)
  const optionalFields = [];
  
  // Get all non-required sections that can be configured initially
  const optionalSections = sections.filter(section => {
    const sectionNameLower = section.name.toLowerCase();
    return !requiredSections.includes(sectionNameLower) && 
           (section.type === 'string' || section.type === 'object'); // Include both string and object types
  });
  
  for (const section of optionalSections) {
    const fieldType = getFieldTypeForSection(section);
    const validation = await getValidationForSection(section);
    
    optionalFields.push({
      name: section.name.toLowerCase(),
      label: section.name,
      type: fieldType,
      required: section.required || false,
      helperText: section.documentation || `Configure ${section.name}`,
      validation: validation,
      isOptional: true, // Mark as optional for UI
      schema: validation.schema, // Include schema for guided questions
      enabled: false // Default to disabled
    });
  }

  if (optionalFields.length > 0) {
    steps.push({
      label: 'Optional Configuration',
      description: 'Configure optional schema fields (toggle to enable)',
      fields: optionalFields
    });
  }

  return steps;
}

// Helper function to get validation rules based on section
async function getValidationForSection(section) {
  const validation = {};
  
  if (section.type === 'string') {
    validation.minLength = 1;
    validation.maxLength = 100;
    
    // Get validation from schema file if available
    const schemaValidation = await getSchemaValidation(section);
    if (schemaValidation) {
      Object.assign(validation, schemaValidation);
    }
  } else if (section.type === 'object' || section.type === 'array') {
    validation.type = 'json';
    validation.schema = await getObjectSchema(section);
    validation.helperText = `Expected structure: ${JSON.stringify(validation.schema.example, null, 2)}`;
  }
  
  return validation;
}

// Centralized function to map section names to file names
async function getSectionFileName(sectionName) {
  const sectionNameLower = sectionName.toLowerCase();
  
  // Get available schema files dynamically
  const schemasDir = path.join(__dirname, '..', 'schemas');
  const files = await fs.readdir(schemasDir);
  const availableSchemas = files
    .filter(file => file.endsWith('.json') && file !== 'index.json')
    .map(file => file.replace('.json', ''));
  
  // Create dynamic mapping based on available schemas
  const sectionFileMap = {};
  availableSchemas.forEach(schema => {
    // Handle common variations
    const variations = [
      schema,
      schema.replace('_', ' '),
      schema.replace('_', ''),
      schema.toLowerCase(),
      schema.replace(/([A-Z])/g, ' $1').trim().toLowerCase()
    ];
    
    variations.forEach(variation => {
      sectionFileMap[variation] = schema;
    });
  });
  
  // Add common aliases
  const aliases = {
    'id generation': 'idgen',
    'business rules': 'rules',
    'access control': 'access',
    'billing': 'bill',
    'payment gateway': 'payment',
    'calculation': 'calculator',
    'document requirements': 'documents',
    'pdf generation': 'pdf',
    'applicant configuration': 'applicant',
    'geographic boundaries': 'boundary',
    'localization settings': 'localization',
    'notification settings': 'notification'
  };
  
  // Merge aliases with dynamic mapping
  Object.assign(sectionFileMap, aliases);
  
  return sectionFileMap[sectionNameLower] || sectionNameLower;
}

// Function to get validation from schema file
async function getSchemaValidation(section) {
  const fileName = await getSectionFileName(section.name);
  
  try {
    const schemaPath = path.join(process.cwd(), 'schemas', `${fileName}.json`);
    const schemaContent = await fs.readFile(schemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);
    
    // Extract validation rules from schema
    const validation = {};
    
    if (schema.pattern) {
      validation.pattern = schema.pattern;
    }
    
    if (schema.minLength !== undefined) {
      validation.minLength = schema.minLength;
    }
    
    if (schema.maxLength !== undefined) {
      validation.maxLength = schema.maxLength;
    }
    
    if (schema.helperText) {
      validation.helperText = schema.helperText;
    }
    
    return validation;
  } catch (error) {
    // If schema file doesn't exist, return null
    return null;
  }
}

// Function to get specific object schema for each section
async function getObjectSchema(section) {
  const fileName = await getSectionFileName(section.name);
  
  try {
    // Try to load schema from individual schema file
    const schemaPath = path.join(process.cwd(), 'schemas', `${fileName}.json`);
    console.log('Loading schema from:', schemaPath);
    const schemaContent = await fs.readFile(schemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);
    
    // Return schema with guided questions if available
    return {
      type: schema.type,
      properties: schema.properties || {},
      required: schema.required || [],
      example: schema.documentation?.examples?.[0] || {},
      guidedQuestions: schema.guidedQuestions || []
    };
  } catch (error) {
    console.log('Error loading schema:', error.message);
    // Fallback to basic schema if file doesn't exist
    return {
      type: 'object',
      properties: {},
      example: {},
      guidedQuestions: []
    };
  }
}

// Helper function to get field type based on section
function getFieldTypeForSection(section) {
  switch (section.type) {
    case 'string':
      return 'text';
    case 'number':
      return 'number';
    case 'boolean':
      return 'select';
    case 'array':
      return 'json';  // Use JSON editor for arrays
    case 'object':
      return 'json';  // Use JSON editor for objects
    default:
      return 'text';
  }
}

// Function to generate pre-configured sections based on schema
function generatePreConfiguredSections(sections, requiredSections) {
  const preConfiguredSections = {};
  const preConfiguredSectionNames = getPreConfiguredSections();
  
  // Get non-required sections that should be pre-configured
  const sectionsToPreConfigure = sections.filter(section => {
    const sectionNameLower = section.name.toLowerCase();
    return !requiredSections.includes(sectionNameLower) && 
           preConfiguredSectionNames.includes(sectionNameLower);
  });
  
  sectionsToPreConfigure.forEach(section => {
    const sectionNameLower = section.name.toLowerCase();
    const preConfigTemplate = getSectionPreConfigTemplate(sectionNameLower);
    
    if (preConfigTemplate) {
      // Use the section name as the key (not the mapped name)
      preConfiguredSections[sectionNameLower] = preConfigTemplate;
    }
  });
  
  return preConfiguredSections;
}

// Function to generate information cards based on schema
function generateInformationCards(sections, requiredSections, preConfiguredSections) {
  const preConfiguredItems = Object.keys(preConfiguredSections).map(sectionName => {
    // Get section documentation for display name
    const sectionDoc = getSectionDocumentation(sectionName);
    const displayName = sectionDoc ? sectionDoc.name : sectionName;
    return `${displayName} - Pre-configured section`;
  });

  const availableItems = sections
    .filter(section => {
      const sectionNameLower = section.name.toLowerCase();
      return !requiredSections.includes(sectionNameLower) && 
             !Object.keys(preConfiguredSections).some(key => 
               sectionNameLower.includes(key.toLowerCase())
             );
    })
    .map(section => `${section.name} - ${section.description}`);

  return {
    preConfigured: {
      title: 'Pre-configured Sections',
      description: 'The following sections will be pre-configured:',
      items: preConfiguredItems
    },
    available: {
      title: 'Available Sections',
      description: 'You can configure these additional sections:',
      items: availableItems
    }
  };
}

async function loadSchemaDocs() {
  if (Object.keys(docsCache).length > 0) {
    return docsCache;
  }

  try {
    const schemaPath = path.join(__dirname, '..', '..', 'serviceConfigSchema.json');
    const schemaData = await fs.readFile(schemaPath, 'utf8');
    const fullSchema = JSON.parse(schemaData);
    
    // Extract documentation for each section
    if (fullSchema.properties) {
      Object.keys(fullSchema.properties).forEach(section => {
        const sectionSchema = fullSchema.properties[section];
        docsCache[section] = {
          schema: sectionSchema,
          description: sectionSchema.description || `Configuration for ${section} section`,
          required: sectionSchema.required || [],
          examples: generateExamples(section, sectionSchema),
          prompting: generatePromptingGuide(section, sectionSchema)
        };
      });
    }
    
    return docsCache;
  } catch (error) {
    console.error('Error loading schema docs:', error);
    throw new Error('Failed to load schema documentation');
  }
}

function generateExamples(section, schema) {
  const examples = {
    basic: {},
    advanced: {}
  };

  // Generate basic example based on schema structure
  if (schema.type === 'object' && schema.properties) {
    Object.keys(schema.properties).forEach(prop => {
      const propSchema = schema.properties[prop];
      examples.basic[prop] = generateExampleValue(propSchema);
    });
  } else if (schema.type === 'array' && schema.items) {
    examples.basic = [generateExampleValue(schema.items)];
  }

  return examples;
}

function generateExampleValue(schema) {
  if (schema.type === 'string') {
    return schema.enum ? schema.enum[0] : 'example_string';
  } else if (schema.type === 'number') {
    return 0;
  } else if (schema.type === 'boolean') {
    return false;
  } else if (schema.type === 'array') {
    return schema.items ? [generateExampleValue(schema.items)] : [];
  } else if (schema.type === 'object') {
    const obj = {};
    if (schema.properties) {
      Object.keys(schema.properties).forEach(prop => {
        obj[prop] = generateExampleValue(schema.properties[prop]);
      });
    }
    return obj;
  }
  return null;
}

function generatePromptingGuide(section, schema) {
  const guide = {
    description: `Guide for generating ${section} configuration`,
    keyFields: [],
    tips: []
  };

  if (schema.properties) {
    Object.keys(schema.properties).forEach(prop => {
      const propSchema = schema.properties[prop];
      guide.keyFields.push({
        name: prop,
        type: propSchema.type,
        required: schema.required ? schema.required.includes(prop) : false,
        description: propSchema.description || `${prop} field`
      });
    });
  }

  // Add section-specific tips
  switch (section) {
    case 'workflow':
      guide.tips = [
        'Define clear state transitions',
        'Specify roles for each state',
        'Include all required actions'
      ];
      break;
    case 'form':
      guide.tips = [
        'Define field types and validation',
        'Include required fields',
        'Specify field labels and names'
      ];
      break;
    case 'billing':
      guide.tips = [
        'Define billing slabs',
        'Specify tax periods',
        'Include business service details'
      ];
      break;
    default:
      guide.tips = [
        'Follow the schema structure',
        'Include all required fields',
        'Use appropriate data types'
      ];
  }

  return guide;
}

// Use dynamic section management from schemas/index.js
// The section order and required sections are now managed dynamically

// Endpoint to get the section order and required sections
router.get('/section-order', (req, res) => {
  const { order, required } = getSectionOrder();
  res.json({
    order,
    required
  });
});

// Get all available sections
router.get('/', async (req, res) => {
  try {
    const sections = getAvailableSections();
    
    res.json({
      sections,
      total: sections.length
    });
  } catch (error) {
    console.error('Error getting sections:', error);
    res.status(500).json({
      error: 'Failed to get sections',
      message: error.message
    });
  }
});

// Get configuration creation requirements (must be before /:section route)
router.get('/create-requirements', async (req, res) => {
  try {
    const { order, required } = getSectionOrder();
    const sections = getAvailableSections();
    
    // Generate creation steps dynamically based on schema
    const creationSteps = await generateCreationSteps(sections, required);

    // Generate pre-configured sections based on schema
    const preConfiguredSections = generatePreConfiguredSections(sections, required);

    // Generate information cards based on schema
    const informationCards = generateInformationCards(sections, required, preConfiguredSections);

    res.json({
      steps: creationSteps,
      preConfiguredSections,
      informationCards,
      requiredSections: required,
      availableSections: sections.map(s => s.name)
    });
  } catch (error) {
    console.error('Error getting creation requirements:', error);
    res.status(500).json({
      error: 'Failed to get creation requirements',
      message: error.message
    });
  }
});

// Get documentation for a specific section
router.get('/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const sectionDoc = getSectionDocumentation(section);

    if (!sectionDoc) {
      return res.status(404).json({
        error: 'Section not found',
        message: `Section '${section}' not found in schema`
      });
    }

    res.json({
      section,
      ...sectionDoc
    });
  } catch (error) {
    console.error('Error getting section docs:', error);
    res.status(500).json({
      error: 'Failed to get section documentation',
      message: error.message
    });
  }
});

// Generate JSON from guided question answers
router.post('/generate-json', async (req, res) => {
  try {
    const { fieldName, answers, questions } = req.body;
    
    if (!fieldName || !answers) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'fieldName and answers are required'
      });
    }

    const generatedJson = await generateJsonFromGuidedQuestions(fieldName, answers, questions);
    
    res.json({
      fieldName,
      generatedJson
    });
  } catch (error) {
    console.error('Error generating JSON from guided questions:', error);
    res.status(500).json({
      error: 'Failed to generate JSON',
      message: error.message
    });
  }
});

// Get schema for a specific section
router.get('/:section/schema', async (req, res) => {
  try {
    const { section } = req.params;
    const schema = await getSectionSchema(section);

    if (!schema) {
      return res.status(404).json({
        error: 'Section not found',
        message: `Section '${section}' not found in schema`
      });
    }

    res.json({
      section,
      schema
    });
  } catch (error) {
    console.error('Error getting section schema:', error);
    res.status(500).json({
      error: 'Failed to get section schema',
      message: error.message
    });
  }
});

// Get examples for a specific section
router.get('/:section/examples', async (req, res) => {
  try {
    const { section } = req.params;
    const sectionDoc = getSectionDocumentation(section);

    if (!sectionDoc) {
      return res.status(404).json({
        error: 'Section not found',
        message: `Section '${section}' not found in schema`
      });
    }

    res.json({
      section,
      examples: sectionDoc.examples || []
    });
  } catch (error) {
    console.error('Error getting section examples:', error);
    res.status(500).json({
      error: 'Failed to get section examples',
      message: error.message
    });
  }
});

// Function to generate JSON from guided question answers
async function generateJsonFromGuidedQuestions(fieldName, answers, questions) {
  const fileName = await getSectionFileName(fieldName);
  
  try {
    // Load schema from file
    const schemaPath = path.join(process.cwd(), 'schemas', `${fileName}.json`);
    const schemaContent = await fs.readFile(schemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);
    
    // Generate JSON based on schema type and generation logic
    const schemaType = schema.type;
    const generationLogic = schema.generationLogic;
    
    if (schemaType === 'object') {
      const result = {};
      
      // Map guided question answers to schema properties
      questions.forEach(question => {
        const answer = answers[question.id];
        if (answer !== undefined && answer !== '') {
          if (question.type === 'textArray') {
            result[question.id] = answer.split(',').map(s => s.trim()).filter(s => s);
          } else if (question.type === 'multiSelect') {
            result[question.id] = Array.isArray(answer) ? answer : [answer];
          } else if (question.type === 'number') {
            result[question.id] = parseInt(answer) || 0;
          } else {
            result[question.id] = answer;
          }
        }
      });
      
      // Apply generation logic based on schema type
      if (generationLogic) {
        return applyGenerationLogic(fieldName, result, generationLogic);
      }
      
      return result;
    }
    
    if (schemaType === 'array') {
      const result = {};
      
      questions.forEach(question => {
        const answer = answers[question.id];
        if (answer !== undefined && answer !== '') {
          if (question.type === 'textArray') {
            result[question.id] = answer.split(',').map(s => s.trim()).filter(s => s);
          } else if (question.type === 'multiSelect') {
            result[question.id] = Array.isArray(answer) ? answer : [answer];
          } else if (question.type === 'number') {
            result[question.id] = parseInt(answer) || 0;
          } else {
            result[question.id] = answer;
          }
        }
      });
      
      if (generationLogic) {
        return applyGenerationLogic(fieldName, result, generationLogic);
      }
      
      return [];
    }
    
    return {};
  } catch (error) {
    console.log('Error loading schema for JSON generation:', error.message);
    return {};
  }
}

// Function to apply generation logic based on schema
function applyGenerationLogic(fieldName, answers, generationLogic) {
  const fieldNameLower = fieldName.toLowerCase();
  
  // Get generation logic from schema
  const sectionGenerationLogic = getSectionGenerationLogic(fieldNameLower);
  
  if (sectionGenerationLogic && sectionGenerationLogic.type === 'array') {
    if (fieldNameLower === 'fields') {
      const fieldCount = parseInt(answers.fieldCount) || 1;
      const fieldNames = answers.fieldNames || [];
      const fieldTypes = answers.fieldTypes || ['text'];
      
      return Array.from({ length: fieldCount }, (_, i) => ({
        name: fieldNames[i] || `field${i + 1}`,
        label: fieldNames[i] || `Field ${i + 1}`,
        type: fieldTypes[i % fieldTypes.length] || 'text',
        required: true
      }));
    }
  }
  
  if (sectionGenerationLogic && sectionGenerationLogic.type === 'object') {
    if (fieldNameLower === 'documents') {
      const documentCount = parseInt(answers.documentCount) || 1;
      const documentNames = answers.documentNames || [];
      const documentTypes = answers.documentTypes || ['pdf'];
      const mandatoryDocuments = answers.mandatoryDocuments || [];
      
      return {
        required: Array.from({ length: documentCount }, (_, i) => ({
          name: documentNames[i] || `document${i + 1}`,
          type: documentTypes[i % documentTypes.length] || 'pdf',
          mandatory: mandatoryDocuments.includes(documentNames[i])
        }))
      };
    }
    
    if (fieldNameLower === 'business rules' || fieldNameLower === 'rules') {
      const validationRules = answers.validationRules || [];
      const fieldValidations = answers.fieldValidations || [];
      
      return {
        validation: fieldValidations.map(field => ({
          field,
          rule: validationRules[0] || 'REQUIRED',
          value: validationRules.includes('MIN') ? 18 : undefined
        }))
      };
    }
  }
  
  return answers;
}

// Get AI-guided configuration information
router.get('/ai-guided/info', async (req, res) => {
  try {
    const { order, required } = getSectionOrder();
    const sections = getAvailableSections();
    
    // Get schema-driven information for each section
    const sectionInfo = await Promise.all(sections.map(async (section) => {
      const schema = await getSectionSchema(section.name);
      const documentation = getSectionDocumentation(section.name);
      
      return {
        name: section.name,
        label: section.name,
        type: section.type,
        required: required.includes(section.name.toLowerCase()),
        description: documentation?.description || `Configure ${section.name}`,
        examples: documentation?.examples || [],
        guidedQuestions: schema?.guidedQuestions || [],
        generationLogic: schema?.generationLogic || null,
        validation: await getValidationForSection(section),
        helperText: documentation?.helperText || `Enter ${section.name} configuration`,
        order: order.indexOf(section.name.toLowerCase())
      };
    }));
    
    // Sort by order
    sectionInfo.sort((a, b) => a.order - b.order);
    
    res.json({
      sections: sectionInfo,
      requiredSections: required,
      totalSections: sections.length,
      availableSections: sections.map(s => s.name)
    });
  } catch (error) {
    console.error('Error getting AI-guided info:', error);
    res.status(500).json({
      error: 'Failed to get AI-guided information',
      message: error.message
    });
  }
});

// Get section-specific AI guidance
router.get('/ai-guided/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const schema = await getSectionSchema(section);
    const documentation = getSectionDocumentation(section);
    
    if (!schema) {
      return res.status(404).json({
        error: 'Section not found',
        message: `Section '${section}' not found in schema`
      });
    }
    
    // Generate AI prompts based on schema
    const aiPrompts = await generateAIPrompts(section, schema, documentation);
    
    res.json({
      section,
      schema,
      documentation,
      aiPrompts,
      guidedQuestions: schema.guidedQuestions || [],
      generationLogic: schema.generationLogic || null,
      examples: documentation?.examples || [],
      validation: await getValidationForSection({ name: section, type: schema.type })
    });
  } catch (error) {
    console.error('Error getting section AI guidance:', error);
    res.status(500).json({
      error: 'Failed to get section AI guidance',
      message: error.message
    });
  }
});

// Generate AI prompts based on schema using AI
async function generateAIPrompts(section, schema, documentation) {
  const prompts = {
    welcome: `Let's configure the **${section}** section.`,
    description: documentation?.description || `Configure the ${section} for your service.`,
    examples: documentation?.examples || [],
    suggestions: [],
    questions: [],
    copyablePrompts: []
  };
  
  // Generate suggestions based on schema type
  if (schema.type === 'string') {
    prompts.suggestions.push(`Enter the ${section} value`);
    if (schema.pattern) {
      prompts.suggestions.push(`Follow the pattern: ${schema.pattern}`);
    }
  } else if (schema.type === 'object') {
    prompts.suggestions.push(`Describe the ${section} configuration you need`);
    prompts.suggestions.push(`I'll generate the complete ${section} structure for you`);
  } else if (schema.type === 'array') {
    prompts.suggestions.push(`List the ${section} items you need`);
    prompts.suggestions.push(`I'll create the ${section} array for you`);
  }
  
  // Add guided questions if available
  if (schema.guidedQuestions) {
    prompts.questions = schema.guidedQuestions.map(q => q.question);
  }
  
  // Generate dynamic copyable prompts using AI
  try {
    const dynamicPrompts = await generateDynamicPrompts(section, schema, documentation);
    prompts.copyablePrompts = dynamicPrompts;
  } catch (error) {
    console.error('Error generating dynamic prompts:', error);
    // Fallback to basic prompts
    prompts.copyablePrompts = [
      {
        title: "Basic Configuration",
        prompt: `Create ${section} configuration with basic settings`,
        description: `Basic ${section} configuration`
      },
      {
        title: "Custom Configuration",
        prompt: `Create ${section} configuration with: [your_requirements]`,
        description: "Replace [your_requirements] with your specific needs"
      }
    ];
  }
  
  return prompts;
}

// Generate dynamic prompts using AI
async function generateDynamicPrompts(section, schema, documentation) {
  const OpenAI = require('openai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  // Build context for AI prompt generation
  const schemaContext = {
    section: section,
    schema: schema,
    documentation: documentation,
    examples: documentation?.examples || [],
    description: documentation?.description || `Configure the ${section} for your service.`
  };

  const promptForAI = `You are a configuration prompt generator. Based on the following schema information, generate 3-4 simple, copyable prompts that users can easily modify for their requirements.

Schema Information:
- Section: ${section}
- Description: ${schemaContext.description}
- Schema Type: ${schema.type}
- Schema Properties: ${JSON.stringify(schema.properties || {}, null, 2)}
- Examples: ${JSON.stringify(schemaContext.examples, null, 2)}
- Documentation: ${JSON.stringify(documentation, null, 2)}

Requirements:
1. Generate 3-4 different prompt variations (simple to complex)
2. Each prompt should be in SIMPLE NATURAL LANGUAGE
3. Use placeholders like [your_states] for customization
4. Make prompts easy to copy, edit, and use
5. Focus on common use cases and patterns
6. Keep prompts short and actionable

Generate prompts in this exact JSON format:
[
  {
    "title": "Simple Title",
    "prompt": "Simple natural language prompt",
    "description": "Brief description"
  }
]

Examples of good simple prompts:
- "Create a workflow with 3 states: DRAFT -> SUBMITTED -> APPROVED"
- "Create form fields: name (text, required), email (email, required)"
- "Create billing with tax head: TL_FEE (Trade License Fee, required)"

Make prompts SIMPLE and EASY to copy/edit. Avoid complex technical language.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a configuration prompt generator. Always respond with valid JSON array only, no explanations or markdown."
        },
        {
          role: "user",
          content: promptForAI
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const generatedPrompts = completion.choices[0].message.content;
    
    try {
      const parsedPrompts = JSON.parse(generatedPrompts);
      return Array.isArray(parsedPrompts) ? parsedPrompts : [];
    } catch (parseError) {
      console.error('Error parsing AI-generated prompts:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error calling OpenAI for prompt generation:', error);
    throw error;
  }
}

// Get conversation context for AI
router.get('/ai-guided/context/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const { completedSections = [], currentConfig = {} } = req.query;
    
    const schema = await getSectionSchema(section);
    const documentation = getSectionDocumentation(section);
    
    if (!schema) {
      return res.status(404).json({
        error: 'Section not found',
        message: `Section '${section}' not found in schema`
      });
    }
    
    // Build context based on completed sections
    const context = {
      currentSection: section,
      completedSections: completedSections.split(',').filter(Boolean),
      existingConfig: currentConfig,
      schema,
      documentation,
      suggestions: generateContextualSuggestions(section, schema, completedSections.split(',').filter(Boolean), currentConfig)
    };
    
    res.json(context);
  } catch (error) {
    console.error('Error getting AI context:', error);
    res.status(500).json({
      error: 'Failed to get AI context',
      message: error.message
    });
  }
});

// Generate contextual suggestions based on completed sections
function generateContextualSuggestions(section, schema, completedSections, currentConfig) {
  const suggestions = [];
  
  // If service name is already configured, use it in suggestions
  if (currentConfig.service) {
    suggestions.push(`Based on your service "${currentConfig.service}", I'll help configure ${section}`);
  }
  
  // If module is configured, use it in suggestions
  if (currentConfig.module) {
    suggestions.push(`For module "${currentConfig.module}", let's set up ${section}`);
  }
  
  // Section-specific suggestions
  if (section === 'workflow' && completedSections.includes('fields')) {
    suggestions.push('I can create a workflow that matches your form fields');
  }
  
  if (section === 'rules' && completedSections.includes('fields')) {
    suggestions.push('I can create validation rules for your form fields');
  }
  
  if (section === 'documents' && completedSections.includes('fields')) {
    suggestions.push('I can suggest required documents based on your form fields');
  }
  
  return suggestions;
}

module.exports = router; 