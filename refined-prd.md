# PRODUCT REQUIREMENTS DOCUMENT

## EXECUTIVE SUMMARY

*   **Product Vision:** To create a conversational AI assistant named Helios that empowers users to gain insights from their uploaded data through a simple chat interface. The system will eventually evolve into an agentic platform capable of autonomous data analysis, validation, and optimization.
*   **Core Purpose:** To enable users to ask questions in natural language about their structured data (initially CSVs) and receive accurate, context-aware answers, effectively turning raw data into an interactive knowledge base.
*   **Target Users:** Business analysts, data analysts, and decision-makers who need to quickly query and understand datasets without writing complex code or using traditional BI tools.
*   **Key Features:**
    *   Data Upload for Analysis (User-Generated Content)
    *   Conversational Querying (Communication)
    *   Knowledge Base Management (System)
*   **Complexity Assessment:** Simple
    *   **State Management:** Local (Each user session is independent)
    *   **External Integrations:** 1 (LLM for response generation)
    *   **Business Logic:** Simple (Data processing and query routing)
    *   **Data Synchronization:** None (Data is processed on upload)
*   **MVP Success Metrics:**
    *   Users can successfully upload a CSV file and have it processed into a knowledge base.
    *   Users can ask natural language questions about the uploaded data and receive relevant answers.
    *   The core chat interface functions without errors for the primary user workflow.

## 1. USERS & PERSONAS

*   **Primary Persona:**
    *   **Name:** Alex, the Business Analyst
    *   **Context:** Alex frequently works with datasets from various departments (sales, marketing, operations) and needs to quickly answer specific questions to support strategic decisions.
    *   **Goals:** To reduce the time spent on manual data exploration and to get immediate answers to ad-hoc questions without relying on a data engineering team.
    *   **Needs:** A tool that allows for quick, intuitive data querying and provides transparent, trustworthy answers.

## 2. FUNCTIONAL REQUIREMENTS

### 2.1 User-Requested Features (All are Priority 0 for MVP)

*   **FR-001: Data Upload for Conversational Querying**
    *   **Description:** Users can upload structured data files (initially CSVs). The system processes these files, creates vector embeddings, and stores them in a searchable knowledge base associated with a specific user goal.
    *   **Entity Type:** User-Generated Content
    *   **User Benefit:** Enables users to make their private data available for analysis by the AI assistant.
    *   **Primary User:** Alex, the Business Analyst
    *   **Lifecycle Operations:**
        *   **Create:** User uploads a CSV file. The system processes it into a new Knowledge Base or adds it to an existing one.
        *   **View:** Users can see a list of their uploaded files and the status of their knowledge bases.
        *   **Edit:** Not allowed for the MVP. To update data, the user must re-upload a new file.
        *   **Delete:** Users can delete an uploaded file, which removes the corresponding data from the knowledge base.
        *   **List/Search:** Users can see a list of their goals, each with its own associated knowledge base.
    *   **Acceptance Criteria:**
        *   - [ ] Given a user is logged in, when they upload a valid CSV file, then the system processes it and creates a knowledge base.
        *   - [ ] Given a knowledge base exists, when a user deletes the source file, then the knowledge base is also deleted.
        *   - [ ] Users can view the status of their data uploads (e.g., processing, complete, failed).

*   **FR-002: Conversational AI Querying**
    *   **Description:** Users can interact with a chat interface to ask natural language questions about the data they have uploaded for a specific goal. The system will find relevant information in the knowledge base and use an LLM to generate a coherent, accurate answer.
    *   **Entity Type:** Communication
    *   **User Benefit:** Provides an intuitive and powerful way to query data without needing to know a specific query language.
    *   **Primary User:** Alex, the Business Analyst
    *   **Lifecycle Operations:**
        *   **Create:** User sends a new message (query) in the chat interface.
        *   **View:** The chat interface displays the conversation history (user queries and AI responses).
        *   **Edit:** Not allowed. Users must send a new message to correct or rephrase a query.
        *   **Delete:** Not allowed for the MVP. Conversation history is preserved.
        *   **List/Search:** The conversation is presented as a chronological list in the chat panel.
    *   **Acceptance Criteria:**
        *   - [ ] Given a user has a processed knowledge base, when they ask a relevant question, then the system provides an answer based on the data.
        *   - [ ] Given a user asks a question, the system displays a loading or "thinking" indicator while processing.
        *   - [ ] The AI's response is streamed to the user interface for a better user experience.
        *   - [ ] The system can handle queries for different goals, using the correct knowledge base for each.

