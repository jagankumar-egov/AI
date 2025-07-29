// Service Configuration AI Helper
// Load metadata definitions from assets/helper.json
const assetSections = require("./assets/helper.json");
// Dynamically build wizard sections from asset metadata (fields, uiHints, defaultSample)
const dynamicSections = Object.fromEntries(
  Object.entries(assetSections).map(([secId, meta]) => [
    secId,
    {
      name: meta.title,
      description: meta.description,
      prompts: (meta.fields || []).map(field => ({
        id: field,
        question: `Enter value for ${field} in ${meta.title}`,
        type: Array.isArray(meta.defaultSample?.[field]) ? 'array' : 'string',
        validation: value => value != null,
        example: meta.defaultSample?.[field]
      })),
      generate: inputs => ({ [secId]: inputs }),
      explain: () => meta.uiHints || ''
    }
  ])
);
// Static overrides for core sections with custom logic
const staticSections = {
  basics: {
    name: 'Basic Service Details',
    description: 'Core configuration of your service',
    prompts: [
      {
        id: 'module',
        question: 'What is the name of your service module? (e.g., PropertyTax, TradeLicense)',
        type: 'string',
        validation: (value) => value && value.length > 0,
        example: 'PropertyTax'
      },
      {
        id: 'service',
        question: 'What is the service code? This should be short (e.g., PT for PropertyTax)',
        type: 'string',
        validation: (value) => value && value.length > 0,
        example: 'PT'
      },
      {
        id: 'enabled',
        question: 'Who can access this service? (comma separated: citizen,employee)',
        type: 'array',
        validation: (value) => value && value.length > 0,
        example: ['citizen', 'employee']
      }
    ],
    generate: (inputs) => {
      return {
        module: inputs.module,
        service: inputs.service,
        enabled: inputs.enabled,
        boundary: {
          lowestLevel: "locality",
          hierarchyType: "REVENUE"
        }
      };
    },
    explain: () => `
This section defines the core identity of your service:
1. module: The full name of your service module
2. service: A short code used in APIs and configurations
3. enabled: Types of users who can access this service
4. boundary: Geographic boundary configuration for the service

Example Configuration:
{
  "module": "PropertyTax",
  "service": "PT",
  "enabled": ["citizen", "employee"],
  "boundary": {
    "lowestLevel": "locality",
    "hierarchyType": "REVENUE"
  }
}
    `
  },

  workflow: {
    name: 'Workflow Configuration',
    description: 'Define the states and transitions for your service',
    prompts: [
      {
        id: 'states',
        question: 'What are the main states in your workflow? (comma separated)',
        type: 'array',
        validation: (value) => value && value.length > 0,
        example: ['PENDING_FOR_VERIFICATION', 'PENDING_FOR_APPROVAL', 'APPROVED']
      },
      {
        id: 'roles',
        question: 'What roles can access this service? (comma separated)',
        type: 'array',
        validation: (value) => value && value.length > 0,
        example: ['CITIZEN', 'APPROVER', 'ADMIN']
      }
    ],
    generate: (inputs) => {
      const rawStates = Array.isArray(inputs.states)
        ? inputs.states
        : String(inputs.states).split(',').map(s => s.trim()).filter(Boolean);
      const rawRoles = Array.isArray(inputs.roles)
        ? inputs.roles
        : String(inputs.roles).split(',').map(s => s.trim()).filter(Boolean);
      const workflowStates = rawStates.map((state, idx) => ({
        state,
        sla: 86400000, // 24 hours in milliseconds
        actions: [
          {
            roles: rawRoles,
            action: "FORWARD",
            nextState: rawStates[idx + 1] || "APPROVED"
          }
        ],
        isStartState: idx === 0,
        isStateUpdatable: true,
        isTerminateState: idx === rawStates.length - 1,
        applicationStatus: state === "APPROVED" ? "ACTIVE" : "INWORKFLOW",
        docUploadRequired: false
      }));

      return {
        workflow: {
          ACTIVE: ["APPROVED"],
          states: workflowStates,
          INACTIVE: ["REJECTED", "WITHDRAWN"],
          business: "public-services",
          businessService: `${inputs.module}.${inputs.service}`,
          businessServiceSla: 5184000000 // 60 days in milliseconds
        }
      };
    },
    explain: () => `
The workflow section defines how your service application moves through different states:
1. States: Different stages an application goes through
2. Actions: What can be done in each state
3. Roles: Who can perform actions
4. SLAs: Time limits for each state

Example State:
{
  "state": "PENDING_FOR_VERIFICATION",
  "actions": [
    {
      "roles": ["CITIZEN", "APPROVER"],
      "action": "FORWARD",
      "nextState": "PENDING_FOR_APPROVAL"
    }
  ],
  "sla": 86400000,
  "isStartState": true
}
    `
  }
};

