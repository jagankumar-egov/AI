# Service Configuration Generator - Developer Documentation

## 🎯 **Complete Application Flow**

### 📍 **1. Application Entry Points**

There are **3 ways** to start the application:

#### **A. Welcome Screen (Default)**
- **URL**: `http://localhost:3000/`
- **When**: No existing configuration
- **Shows**: Welcome card with "Create New Configuration" button
- **Action**: Click → Navigate to `/create`

#### **B. Header Navigation**
- **URL**: `http://localhost:3000/create`
- **Direct Access**: "Create New" button in header
- **Action**: Multi-step form to create configuration

#### **C. Direct Stepper Access**
- **URL**: `http://localhost:3000/` (with existing config)
- **When**: Configuration already exists
- **Shows**: Configuration stepper directly

---

### 🏗️ **2. Configuration Creation Flow**

#### **Step 1: Basic Information**
```
Service Name: "Trade License"
Description: "Online trade license application system"
```

#### **Step 2: Module & Service Details**
```
Module: "tradelicence"
Service: "TradeLicense"
```

#### **Step 3: Service Category**
```
Category: "licensing" (Government Service, Utility, etc.)
```

#### **Step 4: Initial Configuration**
```
Business Service: "TradeLicense"
SLA: 72 (hours)
```

#### **Result**: Creates comprehensive initial configuration with pre-configured sections

---

### ⚙️ **3. Configuration Processing**

#### **A. Server-Side Schema System**
```
server/schemas/
├── index.js              # Main configuration & metadata
├── module.json           # Module schema
├── service.json          # Service schema
├── fields.json           # Fields schema
├── workflow.json         # Workflow schema
├── bill.json            # Billing schema
└── ... (16 total files)
```

#### **B. Schema Loading Process**
1. **Client Request**: `GET /api/docs/section-order`
2. **Server Response**: Returns order and required sections
3. **Client Request**: `GET /api/docs` 
4. **Server Response**: Returns all available sections
5. **Client Processing**: Orders sections based on server configuration

#### **C. Required vs Optional Sections**
```javascript
// Required (Auto-enabled, cannot disable)
- module: "tradelicence"
- service: "TradeLicense" 
- fields: [form fields array]
- idgen: {format: "TL/{YYYY}/{MM}/{DD}/{SEQUENCE}"}

// Optional (User can enable/disable)
- workflow: {states: [], business: "TradeLicense"}
- bill: {taxHead: [], taxPeriod: []}
- payment: {gateway: "PAYTM"}
- access: {roles: ["CITIZEN", "EMPLOYEE"]}
- rules: {validation: []}
- calculator: {formula: "baseAmount * taxRate"}
- documents: {required: []}
- pdf: [{key: "certificate", type: "certificate"}]
- applicant: {type: "INDIVIDUAL", fields: []}
- boundary: {lowestLevel: "WARD", hierarchyType: "ADMIN"}
- localization: {language: "en_IN", currency: "INR"}
- notification: {channels: ["SMS", "EMAIL"]}
```

---

### 🎨 **4. UI Configuration Flow**

#### **A. Section-by-Section Configuration**
```
1. Module (Required) → String: "tradelicence"
2. Service (Required) → String: "TradeLicense"  
3. Fields (Required) → Array: Form fields with validation
4. ID Generation (Required) → Object: ID format patterns
5. Workflow (Optional) → Object: States and transitions
6. Billing (Optional) → Object: Tax heads and periods
7. Payment (Optional) → Object: Gateway settings
8. Access (Optional) → Object: Roles and permissions
9. Rules (Optional) → Object: Business rules
10. Calculator (Optional) → Object: Fee calculations
11. Documents (Optional) → Object: Required uploads
12. PDF (Optional) → Array: Certificate templates
13. Applicant (Optional) → Object: Applicant types
14. Boundary (Optional) → Object: Geographic boundaries
15. Localization (Optional) → Object: Language settings
16. Notification (Optional) → Object: Notification templates
```

#### **B. Section Configuration Options**
Each section can be configured in **3 ways**:

1. **AI Generation**: 
   - Enter description → AI generates configuration
   - Example: "Create a trade license workflow with 3 states"

2. **Schema Form**: 
   - Guided form based on JSON schema
   - Example: Fill out form fields with validation rules

3. **JSON Editor**: 
   - Direct JSON editing with Monaco editor
   - Example: Write raw JSON configuration

