# 📚 API Documentation

This document provides comprehensive API documentation for the AI-Powered Service Config Creator.

## 🚀 Quick Start

### View API Documentation
1. **Swagger UI**: Open `swagger-api-docs.yaml` in any Swagger UI viewer
2. **Online Viewer**: Use [Swagger Editor](https://editor.swagger.io/) to view the documentation
3. **Local Server**: Serve the documentation locally for development

### API Base URLs
- **Development**: `http://localhost:3001`
- **Production**: `https://api.serviceconfig.com`

## 📋 API Overview

The API is organized into 5 main categories:

### 1. **Health** 🏥
- **GET** `/health` - Check API health status

### 2. **Configuration Generation** 🤖
- **POST** `/api/generate-config/ai-guided` - AI-powered configuration generation

### 3. **Configuration Validation** ✅
- **POST** `/api/validate-config` - Validate configuration against schema
- **POST** `/api/validate-config/{section}` - Validate specific section

### 4. **Documentation** 📖
- **GET** `/api/docs` - Get all available sections
- **GET** `/api/docs/create-requirements` - Get creation requirements
- **GET** `/api/docs/section-order` - Get section order
- **GET** `/api/docs/{section}` - Get section documentation
- **GET** `/api/docs/{section}/schema` - Get section schema
- **GET** `/api/docs/{section}/examples` - Get section examples
- **POST** `/api/docs/generate-json` - Generate JSON from guided questions
- **GET** `/api/docs/ai-guided/info` - Get AI-guided information
- **GET** `/api/docs/ai-guided/{section}` - Get section-specific AI guidance
- **GET** `/api/docs/ai-guided/context/{section}` - Get AI context for section

### 5. **External Services** 🔗
- **POST** `/api/external-service` - Send configuration to external service

## 🎯 Key Features Documented

### 1. **AI-Guided Configuration Generation**
```yaml
POST /api/generate-config/ai-guided
```
**Features:**
- Multi-attribute input processing
- Affirmative response handling
- Default configuration generation
- Context-aware progression

**Example Request:**
```json
{
  "section": "module",
  "details": {
    "prompt": "create a module called tradelicence and service as NewTl"
  },
  "context": {
    "currentSection": "module",
    "completedSections": ["service"],
    "existingConfig": {"service": "NewTl"},
    "useDefault": false,
    "multiAttributes": {
      "module": "tradelicence",
      "service": "NewTl"
    }
  }
}
```

### 2. **Schema Validation**
```yaml
POST /api/validate-config
```
**Features:**
- JSON schema validation
- Detailed error reporting
- Section-specific validation

**Example Request:**
```json
{
  "config": {
    "module": "tradelicence",
    "service": "NewTl"
  },
  "section": "module"
}
```

### 3. **Dynamic Documentation**
```yaml
GET /api/docs/ai-guided/info
```
**Features:**
- Dynamic schema discovery
- AI-guided information
- Section metadata
- Guided questions

## 🔧 API Response Examples

### Successful Configuration Generation
```json
{
  "success": true,
  "section": "module",
  "config": {
    "module": "tradelicence",
    "service": "NewTl"
  },
  "context": {
    "currentSection": "module",
    "completedSections": ["service"]
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "suggestions": [
    "Now let's configure the fields section",
    "We can set up the workflow next"
  ],
  "multiAttributes": {
    "module": "tradelicence",
    "service": "NewTl"
  }
}
```

### Validation Response
```json
{
  "valid": true,
  "section": "module",
  "errors": [],
  "message": "module configuration is valid"
}
```

### Error Response
```json
{
  "error": "Bad Request",
  "message": "Missing required field: config"
}
```

## 📊 Data Models

### Core Schemas

#### ErrorResponse
```yaml
type: object
properties:
  error:
    type: string
    example: "Bad Request"
  message:
    type: string
    example: "Missing required field: config"
```

#### ValidationError
```yaml
type: object
properties:
  field:
    type: string
    example: "/module"
  message:
    type: string
    example: "should match pattern \"^[a-z]+$\""
  code:
    type: string
    example: "pattern"
  params:
    type: object
    properties:
      pattern:
        type: string
        example: "^[a-z]+$"
```

#### AIGuidedSection
```yaml
type: object
properties:
  name:
    type: string
    example: "module"
  label:
    type: string
    example: "Module"
  type:
    type: string
    example: "string"
  required:
    type: boolean
    example: true
  description:
    type: string
    example: "Basic module information and configuration"
  examples:
    type: array
    items:
      type: string
  guidedQuestions:
    type: array
    items:
      $ref: '#/components/schemas/GuidedQuestion'
  generationLogic:
    type: object
    nullable: true
  validation:
    type: object
    properties:
      type:
        type: string
        example: "json"
      schema:
        type: object
  helperText:
    type: string
    example: "Enter module configuration"
  order:
    type: integer
    example: 1
```

## 🔐 Authentication

The API supports API key authentication:

```yaml
security:
  - ApiKeyAuth: []

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
      description: API key for authentication (if required)
```

## 🚀 Usage Examples

### 1. Generate Configuration
```bash
curl -X POST http://localhost:3001/api/generate-config/ai-guided \
  -H "Content-Type: application/json" \
  -d '{
    "section": "module",
    "details": {
      "prompt": "create a module called tradelicence and service as NewTl"
    },
    "context": {
      "currentSection": "module",
      "completedSections": [],
      "existingConfig": {}
    }
  }'
```

### 2. Validate Configuration
```bash
curl -X POST http://localhost:3001/api/validate-config \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "module": "tradelicence"
    },
    "section": "module"
  }'
```

### 3. Get AI-Guided Information
```bash
curl -X GET http://localhost:3001/api/docs/ai-guided/info
```

### 4. Get Section Documentation
```bash
curl -X GET http://localhost:3001/api/docs/module
```

## 📈 API Metrics

### Endpoint Coverage
- **Total Endpoints**: 15
- **Health**: 1 endpoint
- **Configuration Generation**: 1 endpoint
- **Configuration Validation**: 2 endpoints
- **Documentation**: 10 endpoints
- **External Services**: 1 endpoint

### Response Types
- **Success Responses**: 200, 201
- **Client Errors**: 400, 404
- **Server Errors**: 500

### Data Models
- **Core Schemas**: 8
- **Error Handling**: 2
- **Validation**: 1
- **Documentation**: 5

## 🔄 API Evolution

### Version 1.0.0 Features
- ✅ AI-guided configuration generation
- ✅ Multi-attribute input processing
- ✅ Dynamic schema discovery
- ✅ Comprehensive validation
- ✅ Rich documentation endpoints
- ✅ External service integration

### Planned Features
- 🔄 Real-time collaboration
- 🔄 Advanced schema relationships
- 🔄 Template system
- 🔄 Configuration versioning
- 🔄 Advanced AI features

## 📚 Additional Resources

### Documentation Files
- `swagger-api-docs.yaml` - Complete OpenAPI specification
- `understanding.md` - Project evolution and architecture
- `EXAMPLES_MULTI_ATTRIBUTE.md` - Multi-attribute examples
- `DYNAMIC_PROGRESSION.md` - Dynamic progression system
- `AFFIRMATIVE_RESPONSE_FIX.md` - Intent detection fixes

### Testing
- `server/test/` - Comprehensive test coverage
- `server/test/multiAttributeTest.js` - Multi-attribute testing
- `server/test/enhancedIntentTest.js` - Intent detection testing
- `server/test/dynamicProgressionTest.js` - Progression testing

## 🎯 Getting Started

1. **View Documentation**: Open `swagger-api-docs.yaml` in Swagger UI
2. **Test Endpoints**: Use the provided curl examples
3. **Explore Features**: Try the AI-guided generation endpoints
4. **Validate Configs**: Test the validation endpoints
5. **Check Health**: Verify API status with `/health`

---

**API Documentation**: Complete OpenAPI 3.0.3 specification with comprehensive examples and schemas. 