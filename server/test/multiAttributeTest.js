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
                extractedAttributes: {
                  module: "tradelicence",
                  service: "NewTl"
                },
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

describe('Multi-Attribute Input Processing', () => {
  test('should extract module and service from input', async () => {
    const userInput = "create a module called tradelicence and service as NewTl";
    const section = "module";
    const schema = {
      type: "string",
      description: "Module configuration"
    };
    const context = {};

    const result = await sanitizeAndExtractAttributes(userInput, section, schema, context);

    expect(result.extractedAttributes).toEqual({
      module: "tradelicence",
      service: "NewTl"
    });
    expect(result.needsClarification).toBe(false);
  });

  test('should handle multiple attributes in different formats', async () => {
    const testCases = [
      {
        input: "module tradelicence service NewTl",
        expected: { module: "tradelicence", service: "NewTl" }
      },
      {
        input: "create workflow with states DRAFT, PENDING, APPROVED",
        expected: { states: ["DRAFT", "PENDING", "APPROVED"] }
      },
      {
        input: "form fields: name (text), email (email)",
        expected: { fields: [{ name: "name", type: "text" }, { name: "email", type: "email" }] }
      }
    ];

    for (const testCase of testCases) {
      const result = await sanitizeAndExtractAttributes(testCase.input, "test", { type: "object" }, {});
      expect(result.extractedAttributes).toEqual(testCase.expected);
    }
  });
});

module.exports = { sanitizeAndExtractAttributes }; 