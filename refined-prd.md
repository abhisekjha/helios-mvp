# PRODUCT REQUIREMENTS DOCUMENT: Helios MVP

**EXECUTIVE SUMMARY**

*   **Product Vision:** To create 'Helios', an AI-Agentic Trade Promotion Management system. The MVP empowers business leaders to translate high-level goals and operational data into actionable, AI-generated strategic plans, enabling faster, data-driven decision-making.
*   **Core Purpose:** Helios solves the problem of slow, manual, and often inconsistent strategic planning. It bridges the gap between a business objective and a set of viable, data-backed strategies by leveraging AI to perform the complex analysis and generation tasks.
*   **Target Users:** The primary users are business leaders at two levels: 'Directors' who set strategic goals and approve final plans, and 'Managers' who are responsible for providing the data to support these goals.
*   **Key Features:**
    *   Declarative Goal Definition (User-Generated Content)
    *   Manual Data Ingestion (User-Generated Content)
    *   Automated Strategic Plan Generation (System-Generated Content)
    *   Strategic Plan Review & Approval (Communication)
*   **Complexity Assessment:** Moderate
    *   **State Management:** Local (Modular Monolith)
    *   **External Integrations:** 1 (LLM API for plan generation)
    *   **Business Logic:** Moderate (Involves a multi-step asynchronous workflow for data processing and AI plan generation)
    *   **Data Synchronization:** Basic (Asynchronous updates via a job queue)
*   **MVP Success Metrics:**
    *   A Director can successfully create a goal, leading to a Manager uploading data, and resulting in the Director approving a generated plan.
    *   The system correctly processes a valid uploaded CSV file and triggers the AI plan generation workflow.
    *   The core workflow (Goal -> Data -> Plans -> Approval) can be completed without errors.

**1. USERS & PERSONAS**

*   **Primary Persona: The Director (Chloe)**
    *   **Context:** A senior leader responsible for setting business objectives, defining budgets, and making high-stakes strategic decisions.
    *   **Goals:** To quickly evaluate multiple data-driven strategies to achieve a specific business objective (e.g., increase market share).
    *   **Needs:** A streamlined way to define goals, see potential strategies without manual analysis, and approve a plan with confidence.
*   **Secondary Persona: The Manager (David)**
    *   **Context:** A manager responsible for gathering and providing the operational data related to a Director's goal.
    *   **Goals:** To easily provide the necessary data for analysis and to see the status of the data processing.
    *   **Needs:** A simple, reliable method to upload data files and confirm they have been successfully processed.

**2. FUNCTIONAL REQUIREMENTS**

