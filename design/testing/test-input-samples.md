# 🧪 Test Input Samples

## 🎯 Overview

This document provides comprehensive test input samples for the AI-Powered Service Config Creator, covering all user interaction scenarios, edge cases, and validation requirements.

## 📋 Test Input Categories

### 1. **Multi-Attribute Inputs**
### 2. **Natural Language Commands**
### 3. **Quick Commands**
### 4. **Affirmative Responses**
### 5. **Error Scenarios**
### 6. **Edge Cases**
### 7. **Complex Configurations**

## 🎯 Multi-Attribute Input Samples

### **Basic Multi-Attribute**
```json
{
  "input": "create a module called tradelicence and service as NewTl",
  "expected": {
    "module": "tradelicence",
    "service": "NewTl"
  },
  "description": "Basic multi-attribute extraction"
}
```

### **Complex Multi-Attribute**
```json
{
  "input": "create module propertytax with service TaxService and fields name, email, phone",
  "expected": {
    "module": "propertytax",
    "service": "TaxService",
    "fields": ["name", "email", "phone"]
  },
  "description": "Complex multi-attribute with array"
}
```

### **Workflow Multi-Attribute**
```json
{
  "input": "create workflow with states DRAFT, PENDING, APPROVED and module watercharge",
  "expected": {
    "workflow": {
      "states": ["DRAFT", "PENDING", "APPROVED"]
    },
    "module": "watercharge"
  },
  "description": "Multi-attribute with object structure"
}
```

### **Mixed Data Types**
```json
{
  "input": "create module billing with service PaymentService and calculator tax_rate=0.08",
  "expected": {
    "module": "billing",
    "service": "PaymentService",
    "calculator": {
      "tax_rate": 0.08
    }
  },
  "description": "Mixed string and numeric attributes"
}
```

## 🗣️ Natural Language Commands

### **Simple Commands**
```json
{
  "input": "create a module",
  "expected": {
    "intent": "generate",
    "section": "module",
    "needsClarification": true
  },
  "description": "Simple command requiring clarification"
}
```

### **Detailed Commands**
```json
{
  "input": "create a module for trade license management with applicant tracking",
  "expected": {
    "intent": "generate",
    "section": "module",
    "details": "trade license management with applicant tracking"
  },
  "description": "Detailed command with context"
}
```

### **Question Format**
```json
{
  "input": "how do I create a workflow for document approval?",
  "expected": {
    "intent": "help",
    "section": "workflow",
    "context": "document approval"
  },
  "description": "Question format command"
}
```

### **Instructional Commands**
```json
{
  "input": "set up a billing system with tax calculation and payment processing",
  "expected": {
    "intent": "generate",
    "sections": ["billing", "calculator", "payment"],
    "context": "tax calculation and payment processing"
  },
  "description": "Instructional multi-section command"
}
```

## ⚡ Quick Commands

### **Default Commands**
```json
{
  "input": "keep it default",
  "expected": {
    "intent": "keep_default",
    "action": "generate_default_config"
  },
  "description": "Default configuration request"
}
```

### **Skip Commands**
```json
{
  "input": "skip this section",
  "expected": {
    "intent": "skip_section",
    "action": "move_to_next_section"
  },
  "description": "Skip current section"
}
```

### **Proceed Commands**
```json
{
  "input": "yes fine next step",
  "expected": {
    "intent": "proceed_next",
    "action": "move_to_next_section"
  },
  "description": "Affirmative progression command"
}
```

### **Simple Affirmatives**
```json
{
  "input": "yes",
  "expected": {
    "intent": "proceed_next",
    "action": "move_to_next_section"
  },
  "description": "Simple affirmative response"
}
```

## ✅ Affirmative Response Samples

### **Simple Affirmatives**
```json
{
  "inputs": [
    "yes",
    "ok",
    "fine",
    "good",
    "sure",
    "alright",
    "right",
    "correct"
  ],
  "expected": {
    "intent": "proceed_next",
    "action": "generate_sensible_config"
  },
  "description": "Simple affirmative responses"
}
```

