const fs = require('fs').promises;
const path = require('path');

// Schema configuration and metadata
const SCHEMA_CONFIG = {
  // Required sections will be determined dynamically from schema files
  // by checking which schemas have required: true or are marked as required
  required: [], // Will be populated dynamically
  
  // Configurable section order (edit this array to change the order)
  order: [
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
  ],
  
  // Pre-configured sections (sections that get auto-generated)
  preConfigured: ["workflow", "bill", "payment", "access", "boundary", "localization", "notification"],
  
  // Section metadata for dynamic generation
  sections: {
    module: {
      name: "Module",
      description: "Basic module information and configuration",
      type: "string",
      required: true,
      examples: ["tradelicence", "propertytax", "watercharge"],
      documentation: "The module name identifies the specific service module. This is a required field that must be a string value.",
      preConfigured: false,
      generationLogic: null
    },
    service: {
      name: "Service",
      description: "Service name and operational details",
      type: "string", 
      required: true,
      examples: ["TradeLicense", "PropertyTax", "WaterCharge"],
      documentation: "The service name defines the specific service being configured. This is a required field that must be a string value.",
      preConfigured: false,
      generationLogic: null
    },
    fields: {
      name: "Fields",
      description: "Form fields configuration and validation rules",
      type: "array",
      required: true,
      examples: [
        {
          "name": "applicantName",
          "label": "Applicant Name",
          "type": "text",
          "required": true
        }
      ],
      documentation: "Defines the form fields that will be displayed to users. Each field can have validation rules, display properties, and data types.",
      preConfigured: false,
      generationLogic: {
        type: "array",
        description: "Generate array of field objects from guided question answers",
        logic: {
          fieldCount: "number of fields to generate",
          fieldNames: "comma-separated field names",
          fieldTypes: "array of field types",
          output: "Array of field objects with name, label, type, required properties"
        }
      }
    },
    idgen: {
      name: "ID Generation",
      description: "ID generation rules and patterns",
      type: "object",
      required: true,
      examples: [
        {
          "format": "TL/{YYYY}/{MM}/{DD}/{SEQUENCE}",
          "sequence": "0001"
        }
      ],
      documentation: "Configures how unique identifiers are generated for service records. Supports various patterns and sequences.",
      preConfigured: false,
      generationLogic: null
    },
    workflow: {
      name: "Workflow",
      description: "Workflow states and state transitions",
      type: "object",
      required: false,
      examples: [
        {
          "states": [
            {
              "state": "INITIATED",
              "isStartState": true,
              "actions": [
                {
                  "action": "SUBMIT",
                  "nextState": "PENDING_VERIFICATION"
                }
              ]
            }
          ]
        }
      ],
      documentation: "Defines the workflow states and transitions for the service. Controls the business process flow and user actions.",
      preConfigured: true,
      preConfigTemplate: {
        business: "${service}",
        businessService: "${service}",
        businessServiceSla: "72",
        states: []
      },
      generationLogic: null
    },
    bill: {
      name: "Billing",
      description: "Billing configuration and tax heads",
      type: "object",
      required: false,
      examples: [
        {
          "BusinessService": "TradeLicense",
          "taxHead": [
            {
              "code": "TL_FEE",
              "name": "Trade License Fee",
              "amount": 1000
            }
          ],
          "taxPeriod": [
            {
              "from": "01-04-2024",
              "to": "31-03-2025"
            }
          ]
        }
      ],
      documentation: "Configures billing and payment settings for the service. Includes tax heads, periods, and fee calculations.",
      preConfigured: true,
      preConfigTemplate: {
        BusinessService: "${service}",
        taxHead: [],
        taxPeriod: []
      },
      generationLogic: null
    },
    payment: {
      name: "Payment",
      description: "Payment gateway and transaction settings",
      type: "object",
      required: false,
      examples: [
        {
          "gateway": "PAYTM",
          "merchantId": "MERCHANT123",
          "supportedModes": ["CARD", "UPI", "NETBANKING"]
        }
      ],
      documentation: "Configures payment gateway integration and transaction processing settings.",
      preConfigured: true,
      preConfigTemplate: {
        gateway: "PAYTM"
      },
      generationLogic: null
    },
    access: {
      name: "Access Control",
      description: "User roles and permissions",
      type: "object",
      required: false,
      examples: [
        {
          "roles": ["CITIZEN", "EMPLOYEE"],
          "permissions": {
            "CITIZEN": ["CREATE", "VIEW"],
            "EMPLOYEE": ["CREATE", "VIEW", "UPDATE", "DELETE"]
          }
        }
      ],
      documentation: "Defines user roles, permissions, and access control settings for the service.",
      preConfigured: true,
      preConfigTemplate: {
        roles: ["CITIZEN", "EMPLOYEE"],
        permissions: {
          "CITIZEN": ["CREATE", "VIEW"],
          "EMPLOYEE": ["CREATE", "VIEW", "UPDATE", "DELETE"]
        }
      },
      generationLogic: null
    },
    rules: {
      name: "Business Rules",
      description: "Business rules and validation logic",
      type: "object",
      required: false,
      examples: [
        {
          "validation": [
            {
              "field": "age",
              "rule": "MIN",
              "value": 18
            }
          ]
        }
      ],
      documentation: "Defines business rules, validation logic, and custom calculations for the service.",
      preConfigured: false,
      generationLogic: {
        type: "object",
        description: "Generate business rules object from guided question answers",
        logic: {
          validationRules: "array of validation rule types",
          fieldValidations: "comma-separated field names to validate",
          output: "Object with validation array containing rule objects"
        }
      }
    },
    calculator: {
      name: "Calculator",
      description: "Fee calculation and formula logic",
      type: "object",
      required: false,
      examples: [
        {
          "formula": "baseAmount * taxRate",
          "variables": {
            "baseAmount": "number",
            "taxRate": "number"
          }
        }
      ],
      documentation: "Configures fee calculation formulas and mathematical operations for the service.",
      preConfigured: false,
      generationLogic: null
    },
    documents: {
      name: "Documents",
      description: "Document requirements and upload settings",
      type: "object",
      required: false,
      examples: [
        {
          "required": [
            {
              "name": "identityProof",
              "label": "Identity Proof",
              "type": "file",
              "required": true
            }
          ]
        }
      ],
      documentation: "Defines required documents, file types, and upload configurations for the service.",
      preConfigured: false,
      generationLogic: {
        type: "object",
        description: "Generate document configuration object from guided question answers",
        logic: {
          documentCount: "number of documents to generate",
          documentNames: "comma-separated document names",
          documentTypes: "array of document types",
          mandatoryDocuments: "comma-separated mandatory document names",
          output: "Object with required array containing document objects"
        }
      }
    },
    pdf: {
      name: "PDF Generation",
      description: "PDF certificate and document templates",
      type: "array",
      required: false,
      examples: [
        {
          "key": "certificate",
          "type": "certificate",
          "template": "certificate-template.html"
        }
      ],
      documentation: "Configures PDF generation templates and certificate formats for the service.",
      preConfigured: false,
      generationLogic: null
    },
    applicant: {
      name: "Applicant",
      description: "Applicant type and field configuration",
      type: "object",
      required: false,
      examples: [
        {
          "type": "INDIVIDUAL",
          "fields": ["name", "mobile", "email"]
        }
      ],
      documentation: "Configures applicant types and their associated fields for the service.",
      preConfigured: false,
      generationLogic: null
    },
    boundary: {
      name: "Boundary",
      description: "Geographic boundaries and hierarchy",
      type: "object",
      required: false,
      examples: [
        {
          "lowestLevel": "WARD",
          "hierarchyType": "ADMIN"
        }
      ],
      documentation: "Defines geographic boundaries and administrative hierarchy for the service.",
      preConfigured: true,
      preConfigTemplate: {
        lowestLevel: "WARD",
        hierarchyType: "ADMIN"
      },
      generationLogic: null
    },
    localization: {
      name: "Localization",
      description: "Language and regional settings",
      type: "object",
      required: false,
      examples: [
        {
          "language": "en_IN",
          "currency": "INR",
          "dateFormat": "DD/MM/YYYY"
        }
      ],
      documentation: "Configures language, currency, and regional settings for the service.",
      preConfigured: true,
      preConfigTemplate: {
        language: "en_IN",
        currency: "INR",
        dateFormat: "DD/MM/YYYY"
      },
      generationLogic: null
    },
    notification: {
      name: "Notification",
      description: "Notification channels and templates",
      type: "object",
      required: false,
      examples: [
        {
          "channels": ["SMS", "EMAIL"],
          "templates": {
            "SUBMISSION": "Your application has been submitted successfully.",
            "APPROVAL": "Your application has been approved."
          }
        }
      ],
      documentation: "Configures notification channels, templates, and messaging settings for the service.",
      preConfigured: true,
      preConfigTemplate: {
        channels: ["SMS", "EMAIL"],
        templates: {
          "SUBMISSION": "Your application has been submitted successfully.",
          "APPROVAL": "Your application has been approved.",
          "REJECTION": "Your application has been rejected."
        }
      },
      generationLogic: null
    }
  }
};

