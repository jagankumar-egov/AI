# 🏗️ System Architecture

## 🎯 Overview

The AI-Powered Service Config Creator follows a **monolithic architecture** with clear separation of concerns, designed for scalability, maintainability, and extensibility.

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client (React + Material-UI)                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Chat UI   │  │ Progress UI │  │ Config UI   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ State Mgmt  │  │ API Client  │  │ Validation  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/JSON
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Server (Express.js)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Generate    │  │ Validate    │  │ Docs        │          │
│  │ Config      │  │ Config      │  │ API         │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ External    │  │ Schema      │  │ Error       │          │
│  │ Services    │  │ Manager     │  │ Handler     │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ OpenAI API
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ OpenAI      │  │ GitHub      │  │ S3/Storage  │          │
│  │ GPT-4       │  │ Integration │  │ Services    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## 🧩 Component Architecture

### 1. **Client Layer**

#### **UI Components**
```
┌─────────────────────────────────────────────────────────────┐
│                    UI Components                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Unified     │  │ Schema      │  │ Chat        │      │
│  │ Config      │  │ Explorer    │  │ Assistant   │      │
│  │ Creator     │  │             │  │             │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Monaco      │  │ Config      │  │ Export      │      │
│  │ Editor      │  │ Preview     │  │ Dialog      │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

#### **State Management**
```
┌─────────────────────────────────────────────────────────────┐
│                    State Management                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Config      │  │ Chat        │  │ Progress    │      │
│  │ Store       │  │ History     │  │ Tracking    │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Validation  │  │ UI State    │  │ Error       │      │
│  │ State       │  │ Management  │  │ State       │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

#### **Services Layer**
```
┌─────────────────────────────────────────────────────────────┐
│                    Services Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ API         │  │ Config      │  │ Health      │      │
│  │ Service     │  │ Service     │  │ Service     │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Validation  │  │ External    │  │ Error       │      │
│  │ Service     │  │ Service     │  │ Handler     │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2. **Server Layer**

#### **API Routes**
```
┌─────────────────────────────────────────────────────────────┐
│                    API Routes                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Generate    │  │ Validate    │  │ Docs        │      │
│  │ Config      │  │ Config      │  │ API         │      │
│  │ Routes      │  │ Routes      │  │ Routes      │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ External    │  │ Health      │  │ Error       │      │
│  │ Service     │  │ Check       │  │ Handler     │      │
│  │ Routes      │  │ Routes      │  │ Routes      │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

#### **Core Services**
```
┌─────────────────────────────────────────────────────────────┐
│                    Core Services                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Schema      │  │ AI          │  │ Validation  │      │
│  │ Manager     │  │ Processor   │  │ Engine      │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Context     │  │ Error       │  │ Logging     │      │
│  │ Manager     │  │ Handler     │  │ Service     │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 3. **Schema Layer**

#### **Schema Organization**
```
┌─────────────────────────────────────────────────────────────┐
│                    Schema Layer                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Base        │  │ Section     │  │ Validation  │      │
│  │ Schemas     │  │ Schemas     │  │ Rules       │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ Metadata    │  │ Examples    │  │ Guided      │      │
│  │ Schemas     │  │ Schemas     │  │ Questions   │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Architecture

### 1. **Configuration Generation Flow**
```
User Input → Intent Detection → Schema Loading → AI Processing → Validation → Response
     │              │               │              │              │           │
     ▼              ▼               ▼              ▼              ▼           ▼
Natural    →  Pattern      →  Schema      →  OpenAI      →  AJV        →  UI
Language      Recognition     Discovery       Processing      Validation     Update
```

### 2. **Multi-Attribute Processing Flow**
```
Multi-Attribute Input → AI Extraction → Schema Mapping → Multi-Section Generation → Validation
         │                    │               │                    │                │
         ▼                    ▼               ▼                    ▼                ▼
"create module    →  AI extracts    →  Map to        →  Generate        →  Validate all
 tradelicence      →  multiple        →  appropriate   →  multiple        →  sections
 and service       →  attributes      →  schemas       →  configurations   →  against
 NewTl"           →  automatically   →  dynamically   →  simultaneously   →  schemas
```

### 3. **Dynamic Progression Flow**
```
User Progress → Completion Count → Interface Adaptation → Quick Commands → Next Section
      │              │                    │                    │              │
      ▼              ▼                    ▼                    ▼              ▼
Section      →  Count completed  →  Show focused    →  Handle quick   →  Move to
completion      →  sections         →  interface        →  commands        →  next step
```

## 🏗️ Component Relationships

### 1. **Client-Server Communication**
```
┌─────────────────┐    HTTP/JSON    ┌─────────────────┐
│     Client      │ ←──────────────→ │     Server      │
│                 │                  │                 │
│  ┌───────────┐  │                  │  ┌───────────┐  │
│  │ React UI  │  │                  │  │ Express   │  │
│  └───────────┘  │                  │  └───────────┘  │
│  ┌───────────┐  │                  │  ┌───────────┐  │
│  │ Zustand   │  │                  │  │ OpenAI    │  │
│  │ Store     │  │                  │  │ API       │  │
│  └───────────┘  │                  │  └───────────┘  │
└─────────────────┘                  └─────────────────┘
```

