# Service Configuration Assistant Requirements

This document outlines the requirements for an interactive, chat‑assisted AI agent that guides users through the end‑to‑end service configuration process, section by section, without losing context between steps.

## 1. Goals and Overview
- Provide a conversational UI (chat) to configure services via natural language.
- Retain context across the entire configuration session so users can move forward or back without repeating information.
- Break the configuration flow into discrete sections matching the underlying schema (e.g., Basics, Workflow, ID Generation, Documents, Billing, Inbox, Rules, Localization, Access Control, Calculator, Search, UI Information, Notifications).
- Give real‑time hints, examples, and validation feedback based on each section’s requirements and schema metadata.

## 2. Core Requirements

### 2.1 Chat Interface
- A floating or embedded chat widget accessible from the service configuration UI.
- Multi‑turn conversation state stored per session, covering all sections.
- Ability to revisit or adjust previous answers without losing subsequent context.

### 2.2 Section‑by‑Section Flow
For each configuration section:
1. The AI agent prompts the user with section‑specific questions (e.g., “What is your module name?” for Basics).
2. Provide inline examples or default samples drawn from the schema metadata (helper.json).
3. Accept and validate user inputs against schema rules.
4. Confirm and summarize the collected inputs before proceeding to the next section.

### 2.3 Context Management
- Maintain a single conversation context so that prior section answers can influence or pre‑populate later sections.
- Store a partial JSON config object as the user progresses.
- Provide commands to list current configuration state, edit specific sections, or restart the flow.

### 2.4 AI‑Driven Suggestions
- Use OpenAI’s GPT model (via chatAssist or generateConfigFromPrompt) to:
  - Suggest valid formats, field values, or naming conventions.
  - Explain schema properties and constraints in simple terms.
  - Offer examples based on existing sample configurations.
- Enforce refusals when user asks outside the defined schema context.

## 3. Integration Points

| Component                   | Role                                                                 |
|-----------------------------|----------------------------------------------------------------------|
| server/openai.js            | chatAssist() & generateConfigFromPrompt() implementations             |
| server/assets/helper.json   | Section metadata (questions, examples, hints)                         |
| server/serviceConfigSchema.json | JSON schema for validating merged configuration                  |
| server/index.js             | REST endpoints `/chat-assist` and `/generate-config`                 |
| client/src/App.jsx          | Chat widget and config‑generation UI                                 |

## 4. Error Handling & Validation
- Immediately validate each user input against JSON schema constraints.
- Provide clear error messages and correction hints for invalid entries.
- If the AI model drifts, fall back to refusal messages or re‑prompt the user.

## 5. UX Considerations
- Display the current section name and progress indicator.
- Allow “help” commands in chat to re‑show instructions or examples.
- Highlight required fields and section descriptions.
- Offer a “review” command to dump the current config JSON at any time.

---
_End of requirements_
