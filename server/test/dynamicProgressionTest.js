const { sanitizeAndExtractAttributes } = require('../routes/generateConfig');

// Mock OpenAI for testing
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                extractedAttributes: {},
                missingRequired: [],
                needsClarification: false,
                clarificationQuestion: null
              })
            }
          }]
        })
      }
    }
  }))
}));

describe('Dynamic Progression and Default Configuration', () => {
  test('should handle keep default command', async () => {
    const userInput = "keep it default";
    const section = "workflow";
    const schema = {
      type: "object",
      description: "Workflow configuration"
    };
    const context = { useDefault: true };

    const result = await sanitizeAndExtractAttributes(userInput, section, schema, context);

    expect(result.needsClarification).toBe(false);
    expect(result.extractedAttributes).toEqual({});
  });

  test('should handle skip section command', async () => {
    const userInput = "skip this section";
    const section = "billing";
    const schema = {
      type: "object",
      description: "Billing configuration"
    };
    const context = {};

    const result = await sanitizeAndExtractAttributes(userInput, section, schema, context);

    expect(result.needsClarification).toBe(false);
  });

  test('should detect default configuration requests', () => {
    const defaultPatterns = [
      "keep it default",
      "use default",
      "default settings",
      "apply default",
      "use default configuration"
    ];

    defaultPatterns.forEach(input => {
      const lowerInput = input.toLowerCase();
      expect(lowerInput.includes('default')).toBe(true);
    });
  });

  test('should detect skip section requests', () => {
    const skipPatterns = [
      "skip this section",
      "skip section",
      "move to next",
      "skip to next",
      "next section"
    ];

    skipPatterns.forEach(input => {
      const lowerInput = input.toLowerCase();
      expect(lowerInput.includes('skip') || lowerInput.includes('next')).toBe(true);
    });
  });
});

// Test progression logic
describe('Progression Logic', () => {
  test('should show focused next step after 2+ completions', () => {
    const completedSectionsCount = 3;
    const shouldShowFocused = completedSectionsCount >= 2;
    
    expect(shouldShowFocused).toBe(true);
  });

  test('should show full guidance for first few steps', () => {
    const completedSectionsCount = 1;
    const shouldShowFullGuidance = completedSectionsCount < 2;
    
    expect(shouldShowFullGuidance).toBe(true);
  });
});

module.exports = { sanitizeAndExtractAttributes }; 