### **Compound Affirmatives**
```json
{
  "inputs": [
    "yes please",
    "ok sure",
    "fine with me",
    "good to go",
    "sure thing",
    "alright then",
    "right on",
    "correct"
  ],
  "expected": {
    "intent": "proceed_next",
    "action": "generate_sensible_config"
  },
  "description": "Compound affirmative responses"
}
```

### **Progression Commands**
```json
{
  "inputs": [
    "next step",
    "continue",
    "proceed",
    "move on",
    "go ahead",
    "carry on"
  ],
  "expected": {
    "intent": "proceed_next",
    "action": "move_to_next_section"
  },
  "description": "Progression commands"
}
```

### **Complex Affirmatives**
```json
{
  "inputs": [
    "yes fine next step",
    "ok proceed to next",
    "sure move on",
    "alright continue",
    "good go ahead",
    "right carry on"
  ],
  "expected": {
    "intent": "proceed_next",
    "action": "move_to_next_section"
  },
  "description": "Complex affirmative with progression"
}
```

## ❌ Error Scenario Samples

### **Invalid Inputs**
```json
{
  "input": "create module 123",
  "expected": {
    "error": "validation_error",
    "message": "Module name must contain only lowercase letters",
    "field": "module"
  },
  "description": "Invalid module name with numbers"
}
```

### **Missing Required Fields**
```json
{
  "input": "create service",
  "expected": {
    "error": "missing_required",
    "message": "Service name is required",
    "field": "service.name"
  },
  "description": "Missing required service name"
}
```

### **Invalid Data Types**
```json
{
  "input": "create calculator with tax_rate=abc",
  "expected": {
    "error": "type_error",
    "message": "tax_rate must be a number",
    "field": "calculator.tax_rate"
  },
  "description": "Invalid data type for numeric field"
}
```

### **Pattern Violations**
```json
{
  "input": "create module TRADE_LICENSE",
  "expected": {
    "error": "pattern_error",
    "message": "Module name must match pattern ^[a-z]+$",
    "field": "module"
  },
  "description": "Pattern violation for module name"
}
```

## 🔍 Edge Case Samples

### **Empty Inputs**
```json
{
  "input": "",
  "expected": {
    "error": "empty_input",
    "message": "Please provide some input"
  },
  "description": "Empty user input"
}
```

### **Very Long Inputs**
```json
{
  "input": "create module with a very long name that exceeds the maximum length limit of twenty characters",
  "expected": {
    "error": "length_error",
    "message": "Module name must be 20 characters or less"
  },
  "description": "Input exceeding length limits"
}
```

### **Special Characters**
```json
{
  "input": "create module test@123",
  "expected": {
    "error": "pattern_error",
    "message": "Module name must contain only lowercase letters"
  },
  "description": "Special characters in input"
}
```

### **Whitespace Only**
```json
{
  "input": "   ",
  "expected": {
    "error": "empty_input",
    "message": "Please provide some input"
  },
  "description": "Whitespace only input"
}
```

## 🏗️ Complex Configuration Samples

### **Complete Workflow Configuration**
```json
{
  "input": "create a complete workflow for document approval with states DRAFT, REVIEW, APPROVED, REJECTED and fields applicant_name, document_type, submission_date, reviewer_comments",
  "expected": {
    "workflow": {
      "states": ["DRAFT", "REVIEW", "APPROVED", "REJECTED"]
    },
    "fields": [
      {
        "name": "applicant_name",
        "type": "text",
        "required": true
      },
      {
        "name": "document_type",
        "type": "select",
        "required": true
      },
      {
        "name": "submission_date",
        "type": "date",
        "required": true
      },
      {
        "name": "reviewer_comments",
        "type": "textarea",
        "required": false
      }
    ]
  },
  "description": "Complex workflow with multiple fields"
}
```