### 2. **Schema-Driven Architecture**
```
┌─────────────────┐    Schema Files    ┌─────────────────┐
│     Server      │ ←────────────────→ │    Schemas      │
│                 │                    │                 │
│  ┌───────────┐  │                    │  ┌───────────┐  │
│  │ AI        │  │                    │  │ JSON      │  │
│  │ Processor │  │                    │  │ Schema    │  │
│  └───────────┘  │                    │  └───────────┘  │
│  ┌───────────┐  │                    │  ┌───────────┐  │
│  │ Validation│  │                    │  │ Metadata  │  │
│  │ Engine    │  │                    │  │ Schema    │  │
│  └───────────┘  │                    │  └───────────┘  │
└─────────────────┘                    └─────────────────┘
```

### 3. **AI Integration Architecture**
```
┌─────────────────┐    OpenAI API     ┌─────────────────┐
│     Server      │ ←────────────────→ │    OpenAI       │
│                 │                    │                 │
│  ┌───────────┐  │                    │  ┌───────────┐  │
│  │ Prompt    │  │                    │  │ GPT-4     │  │
│  │ Builder   │  │                    │  │ Model     │  │
│  └───────────┘  │                    │  └───────────┘  │
│  ┌───────────┐  │                    │  ┌───────────┐  │
│  │ Response  │  │                    │  │ Rate      │  │
│  │ Parser    │  │                    │  │ Limiting  │  │
│  └───────────┘  │                    │  └───────────┘  │
└─────────────────┘                    └─────────────────┘
```

## 🔧 Technical Architecture

### 1. **Technology Stack**

#### **Frontend**
- **Framework**: React 18
- **UI Library**: Material-UI (MUI)
- **State Management**: Zustand
- **Code Editor**: Monaco Editor
- **HTTP Client**: Axios
- **Build Tool**: Vite

#### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **AI Integration**: OpenAI GPT-4
- **Validation**: AJV (JSON Schema)
- **CORS**: Express CORS
- **Security**: Helmet

#### **External Services**
- **AI**: OpenAI API
- **Version Control**: GitHub API
- **Storage**: AWS S3 (planned)
- **Monitoring**: Custom logging

### 2. **Data Architecture**

#### **Schema Storage**
```
server/schemas/
├── index.js              # Schema management
├── module.json           # Module schema
├── service.json          # Service schema
├── fields.json           # Fields schema
├── workflow.json         # Workflow schema
├── bill.json             # Billing schema
├── payment.json          # Payment schema
├── access.json           # Access control schema
├── rules.json            # Business rules schema
├── calculator.json       # Calculator schema
├── documents.json        # Documents schema
├── pdf.json             # PDF generation schema
├── applicant.json        # Applicant schema
├── boundary.json         # Boundary schema
├── localization.json     # Localization schema
└── notification.json     # Notification schema
```

#### **State Management**
```
client/src/stores/
├── configStore.js        # Configuration state
├── chatStore.js          # Chat history state
├── progressStore.js      # Progress tracking
└── validationStore.js    # Validation state
```

### 3. **API Architecture**

#### **RESTful Endpoints**
```
/api/
├── generate-config/      # Configuration generation
├── validate-config/      # Configuration validation
├── docs/                # Documentation and guidance
└── external-service/     # External service integration
```

#### **Response Patterns**
```javascript
// Success Response
{
  success: true,
  data: { /* response data */ },
  timestamp: "2024-01-15T10:30:00.000Z"
}

// Error Response
{
  error: "Error Type",
  message: "Error description",
  details: { /* error details */ }
}
```

## 🔒 Security Architecture

### 1. **Input Validation**
- Schema-based validation
- Type checking
- Size limits
- Sanitization

### 2. **API Security**
- CORS configuration
- Rate limiting
- Input sanitization
- Error message sanitization

### 3. **AI Security**
- Prompt injection prevention
- Output validation
- Rate limiting
- Error handling

## 📈 Scalability Architecture

### 1. **Horizontal Scaling**
- Stateless server design
- Session management in client
- No server-side state dependencies
- Easy horizontal scaling

### 2. **Performance Optimization**
- Schema caching
- Response compression
- Efficient validation
- Minimal network requests

### 3. **AI Scalability**
- Async AI processing
- Request queuing
- Rate limiting
- Fallback mechanisms

## 🧪 Testing Architecture

### 1. **Test Layers**
```
┌─────────────────┐
│   E2E Tests     │  User workflows
├─────────────────┤
│ Integration     │  API integration
│ Tests           │
├─────────────────┤
│   Unit Tests    │  Component tests
├─────────────────┤
│ Schema Tests    │  Schema validation
└─────────────────┘
```

### 2. **Test Coverage**
- **API Endpoints**: 100%
- **Schema Validation**: 100%
- **AI Processing**: 90%
- **UI Components**: 85%
- **User Flows**: 80%

## 🚀 Deployment Architecture

### 1. **Development Environment**
```
┌─────────────────┐    ┌─────────────────┐
│   Client        │    │   Server        │
│   (Port 3000)   │    │   (Port 3001)   │
└─────────────────┘    └─────────────────┘
```

### 2. **Production Environment**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load          │    │   Application   │    │   Database      │
│   Balancer      │    │   Servers       │    │   (Future)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

**System Architecture**: Comprehensive architecture design for the AI-Powered Service Config Creator. 