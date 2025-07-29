# 🧠 Service Config Generator AI

An AI-powered, **stateless tool** that transforms natural language input and structured prompts into modular `serviceConfig.json` files. Built for schema-driven applications with **no persistent storage** — everything is managed in-browser or passed via API.

# 🛠️ Generic Config Creator App & Service

This project provides a configurable, extensible platform for generating, editing, validating, and exploring JSON-based configuration files. The system is **modular**, **UI-driven**, and powered by **OpenAI** with real-time schema validation.

---

## 🌟 Goal

To enable teams to:

* Create structured config files for services like workflow, billing, forms, and access control
* Interact with **schema-driven UI** or generate config from structured prompts
* Validate config against **modular schemas**
* Avoid persistent backend storage — everything is stored in **sessionStorage**
* Export or integrate config with **external services** like GitHub or S3

---

## 🧱 Core Components

### 1. 💻 Frontend UI (React + Material UI)

* **Stepper-based UI**: each step represents one section of the config
* Toggle config **sections** (modular)
* Fill or edit config via:

  * JSON Schema-driven **form editor**
  * **Monaco editor** for raw JSON
* OpenAI-powered **structured prompt builder**
* Live **validation and preview**
* Export config as `.json`
* Stores session data in `sessionStorage` (no server-side state)

### 2. ⚙️ Backend Service (Node.js / Express)

A **stateless proxy** API:

* `POST /generate-config` — Convert structured user input into valid config
* `POST /validate-config` — Validate config against schema
* `GET /docs/:section` — Return section-specific schema docs & examples
* `POST /external-service` (optional) — Send config to GitHub, S3, etc.

### 3. 🤖 OpenAI Integration

* Uses Chat Completions API to generate JSON config from **structured inputs**
* Prompt driven by:

  * Schema metadata
  * Section-specific examples
* Stateless: Prompts and schema are passed in real-time; no history or memory retained

---

## 📎 Modular Config Structure

Each `serviceConfig` file is composed of modular, optionally enabled sections:

```json
{
  "serviceName": "TradeLicense",
  "enabledSections": ["workflow", "form"],
  "workflow": {
    "states": [
      {
        "state": "DRAFT",
        "roles": ["CITIZEN"],
        "actions": [{ "action": "SUBMIT", "nextState": "REVIEW" }]
      },
      {
        "state": "REVIEW",
        "roles": ["CLERK"],
        "actions": [{ "action": "APPROVE", "nextState": "APPROVED" }]
      }
    ]
  },
  "form": {
    "fields": [
      {
        "label": "Applicant Name",
        "name": "applicantName",
        "type": "text",
        "required": true
      },
      {
        "label": "Mobile Number",
        "name": "mobileNumber",
        "type": "mobile",
        "validation": { "pattern": "^[0-9]{10}$" }
      }
    ]
  }
}
```

---

## 🧬 Schema Structure

```
config-schema/
├── index.schema.json             # Main schema
├── workflow.schema.json
├── form.schema.json
├── billing.schema.json
├── accessControl.schema.json
```

Each schema is standalone and used by both the form UI and backend validator.

---

## 🔗 API Endpoints

### `POST /generate-config`

Structured prompt-to-config generation:

```json
{
  "section": "workflow",
  "details": {
    "states": [
      {
        "name": "DRAFT",
        "roles": ["CITIZEN"],
        "actions": [
          { "action": "SUBMIT", "nextState": "REVIEW" }
        ]
      }
    ]
  }
}
```

### `POST /validate-config`

Validate a config file against a schema:

```json
{
  "config": { ... }
}
```

Response:

```json
{
  "valid": true,
  "errors": []
}
```

### `GET /docs/:section`

Returns:

* Schema definition
* Required fields
* Example config snippets
* Prompting instructions

### `POST /external-service` (optional)

Sends final validated config to:

* GitHub (via PR or commit)
* S3 bucket
* Other API

---

## 🧠 AI Prompt Logic

* Prompts are **structured**, not plain natural language
* Inputs include:

  * Section name
  * Field details
  * Roles, states, actions, etc.
  * Schema reference
* Designed to guide LLM safely within schema rules

---

## 📂 Project Structure

