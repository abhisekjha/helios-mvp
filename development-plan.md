Project Blueprint: Helios MVP
This document provides the complete architectural and tactical plan for building the Helios MVP. It is designed to be used by a solo developer or an AI coding agent to build the application from the ground up in a structured, agile manner.
Phase 1: High-Level Architectural Decisions
1.1. Architecture Pattern Selection
Decision: Modular Monolith
Rationale: The project is an MVP with a well-defined, singular purpose. A Modular Monolith offers the best balance of development speed and simplicity for a solo developer. It avoids the premature operational and distributed systems complexity of a microservices architecture. The application's components (user management, goal setting, data processing, planning) are distinct domains but do not have technical requirements (like different runtimes or extreme resource scaling) that would justify the overhead of separate services at this stage.
1.2. Technology Stack Selection
This stack is based on current, stable, and high-performance technologies suitable for rapid development. Versions are locked as per system requirements.
Frontend Framework: Next.js 15.4.6 (using App Router)
UI Components: shadcn/ui 2.10.x (installed via npx shadcn-ui@latest)
Backend Runtime: Python 3.12.4
Backend Framework: FastAPI 0.116.1
Data Validation: Pydantic 2.x (comes with FastAPI)
Primary Database: MongoDB Atlas (Free Tier Account)
Password Hashing: passlib with bcrypt
JWT Management: python-jose
1.3. Core Infrastructure & Services (Local Development Focus)
Local Development Environment: The project will be run via simple command-line interfaces. No Docker or containerization is required for local setup.
Frontend: npm run dev
Backend: uvicorn app.main:app --reload
Background Worker: celery -A app.core.celery_worker.celery_app worker --loglevel=info


File Storage: A local directory at backend/uploads/ will be used for storing uploaded CSV files. This directory will be added to .gitignore.
Job Queues: Celery with a Redis broker will be used for asynchronous background processing of uploaded files and AI plan generation. Redis can be run locally.
Authentication: A library-based JWT (JSON Web Tokens) approach will be used. The backend will issue tokens upon login, and the frontend will store them securely to authenticate API requests.
External Services:
Large Language Model (LLM): An AI service (e.g., OpenAI, Anthropic Claude, Google Gemini) is required for strategic plan generation (FR-003). The specific provider is up to the developer, but the architecture will assume its presence.


1.4. Integration and API Strategy
API Style: RESTful API.
API Versioning: All API endpoints will be versioned under the /api/v1/ prefix (e.g., /api/v1/goals).
Standard Success Response:
 code Json
downloadcontent_copyexpand_less
      {
  "success": true,
  "data": { ... }
}
   
Standard Error Response:
 code Json
downloadcontent_copyexpand_less
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END
      {
  "success": false,
  "error": {
    "message": "A human-readable error message.",
    "type": "ERROR_CODE_STRING"
  }
}
   
Phase 2: Detailed Module Architecture
The application will be structured into domain-driven modules within the FastAPI backend and a feature-based structure in the Next.js frontend.
2.1. Module Identification
UserModule (Backend/Frontend): Manages user data, authentication, roles, and session logic.
GoalModule (Backend/Frontend): Manages the Goal entity, including all CRUD operations and associated UI.
DataModule (Backend/Frontend): Manages DataUpload entities, including file upload handling, validation, and storage.
PlanningModule (Backend/Frontend): Manages MarketInsight and StrategicPlan entities. Contains the core business logic for triggering and executing the AI-driven analysis and plan generation.
Core or Shared Module: Contains shared logic, such as database configuration, Celery setup, API client configuration, shared UI components, and type definitions.
2.2. Module Responsibilities and Contracts
Module
Responsibilities
Key Backend Endpoints (Contracts)
UserModule
User creation (seeding), login, JWT generation/validation, role-based access control.
POST /api/v1/auth/login<br>GET /api/v1/users/me
GoalModule
CRUD operations for Goals. Enforces business rules (e.g., no editing after data upload).
POST /api/v1/goals<br>GET /api/v1/goals<br>GET /api/v1/goals/{goal_id}<br>PUT /api/v1/goals/{goal_id}<br>DELETE /api/v1/goals/{goal_id}
DataModule
Handle CSV file uploads, validate format, store file locally, create DataUpload record, and trigger background processing.
POST /api/v1/goals/{goal_id}/uploads<br>GET /api/v1/goals/{goal_id}/uploads
PlanningModule
Run background tasks to process data, generate insights, use an LLM to generate plans, and update plan statuses.
GET /api/v1/goals/{goal_id}/plans<br>POST /api/v1/plans/{plan_id}/approve

