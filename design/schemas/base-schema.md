# 📋 Base Schema Design

## 🎯 Overview

The AI-Powered Service Config Creator uses **JSON Schema** as the foundation for all configuration definitions. Every aspect of the system - validation, UI generation, AI guidance, and documentation - is driven by these schema files.

## 🏗️ Schema Design Principles

### 1. **Self-Documenting Schemas**
Every schema file contains comprehensive metadata that drives the entire system behavior.

### 2. **AI-Readable Structure**
Schemas are designed to be easily parsed and understood by AI systems for intelligent processing.

### 3. **Extensible Architecture**
New configuration types can be added by simply creating new schema files.

### 4. **Validation-First Approach**
All validation rules are defined in the schema, ensuring consistency across the system.

## 📋 Base Schema Structure

### **Core Schema Template**
```json
{
  "type": "string|object|array",
  "description": "Human-readable description",
  "title": "Display title",
  "required": true|false,
  "examples": ["example1", "example2"],
  "documentation": {
    "description": "Detailed description",
    "usage": "Usage instructions",
    "helperText": "UI helper text",
    "required": true|false
  },
  "validation": {
    "pattern": "regex-pattern",
    "minLength": 1,
    "maxLength": 100,
    "enum": ["value1", "value2"]
  },
  "guidedQuestions": [
    {
      "id": "questionId",
      "question": "Question text",
      "type": "text|number|select|multiSelect",
      "suggestions": ["suggestion1", "suggestion2"],
      "placeholder": "Placeholder text"
    }
  ],
  "generationLogic": {
    "type": "object|array",
    "description": "Generation description",
    "logic": {
      "input": "input description",
      "output": "output description"
    }
  }
}
```

## 🧩 Schema Components

### 1. **Basic Properties**

#### **Type Definition**
```json
{
  "type": "string",
  "description": "Module configuration for the service",
  "title": "Module Configuration"
}
```

#### **Validation Rules**
```json
{
  "pattern": "^[a-z]+$",
  "minLength": 3,
  "maxLength": 20,
  "required": true
}
```

#### **Examples**
```json
{
  "examples": ["tradelicense", "propertytax", "watercharge"]
}
```

### 2. **Documentation Metadata**

#### **Comprehensive Documentation**
```json
{
  "documentation": {
    "description": "The module name identifies the specific service module",
    "usage": "Enter the module name in lowercase without spaces",
    "helperText": "Enter the module name (lowercase, no spaces)",
    "required": true,
    "fieldTypes": {
      "text": "Single line text input",
      "number": "Numeric input",
      "email": "Email address input with validation"
    },
    "examples": [
      {
        "name": "applicantName",
        "label": "Applicant Name",
        "type": "text",
        "required": true
      }
    ]
  }
}
```

### 3. **Guided Questions**

#### **Question Structure**
```json
{
  "guidedQuestions": [
    {
      "id": "fieldCount",
      "question": "How many form fields do you need?",
      "type": "number",
      "placeholder": "Enter number of fields"
    },
    {
      "id": "fieldTypes",
      "question": "What types of fields do you need?",
      "type": "multiSelect",
      "suggestions": ["text", "number", "select", "date", "file", "textarea"],
      "placeholder": "Select field types"
    }
  ]
}
```

### 4. **Generation Logic**

#### **Logic Definition**
```json
{
  "generationLogic": {
    "type": "array",
    "description": "Generate array of field objects from guided question answers",
    "logic": {
      "fieldCount": "number of fields to generate",
      "fieldNames": "comma-separated field names",
      "fieldTypes": "array of field types",
      "output": "Array of field objects with name, label, type, required properties"
    }
  }
}
```

## 📊 Schema Types

### 1. **Simple Schemas (String/Number)**

#### **Module Schema Example**
```json
{
  "type": "string",
  "description": "Module configuration for the service",
  "title": "Module Configuration",
  "required": true,
  "examples": ["tradelicense", "propertytax", "watercharge"],
  "documentation": {
    "description": "The module name identifies the specific service module",
    "helperText": "Enter the module name (lowercase, no spaces)",
    "required": true
  },
  "pattern": "^[a-z]+$",
  "minLength": 3,
  "maxLength": 20
}
```

### 2. **Complex Schemas (Object)**

#### **Service Schema Example**
```json
{
  "type": "object",
  "description": "Service configuration object",
  "title": "Service Configuration",
  "required": ["name", "type"],
  "properties": {
    "name": {
      "type": "string",
      "description": "Service name",
      "pattern": "^[A-Za-z]+$"
    },
    "type": {
      "type": "string",
      "enum": ["api", "database", "external"],
      "description": "Service type"
    },
    "config": {
      "type": "object",
      "description": "Service-specific configuration"
    }
  }
}
```

### 3. **Array Schemas**