---

### 🤖 **5. AI Integration Flow**

#### **A. AI Generation Process**
```
1. User Input: "Create a trade license workflow"
2. Client Request: POST /api/generate-config
   {
     section: "workflow",
     details: "Create a trade license workflow"
   }
3. Server Processing:
   - Loads workflow schema
   - Builds AI prompt
   - Calls OpenAI API
   - Validates response
4. Server Response: Generated workflow configuration
5. Client Update: Updates configuration in store
```

#### **B. AI Prompt Structure**
```javascript
// Server builds this prompt:
`Generate a valid JSON configuration for the "workflow" section based on:
Schema: {workflow schema}
User Details: "Create a trade license workflow"
Requirements: Return only valid JSON matching schema`
```

---

### 💾 **6. State Management Flow**

#### **A. Zustand Store Structure**
```javascript
const useConfigStore = create((set) => ({
  // Configuration data
  config: {},
  serviceName: '',
  
  // UI state
  enabledSections: [],
  validationErrors: {},
  
  // Actions
  setConfig: (config) => set({ config }),
  addSection: (section) => set((state) => ({
    config: { ...state.config, [section]: {} }
  })),
  updateSection: (section, data) => set((state) => ({
    config: { ...state.config, [section]: data }
  }))
}));
```

#### **B. Data Persistence**
- **Session Storage**: Configuration persists during browser session
- **Export Options**: JSON, YAML, GitHub, S3

---

### 📤 **7. Export & Completion Flow**

#### **A. Export Options**
```
1. Download JSON: Direct download of configuration
2. Download YAML: Converted YAML format
3. Export to GitHub: Commit to repository
4. Export to S3: Upload to AWS S3
```

#### **B. Final Configuration Structure**
```json
{
  "serviceName": "Trade License",
  "module": "tradelicence",
  "service": "TradeLicense",
  "fields": [
    {
      "name": "applicantName",
      "label": "Applicant Name",
      "type": "text",
      "required": true
    }
  ],
  "workflow": {
    "states": [
      {
        "state": "INITIATED",
        "isStartState": true,
        "actions": [
          {
            "action": "SUBMIT",
            "nextState": "PENDING_VERIFICATION",
            "roles": ["CITIZEN"]
          }
        ]
      }
    ]
  },
  "bill": {
    "taxHead": [
      {
        "code": "TL_FEE",
        "name": "Trade License Fee",
        "isRequired": true
      }
    ]
  }
  // ... other sections
}
```

---

### 🎯 **8. Complete User Journey**

```
1. START: User visits http://localhost:3000/
   ↓
2. WELCOME: Sees "Create New Configuration" card
   ↓
3. CREATE: Clicks → Goes to 4-step creation form
   ↓
4. CONFIGURE: Enters basic details (name, module, service, category)
   ↓
5. INITIALIZE: System creates pre-configured sections
   ↓
6. STEPPER: Navigates to section-by-section configuration
   ↓
7. CONFIGURE SECTIONS: User configures each section (AI/Form/JSON)
   ↓
8. VALIDATE: System validates each section against schema
   ↓
9. PREVIEW: User sees live JSON preview
   ↓
10. EXPORT: User exports final configuration
    ↓
11. COMPLETE: Configuration ready for deployment
```

---

## 🏗️ **Architecture Overview**

### **Frontend (React)**
```
client/
├── src/
│   ├── components/
│   │   ├── CreateConfig.js      # Configuration creation form
│   │   ├── ConfigStepper.js     # Section-by-section configuration
│   │   ├── SectionForm.js       # Individual section configuration
│   │   ├── SchemaForm.js        # Schema-driven forms
│   │   ├── MonacoEditor.js      # JSON editor
│   │   ├── ConfigPreview.js     # Live JSON preview
│   │   ├── ExportDialog.js      # Export options
│   │   ├── SchemaExplorer.js    # Schema documentation
│   │   ├── ChatAssistant.js     # AI chat interface
│   │   └── Header.js            # Navigation header
│   ├── stores/
│   │   └── configStore.js       # Zustand state management
│   ├── services/
│   │   └── api.js              # API communication
│   └── App.js                   # Main application
```

