const ServiceConfigHelper = require('./serviceConfigHelper');

// Example usage
async function demonstrateHelper() {
  const helper = new ServiceConfigHelper();
  
  console.log('Welcome to the Service Config Generator!\n');
  
  // Demonstrate Basic Service Details
  console.log('\n=== Basic Service Details ===');
  console.log(helper.explainSection('basics'));
  
  // Simulate user inputs for basics
  const basicInputs = {
    module: 'PropertyTax',
    service: 'PT',
    enabled: ['citizen', 'employee']
  };
  
  const basicConfig = helper.generateSectionConfig('basics', basicInputs);
  console.log('\nGenerated Basic Config:');
  console.log(JSON.stringify(basicConfig, null, 2));
  
  // Demonstrate Workflow Configuration
  console.log('\n=== Workflow Configuration ===');
  console.log(helper.explainSection('workflow'));
  
  // Simulate user inputs for workflow
  const workflowInputs = {
    module: 'PropertyTax',
    service: 'PT',
    states: [
      'PENDING_FOR_VERIFICATION',
      'PENDING_FOR_APPROVAL',
      'APPROVED'
    ],
    roles: ['CITIZEN', 'APPROVER', 'ADMIN']
  };
  
  const workflowConfig = helper.generateSectionConfig('workflow', workflowInputs);
  console.log('\nGenerated Workflow Config:');
  console.log(JSON.stringify(workflowConfig, null, 2));
  
  // Get complete config
  console.log('\n=== Complete Configuration ===');
  console.log(JSON.stringify(helper.getFinalConfig(), null, 2));
}

demonstrateHelper();
