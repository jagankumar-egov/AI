# 🧠 Generic AI-Powered Service Config Creator

A **unified, schema-driven service configuration generator** that uses AI to intelligently guide users through creating any type of configuration based on JSON schemas. **One config creator, always AI-supported, fully schema-driven.**

## 🎯 Core Principle

**ONE Unified Config Creator**: There is only **one way** to create configurations - through an **AI-supported, schema-driven interface**. The AI reads schemas, understands what each section needs, captures information from users, asks for missing details, and generates validated configurations.

## 🚀 Key Features

### 🤖 **AI-Supported Schema-Driven Creation**
- **Schema Reading**: AI reads JSON schemas to understand each section
- **Information Capture**: AI captures user requirements through natural conversation
- **Missing Info Detection**: AI identifies what information is missing and asks for it
- **Validation**: AI ensures generated configs match schema requirements exactly
- **Progressive Flow**: AI guides through sections one by one until complete

### 📋 **Schema-Based Architecture**
- **Generic**: Supports ANY configuration type defined in schemas
- **Extensible**: Add new sections by creating schema files only
- **Self-Documenting**: Schemas define descriptions, examples, and validation rules
- **No Hardcoding**: Everything is driven by schema files

### 🎨 **Unified User Experience**
- **Single Interface**: One config creator for all configuration types
- **Conversational**: Natural language interaction with AI
- **Guided**: Step-by-step progression through sections
- **Context-Aware**: AI remembers previous sections and uses context

## 🛠️ Quick Start

```bash
# Clone and setup
git clone <your-repo>
cd AI
npm install

# Set up environment
cp server/env.example server/.env
# Edit server/.env with your OpenAI API key

# Start development
npm run dev  # Runs both frontend and backend

# to test development
node test/runTests.js
```

## 📁 Schema Structure

Each configuration section is defined by a schema file in `server/schemas/`:

```json
{
  "type": "object|string|array",
  "description": "What this section does",
  "title": "Section Name",
  "examples": ["example1", "example2"],
  "documentation": {
    "description": "Detailed explanation",
    "usage": "How to use this section",
    "examples": ["detailed examples"],
    "helperText": "User guidance text"
  },
  "guidedQuestions": [
    {
      "id": "field1",
      "question": "What do you need for this?",
      "type": "string|number|array",
      "suggestions": ["option1", "option2"]
    }
  ],
  "generationLogic": {
    "type": "object|array",
    "description": "How to generate from answers",
    "logic": { /* generation rules */ }
  }
}
```

## 🎯 How It Works

### 1. **Schema Reading**
AI reads schema files to understand:
- What each section does
- What information is required
- What examples are available
- What questions to ask users

### 2. **Information Capture**
AI converses with users to:
- Understand their requirements
- Ask relevant questions from schemas
- Capture missing information
- Validate inputs against schema rules

### 3. **Configuration Generation**
AI generates configurations that:
- Match schema requirements exactly
- Include all required fields
- Follow validation rules
- Use captured information appropriately

### 4. **Progressive Flow**
AI guides users through:
- Required sections first
- Optional sections as needed
- Context-aware suggestions
- Validation and feedback

## 🧱 Core Components

### 1. **Schema System** (`server/schemas/`)
- **Generic schemas**: Define any configuration structure
- **Self-documenting**: Include descriptions, examples, validation
- **AI-readable**: Structured for AI to understand and use
- **Extensible**: Add new sections by creating schema files

### 2. **AI Engine** (`server/routes/generateConfig.js`)
- **Schema-aware**: Reads and understands schemas
- **Context-aware**: Uses previous sections for better generation
- **Validation-aware**: Ensures generated configs are valid
- **Conversation-aware**: Maintains context across sections

### 3. **Unified UI** (`client/src/components/ConfigCreator.js`)
- **Single interface**: One config creator for everything
- **AI-powered**: Always uses AI for guidance
- **Schema-driven**: All information comes from schemas
- **Progressive**: Step-by-step guided experience

### 4. **API Layer** (`server/routes/docs.js`)
- **Schema endpoints**: Provide schema information to AI
- **AI guidance**: Generate prompts and suggestions
- **Context management**: Track progress and relationships
- **Validation**: Ensure all configs are schema-compliant

## 📊 Example Workflow

### User: "I need a trade license service"
1. **AI reads schemas** for module, service, fields, workflow, etc.
2. **AI asks**: "What module name do you want? (e.g., tradelicense)"
3. **User**: "tradelicense"
4. **AI validates** against schema pattern `^[a-z]+$`
5. **AI generates** module config: `"tradelicense"`
6. **AI moves to next section**: "Now let's configure the service name..."
7. **AI continues** until all required sections are complete

### Schema-Driven Intelligence
- **AI knows** what questions to ask from `guidedQuestions`
- **AI validates** inputs against schema patterns
- **AI generates** proper structure from `generationLogic`
- **AI suggests** next steps based on schema relationships

## 🔧 Architecture Benefits

### ✅ **Generic & Extensible**
- Add new configuration types by creating schemas
- No code changes needed for new sections
- AI automatically understands new schemas

### ✅ **AI-Supported Always**
- Every configuration creation uses AI
- AI reads schemas to understand requirements
- AI guides users through complex configurations

### ✅ **Schema-Driven**
- All validation rules come from schemas
- All examples come from schemas
- All guidance comes from schemas

### ✅ **Unified Experience**
- One interface for all configuration types
- Consistent AI guidance across all sections
- Progressive, context-aware flow

## 🎯 Use Cases

### **Any Service Configuration**
- Trade License systems
- Property Tax systems
- Water Tax systems
- Any government service

### **Any Configuration Type**
- Workflow configurations
- Form field definitions
- Billing structures
- Access control rules
- Document requirements
- Business rules

### **Any Complexity Level**
- Simple string configurations
- Complex nested objects
- Array-based configurations
- Multi-step workflows

## 🚀 Getting Started

### 1. **Define Your Schema**
Create schema files in `server/schemas/`:
```json
{
  "type": "object",
  "description": "Your section description",
  "examples": ["example1", "example2"],
  "documentation": {
    "description": "Detailed explanation",
    "helperText": "User guidance"
  }
}
```

### 2. **AI Automatically Understands**
- AI reads your schema
- AI knows what questions to ask
- AI validates user inputs
- AI generates proper configurations

### 3. **Users Create Configurations**
- Users describe what they need
- AI guides them through each section
- AI captures missing information
- AI generates validated configurations

## 🎉 The Result

**ONE unified, AI-supported, schema-driven config creator** that can handle ANY configuration type defined in schemas, with intelligent guidance, validation, and progressive completion.

---

**Core Principle**: Generic + AI-Supported + Schema-Driven = Universal Config Creator 🚀