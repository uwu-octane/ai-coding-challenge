# Multi-Agent Customer Support System

## 🧩 Overview

This project is an exercise to build an **automated customer support system** using multiple collaborating agents.  
The system consists of **three specialized agents** that work together to intelligently process customer requests.

---

## ⚙️ System Architecture

### **Agent 1: Router Agent**

- **Task:** Classifies incoming customer queries into one of three categories:
  - `technical`
  - `billing`
  - `general`
- **Output:** Category + forwarded query

---

### **Agent 2: Knowledge Agent**

- **Task:** Answers questions based on FAQ data.
- **Possible approaches:**
  - Embedding FAQ data directly into the system prompt
  - Using a tool call to read from `faq_data.json`
  - String match or keyword-based search
- **Input:** Question + category (from Router Agent)

---

### **Agent 3: Action Agent**

- **Task:** Simulates support actions via mock functions.
- **Available actions:**
  - `create_ticket`
  - `check_status`
  - `escalate`
- **Output:** Structured action confirmation

---

## 🔄 Example Workflow

**User input:**

> “My invoice is incorrect, can you please check it?”

**Flow:**

1. **Router Agent →** Classifies as `billing`
2. **Knowledge Agent →** Looks up related FAQ entries for billing
3. **Action Agent →** Calls `create_ticket("billing_dispute")`
4. **System Output →**  
   `"Ticket #123 created. The billing team will contact you within 24 hours."`

**Overall process:**  
`User Query → Router Agent → Knowledge/Action Agent → Response`

---

## 🧰 Provided Resources

```
support_data/
├── faq_data.json         # Predefined Q&A by category
└── test_queries.txt      # Example user queries
```

---

## ☁️ Infrastructure

- OpenAI API key (test budget provided)
- Evaluation script for automated test cases

---

## 📦 Deliverables

- Source code (GitHub repo or ZIP file)
- **README.md** (max one page setup guide)
- CLI demo (3–5 example queries) - if you want to build a frontend, feel free, but a CLI demo is sufficient

---

## 🧠 Evaluation Criteria

| Aspect                     | Description                                        |
| -------------------------- | -------------------------------------------------- |
| **Agent Communication**    | How effectively agents exchange information        |
| **Workflow Orchestration** | How decisions are made about which agent acts next |
| **Message Passing**        | How agent-to-agent messages are structured         |

---

## ✅ Core Features

- Focus on **agent coordination** and **message passing**
- Uses simple data structures (`JSON`, `dict`)
- Works with **static mock data**
- Defines clear **roles and responsibilities** per agent

> The main focus is **architecture and collaboration**, not complex agent intelligence.

---

## 💬 Notes

Questions during implementation are **encouraged**!