### 2.2 Essential Market Features

*   **FR-003: User Authentication**
    *   **Description:** Secure user login and session management to ensure data privacy and a personalized experience.
    *   **Entity Type:** System/Configuration
    *   **User Benefit:** Protects user data and ensures that each user can only access their own knowledge bases.
    *   **Primary User:** All personas
    *   **Lifecycle Operations:**
        *   **Create:** Register a new user account.
        *   **View:** View basic profile information.
        *   **Edit:** Update profile information and password.
        *   **Delete:** Option for users to delete their account.
        *   **Additional:** Password reset functionality.
    *   **Acceptance Criteria:**
        *   - [ ] Given valid credentials, when a user logs in, then access is granted.
        *   - [ ] Given invalid credentials, when a user attempts to log in, then access is denied with a clear error message.
        *   - [ ] Users can securely reset their password.

## 3. USER WORKFLOWS

### 3.1 Primary Workflow: Gaining Insight from Uploaded Data

*   **Trigger:** Alex needs to answer a question about a new dataset.
*   **Outcome:** Alex receives a clear, data-backed answer from the AI assistant.
*   **Steps:**
    1.  User logs into the Helios application.
    2.  User navigates to the "Data" or "Goals" section.
    3.  User creates a new goal (e.g., "Analyze Q3 Sales Promotions").
    4.  User uploads a CSV file containing the relevant sales data.
    5.  System processes the file and creates a knowledge base for the goal.
    6.  User opens the chat panel for that goal.
    7.  User types a question, such as "Which promotion had the highest ROI in September?"
    8.  System performs a similarity search on the knowledge base to find relevant data chunks.
    9.  System sends the retrieved data and the user's question to an LLM.
    10. System streams the AI-generated answer back to the user in the chat panel.

### 3.2 Entity Management Workflows

*   **Data Upload (Knowledge Base) Management Workflow**
    *   **Create Knowledge Base:**
        1.  User navigates to the "Data" section.
        2.  User clicks "Upload New Data".
        3.  User selects a CSV file and associates it with a new or existing goal.
        4.  System confirms the upload and begins processing.
    *   **Delete Knowledge Base:**
        1.  User locates the uploaded file in their data list.
        2.  User clicks the delete option.
        3.  System asks for confirmation.
        4.  User confirms, and the system removes the file and the associated knowledge base data.

### 3.3 CONVERSATION SIMULATIONS

*   **Simulation 1: Happy Path Query**
    *   **Context:** Alex has uploaded sales data.
    *   **User:** "What was our total revenue from the 'Summer Sale' promotion?"
    *   **Helios:** "The total revenue from the 'Summer Sale' promotion was $152,340. This was generated from 1,280 individual transactions."
*   **Simulation 2: Error/Confusion Handling**
    *   **Context:** Alex asks a question about data that doesn't exist.
    *   **User:** "How did the 'Winter Wonderland' campaign perform?"
    *   **Helios:** "I couldn't find any information about a 'Winter Wonderland' campaign in the data you've provided. Could you please check if that campaign name is correct, or perhaps upload the relevant data?"

## 4. BUSINESS RULES

*   **Access Control:**
    *   Users can only access and query the data they have personally uploaded.
    *   There is no concept of shared data or teams in the MVP.
*   **Data Rules:**
    *   The system only supports CSV files for the MVP.
    *   Each goal has its own separate and isolated knowledge base.

## 5. DATA REQUIREMENTS