### **Backend (Node.js/Express)**
```
server/
├── routes/
│   ├── generateConfig.js        # AI configuration generation
│   ├── validateConfig.js        # Schema validation
│   ├── docs.js                  # Schema documentation
│   └── externalService.js       # GitHub/S3 integration
├── schemas/
│   ├── index.js                 # Schema configuration
│   ├── module.json              # Module schema
│   ├── service.json             # Service schema
│   ├── fields.json              # Fields schema
│   ├── workflow.json            # Workflow schema
│   ├── bill.json                # Billing schema
│   ├── payment.json             # Payment schema
│   ├── access.json              # Access control schema
│   ├── rules.json               # Business rules schema
│   ├── calculator.json          # Calculator schema
│   ├── documents.json           # Documents schema
│   ├── pdf.json                 # PDF generation schema
│   ├── applicant.json           # Applicant schema
│   ├── boundary.json            # Boundary schema
│   ├── localization.json        # Localization schema
│   └── notification.json        # Notification schema
└── index.js                     # Main server
```

---

## 🔧 **Development Guide**

### **Prerequisites**
- Node.js 16+
- npm or yarn
- OpenAI API key

### **Setup**
```bash
# Clone repository
git clone <repository-url>
cd AI

# Install dependencies
npm run install:all

# Set up environment variables
cp server/env.example server/.env
# Edit server/.env with your OpenAI API key

# Start development servers
npm run dev
```

### **Environment Variables**
```bash
# Server (.env)
PORT=3001
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key
CLIENT_URL=http://localhost:3000
GITHUB_TOKEN=your_github_token
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
LOG_LEVEL=debug
```

### **Available Scripts**
```bash
# Install dependencies
npm run install:all
npm run server:install
npm run client:install

# Development
npm run dev              # Start both servers
npm run server:dev       # Start server only
npm run client:dev       # Start client only

# Build
npm run build            # Build for production
npm run start            # Start production build

# Testing
npm run test             # Run tests
```

---

## 🚀 **Key Features**

### **1. Server-Driven Architecture**
- All configuration comes from server schemas
- Centralized schema management
- Configurable section order and requirements

### **2. AI-Powered Generation**
- Natural language to configuration
- OpenAI GPT-4 integration
- Schema-validated AI responses

### **3. Multiple Configuration Methods**
- AI generation with natural language
- Schema-driven forms
- Direct JSON editing

### **4. Real-time Validation**
- JSON Schema validation
- Live error reporting
- Type safety enforcement

### **5. Comprehensive Export**
- JSON download
- YAML conversion
- GitHub integration
- AWS S3 upload

### **6. Modern UI/UX**
- Material-UI components
- Responsive design
- Real-time preview
- Intuitive navigation

---

## 📚 **API Documentation**

### **Core Endpoints**

#### **GET /api/docs**
Returns all available configuration sections.

#### **GET /api/docs/section-order**
Returns the configurable order and required sections.

#### **GET /api/docs/:section**
Returns documentation for a specific section.

#### **GET /api/docs/:section/schema**
Returns JSON schema for a specific section.

#### **GET /api/docs/:section/examples**
Returns examples for a specific section.

#### **POST /api/generate-config**
Generates configuration using AI.

**Request:**
```json
{
  "section": "workflow",
  "details": "Create a trade license workflow with 3 states"
}
```

**Response:**
```json
{
  "success": true,
  "section": "workflow",
  "config": {
    "states": [
      {
        "state": "INITIATED",
        "isStartState": true,
        "actions": [
          {
            "action": "SUBMIT",
            "nextState": "PENDING_VERIFICATION",
            "roles": ["CITIZEN"]
          }
        ]
      }
    ]
  }
}
```

#### **POST /api/validate-config**
Validates configuration against schema.

#### **POST /api/external-service/github**
Exports configuration to GitHub.

#### **POST /api/external-service/s3**
Exports configuration to AWS S3.

---

## 🧪 **Testing**

### **Unit Tests**
```bash
npm run test
```

### **API Tests**
```bash
npm run test:api
```

### **Integration Tests**
```bash
npm run test:integration
```

---

## 🚀 **Deployment**

### **Development**
```bash
npm run dev
```

### **Production**
```bash
npm run build
npm run start
```

### **Docker**
```bash
docker-compose up
```

---

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

## 📄 **License**

This project is licensed under the MIT License.

---

## 🆘 **Support**

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API documentation

---

This documentation provides a comprehensive overview of the Service Configuration Generator application, its architecture, development process, and usage patterns. 