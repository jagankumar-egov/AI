const fs = require('fs').promises;
const path = require('path');

// Schema configuration and metadata
const SCHEMA_CONFIG = {
  // Required sections based on the main schema
  required: ["fields", "module", "service", "idgen"],
  
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
  
  // Section descriptions and documentation
  sections: {
    module: {
      name: "Module",
      description: "Basic module information and configuration",
      type: "string",
      required: true,
      examples: ["tradelicence", "propertytax", "watercharge"],
      documentation: "The module name identifies the specific service module. This is a required field that must be a string value."
    },
    service: {
      name: "Service",
      description: "Service name and operational details",
      type: "string", 
      required: true,
      examples: ["TradeLicense", "PropertyTax", "WaterCharge"],
      documentation: "The service name defines the specific service being configured. This is a required field that must be a string value."
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
      documentation: "Defines the form fields that will be displayed to users. Each field can have validation rules, display properties, and data types."
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
      documentation: "Configures how unique identifiers are generated for service records. Supports various patterns and sequences."
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
      documentation: "Defines the workflow states and transitions for the service. Controls the business process flow and user actions."
    },
    bill: {
      name: "Billing",
      description: "Billing configuration and tax heads",
      type: "object",
      required: false,
      examples: [
        {
          "taxHead": [
            {
              "code": "TL_FEE",
              "name": "Trade License Fee",
              "isRequired": true
            }
          ]
        }
      ],
      documentation: "Configures billing components including tax heads, payment periods, and business services."
    },
    payment: {
      name: "Payment",
      description: "Payment gateway settings and configuration",
      type: "object",
      required: false,
      examples: [
        {
          "gateway": "PAYTM",
          "merchantId": "MERCHANT123"
        }
      ],
      documentation: "Defines payment gateway integration settings and merchant configurations."
    },
    access: {
      name: "Access Control",
      description: "Access control and role-based permissions",
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
      documentation: "Configures role-based access control and permissions for different user types."
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
      documentation: "Defines business rules, validation logic, and custom calculations for the service."
    },
    calculator: {
      name: "Calculator",
      description: "Calculation logic and formulas",
      type: "object",
      required: false,
      examples: [
        {
          "formula": "baseAmount * taxRate",
          "variables": {
            "baseAmount": "field.value",
            "taxRate": 0.05
          }
        }
      ],
      documentation: "Configures calculation formulas and logic for fees, taxes, and other computations."
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
              "type": "file"
            }
          ]
        }
      ],
      documentation: "Defines required documents, file types, and upload configurations for the service."
    },
    pdf: {
      name: "PDF Generation",
      description: "PDF generation settings and templates",
      type: "array",
      required: false,
      examples: [
        {
          "key": "certificate",
          "type": "certificate",
          "states": ["APPROVED"]
        }
      ],
      documentation: "Configures PDF generation for certificates, receipts, and other documents."
    },
    applicant: {
      name: "Applicant",
      description: "Applicant configuration and details",
      type: "object",
      required: false,
      examples: [
        {
          "type": "INDIVIDUAL",
          "fields": ["name", "mobile", "email"]
        }
      ],
      documentation: "Defines applicant types and required applicant information fields."
    },
    boundary: {
      name: "Boundary",
      description: "Geographic boundaries and jurisdiction",
      type: "object",
      required: false,
      examples: [
        {
          "lowestLevel": "WARD",
          "hierarchyType": "ADMIN"
        }
      ],
      documentation: "Configures geographic boundaries, jurisdiction levels, and administrative hierarchies."
    },
    localization: {
      name: "Localization",
      description: "Localization settings and translations",
      type: "object",
      required: false,
      examples: [
        {
          "language": "en_IN",
          "currency": "INR",
          "dateFormat": "DD/MM/YYYY"
        }
      ],
      documentation: "Defines language settings, currency formats, and localization preferences."
    },
    notification: {
      name: "Notification",
      description: "Notification settings and templates",
      type: "object",
      required: false,
      examples: [
        {
          "channels": ["SMS", "EMAIL"],
          "templates": {
            "SUBMISSION": "Your application has been submitted successfully."
          }
        }
      ],
      documentation: "Configures notification channels, templates, and delivery settings."
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

// Get all available sections
function getAvailableSections() {
  return Object.keys(SCHEMA_CONFIG.sections).map(key => ({
    name: key,
    ...SCHEMA_CONFIG.sections[key]
  }));
}

// Get section order
function getSectionOrder() {
  return {
    order: SCHEMA_CONFIG.order,
    required: SCHEMA_CONFIG.required
  };
}

// Get section documentation
function getSectionDocumentation(sectionName) {
  return SCHEMA_CONFIG.sections[sectionName] || null;
}

module.exports = {
  SCHEMA_CONFIG,
  loadMainSchema,
  getSectionSchema,
  getAvailableSections,
  getSectionOrder,
  getSectionDocumentation
}; 