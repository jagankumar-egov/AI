const express = require('express');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Initialize AJV for validation
const ajv = new Ajv({ 
  allErrors: true,
  verbose: true
});
addFormats(ajv);

// Load schema cache
let schemaCache = {};

async function loadSchema(section) {
  if (schemaCache[section]) {
    return schemaCache[section];
  }

  try {
    const schemaPath = path.join(__dirname, '..', '..', 'serviceConfigSchema.json');
    const schemaData = await fs.readFile(schemaPath, 'utf8');
    const fullSchema = JSON.parse(schemaData);
    
    // Extract section-specific schema
    if (section && fullSchema.properties && fullSchema.properties[section]) {
      schemaCache[section] = fullSchema.properties[section];
    } else {
      schemaCache[section] = fullSchema;
    }
    
    return schemaCache[section];
  } catch (error) {
    console.error('Error loading schema:', error);
    throw new Error(`Failed to load schema for section: ${section}`);
  }
}

function formatValidationErrors(errors) {
  return errors.map(error => ({
    field: error.instancePath || error.schemaPath,
    message: error.message,
    code: error.keyword,
    params: error.params
  }));
}

router.post('/', async (req, res) => {
  try {
    const { config, section } = req.body;

    if (!config) {
      return res.status(400).json({
        error: 'Missing required field: config'
      });
    }

    // Load schema for validation
    const schema = await loadSchema(section);
    
    // Compile validator
    const validate = ajv.compile(schema);
    
    // Validate the configuration
    const isValid = validate(config);

    if (isValid) {
      res.json({
        valid: true,
        errors: [],
        message: 'Configuration is valid'
      });
    } else {
      res.json({
        valid: false,
        errors: formatValidationErrors(validate.errors),
        message: 'Configuration validation failed'
      });
    }

  } catch (error) {
    console.error('Error validating config:', error);
    res.status(500).json({
      error: 'Failed to validate configuration',
      message: error.message
    });
  }
});

// Validate specific section
router.post('/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({
        error: 'Missing required field: config'
      });
    }

    // Load schema for the specific section
    const schema = await loadSchema(section);
    
    // Compile validator
    const validate = ajv.compile(schema);
    
    // Validate the configuration
    const isValid = validate(config);

    if (isValid) {
      res.json({
        valid: true,
        section,
        errors: [],
        message: `${section} configuration is valid`
      });
    } else {
      res.json({
        valid: false,
        section,
        errors: formatValidationErrors(validate.errors),
        message: `${section} configuration validation failed`
      });
    }

  } catch (error) {
    console.error('Error validating config:', error);
    res.status(500).json({
      error: 'Failed to validate configuration',
      message: error.message
    });
  }
});

module.exports = router; 