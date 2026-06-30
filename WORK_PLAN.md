# LexisAI Work Plan & Roadmap

This document outlines the tasks, timeline, current status, and scientific references for the development of LexisAI: Enterprise-Grade AI Legal Assistant.

---

## 📅 Project Work Plan

| # | Task Name | Status | Target Date | Key Deliverables & Focus |
|---|---|---|---|---|
| 1 | **Literature Review** | Planned | May 15, 2026 | Review legal LLM benchmarks, RAG architectures, and citation methods (e.g., Legal-BERT, dense vs. sparse vector search). |
| 2 | **Requirements Analysis** | Completed | May 22, 2026 | Documented jurisdictional scope (US, Saudi Arabia, Nigeria, Egypt), RTL/Arabic localization, security constraints, and compliance requirements. |
| 3 | **System Architecture Design** | Completed | June 5, 2026 | Modeled database schema (PostgreSQL for users/sessions, Redis for caching), API specs (REST & WebSockets), and fine-tuning skeleton pipeline. |
| 4 | **Frontend Development** | In Progress | July 10, 2026 | Polishing dynamic theming (Light/Dark), RTL language localization switcher in Expo, and adding document upload UI components. |
| 5 | **FastAPI Backend Development** | Completed | July 8, 2026 | Developed and deployed the core session API gateway, database repos, users/sessions routes, and WebSockets chat gateway. |
| 6 | **Document Processing Module** | Planned | July 5, 2026 | Design and implement Python-based parsing scripts for PDFs/legal contracts and hierarchical paragraph chunking logic. |
| 7 | **Embedding Pipeline** | Planned | July 12, 2026 | Set up local embedding generation (e.g., using `nomic-embed-text` or SentenceTransformers) and database indexing (pgvector). |
| 8 | **Retrieval System** | Planned | July 18, 2026 | Implement hybrid search (vector search + keyword BM25), reranking, and jurisdiction-based metadata filtering. |
| 9 | **LLM Integration** | In Progress | June 25, 2026 | Integrating Ollama `llama3.2` local LLM and prompt templates for RAG context injection and context window management. |
| 10 | **Citation Generation** | Planned | July 22, 2026 | Create source-attribution mechanism to map generated answer segments back to raw document paragraphs. |
| 11 | **Security Layer** | In Progress | July 25, 2026 | Standard JWT flow and bcrypt password hashing are complete. Implementing rate limiting, CORS safeguards, and document access ACLs. |
| 12 | **Testing** | In Progress | July 28, 2026 | Writing unit and integration tests (using Pytest) for authentication endpoints, WebSocket gates, and document pipelines. |
| 13 | **Performance Evaluation** | Planned | August 3, 2026 | Measure LLM latency, token-generation rates, and evaluate RAG responses using parameters like faithfulness and relevance. |
| 14 | **Documentation** | In Progress | August 7, 2026 | Writing API references (Swagger), local setup instructions (`README.md` updates), and fine-tuning guides. |
| 15 | **Final Presentation** | Planned | August 14, 2026 | Create system demos (Arabic & English consultations) and compile latency and accuracy performance metrics. |

---

## 📚 References

The following research papers, documentation sources, and system standards guide the implementation of each milestone:

### 1. RAG & Information Retrieval Architecture
*   **Lewis, P., et al. (2020).** *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.* NeurIPS. [arXiv:2005.11401](https://arxiv.org/abs/2005.11401)
    *   *Application:* Core architecture framework for routing context from pgvector to Ollama.
*   **Robertson, S., & Zaragoza, H. (2009).** *The Probabilistic Relevance Framework: BM25 and Beyond.* Foundations and Trends in Information Retrieval.
    *   *Application:* Hybrid retrieval logic combined with vector embeddings.

### 2. Legal NLP & Domain Adaptation
*   **Chalkidis, I., et al. (2020).** *LEGAL-BERT: The Muppets straight out of Law School.* Findings of EMNLP. [arXiv:2010.02559](https://arxiv.org/abs/2010.02559)
    *   *Application:* Pre-training and fine-tuning protocols for legal text representations.
*   **Ollama API Documentation.** [Ollama GitHub Docs](https://github.com/ollama/ollama/blob/main/docs/api.md)
    *   *Application:* Integration pattern for standard generation and chat models.

### 3. LLM Hallucinations & Citations
*   **Huang, L., et al. (2023).** *A Survey on Hallucination in Large Language Models.* [arXiv:2311.05232](https://arxiv.org/abs/2311.05232)
    *   *Application:* Designing instruction prompt contexts to keep LLM responses strictly bounded.
*   **Gao, Y., et al. (2023).** *Retrieval-Augmented Generation for Large Language Models: A Survey.* [arXiv:2312.10997](https://arxiv.org/abs/2312.10997)
    *   *Application:* Source-to-text mapping and rendering interactive citation linkages in UI.

### 4. System Standards & Engineering
*   **ISO/IEC/IEEE 29148:2018.** *Systems and software engineering — Life cycle processes — Requirements engineering.*
    *   *Application:* Formatting and refining software constraints and interface specs.
*   **Ragas Evaluation Framework.** [Ragas Documentation](https://github.com/explodinggradients/ragas)
    *   *Application:* Standard metrics for evaluating faithfulness, answer relevance, and context recall.