// Custom override for Billing section to use billDetails array as per helper.json
staticSections.bill = {
  name: assetSections.bill.title,
  description: assetSections.bill.description,
  prompts: [
    {
      id: 'taxHeadCode',
      question: `Enter the tax head code for Billing (e.g., ${assetSections.bill.defaultSample.billDetails?.[0]?.taxHeadCode})`,
      type: 'string',
      validation: value => value != null,
      example: assetSections.bill.defaultSample.billDetails?.[0]?.taxHeadCode
    },
    {
      id: 'feeType',
      question: 'Enter the fee type for Billing',
      type: 'string',
      validation: value => value != null,
      example: assetSections.bill.defaultSample.billDetails?.[0]?.feeType
    },
    {
      id: 'amount',
      question: `Enter the amount for Billing (e.g., ${assetSections.bill.defaultSample.billDetails?.[0]?.amount})`,
      type: 'number',
      validation: value => value != null,
      example: assetSections.bill.defaultSample.billDetails?.[0]?.amount
    },
    {
      id: 'isMandatory',
      question: 'Is the fee mandatory? (true/false)',
      type: 'string',
      validation: value => value != null,
      example: assetSections.bill.defaultSample.billDetails?.[0]?.isMandatory
    }
  ],
  generate: inputs => ({ billDetails: [inputs] }),
  explain: () => assetSections.bill.uiHints || ''
};

// Custom override for Documents section to collect one document entry
staticSections.documents = {
  name: assetSections.documents.title,
  description: assetSections.documents.description,
  prompts: [
    {
      id: 'code',
      question: `Enter the document code (e.g., ${assetSections.documents.defaultSample.requiredDocuments?.[0]?.code})`,
      type: 'string',
      validation: value => value != null,
      example: assetSections.documents.defaultSample.requiredDocuments?.[0]?.code
    },
    {
      id: 'documentType',
      question: `Enter the document type (e.g., ${assetSections.documents.defaultSample.requiredDocuments?.[0]?.documentType})`,
      type: 'string',
      validation: value => value != null,
      example: assetSections.documents.defaultSample.requiredDocuments?.[0]?.documentType
    },
    {
      id: 'isMandatory',
      question: 'Is this document mandatory? (true/false)',
      type: 'boolean',
      validation: value => value != null,
      example: assetSections.documents.defaultSample.requiredDocuments?.[0]?.required
    },
    {
      id: 'allowedRoles',
      question: 'Enter allowed roles (comma separated)',
      type: 'array',
      validation: value => Array.isArray(value) || typeof value === 'string',
      example: assetSections.documents.defaultSample.requiredDocuments?.[0]?.allowedRoles
    }
  ],
  generate: inputs => ({ documents: [
    {
      code: inputs.code,
      documentType: inputs.documentType,
      isMandatory: inputs.isMandatory === true || inputs.isMandatory === 'true',
      allowedRoles: typeof inputs.allowedRoles === 'string'
        ? inputs.allowedRoles.split(',').map(r => r.trim()).filter(Boolean)
        : inputs.allowedRoles
    }
  ]}),
  explain: () => assetSections.documents.uiHints || ''
};

// Merge dynamic (asset) and static sections
const serviceConfigSections = { ...dynamicSections, ...staticSections };

class ServiceConfigHelper {
  constructor() {
    this.sections = serviceConfigSections;
    this.currentConfig = {};
  }

  // Get explanation for a section
  explainSection(sectionId) {
    const section = this.sections[sectionId];
    if (!section) return 'Section not found';
    return section.explain();
  }

  // Get next question for a section
  getNextPrompt(sectionId, currentAnswers = {}) {
    const section = this.sections[sectionId];
    if (!section) return null;

    // Find first unanswered prompt
    return section.prompts.find(prompt => !currentAnswers[prompt.id]);
  }

  // Generate config for a section based on inputs
  generateSectionConfig(sectionId, inputs) {
    const section = this.sections[sectionId];
    if (!section) return null;
    
    const config = section.generate(inputs);
    this.currentConfig = { ...this.currentConfig, ...config };
    return config;
  }

  // Get the final complete config
  getFinalConfig() {
    return this.currentConfig;
  }
}

module.exports = ServiceConfigHelper;