2.3. Key Module Design
Backend Folder Structure (FastAPI)
code Code
downloadcontent_copyexpand_less
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END
     /backend
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── auth.py
│   │   │   │   ├── goals.py
│   │   │   │   ├── data_uploads.py
│   │   │   │   └── plans.py
│   │   │   └── router.py
│   ├── core/
│   │   ├── config.py         # Environment variables
│   │   ├── security.py       # Hashing, JWTs
│   │   └── celery_worker.py  # Celery app instance
│   ├── crud/                 # Repository Pattern: DB interactions
│   │   ├── crud_user.py
│   │   └── ...
│   ├── models/               # Pydantic models for DB (e.g., User, Goal)
│   ├── schemas/              # Pydantic schemas for API (e.g., GoalCreate)
│   ├── services/             # Business logic (e.g., plan_generation_service.py)
│   └── main.py               # FastAPI app entrypoint
├── uploads/                  # .gitignored
└── requirements.txt
   
Frontend Folder Structure (Next.js App Router)
code Code
downloadcontent_copyexpand_less
IGNORE_WHEN_COPYING_START
IGNORE_WHEN_COPYING_END
     /frontend
├── app/
│   ├── (auth)/               # Route group for auth pages
│   │   └── login/
│   │       └── page.tsx
│   ├── (main)/               # Route group for main app
│   │   ├── goals/
│   │   │   ├── [goalId]/
│   │   │   │   └── page.tsx  # View goal, uploads, plans
│   │   │   └── page.tsx      # Goal Dashboard
│   │   └── layout.tsx        # Main app layout
│   ├── api/                  # API client functions
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   └── shared/           # Custom reusable components
│   ├── context/              # React Context (e.g., AuthContext)
│   ├── lib/                  # Utilities, helpers
│   └── globals.css
├── public/
└── package.json
   
Phase 3: Tactical Sprint-by-Sprint Plan
Sprint S0: Project Foundation & Setup
Sprint ID & Name: S0: Project Foundation & Setup
Project Context: This project is to build a web application called 'Helios', an AI-Agentic Trade Promotion Management system. The MVP focuses on translating a user-defined goal and uploaded data into multiple strategic plans for review.
Goal: To establish a fully configured, runnable project skeleton on the local machine, enabling rapid feature development in subsequent sprints.
Tasks:
Developer Onboarding: Ask the developer for the URL of their new, empty GitHub repository for this project.
Project Scaffolding: Create a monorepo structure with frontend and backend directories. Initialize Git, create a comprehensive .gitignore file, and push the initial structure to the main branch. Create a develop branch from main.
Backend Setup (Python/FastAPI):
Inside the backend directory, set up a Python virtual environment (python -m venv venv).
Create a requirements.txt and add fastapi==0.116.1, uvicorn[standard], python-dotenv, pymongo, celery, and redis. Install them.
Create the basic FastAPI file structure as defined in Phase 2, starting with app/main.py.


Frontend Setup (Next.js & shadcn/ui):
Inside the frontend directory, scaffold the app: npx create-next-app@15.4.6 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*".
Initialize shadcn/ui: npx shadcn-ui@latest init.


Database & Broker Setup (MongoDB Atlas & Redis):
Instruct the developer to create a free-tier cluster on MongoDB Atlas.
Ask the developer for their MongoDB Atlas connection string.
Instruct the developer to install and run Redis locally for the Celery message broker.


Configuration:
Create .env.example files in both frontend and backend.
Create .env files (added to .gitignore). The backend .env will hold DATABASE_URL and REDIS_URL.