*   **Core Entities:**
    *   **User**
        *   **Type:** System/Configuration
        *   **Attributes:** user_id, email, name, hashed_password, created_date
        *   **Lifecycle:** Full CRUD with account deletion.
    *   **Goal**
        *   **Type:** User-Generated Content
        *   **Attributes:** goal_id, user_id, name, description, created_date
        *   **Lifecycle:** Full CRUD.
    *   **DataSource (Uploaded File)**
        *   **Type:** User-Generated Content
        *   **Attributes:** datasource_id, goal_id, filename, status, created_date
        *   **Lifecycle:** Create, Read, Delete.
    *   **KnowledgeBaseChunk**
        *   **Type:** System Data
        *   **Attributes:** chunk_id, goal_id, text_content, vector_embedding
        *   **Lifecycle:** System-managed (Create, Read, Delete).

## 6. INTEGRATION REQUIREMENTS

*   **External Systems:**
    *   **Large Language Model (LLM) Provider:**
        *   **Purpose:** To generate natural language responses based on user queries and retrieved data context.
        *   **Data Exchange:** Sends user query and data context; receives a text-based answer.
        *   **Frequency:** On-demand, whenever a user asks a question.

## 7. FUNCTIONAL VIEWS/AREAS

*   **Primary Views:**
    *   **Login/Register View:** For user authentication.
    *   **Goals Dashboard:** A list view where users can see and manage their goals.
    *   **Data Upload View:** A form for uploading new CSV files.
    *   **Chat Panel:** The primary interface for conversational querying, likely persistent or accessible from the goal view.

## 8. MVP SCOPE & DEFERRED FEATURES

### 8.1 MVP Success Definition
The core workflow—uploading a CSV, asking a question, and getting an answer—can be completed end-to-end by a new user. All features defined in Section 2.1 are fully functional.

### 8.2 In Scope for MVP
*   FR-001: Data Upload for Conversational Querying
*   FR-002: Conversational AI Querying
*   FR-003: User Authentication

### 8.3 Deferred Features (Post-MVP Roadmap)

*   **DF-001: Multi-Agent System**
    *   **Description:** An advanced system with specialized agents (Router, Retrieval, Synthesizer) to handle complex, multi-step queries.
    *   **Reason for Deferral:** Not essential for the core validation flow of asking simple questions. Adds significant complexity best handled in V2.
*   **DF-002: Auditor Agent (Claim Validation)**
    *   **Description:** An agent to validate "claim files" against the knowledge base, identifying discrepancies.
    *   **Reason for Deferral:** This is a distinct, secondary workflow. The core value is in querying, not auditing, for the MVP.
*   **DF-003: Treasurer Agent (In-Flight Optimization)**
    *   **Description:** An agent that monitors live data to provide budget reallocation recommendations.
    *   **Reason for Deferral:** Requires live data simulation and introduces a high degree of complexity. It is a "nice-to-have" enhancement, not part of the core flow.
*   **DF-004: Advanced Dashboards**
    *   **Description:** High-level executive dashboards with portfolio-wide metrics and visualizations.
    *   **Reason for Deferral:** The primary interface for the MVP is conversational. Dashboards are a secondary way to view data and are not needed to validate the core hypothesis.
*   **DF-005: Advanced Data Source Support**
    *   **Description:** Support for data sources other than CSV, such as databases or other file formats (e.g., PDF with OCR).
    *   **Reason for Deferral:** Adds complexity to the data processing pipeline. Sticking to CSVs simplifies the MVP implementation.

## 9. ASSUMPTIONS & DECISIONS

*   **Access Model:** The application is designed for individual users. There is no multi-tenancy or team-based access in the MVP.
*   **Entity Lifecycle Decisions:**
    *   **DataSource:** No edit functionality for the MVP. To change the data, a user must delete the old file and upload a new one. This simplifies the data synchronization logic.
    *   **Conversation:** Chat history cannot be edited or deleted in the MVP to maintain a clear audit trail of interactions.
*   **Key Assumptions Made:**
    *   Users are comfortable with a chat-based interface for data exploration.
    *   The primary value for the initial user base is getting quick answers to specific questions, not complex data visualization.
