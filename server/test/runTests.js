const { runTests: runSchemaTests } = require('./schemaTest');
const { runServerTests } = require('./serverTest');

class TestRunner {
  constructor() {
    this.results = [];
    this.startTime = null;
  }

  async runAllTests() {
    this.startTime = new Date();
    console.log('🧪 Starting Comprehensive Test Suite');
    console.log('=' .repeat(60));
    console.log('Testing Schema-Driven System Without Hardcoding');
    console.log('=' .repeat(60));
    console.log(`Started at: ${this.startTime.toISOString()}\n`);

    try {
      // Run schema tests
      console.log('📋 Phase 1: Schema Tests');
      console.log('-'.repeat(40));
      await runSchemaTests();
      
      console.log('\n' + '='.repeat(60) + '\n');
      
      // Run server integration tests
      console.log('🚀 Phase 2: Server Integration Tests');
      console.log('-'.repeat(40));
      await runServerTests();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.addResult('Test Suite', 'FAIL', error.message);
    }

    this.printFinalResults();
  }

  addResult(testName, status, message) {
    this.results.push({
      test: testName,
      status,
      message,
      timestamp: new Date().toISOString()
    });
  }

  printFinalResults() {
    const endTime = new Date();
    const duration = (endTime - this.startTime) / 1000;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Duration: ${duration.toFixed(2)} seconds`);
    console.log(`Completed at: ${endTime.toISOString()}`);
    
    // Summary
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';
    
    console.log(`\nOverall Results:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  Passed: ${passedTests}`);
    console.log(`  Failed: ${failedTests}`);
    console.log(`  Pass Rate: ${passRate}%`);
    
    if (passRate === '100.0') {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('✅ The schema-driven system is working correctly without hardcoding.');
      console.log('✅ All configurations are dynamically loaded from schemas.');
      console.log('✅ The system is ready for production use.');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED');
      console.log('Please review the failed tests above and fix any issues.');
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run all tests
async function runAllTests() {
  const runner = new TestRunner();
  await runner.runAllTests();
}

// Export for use in other files
module.exports = {
  TestRunner,
  runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
} 