"Hello World" Verification:
Backend: Create a /api/v1/health endpoint that returns {"status": "ok"}.
Backend: Implement the initial database connection logic to MongoDB Atlas and Celery connection logic to Redis.
Frontend: Create a basic page that fetches data from the backend's /api/v1/health endpoint and displays the status.




Verification Criteria: The developer can clone the repository, run npm install & npm run dev in /frontend, run pip install -r requirements.txt & uvicorn app.main:app --reload in /backend, and see a "Status: ok" message on the frontend. The backend application successfully connects to MongoDB and Redis on startup.
Sprint S1: User Authentication & Roles
Sprint ID & Name: S1: User Authentication & Roles
Project Context: This project is to build 'Helios', an AI-powered strategic planning tool. This sprint builds the foundational user system required for all subsequent features.
Previous Sprint's Accomplishments: S0 established a local development environment. The Next.js frontend and FastAPI backend are running and can communicate. A connection to MongoDB Atlas and Redis is established. The codebase is tracked in a GitHub repository.
Goal: To implement a secure login system for pre-provisioned users, with role-based access control.
Relevant Requirements & User Stories:
FR-100: User Authentication.
Business Rules: Users have 'Director' or 'Manager' roles.


Tasks:
Database (Backend):
Define the User model in app/models/user.py with fields: email, hashed_password, full_name, role (Enum: 'director', 'manager'), is_active.
Create a crud_user.py module to handle database operations for users.


Seeding (Backend): Create a one-off script or startup event logic to create two default users in the database: one 'director' (Chloe) and one 'manager' (David), with placeholder passwords. Print the credentials to the console for the developer.
Authentication Logic (Backend):
Add passlib[bcrypt] and python-jose to requirements.txt.
Implement password hashing and verification in app/core/security.py.
Implement JWT creation and decoding logic in app/core/security.py.
Create the POST /api/v1/auth/login endpoint. It should accept an email and password, verify them, and return a JWT access token.
Create a protected endpoint GET /api/v1/users/me that requires a valid JWT and returns the current user's data.
Implement FastAPI dependencies for validating JWTs and for checking user roles (require_role('director')).


UI & State Management (Frontend):
Using shadcn/ui, build the LoginPage component.
Create an AuthContext to manage user session state (user object, token, loading status) throughout the application.
Implement API client functions in app/api/auth.ts to call the login endpoint.
Implement protected route logic. Unauthenticated users attempting to access protected pages should be redirected to /login.




Version Control: Commit all changes and push the develop branch to GitHub.
Verification Criteria: A developer can run the app, log in as either Chloe or David using the seeded credentials, and be redirected to a placeholder dashboard. The JWT is stored in the browser. Accessing protected routes without logging in redirects to /login. The /users/me endpoint returns the correct user data.
Sprint S2: Goal Definition (CRUD)
Sprint ID & Name: S2: Goal Definition (CRUD)
Project Context: Building 'Helios', an AI-powered strategic planning tool. This sprint enables Directors to define the high-level goals that will drive the AI planning process.
Previous Sprint's Accomplishments: S1 implemented a complete user authentication system with two pre-provisioned roles. The frontend and backend can manage a user session.
Goal: To implement the full CRUD lifecycle for Strategic Goals, restricted to the 'Director' role.
Relevant Requirements & User Stories:
FR-001: Declarative Goal Definition


Tasks:
Database (Backend):
Define the Goal model in app/models/goal.py with fields: objective_text, budget, start_date, end_date, status (Enum: 'Draft', 'Processing', 'Complete'), owner_id.
Define Pydantic schemas in app/schemas/goal.py for creating (GoalCreate), updating (GoalUpdate), and reading (GoalInDB) goals.
Create crud_goal.py to handle all database operations for the Goal collection.


API (Backend):
Create app/api/v1/endpoints/goals.py.
Implement the following endpoints, all protected by authentication:
POST /api/v1/goals: Create a new goal. Protected by require_role('director').
GET /api/v1/goals: List all goals for the logged-in user.
GET /api/v1/goals/{goal_id}: Get a single goal's details.
PUT /api/v1/goals/{goal_id}: Update a goal. Protected by require_role('director'). Add logic to prevent editing if status is not 'Draft'.
DELETE /api/v1/goals/{goal_id}: Delete a goal. Protected by require_role('director').




