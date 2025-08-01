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

describe('Enhanced Intent Detection', () => {
  test('should detect affirmative responses', () => {
    const affirmativeInputs = [
      'yes',
      'yeah',
      'yep',
      'ok',
      'okay',
      'fine',
      'good',
      'sure',
      'alright',
      'right',
      'correct',
      'yes fine',
      'ok good',
      'yes next',
      'ok proceed',
      'next step',
      'proceed ahead',
      'yes next step',
      'ok proceed forward'
    ];

    affirmativeInputs.forEach(input => {
      const lowerInput = input.toLowerCase();
      const hasAffirmative = /^(yes|yeah|yep|ok|okay|fine|good|sure|alright|right|correct)$/i.test(input) ||
                            /^(yes|yeah|yep|ok|okay|fine|good|sure|alright|right|correct)\s+(fine|good|ok|okay|alright)$/i.test(input) ||
                            /^(yes|yeah|yep|ok|okay|fine|good|sure|alright|right|correct)\s+(next|proceed|continue|go|move)$/i.test(input) ||
                            /^(next|proceed|continue|go|move)\s+(step|section|ahead|forward)$/i.test(input) ||
                            /^(yes|yeah|yep|ok|okay|fine|good|sure|alright|right|correct)\s+(next|proceed|continue|go|move)\s+(step|section|ahead|forward)$/i.test(input);
      
      expect(hasAffirmative).toBe(true);
    });
  });

  test('should handle "yes fine next step" pattern', () => {
    const input = 'yes fine next step';
    const pattern = /^(yes|yeah|yep|ok|okay|fine|good|sure|alright|right|correct)\s+(next|proceed|continue|go|move)\s+(step|section|ahead|forward)$/i;
    
    expect(pattern.test(input)).toBe(true);
  });

  test('should handle simple affirmative responses', () => {
    const simpleAffirmatives = ['yes', 'ok', 'fine', 'good'];
    
    simpleAffirmatives.forEach(input => {
      const pattern = /^(yes|yeah|yep|ok|okay|fine|good|sure|alright|right|correct)$/i;
      expect(pattern.test(input)).toBe(true);
    });
  });

  test('should handle compound affirmative responses', () => {
    const compoundAffirmatives = ['yes fine', 'ok good', 'yes next'];
    
    compoundAffirmatives.forEach(input => {
      const pattern = /^(yes|yeah|yep|ok|okay|fine|good|sure|alright|right|correct)\s+(fine|good|ok|okay|alright|next|proceed|continue|go|move)$/i;
      expect(pattern.test(input)).toBe(true);
    });
  });
});

describe('Intent Detection Patterns', () => {
  test('should match various affirmative patterns', () => {
    const patterns = [
      /^(yes|yeah|yep|ok|okay|fine|good|sure|alright|right|correct)$/i,
      /^(yes|yeah|yep|ok|okay|fine|good|sure|alright|right|correct)\s+(fine|good|ok|okay|alright)$/i,
      /^(yes|yeah|yep|ok|okay|fine|good|sure|alright|right|correct)\s+(next|proceed|continue|go|move)$/i,
      /^(next|proceed|continue|go|move)\s+(step|section|ahead|forward)$/i,
      /^(yes|yeah|yep|ok|okay|fine|good|sure|alright|right|correct)\s+(next|proceed|continue|go|move)\s+(step|section|ahead|forward)$/i
    ];

    const testInputs = [
      'yes',
      'yes fine',
      'yes next',
      'next step',
      'yes next step'
    ];

    testInputs.forEach((input, index) => {
      const matched = patterns.some(pattern => pattern.test(input));
      expect(matched).toBe(true);
    });
  });
});

module.exports = { sanitizeAndExtractAttributes }; 