*   **2.1 Core MVP Features (All are Priority 0)**

    *   **FR-001: Declarative Goal Definition**
        *   **Description:** Allows a 'Director' to define, view, update, and delete a high-level strategic goal. A goal serves as the primary driver for the entire AI planning workflow.
        *   **Entity Type:** User-Generated Content
        *   **User Benefit:** Enables Directors to formally capture their strategic intent, providing a clear objective for the AI to work towards.
        *   **Primary User:** Director (Chloe)
        *   **Lifecycle Operations:**
            *   **Create:** A Director can create a new goal, specifying an objective, budget, and timeframe.
            *   **View:** Directors and Managers can view the details of any existing goal.
            *   **Edit:** A Director can edit a goal's details only if it is in a 'Draft' state.
            *   **Delete:** A Director can delete a goal only if it is in a 'Draft' state.
            *   **List/Search:** Users can see a list of all goals they have access to.
        *   **Acceptance Criteria:**
            *   - [ ] Given a Director is logged in, when they create a new goal with valid inputs, then the goal is saved with a 'Draft' status.
            *   - [ ] Given a goal exists, when a user views its details, then they see the objective, budget, timeframe, and status.
            *   - [ ] Given a 'Draft' goal exists, when a Director edits it, then the changes are saved.
            *   - [ ] Given a goal with a 'Processing' status exists, when a Director attempts to edit it, then the system prevents the edit and shows a notification.
            *   - [ ] Users can view a dashboard listing all created goals.

    *   **FR-002: Manual Data Ingestion**
        *   **Description:** Allows a 'Manager' to upload a CSV data file against a specific 'Draft' goal. The system validates the file asynchronously and updates its status.
        *   **Entity Type:** User-Generated Content
        *   **User Benefit:** Provides the raw data necessary for the AI to perform its analysis and generate relevant strategic plans.
        *   **Primary User:** Manager (David)
        *   **Lifecycle Operations:**
            *   **Create:** A Manager can upload a CSV file for a goal that is in 'Draft' status.
            *   **View:** Users can see a list of uploaded files for a goal, including their validation status.
            *   **Delete:** Not allowed for MVP to maintain audit trail.
            *   **List/Search:** Users can list all data uploads associated with a specific goal.
        *   **Acceptance Criteria:**
            *   - [ ] Given a 'Draft' goal, when a Manager uploads a CSV file, then a `DataUpload` record is created with 'Pending' status.
            *   - [ ] The system triggers a background job to validate the uploaded file.
            *   - [ ] The `DataUpload` status updates to 'Validating', then to 'Complete' or 'Failed'.
            *   - [ ] Users can see the real-time status of their uploads on the goal detail page.

    *   **FR-003: Automated Strategic Plan Generation**
        *   **Description:** The system automatically triggers an AI-driven process to generate multiple strategic plans after a data file has been successfully validated.
        *   **Entity Type:** System-Generated Content
        *   **User Benefit:** Leverages AI to transform raw data and a high-level goal into concrete, actionable strategies, saving significant time and effort.
        *   **Primary User:** System/Director (Chloe)
        *   **Lifecycle Operations:**
            *   **Create:** The system automatically generates 3 distinct `StrategicPlan` entities via an LLM call after successful data validation.
            *   **View:** Directors and Managers can view the generated plans.
            *   **Edit:** Not allowed. Plans are immutable once generated.
            *   **Delete:** Not allowed.
            *   **List/Search:** Users can list all plans associated with a specific goal.
        *   **Acceptance Criteria:**
            *   - [ ] Given a `DataUpload` status changes to 'Complete', then the parent `Goal` status changes to 'Processing'.
            *   - [ ] A background job is triggered to generate insights and plans.
            *   - [ ] The system makes a call to an LLM with the goal's objective and data insights.
            *   - [ ] The system successfully parses the LLM response and creates multiple `StrategicPlan` records in the database, each with a 'Pending' status.

    *   **FR-004: Strategic Plan Review & Approval**
        *   **Description:** Provides a dedicated interface for a 'Director' to review, compare, and approve one of the AI-generated strategic plans.
        *   **Entity Type:** Communication
        *   **User Benefit:** Empowers Directors to make the final strategic decision based on a clear, comparative layout of AI-generated options.
        *   **Primary User:** Director (Chloe)
        *   **Lifecycle Operations:**
            *   **Update (Approve):** A Director can approve one `StrategicPlan` from the list of generated options.
            *   **View:** Directors can view all generated plans in a comparative layout.
            *   **List/Search:** Users can list all plans for a goal.
        *   **Acceptance Criteria:**
            *   - [ ] Given a goal has 'Pending' plans, when a Director navigates to the review page, then they see all plans displayed side-by-side.
            *   - [ ] When a Director clicks "Approve" on a plan, then its status changes to 'Approved'.
            *   - [ ] The status of all other plans for that goal is automatically changed to 'Dismissed'.
            *   - [ ] The parent `Goal`'s status is updated to 'Complete'.
            *   - [ ] Once a goal is 'Complete', no further actions (like approving another plan) are possible.

*   **2.2 Essential Market Features**
    *   **FR-100: User Authentication**
        *   **Description:** Secure user login for pre-provisioned users. The system manages sessions and protects routes based on authentication status and user role.
        *   **Entity Type:** System/Configuration
        *   **User Benefit:** Protects application data and ensures that users can only perform actions appropriate to their role.
        *   **Primary User:** All Personas
        *   **Lifecycle Operations:**
            *   **Create:** Users are pre-provisioned in the database by a seeding script.
            *   **View:** A user can view their own profile information.
            *   **Update:** Password reset functionality.
            *   **Delete:** Not in MVP scope.
            *   **Additional:** Login (JWT issuance), Logout (session termination).
        *   **Acceptance Criteria:**
            *   - [ ] Given valid credentials for a pre-provisioned user, when they log in, then access is granted and a JWT is issued.
            *   - [ ] Given invalid credentials, when a user attempts to log in, then access is denied with a clear error message.
            *   - [ ] Unauthenticated users attempting to access protected pages are redirected to the login page.
            *   - [ ] A logged-in user can access a page that displays their own information (e.g., name, role).

**3. USER WORKFLOWS**

*   **3.1 Primary Workflow: End-to-End Plan Generation and Approval**
    *   **Trigger:** A Director decides to pursue a new strategic objective.
    *   **Outcome:** A single, AI-generated strategic plan is approved to meet the objective.
    *   **Steps:**
        1.  **Chloe (Director)** logs into Helios.
        2.  She creates a new **Goal**, defining the objective, budget, and dates. The Goal is saved in 'Draft' status.
        3.  **David (Manager)** logs in, sees the new 'Draft' Goal on his dashboard.
        4.  He navigates to the Goal's detail page and uploads the required CSV data file.
        5.  The system creates a **DataUpload** record ('Pending') and starts a background validation task.
        6.  The system updates the DataUpload status to 'Validating', then 'Complete'.
        7.  Upon successful validation, the system updates the parent Goal's status to 'Processing'.
        8.  The system triggers the AI pipeline, which generates several **Strategic Plans**.
        9.  **Chloe (Director)** receives a notification (future feature) or revisits the Goal page and sees the status is now 'Ready for Review'.
        10. She navigates to the Plan Review page.
        11. The system displays the generated plans in a comparative view.
        12. Chloe reviews the plans and clicks "Approve" on her chosen strategy.
        13. The system updates the chosen plan to 'Approved', the others to 'Dismissed', and the parent Goal to 'Complete'.
        14. The workflow is complete.