#### **Fields Schema Example**
```json
{
  "type": "array",
  "description": "Form fields configuration and validation rules",
  "title": "Fields Configuration",
  "items": {
    "type": "object",
    "required": ["name", "label", "type"],
    "properties": {
      "name": {
        "type": "string",
        "description": "Unique field identifier",
        "pattern": "^[a-zA-Z][a-zA-Z0-9_]*$"
      },
      "label": {
        "type": "string",
        "description": "Display label for the field"
      },
      "type": {
        "type": "string",
        "enum": ["text", "number", "email", "phone", "date", "select", "multiselect", "file", "textarea"],
        "description": "Field input type"
      },
      "required": {
        "type": "boolean",
        "default": false,
        "description": "Whether the field is mandatory"
      },
      "validation": {
        "type": "object",
        "properties": {
          "minLength": { "type": "number" },
          "maxLength": { "type": "number" },
          "pattern": { "type": "string" },
          "min": { "type": "number" },
          "max": { "type": "number" }
        }
      }
    }
  },
  "minItems": 1
}
```

## 🔄 Schema Evolution

### 1. **Versioning Strategy**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "version": "1.0.0",
  "deprecated": false,
  "migration": {
    "from": "0.9.0",
    "changes": [
      "Added guidedQuestions property",
      "Enhanced documentation structure"
    ]
  }
}
```

### 2. **Backward Compatibility**
- New properties are optional
- Deprecated properties are marked but not removed
- Migration guides provided
- Version-specific validation

### 3. **Schema Validation**
```json
{
  "validation": {
    "strict": true,
    "allowUnknown": false,
    "coerceTypes": false
  }
}
```

## 🎨 Schema-Driven UI Generation

### 1. **Form Generation**
```javascript
// Schema drives form field generation
const generateFormFields = (schema) => {
  if (schema.type === 'string') {
    return generateTextField(schema);
  } else if (schema.type === 'object') {
    return generateObjectFields(schema.properties);
  } else if (schema.type === 'array') {
    return generateArrayField(schema);
  }
};
```

### 2. **Validation Rules**
```javascript
// Schema drives validation
const generateValidation = (schema) => {
  return {
    required: schema.required || false,
    pattern: schema.pattern,
    minLength: schema.minLength,
    maxLength: schema.maxLength,
    enum: schema.enum
  };
};
```

### 3. **AI Prompt Generation**
```javascript
// Schema drives AI prompts
const generateAIPrompt = (schema) => {
  return `
    Generate a configuration for ${schema.title}.
    Description: ${schema.description}
    Examples: ${schema.examples.join(', ')}
    Validation: ${JSON.stringify(schema.validation)}
  `;
};
```

## 🔧 Schema Management

### 1. **Schema Discovery**
```javascript
// Dynamic schema loading
const loadSchemas = async () => {
  const schemaFiles = await fs.readdir('./schemas');
  const schemas = {};
  
  for (const file of schemaFiles) {
    if (file.endsWith('.json')) {
      const schema = await fs.readFile(`./schemas/${file}`, 'utf8');
      const section = file.replace('.json', '');
      schemas[section] = JSON.parse(schema);
    }
  }
  
  return schemas;
};
```

### 2. **Schema Caching**
```javascript
// Schema caching for performance
const schemaCache = new Map();

const getSchema = async (section) => {
  if (schemaCache.has(section)) {
    return schemaCache.get(section);
  }
  
  const schema = await loadSchema(section);
  schemaCache.set(section, schema);
  return schema;
};
```

### 3. **Schema Validation**
```javascript
// Schema validation
const validateSchema = (schema) => {
  const ajv = new Ajv();
  const validate = ajv.compile(schema);
  return validate;
};
```

## 📈 Schema Performance

### 1. **Optimization Strategies**
- Schema caching
- Lazy loading
- Compression
- CDN distribution

### 2. **Memory Management**
- Schema pooling
- Garbage collection
- Memory limits
- Cache eviction

### 3. **Loading Performance**
- Parallel loading
- Progressive loading
- Background loading
- Preloading

## 🧪 Schema Testing

### 1. **Unit Testing**
```javascript
// Test schema structure
describe('Schema Structure', () => {
  test('should have required properties', () => {
    expect(schema).toHaveProperty('type');
    expect(schema).toHaveProperty('description');
    expect(schema).toHaveProperty('title');
  });
});
```

### 2. **Validation Testing**
```javascript
// Test schema validation
describe('Schema Validation', () => {
  test('should validate correct data', () => {
    const validData = 'tradelicense';
    const isValid = validate(validData);
    expect(isValid).toBe(true);
  });
});
```

### 3. **AI Integration Testing**
```javascript
// Test AI processing
describe('AI Integration', () => {
  test('should generate correct prompts', () => {
    const prompt = generatePrompt(schema, userInput);
    expect(prompt).toContain(schema.description);
  });
});
```

## 🚀 Best Practices

### 1. **Schema Design**
- Keep schemas focused and single-purpose
- Use descriptive names and descriptions
- Include comprehensive examples
- Provide clear validation rules

### 2. **Documentation**
- Document all properties thoroughly
- Include usage examples
- Provide helper text for UI
- Explain validation rules

### 3. **Validation**
- Use appropriate validation rules
- Test edge cases
- Provide clear error messages
- Consider performance impact

### 4. **Extensibility**
- Design for future expansion
- Use consistent patterns
- Maintain backward compatibility
- Plan for versioning

---

**Base Schema Design**: Foundation for all configuration schemas in the AI-Powered Service Config Creator. 