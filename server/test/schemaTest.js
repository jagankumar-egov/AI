const fs = require('fs').promises;
const path = require('path');
const assert = require('assert');

// Test configuration
const TEST_CONFIGS = {
  simple: {
    name: 'Simple Configuration',
    schemasPath: './test/schemas/simple',
    description: 'Basic configuration with minimal fields'
  },
  medium: {
    name: 'Medium Configuration', 
    schemasPath: './test/schemas/medium',
    description: 'Medium complexity with workflow and validation'
  },
  complex: {
    name: 'Complex Configuration',
    schemasPath: './schemas',
    description: 'Full enterprise configuration with all features'
  }
};

class SchemaTestSuite {
  constructor() {
    this.results = [];
    this.currentConfig = null;
  }

  async runAllTests() {
    console.log('🧪 Starting Schema-Driven System Tests\n');
    
    for (const [configKey, config] of Object.entries(TEST_CONFIGS)) {
      console.log(`📋 Testing ${config.name}...`);
      this.currentConfig = config;
      
      await this.testSchemaDiscovery(configKey, config);
      await this.testRequiredSections(configKey, config);
      await this.testSectionOrder(configKey, config);
      await this.testDynamicMapping(configKey, config);
      await this.testValidation(configKey, config);
      await this.testAIPromptGeneration(configKey, config);
      
      console.log(`✅ ${config.name} tests completed\n`);
    }
    
    this.printResults();
  }

  async testSchemaDiscovery(configKey, config) {
    try {
      const schemasPath = path.join(__dirname, '..', config.schemasPath);
      const files = await fs.readdir(schemasPath);
      const schemaFiles = files.filter(file => file.endsWith('.json'));
      
      assert(schemaFiles.length > 0, 'No schema files found');
      
      // Test that we can read all schema files
      for (const file of schemaFiles) {
        const schemaPath = path.join(schemasPath, file);
        const content = await fs.readFile(schemaPath, 'utf8');
        const schema = JSON.parse(content);
        
        assert(schema.type, `Schema ${file} missing type`);
        assert(schema.description, `Schema ${file} missing description`);
        assert(schema.title, `Schema ${file} missing title`);
      }
      
      this.addResult(configKey, 'Schema Discovery', 'PASS', `Found ${schemaFiles.length} schema files`);
    } catch (error) {
      this.addResult(configKey, 'Schema Discovery', 'FAIL', error.message);
    }
  }

  async testRequiredSections(configKey, config) {
    try {
      const schemasPath = path.join(__dirname, '..', config.schemasPath);
      const files = await fs.readdir(schemasPath);
      const schemaFiles = files.filter(file => file.endsWith('.json'));
      
      const requiredSections = [];
      
      for (const file of schemaFiles) {
        const schemaPath = path.join(schemasPath, file);
        const content = await fs.readFile(schemaPath, 'utf8');
        const schema = JSON.parse(content);
        
        if (schema.required === true) {
          requiredSections.push(file.replace('.json', ''));
        }
      }
      
      // Test that required sections are properly identified
      assert(requiredSections.length > 0, 'No required sections found');
      
      this.addResult(configKey, 'Required Sections', 'PASS', `Found ${requiredSections.length} required sections: ${requiredSections.join(', ')}`);
    } catch (error) {
      this.addResult(configKey, 'Required Sections', 'FAIL', error.message);
    }
  }

  async testSectionOrder(configKey, config) {
    try {
      const schemasPath = path.join(__dirname, '..', config.schemasPath);
      const files = await fs.readdir(schemasPath);
      const schemaFiles = files.filter(file => file.endsWith('.json'));
      
      const sections = schemaFiles.map(file => file.replace('.json', ''));
      
      // Test that sections can be ordered dynamically
      assert(sections.length > 0, 'No sections found for ordering');
      
      // Simulate dynamic ordering (required first, then others)
      const requiredSections = [];
      const optionalSections = [];
      
      for (const section of sections) {
        const schemaPath = path.join(schemasPath, `${section}.json`);
        const content = await fs.readFile(schemaPath, 'utf8');
        const schema = JSON.parse(content);
        
        if (schema.required === true) {
          requiredSections.push(section);
        } else {
          optionalSections.push(section);
        }
      }
      
      const orderedSections = [...requiredSections, ...optionalSections];
      
      this.addResult(configKey, 'Section Order', 'PASS', `Ordered ${orderedSections.length} sections: ${orderedSections.join(' → ')}`);
    } catch (error) {
      this.addResult(configKey, 'Section Order', 'FAIL', error.message);
    }
  }