UI (Frontend):
Create the Goal Dashboard page (/goals) to list all goals for the user.
Create a "New Goal" button on the dashboard, visible only to Directors (use the AuthContext role).
Build a Goal Creation/Edit Form using shadcn/ui components (Input, Textarea, DatePicker, Button). This can be a modal or a separate page (/goals/new).
Implement client-side validation for the form fields.
Create API client functions in app/api/goals.ts to interact with the backend goal endpoints.




Version Control: Commit all changes and push the develop branch to GitHub.
Verification Criteria: Chloe (Director) can log in, create a new goal, see it on her dashboard, edit it, and delete it. David (Manager) can log in and view the goals created by Chloe but cannot create, edit, or delete them.
Sprint S3: Manual Data Ingestion
Sprint ID & Name: S3: Manual Data Ingestion
Project Context: Building 'Helios', an AI-powered strategic planning tool. This sprint allows Managers to upload the data necessary for the AI to generate plans.
Previous Sprint's Accomplishments: S2 delivered the full CRUD functionality for Goal entities, allowing Directors to define objectives.
Goal: To allow a 'Manager' to upload a CSV file associated with a 'Draft' Goal, have the backend validate it, and store it.
Relevant Requirements & User Stories:
FR-002: Manual Data Ingestion & Insight Generation (Upload part)


Tasks:
Database (Backend):
Define the DataUpload model in app/models/data_upload.py with fields: goal_id, uploader_id, file_name, file_path, upload_timestamp, status (Enum: 'Pending', 'Validating', 'Failed', 'Complete').
Create crud_data_upload.py.


API (Backend):
Create app/api/v1/endpoints/data_uploads.py.
Implement POST /api/v1/goals/{goal_id}/uploads. This endpoint should be protected by authentication (require_role('manager')).
The endpoint will accept a file upload. It will:
Save the file to the local backend/uploads/ directory with a unique name.
Create a DataUpload record in the database with status 'Pending'.
Trigger a background Celery task to perform validation.


Implement GET /api/v1/goals/{goal_id}/uploads to list all uploads for a goal.


Background Task (Backend):
Create a new Celery task validate_csv_file(upload_id).
This task will:
Fetch the DataUpload record.
Update its status to 'Validating'.
Read the CSV file from backend/uploads/.
Perform validation (e.g., check for required headers like 'Date', 'Sales', 'CompetitorPrice').
If validation fails, update status to 'Failed' and log the error.
If validation succeeds, update status to 'Complete'.




UI (Frontend):
On the Goal Detail page (/goals/[goalId]), create a "Data Management" section.
If the goal status is 'Draft', show a file upload component (visible to Managers).
The component should allow David to select a CSV file and upload it against the current goal.
Display a list of data uploads for the current goal, showing the file name, upload time, and status. The status should periodically re-fetch to show updates from the backend.




Version Control: Commit all changes and push the develop branch to GitHub.
Verification Criteria: David (Manager) can navigate to a 'Draft' goal, upload a CSV file, and see its status change from 'Pending' to 'Validating' to 'Complete' (or 'Failed'). The file is stored on the backend server. Chloe can also see the status of the uploads.
Sprint S4: Asynchronous Insight & Plan Generation (AI Core)
Sprint ID & Name: S4: Asynchronous Insight & Plan Generation (AI Core)
Project Context: Building 'Helios', an AI-powered strategic planning tool. This is the core sprint where the AI's value is realized by generating strategic plans.
Previous Sprint's Accomplishments: S3 enabled managers to upload and validate data files associated with a specific goal.
Goal: To automatically trigger a background process upon successful data validation that uses an LLM to generate insights and strategic plans.
Relevant Requirements & User Stories:
FR-002: ... Insight Generation
FR-003: Automated Strategic Plan Generation


