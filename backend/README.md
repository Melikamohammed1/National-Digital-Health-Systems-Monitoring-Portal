# National Digital Health Systems Monitoring Portal — Backend

The backend powers the National Digital Health Systems Monitoring Portal by providing REST APIs, business logic, data management, and communication between the frontend application and the database.

This repository is currently in the **initial backend development phase**, where the project structure, API foundation, and core services are being implemented.

---

# 📂 Project Directory Architecture (`/backend`)

```text
backend/
├── config/                 # Application configuration files (environment, database)
├── controllers/            # Request handlers and business logic
├── middleware/             # Authentication, validation, logging, and error handling
├── models/                 # Database models and schemas
├── routes/                 # API route definitions
├── services/               # Core application services and reusable logic
├── utils/                  # Helper functions and utility modules
├── database/               # Database connection and migration files
├── tests/                  # Unit and integration tests
├── app.js                  # Express application configuration
├── server.js               # Server entry point
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

# 🚀 Current Sprint Focus: Backend Foundation Phase

Development during this sprint is focused on building the backend architecture that will support the frontend application.

## Backend Key Deliverables

### Express Server Setup

- Configure Express.js application
- Environment variable management
- Middleware configuration
- Project folder structure

### REST API Foundation

Implement the first version of the REST API including:

- Screen Management endpoints
- Authentication endpoints
- Health check endpoint
- Error handling

### Database Integration

- Configure database connection
- Define initial database schema
- Create models for core entities

### Authentication System

- User login
- Session management
- Password hashing
- Protected routes

### Business Logic Layer

Develop reusable service modules responsible for:

- Screen management
- User management
- System configuration

### Validation & Error Handling

- Request validation
- Centralized error responses
- Input sanitization

---

# 🛠️ Getting Started

## Prerequisites

- Node.js v18.0.0 or higher
- npm v9.0.0 or higher

## Local Setup Instructions

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

or

```bash
npm start
```

The backend server will run on:

```
http://localhost:4000
```

---

# 📡 Planned API Modules

The backend will gradually expose RESTful APIs for the following modules.

## Authentication

- User Login
- User Logout
- Session Validation

## Screen Management

- Register Screen
- Update Screen
- Delete Screen
- Retrieve Screen Information

## System Management

- Register External Systems
- Update System Configuration
- Remove Systems

## Monitoring

- Screen Status
- System Status
- Health Monitoring

---

# 🧩 Planned Technologies

The backend will be built using:

- Node.js
- Express.js
- JavaScript (ES6+)
- REST API
- JWT Authentication
- bcrypt
- Database (To Be Finalized)
- dotenv

---

# 🤝 Collaboration & Git Workflow Guidelines

To ensure smooth collaboration among backend developers, follow these Git practices.

## Branch Naming Conventions

Always create feature branches from `main`.

```bash
feat/authentication
feat/screen-api
feat/database-setup
feat/error-handler
feat/user-management
```

## Development Workflow

Pull the latest changes:

```bash
git checkout main
git pull origin main
```

Create a feature branch:

```bash
git checkout -b feat/your-feature-name
```

Commit changes using meaningful prefixes.

- **feat:** New backend feature
- **fix:** Bug fixes
- **refactor:** Code improvements
- **test:** Tests
- **docs:** Documentation

Example:

```bash
git commit -m "feat(auth): implement login endpoint"
```

Push your branch:

```bash
git push origin feat/your-feature-name
```

Create a Pull Request for review before merging.

---

# 📌 Development Roadmap

The backend development will progress through the following milestones.

### Phase 1

- Project setup
- Express configuration
- Folder architecture
- Git workflow

### Phase 2

- Database integration
- Models
- CRUD APIs

### Phase 3

- Authentication
- Authorization
- Protected routes

### Phase 4

- Validation
- Error handling
- Logging

### Phase 5

- Testing
- Performance improvements
- Deployment preparation

---

# 📄 Notes

- The backend is currently under active development.
- API endpoints and project architecture may evolve as new features are implemented.
- Documentation will be updated continuously throughout development to reflect the latest implementation.