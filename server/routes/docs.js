const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { 
  getAvailableSections, 
  getSectionOrder, 
  getSectionDocumentation,
  getSectionSchema 
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
           (section.type === 'string' || section.type === 'object') && // Include both string and object types
           !['workflow', 'billing', 'payment', 'access control', 'boundary', 'localization', 'notification'].includes(sectionNameLower);
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
    
    // Add pattern validation based on section name
    if (section.name === 'module') {
      validation.pattern = '^[a-z]+$';
      validation.helperText = 'Enter the module name (e.g., tradelicence, propertytax)';
    } else if (section.name === 'service') {
      validation.pattern = '^[A-Z][a-zA-Z]+$';
      validation.helperText = 'Enter the service identifier (e.g., TradeLicense, PropertyTax)';
    }
  } else if (section.type === 'object' || section.type === 'array') {
    validation.type = 'json';
    validation.schema = await getObjectSchema(section);
    validation.helperText = `Expected structure: ${JSON.stringify(validation.schema.example, null, 2)}`;
  }
  
  return validation;
}

// Function to get specific object schema for each section
async function getObjectSchema(section) {
  const sectionNameLower = section.name.toLowerCase();
  
  // Map section names to file names
  const sectionFileMap = {
    'id generation': 'idgen',
    'business rules': 'rules',
    'access control': 'access',
    'id generation': 'idgen',
    'fields': 'fields',
    'documents': 'documents',
    'workflow': 'workflow',
    'billing': 'bill',
    'payment': 'payment',
    'calculator': 'calculator',
    'applicant': 'applicant',
    'boundary': 'boundary',
    'localization': 'localization',
    'notification': 'notification'
  };
  
  const fileName = sectionFileMap[sectionNameLower] || sectionNameLower;
  
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
  
  // Get non-required sections that should be pre-configured
  const sectionsToPreConfigure = sections.filter(section => {
    const sectionNameLower = section.name.toLowerCase();
    return !requiredSections.includes(sectionNameLower) && 
           ['workflow', 'billing', 'payment', 'access control', 'boundary', 'localization', 'notification'].includes(sectionNameLower);
  });
  
  sectionsToPreConfigure.forEach(section => {
    const sectionNameLower = section.name.toLowerCase();
    switch (sectionNameLower) {
      case 'workflow':
        preConfiguredSections.workflow = {
          business: '${service}',
          businessService: '${service}',
          businessServiceSla: '72',
          states: []
        };
        break;
      case 'billing':
        preConfiguredSections.bill = {
          BusinessService: '${service}',
          taxHead: [],
          taxPeriod: []
        };
        break;
      case 'payment':
        preConfiguredSections.payment = {
          gateway: 'PAYTM'
        };
        break;
      case 'access control':
        preConfiguredSections.access = {
          roles: ['CITIZEN', 'EMPLOYEE'],
          permissions: {
            'CITIZEN': ['CREATE', 'VIEW'],
            'EMPLOYEE': ['CREATE', 'VIEW', 'UPDATE', 'DELETE']
          }
        };
        break;
      case 'boundary':
        preConfiguredSections.boundary = {
          lowestLevel: 'WARD',
          hierarchyType: 'ADMIN'
        };
        break;
      case 'localization':
        preConfiguredSections.localization = {
          language: 'en_IN',
          currency: 'INR',
          dateFormat: 'DD/MM/YYYY'
        };
        break;
      case 'notification':
        preConfiguredSections.notification = {
          channels: ['SMS', 'EMAIL'],
          templates: {
            'SUBMISSION': 'Your application has been submitted successfully.',
            'APPROVAL': 'Your application has been approved.',
            'REJECTION': 'Your application has been rejected.'
          }
        };
        break;
    }
  });
  
  return preConfiguredSections;
}

// Function to generate information cards based on schema
function generateInformationCards(sections, requiredSections, preConfiguredSections) {
  const preConfiguredItems = Object.keys(preConfiguredSections).map(sectionName => {
    // Map section names to their display names
    const sectionNameMap = {
      'workflow': 'Workflow',
      'bill': 'Billing',
      'payment': 'Payment',
      'access': 'Access Control',
      'boundary': 'Boundary',
      'localization': 'Localization',
      'notification': 'Notification'
    };
    const displayName = sectionNameMap[sectionName] || sectionName;
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

// Configurable section order (edit this array to change the order)
const SECTION_ORDER = [
  "module",           // 1. Basic module information (REQUIRED)
  "service",          // 2. Service name and details (REQUIRED)
  "fields",           // 3. Form fields configuration (REQUIRED)
  "idgen",            // 4. ID generation rules (REQUIRED)
  "workflow",         // 5. Workflow states and transitions
  "bill",             // 6. Billing configuration
  "payment",          // 7. Payment gateway settings
  "access",           // 8. Access control and roles
  "rules",            // 9. Business rules and validation
  "calculator",       // 10. Calculation logic
  "documents",        // 11. Document requirements
  "pdf",              // 12. PDF generation settings
  "applicant",        // 13. Applicant configuration
  "boundary",         // 14. Geographic boundaries
  "localization",     // 15. Localization settings
  "notification",     // 16. Notification settings
  // Add more sections as needed
];

// Required sections based on schema
const REQUIRED_SECTIONS = ["fields", "module", "service", "idgen"];

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
      availableSections: sections.map(s => s.name),
      validation: {
        serviceName: {
          minLength: 3,
          maxLength: 100,
          pattern: '^[a-zA-Z0-9\\s\\-_\\.]+$'
        },
        module: {
          pattern: '^[a-z]+$',
          minLength: 1,
          maxLength: 50
        },
        service: {
          pattern: '^[A-Z][a-zA-Z]+$',
          minLength: 1,
          maxLength: 50
        }
      }
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
  const fieldNameLower = fieldName.toLowerCase();
  
  // Map section names to file names
  const sectionFileMap = {
    'id generation': 'idgen',
    'business rules': 'rules',
    'access control': 'access',
    'fields': 'fields',
    'documents': 'documents',
    'workflow': 'workflow',
    'billing': 'bill',
    'payment': 'payment',
    'calculator': 'calculator',
    'applicant': 'applicant',
    'boundary': 'boundary',
    'localization': 'localization',
    'notification': 'notification'
  };
  
  const fileName = sectionFileMap[fieldNameLower] || fieldNameLower;
  
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
  
  if (generationLogic.type === 'array') {
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
  
  if (generationLogic.type === 'object') {
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

module.exports = router; 