Tasks:
API Key Management: Instruct the developer to get an API key from their chosen LLM provider (e.g., OpenAI) and add it to the backend/.env file as LLM_API_KEY.
Database (Backend):
Define MarketInsight and StrategicPlan models in app/models/planning.py.
MarketInsight: description, data_upload_id, timestamp.
StrategicPlan: goal_id, summary, pnl_forecast (JSON/Dict), risk_assessment, status (Enum: 'Pending', 'Approved', 'Dismissed'), linked_insight_ids.
Create crud_planning.py.


Background Task Chaining (Backend):
Modify the validate_csv_file task from S3. Upon successful validation, it should trigger a new task: generate_plans_for_goal(goal_id).
Update the parent Goal status to 'Processing'.


Plan Generation Service (Backend):
Create a new Celery task generate_plans_for_goal(goal_id).
This task will orchestrate the core logic:
Fetch the Goal and its most recent successful DataUpload.
Insight Generation: Read the CSV data. Create a service app/services/insight_generator.py that (for the MVP) can either use simple heuristics (e.g., find the week with the highest sales) or make a simple LLM call to summarize the data into 2-3 MarketInsight objects and save them.
Plan Generation: Create a service app/services/plan_generator.py. This service will:
Construct a detailed prompt for the LLM. The prompt must include the Goal's objective, budget, timeframe, and the generated insights.
The prompt must explicitly ask the LLM to return 3 distinct strategic plans in a structured JSON format, including fields for summary, pnl_forecast, risk_assessment.
Call the LLM API.
Parse the JSON response from the LLM.
For each plan in the response, create and save a StrategicPlan object in the database.






UI (Frontend):
On the Goal Detail page, if the goal status is 'Processing', display an informative message like "AI is generating plans. This may take a few minutes..."




Version Control: Commit all changes and push the develop branch to GitHub.
Verification Criteria: After a Manager uploads a valid CSV, the Goal's status changes to 'Processing'. The Celery worker logs show the insight and plan generation tasks running. After the process completes, new MarketInsight and StrategicPlan documents are present in the MongoDB database, correctly linked to the Goal.
Sprint S5: Strategic Plan Review & Approval
Sprint ID & Name: S5: Strategic Plan Review & Approval
Project Context: Building 'Helios', an AI-powered strategic planning tool. This final MVP sprint delivers the user-facing result of the AI process, allowing a Director to make the final decision.
Previous Sprint's Accomplishments: S4 implemented the core AI pipeline, which now automatically generates and saves strategic plans in the database after a successful data upload.
Goal: To create a UI for 'Directors' to review, compare, and approve one of the AI-generated strategic plans.
Relevant Requirements & User Stories:
FR-004: Strategic Plan Review & Approval


Tasks:
API (Backend):
Create app/api/v1/endpoints/plans.py.
Implement GET /api/v1/goals/{goal_id}/plans to fetch all plans for a given goal.
Implement POST /api/v1/plans/{plan_id}/approve. This endpoint (protected for 'directors') will:
Set the chosen plan's status to 'Approved'.
Set the status of all other plans for the same goal to 'Dismissed'.
Set the parent Goal's status to 'Complete'.




UI (Frontend):
Create a new route and page: /goals/[goalId]/review.
On the Goal Detail page, if plans are ready, show a prominent "Review Plans" button that links to this new page.
On the Plan Review Page, fetch and display the generated plans.
Design a comparative view (e.g., using Cards or a Table) that shows the summary, pnl_forecast, and risk_assessment for each plan side-by-side.
Each plan card should have an "Approve" button, visible only to Directors.
Implement the client-side logic to call the approval endpoint when the button is clicked.
After a successful approval, redirect back to the Goal Detail page and show a confirmation message. The goal should now be marked as 'Complete', and all plan actions (like uploading more data or re-approving) should be disabled.




Version Control: Commit all changes and push the develop branch to GitHub.
Verification Criteria: Chloe (Director) can log in, navigate to a goal with generated plans, and see the comparative review page. She can click "Approve" on one plan. The UI updates correctly, the plan's status changes to "Approved" in the database, other plans are "Dismissed", and the parent goal is "Complete". David (Manager) can view the plans but does not see the "Approve" button. The MVP workflow is now complete.