### **Billing System Configuration**
```json
{
  "input": "set up billing system with module billing, service PaymentService, calculator tax_rate=0.08, discount_rate=0.05, fields customer_name, amount, tax_amount, total_amount",
  "expected": {
    "module": "billing",
    "service": "PaymentService",
    "calculator": {
      "tax_rate": 0.08,
      "discount_rate": 0.05
    },
    "fields": [
      {
        "name": "customer_name",
        "type": "text",
        "required": true
      },
      {
        "name": "amount",
        "type": "number",
        "required": true
      },
      {
        "name": "tax_amount",
        "type": "number",
        "required": true
      },
      {
        "name": "total_amount",
        "type": "number",
        "required": true
      }
    ]
  },
  "description": "Complete billing system configuration"
}
```

### **Multi-Service Configuration**
```json
{
  "input": "create module tradelicense with services API, Database, External and workflow states APPLIED, VERIFIED, APPROVED",
  "expected": {
    "module": "tradelicense",
    "services": [
      {
        "name": "API",
        "type": "api"
      },
      {
        "name": "Database",
        "type": "database"
      },
      {
        "name": "External",
        "type": "external"
      }
    ],
    "workflow": {
      "states": ["APPLIED", "VERIFIED", "APPROVED"]
    }
  },
  "description": "Multi-service configuration with workflow"
}
```

## 🧪 Test Scenarios

### **Scenario 1: New User Journey**
```json
{
  "scenario": "New user creating first configuration",
  "inputs": [
    "hello",
    "I want to create a configuration",
    "create module tradelicense",
    "yes",
    "create service PaymentService",
    "keep it default",
    "create fields name, email, phone",
    "skip this section",
    "export"
  ],
  "expected": {
    "sections_completed": ["module", "service", "fields"],
    "final_config": {
      "module": "tradelicense",
      "service": "PaymentService",
      "fields": [
        {"name": "name", "type": "text", "required": true},
        {"name": "email", "type": "email", "required": true},
        {"name": "phone", "type": "phone", "required": true}
      ]
    }
  }
}
```

### **Scenario 2: Expert User Journey**
```json
{
  "scenario": "Expert user with quick commands",
  "inputs": [
    "create module billing service PaymentService fields customer, amount, tax",
    "keep it default",
    "skip this section",
    "yes",
    "export"
  ],
  "expected": {
    "sections_completed": ["module", "service", "fields", "workflow"],
    "final_config": {
      "module": "billing",
      "service": "PaymentService",
      "fields": [
        {"name": "customer", "type": "text", "required": true},
        {"name": "amount", "type": "number", "required": true},
        {"name": "tax", "type": "number", "required": true}
      ]
    }
  }
}
```

### **Scenario 3: Error Recovery Journey**
```json
{
  "scenario": "User encountering and recovering from errors",
  "inputs": [
    "create module 123",
    "create module tradelicense",
    "create service @#$%",
    "create service PaymentService",
    "create fields with invalid names",
    "create fields name, email, phone",
    "export"
  ],
  "expected": {
    "errors_encountered": 3,
    "recovery_successful": true,
    "final_config": {
      "module": "tradelicense",
      "service": "PaymentService",
      "fields": [
        {"name": "name", "type": "text", "required": true},
        {"name": "email", "type": "email", "required": true},
        {"name": "phone", "type": "phone", "required": true}
      ]
    }
  }
}
```

## 📊 Test Data Sets

### **Module Test Data**
```json
{
  "valid_modules": [
    "tradelicense",
    "propertytax",
    "watercharge",
    "billing",
    "applicant",
    "document",
    "workflow"
  ],
  "invalid_modules": [
    "123",
    "TRADE_LICENSE",
    "trade-license",
    "trade license",
    "a",
    "verylongmodulenameexceedinglimit"
  ]
}
```