```
config-creator/
├── backend/
│   └── routes/
│       ├── generateConfig.js
│       ├── validateConfig.js
│       ├── docs.js
│       └── externalService.js
├── frontend/
│   └── src/
│       ├── components/
│       ├── editors/
│       ├── prompts/
│       └── steppers/
├── config-schema/
│   └── *.schema.json
└── README.md
```

---

## 🕹️ GitHub Actions

CI/CD for Docker-based deployment:

```yaml
name: Build & Deploy

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Docker
        uses: docker/setup-buildx-action@v2
      - name: Build Backend Image
        run: docker build -t config-backend ./backend
      - name: Build Frontend Image
        run: docker build -t config-frontend ./frontend
```

---

## 🔐 Session Handling

* No database or file storage
* Config lives in `sessionStorage` only
* Reset on tab/browser close
* Export as `.json` supported

---

## 🗺️ Roadmap

* Schema version management
* Diff viewer for config comparison
* CLI for headless validation
* GitHub/GitLab integration (via `POST /external-service`)
* Access control per section

---

## ✅ Compatible With Any JSON Schema-Based System

As long as:

* Each section has a valid schema
* Inputs are well-structured (not raw natural language)
* Sections are modular and independently generatable

This system can generate:

* API test plans
* CI/CD pipelines
* ML model config
* Form or UI layouts

---

## ❌ Limitations

| Challenge                  | Mitigation                          |
| -------------------------- | ----------------------------------- |
| Cross-section dependencies | Generate as a whole or define links |
| YAML-only config systems   | Convert to JSON                     |
| Highly dynamic config      | Use plugins or helper fields        |
| Large/complex schemas      | Provide schema UI hints             |

---

## 🔮 Summary

| Feature                       | Supported |
| ----------------------------- | --------- |
| JSON-schema config generation | ✅         |
| Stateless proxy backend       | ✅         |
| Schema-based validation (AJV) | ✅         |
| Config section docs explorer  | ✅         |
| GitHub Actions integration    | ✅         |
| YAML-only output              | ❌         |

---

## 📄 License

**MIT License** — Built with ❤️ to simplify config generation for modern platforms.

---

Let me know if you want help adding more schema sections or a bootstrap for ML, CI/CD, or analytics config generators.



✅ Minimum Requirements for Compatibility
Each config section has a JSON Schema
The schema must define:

Structure

Data types

Required fields

Nested objects/arrays (if needed)

The system receives modular schemas in a compatible directory like:

pgsql
Copy
Edit
config-schema/
├── index.schema.json
├── <section>.schema.json
Each section is independently generatable

For example: form, workflow, accessControl, notifications, etc.

They must not depend on another section’s internal values at generation time

🎯 What Makes It Generic
Schema-driven form UI
→ Auto-generates form fields using @rjsf, react-jsonschema-form, or your custom builder

Monaco JSON editor
→ Shows editable config per section

AJV validator
→ Plug in any schema and validate runtime config

OpenAI prompt injection
→ Uses system-level examples and schema introspection to guide completions

🔄 How to Extend It to Other Config Systems
Let’s say you’re building config generators for:

🧪 API Test Suites
→ JSON schema of test scenarios, endpoints, headers, assertions

🧬 ML Pipelines
→ JSON config with steps, models, datasets, hyperparams

🧰 CI/CD Templates
→ JSON/YAML-like config for GitHub Actions, GitLab, CircleCI

You simply:

Add each section’s schema to config-schema/

Provide optional examples for GET /docs/:section

Update the prompt builder UI for that section (or use generic one)

❌ Limitations (To Be Aware Of)
Challenge	Solution/Workaround
Highly cross-dependent schemas	Ensure generation happens section-wise or build a combined generator model
Non-JSON-based config (e.g. YAML)	Convert schema to JSON format or use a converter
Deeply dynamic values	Use UI-bound rules or plugin-style validation
UI usability with complex schemas	Provide optional UI hints or override templates

🧪 Summary
Feature	Supported
Any config with valid JSON Schema	✅
Plug-and-play section schemas	✅
Reusable validator	✅
Prompt-based config generation	✅
Schema docs + prompt explorer	✅
YAML or XML formats	❌ (requires adapter)

✅ Yes, it works for any JSON-schema-driven config system.
Just provide the schema, and the rest (UI, AI, validation) is reusable with little or no change.

Let me know if you'd like a scaffold template for a new config domain (e.g., CI/CD or ML pipeline).