// Load the main schema file
async function loadMainSchema() {
  try {
    const schemaPath = path.join(__dirname, '..', '..', 'serviceConfigSchema.json');
    const schemaData = await fs.readFile(schemaPath, 'utf8');
    return JSON.parse(schemaData);
  } catch (error) {
    console.error('Error loading main schema:', error);
    throw new Error('Failed to load main schema file');
  }
}

// Get section-specific schema
async function getSectionSchema(sectionName) {
  try {
    // First try to load from individual schema file
    const schemaPath = path.join(__dirname, `${sectionName}.json`);
    const schemaData = await fs.readFile(schemaPath, 'utf8');
    return JSON.parse(schemaData);
  } catch (error) {
    // Fallback to main schema
    const mainSchema = await loadMainSchema();
    if (mainSchema.properties && mainSchema.properties[sectionName]) {
      return mainSchema.properties[sectionName];
    }
    return null;
  }
}

// Helper function to get all available schema files
async function getAvailableSchemas() {
  const schemasDir = path.join(__dirname);
  const files = await fs.readdir(schemasDir);
  return files
    .filter(file => file.endsWith('.json') && file !== 'index.json')
    .map(file => file.replace('.json', ''));
}

// Helper function to determine if a section is required
async function isSectionRequired(sectionName) {
  try {
    const schemaPath = path.join(__dirname, `${sectionName}.json`);
    const schemaContent = await fs.readFile(schemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);
    
    // Check if schema has required: true or is marked as required
    return schema.required === true || 
           schema.required === 'true' || 
           schema.isRequired === true ||
           (schema.documentation && schema.documentation.required === true);
  } catch (error) {
    console.warn(`Could not determine if ${sectionName} is required:`, error.message);
    return false;
  }
}

