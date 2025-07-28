// Service Configuration AI Helper
const serviceConfigSections = {
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
      const workflowStates = inputs.states.map(state => ({
        state,
        sla: 86400000, // 24 hours in milliseconds
        actions: [
          {
            roles: inputs.roles,
            action: "FORWARD",
            nextState: inputs.states[inputs.states.indexOf(state) + 1] || "APPROVED"
          }
        ],
        isStartState: inputs.states.indexOf(state) === 0,
        isStateUpdatable: true,
        isTerminateState: inputs.states.indexOf(state) === inputs.states.length - 1,
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
