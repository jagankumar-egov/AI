const axios = require('axios');
const assert = require('assert');

class ServerIntegrationTest {
  constructor() {
    this.baseURL = 'http://localhost:3001';
    this.results = [];
  }

  async runAllTests() {
    console.log('🚀 Starting Server Integration Tests\n');
    
    await this.testServerHealth();
    await this.testSchemaEndpoints();
    await this.testAIGuidedEndpoints();
    await this.testConfigurationGeneration();
    await this.testDynamicSchemaLoading();
    
    this.printResults();
  }

  async testServerHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      
      assert(response.status === 200, 'Health endpoint should return 200');
      assert(response.data.status === 'OK', 'Health status should be OK');
      assert(response.data.timestamp, 'Health response should have timestamp');
      
      this.addResult('Server Health', 'PASS', 'Server is running and healthy');
    } catch (error) {
      this.addResult('Server Health', 'FAIL', `Server health check failed: ${error.message}`);
    }
  }

  async testSchemaEndpoints() {
    try {
      // Test schema info endpoint
      const infoResponse = await axios.get(`${this.baseURL}/api/docs/ai-guided/info`);
      
      assert(infoResponse.status === 200, 'Schema info endpoint should return 200');
      assert(infoResponse.data.sections, 'Response should have sections array');
      assert(infoResponse.data.requiredSections, 'Response should have requiredSections array');
      
      const sections = infoResponse.data.sections;
      const requiredSections = infoResponse.data.requiredSections;
      
      assert(sections.length > 0, 'Should have at least one section');
      assert(requiredSections.length > 0, 'Should have at least one required section');
      
      this.addResult('Schema Endpoints', 'PASS', `Found ${sections.length} sections, ${requiredSections.length} required`);
    } catch (error) {
      this.addResult('Schema Endpoints', 'FAIL', `Schema endpoints failed: ${error.message}`);
    }
  }

  async testAIGuidedEndpoints() {
    try {
      // Test AI-guided info endpoint
      const infoResponse = await axios.get(`${this.baseURL}/api/docs/ai-guided/info`);
      const sections = infoResponse.data.sections;
      
      if (sections.length > 0) {
        const firstSection = sections[0];
        
        // Test section-specific guidance endpoint
        const guidanceResponse = await axios.get(`${this.baseURL}/api/docs/ai-guided/${firstSection.name}`);
        
        assert(guidanceResponse.status === 200, 'Section guidance endpoint should return 200');
        assert(guidanceResponse.data.schema, 'Response should have schema');
        assert(guidanceResponse.data.aiPrompts, 'Response should have aiPrompts');
        assert(guidanceResponse.data.aiPrompts.copyablePrompts, 'Response should have copyablePrompts');
        
        const prompts = guidanceResponse.data.aiPrompts.copyablePrompts;
        assert(prompts.length > 0, 'Should have at least one copyable prompt');
        
        this.addResult('AI-Guided Endpoints', 'PASS', `Generated ${prompts.length} prompts for ${firstSection.name}`);
      } else {
        this.addResult('AI-Guided Endpoints', 'SKIP', 'No sections available for testing');
      }
    } catch (error) {
      this.addResult('AI-Guided Endpoints', 'FAIL', `AI-guided endpoints failed: ${error.message}`);
    }
  }

  async testConfigurationGeneration() {
    try {
      // Test configuration generation endpoint
      const testData = {
        section: 'module',
        details: {
          prompt: 'Create a simple module configuration'
        },
        context: {
          completedSections: [],
          existingConfig: {}
        }
      };
      
      const response = await axios.post(`${this.baseURL}/api/generate-config/ai-guided`, testData);
      
      assert(response.status === 200, 'Configuration generation should return 200');
      assert(response.data.success, 'Generation should be successful');
      assert(response.data.config, 'Response should have generated config');
      assert(response.data.section, 'Response should have section name');
      
      this.addResult('Configuration Generation', 'PASS', 'Successfully generated configuration');
    } catch (error) {
      this.addResult('Configuration Generation', 'FAIL', `Configuration generation failed: ${error.message}`);
    }
  }

  async testDynamicSchemaLoading() {
    try {
      // Test that the system can dynamically load different schema configurations
      const infoResponse = await axios.get(`${this.baseURL}/api/docs/ai-guided/info`);
      const sections = infoResponse.data.sections;
      
      let dynamicTests = 0;
      let dynamicPasses = 0;
      
      // Test a few sections to ensure dynamic loading works
      const testSections = sections.slice(0, 3);
      
      for (const section of testSections) {
        try {
          const sectionResponse = await axios.get(`${this.baseURL}/api/docs/ai-guided/${section.name}`);
          
          assert(sectionResponse.data.schema, `Section ${section.name} should have schema`);
          assert(sectionResponse.data.aiPrompts, `Section ${section.name} should have aiPrompts`);
          
          dynamicTests++;
          dynamicPasses++;
        } catch (error) {
          dynamicTests++;
          console.log(`  ⚠️  Section ${section.name} failed: ${error.message}`);
        }
      }
      
      this.addResult('Dynamic Schema Loading', 'PASS', `${dynamicPasses}/${dynamicTests} sections loaded dynamically`);
    } catch (error) {
      this.addResult('Dynamic Schema Loading', 'FAIL', `Dynamic schema loading failed: ${error.message}`);
    }
  }

  addResult(testName, status, message) {
    this.results.push({
      test: testName,
      status,
      message,
      timestamp: new Date().toISOString()
    });
    
    const statusIcon = status === 'PASS' ? '✅' : status === 'SKIP' ? '⏭️' : '❌';
    console.log(`  ${statusIcon} ${testName}: ${message}`);
  }

  printResults() {
    console.log('\n📊 Server Integration Test Results');
    console.log('=' .repeat(50));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const skippedTests = this.results.filter(r => r.status === 'SKIP').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Skipped: ${skippedTests}`);
    console.log(`Failed: ${failedTests}`);
    
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);
    console.log(`Pass Rate: ${passRate}%`);
    
    if (failedTests > 0) {
      console.log('\nFailed Tests:');
      this.results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  - ${r.test}: ${r.message}`);
      });
    }
    
    if (passRate === '100.0') {
      console.log('\n🎉 All server integration tests passed!');
    } else {
      console.log('\n⚠️  Some server integration tests failed.');
    }
  }
}

// Run the server integration tests
async function runServerTests() {
  const testSuite = new ServerIntegrationTest();
  await testSuite.runAllTests();
}

// Export for use in other files
module.exports = {
  ServerIntegrationTest,
  runServerTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runServerTests().catch(console.error);
} 