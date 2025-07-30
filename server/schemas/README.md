# Service Configuration Schemas

This folder contains the organized schema structure for the service configuration system. All schema definitions, documentation, and metadata are centralized here for easy maintenance and updates.

## 📁 Folder Structure

```
schemas/
├── index.js              # Main schema index and configuration
├── README.md             # This documentation file
├── module.json           # Module configuration schema
├── service.json          # Service configuration schema
├── fields.json           # Form fields configuration schema
├── idgen.json            # ID generation schema
├── workflow.json         # Workflow configuration schema
├── bill.json             # Billing configuration schema
├── payment.json          # Payment gateway schema
├── access.json           # Access control schema
├── rules.json            # Business rules schema
├── calculator.json       # Calculation logic schema
├── documents.json        # Document requirements schema
├── pdf.json              # PDF generation schema
├── applicant.json        # Applicant configuration schema
├── boundary.json         # Geographic boundaries schema
├── localization.json     # Localization settings schema
└── notification.json     # Notification settings schema
```

## 🎯 Key Features

### 1. **Centralized Configuration**
- All schema metadata is defined in `index.js`
- Section order and required fields are configurable
- Easy to add new sections or modify existing ones

### 2. **Comprehensive Documentation**
- Each schema includes detailed documentation
- Examples for each section
- Usage guidelines and validation rules

### 3. **Type Safety**
- Proper JSON Schema validation
- Primitive type detection (string, number, boolean)
- Required vs optional field identification

### 4. **Extensible Structure**
- Easy to add new sections
- Modular schema files
- Consistent documentation format

## 📋 Schema Configuration

### Required Sections
The following sections are **required** and cannot be disabled:
- `module` - Basic module information
- `service` - Service name and details  
- `fields` - Form fields configuration
- `idgen` - ID generation rules

### Section Order
The display order of sections in the UI is configurable in `index.js`:

```javascript
order: [
  "module",           // 1. Basic module information (REQUIRED)
  "service",          // 2. Service name and details (REQUIRED)
  "fields",           // 3. Form fields configuration (REQUIRED)
  "idgen",            // 4. ID generation rules (REQUIRED)
  "workflow",         // 5. Workflow states and transitions
  // ... more sections
]
```

## 🔧 Usage

### Server-Side Usage

```javascript
const { 
  getAvailableSections, 
  getSectionOrder, 
  getSectionDocumentation,
  getSectionSchema 
} = require('./schemas');

// Get all available sections
const sections = getAvailableSections();

// Get section order and required sections
const { order, required } = getSectionOrder();

// Get documentation for a specific section
const doc = getSectionDocumentation('module');

// Get schema for a specific section
const schema = await getSectionSchema('module');
```

### API Endpoints

The following endpoints use the schema system:

- `GET /api/docs` - Get all available sections
- `GET /api/docs/:section` - Get section documentation
- `GET /api/docs/:section/schema` - Get section schema
- `GET /api/docs/:section/examples` - Get section examples
- `GET /api/docs/section-order` - Get section order and required fields

## 📝 Adding New Sections

To add a new section:

1. **Create the schema file** (`newsection.json`):
```json
{
  "type": "object",
  "description": "Description of the new section",
  "properties": {
    // Define your schema properties
  },
  "documentation": {
    "description": "Detailed description",
    "usage": "How to use this section",
    "examples": [
      // Example configurations
    ]
  }
}
```

2. **Update `index.js`**:
```javascript
// Add to the order array
order: [
  // ... existing sections
  "newsection",        // New section
],

// Add to the sections object
sections: {
  // ... existing sections
  newsection: {
    name: "New Section",
    description: "Description of the new section",
    type: "object",
    required: false,
    examples: [
      // Example configurations
    ],
    documentation: "Detailed documentation..."
  }
}
```

## 🔍 Schema Validation

Each schema file includes:

- **Type definition** - The JSON Schema type
- **Description** - Human-readable description
- **Examples** - Sample configurations
- **Documentation** - Detailed usage guidelines
- **Validation rules** - Pattern, min/max values, etc.

## 🚀 Benefits

1. **Maintainability** - All schemas in one place
2. **Consistency** - Standardized documentation format
3. **Flexibility** - Easy to modify order and requirements
4. **Documentation** - Comprehensive examples and guides
5. **Type Safety** - Proper validation and error handling

## 📚 Documentation Format

Each schema file follows this structure:

```json
{
  "type": "string|object|array",
  "description": "Brief description",
  "title": "Human-readable title",
  "examples": [
    // Example values
  ],
  "documentation": {
    "description": "Detailed description",
    "usage": "How to use this section",
    "validation": "Validation rules",
    "examples": {
      "valid": ["valid examples"],
      "invalid": ["invalid examples"]
    }
  }
}
```

This structure ensures consistent documentation across all sections and makes it easy for developers to understand and use each configuration section. 