// Helper function to get dynamic required sections
async function getRequiredSections() {
  const availableSchemas = await getAvailableSchemas();
  const requiredSections = [];
  
  for (const schema of availableSchemas) {
    if (await isSectionRequired(schema)) {
      requiredSections.push(schema);
    }
  }
  
  return requiredSections;
}

// Get all available sections
async function getAvailableSections() {
  const schemasDir = path.join(__dirname);
  const files = await fs.readdir(schemasDir);
  return files
    .filter(file => file.endsWith('.json') && file !== 'index.json')
    .map(file => file.replace('.json', ''));
}

// Get section order
async function getSectionOrder() {
  const availableSchemas = await getAvailableSections();
  const requiredSections = await getRequiredSections();
  
  // Put required sections first, then others
  const orderedSections = [
    ...requiredSections,
    ...availableSchemas.filter(section => !requiredSections.includes(section))
  ];
  
  return orderedSections;
}

// Get section documentation
function getSectionDocumentation(sectionName) {
  return SCHEMA_CONFIG.sections[sectionName] || null;
}

// Get pre-configured sections
function getPreConfiguredSections() {
  return SCHEMA_CONFIG.preConfigured;
}

// Get generation logic for a section
function getSectionGenerationLogic(sectionName) {
  const section = SCHEMA_CONFIG.sections[sectionName];
  return section ? section.generationLogic : null;
}

// Get pre-config template for a section
function getSectionPreConfigTemplate(sectionName) {
  const section = SCHEMA_CONFIG.sections[sectionName];
  return section ? section.preConfigTemplate : null;
}

// Get guided questions for a section
function getSectionGuidedQuestions(sectionName) {
  const section = SCHEMA_CONFIG.sections[sectionName];
  return section ? section.guidedQuestions : null;
}

// Get validation for a section
function getSectionValidation(sectionName) {
  const section = SCHEMA_CONFIG.sections[sectionName];
  return section ? section.validation : null;
}

// Get helper text for a section
function getSectionHelperText(sectionName) {
  const section = SCHEMA_CONFIG.sections[sectionName];
  return section ? section.helperText : null;
}

module.exports = {
  // Dynamic section management
  getRequiredSections,
  getSectionOrder,
  getAvailableSchemas,
  getAvailableSections: getAvailableSchemas, // Alias for compatibility
  
  // Legacy exports for backward compatibility
  get SECTION_ORDER() {
    // Return a promise for async function
    return getSectionOrder().catch(() => []);
  },
  
  get REQUIRED_SECTIONS() {
    // Return a promise for async function
    return getRequiredSections().catch(() => []);
  },
  
  // Other exports remain the same
  getPreConfiguredSections,
  getSectionGenerationLogic,
  getSectionPreConfigTemplate,
  getSectionDocumentation,
  getSectionSchema,
  getSectionGuidedQuestions,
  getSectionValidation,
  getSectionHelperText,
  SCHEMA_CONFIG
}; 