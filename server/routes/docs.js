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

module.exports = router; 