**4. BUSINESS RULES**

*   **Entity Lifecycle Rules:**
    *   **Goal:**
        *   **Who can create:** Director
        *   **Who can view:** Director, Manager
        *   **Who can edit/delete:** Director, but only if status is 'Draft'.
        *   **What happens on deletion:** Hard delete.
    *   **DataUpload:**
        *   **Who can create:** Manager
        *   **Who can view:** Director, Manager
        *   **Who can edit/delete:** No one (immutable for audit).
    *   **StrategicPlan:**
        *   **Who can create:** System (AI)
        *   **Who can view:** Director, Manager
        *   **Who can edit/delete:** No one (immutable).
        *   **Who can approve:** Director

*   **Access Control:**
    *   Directors have full control over the Goal lifecycle and final plan approval.
    *   Managers can only upload data to existing 'Draft' goals and view entities.
    *   All authenticated users can view all Goals, Data Uploads, and Plans.

**5. DATA REQUIREMENTS**

*   **Core Entities:**
    *   **User**
        *   **Type:** System/Configuration
        *   **Attributes:** email, hashed_password, full_name, role ('director' or 'manager'), is_active
    *   **Goal**
        *   **Type:** User-Generated Content
        *   **Attributes:** objective_text, budget, start_date, end_date, status ('Draft', 'Processing', 'Complete'), owner_id
        *   **Relationships:** Belongs to a User (owner), Has many DataUploads, Has many StrategicPlans
    *   **DataUpload**
        *   **Type:** User-Generated Content
        *   **Attributes:** goal_id, uploader_id, file_name, file_path, upload_timestamp, status ('Pending', 'Validating', 'Failed', 'Complete')
        *   **Relationships:** Belongs to a Goal, Belongs to a User (uploader)
    *   **MarketInsight**
        *   **Type:** System-Generated Content
        *   **Attributes:** description, data_upload_id, timestamp
        *   **Relationships:** Belongs to a DataUpload
    *   **StrategicPlan**
        *   **Type:** System-Generated Content
        *   **Attributes:** goal_id, summary, pnl_forecast, risk_assessment, status ('Pending', 'Approved', 'Dismissed'), linked_insight_ids
        *   **Relationships:** Belongs to a Goal, Has many MarketInsights

**6. INTEGRATION REQUIREMENTS**

*   **External Systems:**
    *   **Large Language Model (LLM) Provider (e.g., OpenAI, Anthropic, Google)**
        *   **Purpose:** To generate market insights and strategic plans from processed data and user-defined goals.
        *   **Data Exchange:** The system sends a structured prompt containing the goal and data summary. The LLM returns a structured JSON object containing multiple strategic plans.
        *   **Frequency:** On-demand, triggered after successful data validation.

**7. FUNCTIONAL VIEWS/AREAS**

*   **Primary Views:**
    *   **Login Page:** For user authentication.
    *   **Goal Dashboard:** The main landing page after login. Lists all goals.
    *   **Goal Detail View:** Shows details for a single goal, including its associated data uploads and their statuses. This is where a Manager uploads files.
    *   **Plan Review Page:** A dedicated, comparative view for Directors to review and approve one of several AI-generated plans.
    *   **Goal Create/Edit Form:** A modal or page for Directors to create or edit a goal.

**8. MVP SCOPE & DEFERRED FEATURES**

*   **8.1 MVP Success Definition**
    *   The core workflow (Goal -> Data -> Plan -> Approval) can be completed end-to-end by a new user.
    *   All features defined in Section 2.1 are fully functional.

*   **8.2 In Scope for MVP**
    *   FR-001: Declarative Goal Definition
    *   FR-002: Manual Data Ingestion
    *   FR-003: Automated Strategic Plan Generation
    *   FR-004: Strategic Plan Review & Approval
    *   FR-100: User Authentication

*   **8.3 Deferred Features (Post-MVP Roadmap)**
    *   **No features are deferred for this MVP.** The provided document outlines a minimal, complete product, and all identified features are essential for the core workflow. Future versions could include features like user notifications, advanced analytics, team collaboration, or direct data source integrations.

**9. ASSUMPTIONS & DECISIONS**

*   **Access Model:** The application operates on a simple two-role system (Director, Manager). All data is visible to all users, but actions are restricted by role.
*   **Entity Lifecycle Decisions:**
    *   **Goal:** Editable only in 'Draft' state to prevent changes while data is being processed or plans are being generated.
    *   **DataUpload & StrategicPlan:** Immutable after creation to ensure a clear and auditable trail from data to decision.
*   **Key Assumptions Made:**
    *   A single CSV file is sufficient data for the AI to generate meaningful plans for the MVP.
    *   The LLM is capable of returning structured JSON reliably based on a detailed prompt.
    *   Users are pre-provisioned; there is no self-service registration flow in the MVP.