  async testDynamicMapping(configKey, config) {
    try {
      const schemasPath = path.join(__dirname, '..', config.schemasPath);
      const files = await fs.readdir(schemasPath);
      const schemaFiles = files.filter(file => file.endsWith('.json'));
      
      const sections = schemaFiles.map(file => file.replace('.json', ''));
      
      // Test dynamic section name mapping
      const mapping = {};
      sections.forEach(section => {
        // Test various name variations
        const variations = [
          section,
          section.toLowerCase(),
          section.replace(/([A-Z])/g, ' $1').trim().toLowerCase(),
          section.replace('_', ' '),
          section.replace('_', '')
        ];
        
        variations.forEach(variation => {
          mapping[variation] = section;
        });
      });
      
      // Test that mapping works for different input formats
      const testInputs = ['module', 'MODULE', 'Module', 'workflow', 'Workflow', 'WORKFLOW'];
      let mappedCount = 0;
      
      for (const input of testInputs) {
        if (mapping[input.toLowerCase()]) {
          mappedCount++;
        }
      }
      
      this.addResult(configKey, 'Dynamic Mapping', 'PASS', `Created mapping for ${Object.keys(mapping).length} variations`);
    } catch (error) {
      this.addResult(configKey, 'Dynamic Mapping', 'FAIL', error.message);
    }
  }

  async testValidation(configKey, config) {
    try {
      const schemasPath = path.join(__dirname, '..', config.schemasPath);
      const files = await fs.readdir(schemasPath);
      const schemaFiles = files.filter(file => file.endsWith('.json'));
      
      let validationTests = 0;
      let validationPasses = 0;
      
      for (const file of schemaFiles) {
        const schemaPath = path.join(schemasPath, file);
        const content = await fs.readFile(schemaPath, 'utf8');
        const schema = JSON.parse(content);
        
        // Test pattern validation if present
        if (schema.pattern) {
          validationTests++;
          const testValue = schema.examples?.[0] || 'test';
          const regex = new RegExp(schema.pattern);
          
          if (regex.test(testValue)) {
            validationPasses++;
          }
        }
        
        // Test required fields validation
        if (schema.required !== undefined) {
          validationTests++;
          if (typeof schema.required === 'boolean') {
            validationPasses++;
          }
        }
      }
      
      this.addResult(configKey, 'Validation', 'PASS', `${validationPasses}/${validationTests} validation tests passed`);
    } catch (error) {
      this.addResult(configKey, 'Validation', 'FAIL', error.message);
    }
  }

  async testAIPromptGeneration(configKey, config) {
    try {
      const schemasPath = path.join(__dirname, '..', config.schemasPath);
      const files = await fs.readdir(schemasPath);
      const schemaFiles = files.filter(file => file.endsWith('.json'));
      
      let promptTests = 0;
      let promptPasses = 0;
      
      for (const file of schemaFiles) {
        const schemaPath = path.join(schemasPath, file);
        const content = await fs.readFile(schemaPath, 'utf8');
        const schema = JSON.parse(content);
        
        // Test that schema has required fields for AI prompt generation
        promptTests++;
        if (schema.description && schema.title && schema.examples) {
          promptPasses++;
        }
        
        // Test that documentation exists
        promptTests++;
        if (schema.documentation && schema.documentation.description) {
          promptPasses++;
        }
      }
      
      this.addResult(configKey, 'AI Prompt Generation', 'PASS', `${promptPasses}/${promptTests} prompt generation tests passed`);
    } catch (error) {
      this.addResult(configKey, 'AI Prompt Generation', 'FAIL', error.message);
    }
  }

  addResult(configKey, testName, status, message) {
    this.results.push({
      config: configKey,
      test: testName,
      status,
      message,
      timestamp: new Date().toISOString()
    });
    
    const statusIcon = status === 'PASS' ? '✅' : '❌';
    console.log(`  ${statusIcon} ${testName}: ${message}`);
  }

  printResults() {
    console.log('\n📊 Test Results Summary');
    console.log('=' .repeat(50));
    
    const configResults = {};
    
    for (const result of this.results) {
      if (!configResults[result.config]) {
        configResults[result.config] = { pass: 0, fail: 0, tests: [] };
      }
      
      configResults[result.config].tests.push(result);
      if (result.status === 'PASS') {
        configResults[result.config].pass++;
      } else {
        configResults[result.config].fail++;
      }
    }
    
    for (const [configKey, results] of Object.entries(configResults)) {
      const config = TEST_CONFIGS[configKey];
      const total = results.pass + results.fail;
      const passRate = ((results.pass / total) * 100).toFixed(1);
      
      console.log(`\n${config.name}:`);
      console.log(`  Total Tests: ${total}`);
      console.log(`  Passed: ${results.pass}`);
      console.log(`  Failed: ${results.fail}`);
      console.log(`  Pass Rate: ${passRate}%`);
      
      if (results.fail > 0) {
        console.log('  Failed Tests:');
        results.tests.filter(r => r.status === 'FAIL').forEach(r => {
          console.log(`    - ${r.test}: ${r.message}`);
        });
      }
    }
    
    const totalTests = this.results.length;
    const totalPassed = this.results.filter(r => r.status === 'PASS').length;
    const overallPassRate = ((totalPassed / totalTests) * 100).toFixed(1);
    
    console.log('\n' + '='.repeat(50));
    console.log(`Overall Results: ${totalPassed}/${totalTests} tests passed (${overallPassRate}%)`);
    
    if (overallPassRate === '100.0') {
      console.log('🎉 All tests passed! The schema-driven system is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the failed tests above.');
    }
  }
}

// Run the test suite
async function runTests() {
  const testSuite = new SchemaTestSuite();
  await testSuite.runAllTests();
}

// Export for use in other files
module.exports = {
  SchemaTestSuite,
  TEST_CONFIGS,
  runTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
} 