### **Service Test Data**
```json
{
  "valid_services": [
    "PaymentService",
    "DatabaseService",
    "APIService",
    "ExternalService",
    "NotificationService"
  ],
  "invalid_services": [
    "@#$%",
    "123",
    "service@test",
    "service test",
    ""
  ]
}
```

### **Field Test Data**
```json
{
  "valid_fields": [
    {"name": "applicant_name", "type": "text", "required": true},
    {"name": "email", "type": "email", "required": true},
    {"name": "phone", "type": "phone", "required": false},
    {"name": "amount", "type": "number", "required": true},
    {"name": "submission_date", "type": "date", "required": true}
  ],
  "invalid_fields": [
    {"name": "123", "type": "text", "required": true},
    {"name": "@#$%", "type": "text", "required": true},
    {"name": "field name", "type": "text", "required": true},
    {"name": "", "type": "text", "required": true}
  ]
}
```

## 🎯 Performance Test Inputs

### **Large Configuration**
```json
{
  "input": "create module largeconfig with service LargeService and fields field1, field2, field3, field4, field5, field6, field7, field8, field9, field10",
  "expected": {
    "module": "largeconfig",
    "service": "LargeService",
    "fields": [
      {"name": "field1", "type": "text", "required": true},
      {"name": "field2", "type": "text", "required": true},
      {"name": "field3", "type": "text", "required": true},
      {"name": "field4", "type": "text", "required": true},
      {"name": "field5", "type": "text", "required": true},
      {"name": "field6", "type": "text", "required": true},
      {"name": "field7", "type": "text", "required": true},
      {"name": "field8", "type": "text", "required": true},
      {"name": "field9", "type": "text", "required": true},
      {"name": "field10", "type": "text", "required": true}
    ]
  },
  "description": "Large configuration for performance testing"
}
```

### **Complex Multi-Attribute**
```json
{
  "input": "create module complex with service ComplexService and workflow states INITIAL, PROCESSING, VALIDATION, APPROVAL, COMPLETION, REJECTION and fields applicant_name, business_type, license_type, submission_date, review_date, approval_date, rejection_reason and calculator tax_rate=0.08, processing_fee=50.00, late_fee=25.00",
  "expected": {
    "module": "complex",
    "service": "ComplexService",
    "workflow": {
      "states": ["INITIAL", "PROCESSING", "VALIDATION", "APPROVAL", "COMPLETION", "REJECTION"]
    },
    "fields": [
      {"name": "applicant_name", "type": "text", "required": true},
      {"name": "business_type", "type": "select", "required": true},
      {"name": "license_type", "type": "select", "required": true},
      {"name": "submission_date", "type": "date", "required": true},
      {"name": "review_date", "type": "date", "required": false},
      {"name": "approval_date", "type": "date", "required": false},
      {"name": "rejection_reason", "type": "textarea", "required": false}
    ],
    "calculator": {
      "tax_rate": 0.08,
      "processing_fee": 50.00,
      "late_fee": 25.00
    }
  },
  "description": "Complex multi-attribute configuration for performance testing"
}
```

## 🔄 Regression Test Inputs

### **Previous Bug Scenarios**
```json
{
  "regression_tests": [
    {
      "input": "yes fine next step",
      "expected": {
        "intent": "proceed_next",
        "action": "move_to_next_section"
      },
      "bug_fixed": "Intent detection for compound affirmatives"
    },
    {
      "input": "create module tradelicence and service as NewTl",
      "expected": {
        "module": "tradelicence",
        "service": "NewTl"
      },
      "bug_fixed": "Multi-attribute extraction"
    },
    {
      "input": "keep it default",
      "expected": {
        "intent": "keep_default",
        "action": "generate_default_config"
      },
      "bug_fixed": "Default configuration generation"
    }
  ]
}
```

---

**Test Input Samples**: Comprehensive test data for validating all aspects of the AI-Powered Service Config Creator. 