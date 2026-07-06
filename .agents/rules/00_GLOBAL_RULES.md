---
trigger: always_on
---

# 00_GLOBAL_RULES.md: Governance Constitution & The 7 Engineering Principles

## 1. No Direct Coding Without an Implementation Plan
* The AI is strictly forbidden from writing any code or creating new files without first presenting a document containing:
  1. **Implementation Plan:** Step-by-step breakdown of the execution.
  2. **Design Justification:** Architectural explanation of why this specific approach was chosen.
  3. **Risk Review:** Potential side effects or edge cases and how to mitigate them.
* No coding or file creation shall begin until the AI receives an explicit "Approved" from the human System Architect.

## 2. Strict Adherence to the Vanilla Stack (No Frameworks)
* **Frontend:** It is strictly prohibited to use any modern frontend frameworks or libraries (e.g., React, Vue, Angular). All UI code must be written exclusively in raw, Vanilla HTML, CSS, and JavaScript.
* **Backend:** All server-side logic must be handled exclusively via Netlify Serverless Functions.

## 3. Separation of Concerns
* A clear, uncompromised separation between the three system layers must be maintained at all times:
  * **UI Layer (Frontend):** Responsible solely for presentation and user interaction. It must contain zero business logic.
  * **Functions Layer (Serverless Backend):** Responsible for business logic, data validation, and secure execution.
  * **Database Layer (Storage):** Responsible strictly for structured data storage and retention.
* Mixing presentation logic with server logic is completely prohibited.

## 4. Mandatory Architectural Decision Logging (ADR)
* Every technical choice, data flow adjustment, or newly approved phase plan must be documented immediately and formatly in the `06_DECISIONS.md` file.
* Each entry must include: the decision made, the rationale behind the choice, and a comparison with rejected alternatives.

## 5. Forced Analysis Before Execution (Analysis First)
* The AI must never jump straight into providing code or quick fixes when presented with a problem or task.
* The AI must first analyze the problem, break it down structurally, and divide it into clear, incremental logical steps before proposing any code.

## 6. Comprehensive Root Cause Analysis for Errors
* When an error or system failure occurs, the AI is forbidden from providing a superficial patch or quick fix.
* The error must be handled through three consecutive phases:
  1. **Error Explanation:** Clear description of what failed.
  2. **Root Cause Analysis:** Technical explanation of why it failed at an architectural level.
  3. **Remediation Plan:** A permanent solution to prevent recurrence, along with instructions for the user to document it in `11_TROUBLESHOOTING.md`.

## 7. No Unstated Assumptions (Strict Scope Adherence)
* The AI must never invent requirements, add unrequested features, or build extra functionalities not explicitly dictated by the human System Architect.
* Strictly adhere to the requested scope of work to prevent scope creep and environment pollution.