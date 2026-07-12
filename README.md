# 🏥 AI Appointment Scheduling Agent

> A production-ready, full-stack AI-powered appointment scheduling system built with **Spring Boot 3**, **React 18**, **PostgreSQL**, and **Spring AI (OpenAI)**.

---

## 📋 Table of Contents
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Quick Start](#quick-start)
- [Run Commands](#run-commands)
- [Docker Commands](#docker-commands)
- [Database Credentials](#database-credentials)
- [Login Credentials](#login-credentials)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Interview Q&A](#interview-qa)

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Runtime |
| Spring Boot | 3.2.5 | Framework |
| Spring Security | 6.x | Auth & Authorization |
| Spring Data JPA | 3.x | ORM |
| PostgreSQL | 16 | Database |
| Flyway | 9.x | DB Migrations |
| JJWT | 0.12.5 | JWT Tokens |
| Spring AI | 1.0.0-M1 | OpenAI Integration |
| Lombok | 1.18.30 | Boilerplate reduction |
| MapStruct | 1.5.5 | DTO Mapping |
| Springdoc OpenAPI | 2.3.0 | Swagger UI |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.2 | UI Framework |
| TypeScript | 5.2 | Type Safety |
| Vite | 5.2 | Build Tool |
| Tailwind CSS | 3.4 | Styling |
| React Query | 5.x | Server State |
| Axios | 1.6 | HTTP Client |
| React Router | 6.x | Routing |
| Lucide React | 0.363 | Icons |

---

## 📁 Project Structure

```
ai-appointment-system/
├── backend/
│   ├── src/main/java/com/appointment/
│   │   ├── AiAppointmentApplication.java
│   │   ├── config/
│   │   │   ├── SecurityConfig.java
│   │   │   ├── OpenApiConfig.java
│   │   │   └── AiConfig.java
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── DoctorController.java
│   │   │   ├── PatientController.java
│   │   │   ├── AppointmentController.java
│   │   │   ├── DashboardController.java
│   │   │   └── AiController.java
│   │   ├── service/
│   │   │   ├── AuthService.java
│   │   │   ├── DoctorService.java
│   │   │   ├── PatientService.java
│   │   │   ├── AppointmentService.java
│   │   │   ├── DashboardService.java
│   │   │   └── AiService.java
│   │   ├── entity/
│   │   │   ├── User.java
│   │   │   ├── Role.java
│   │   │   ├── Doctor.java
│   │   │   ├── DoctorAvailableSlot.java
│   │   │   ├── Patient.java
│   │   │   ├── Appointment.java
│   │   │   └── RefreshToken.java
│   │   ├── repository/
│   │   ├── dto/request/
│   │   ├── dto/response/
│   │   ├── security/
│   │   │   ├── JwtService.java
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   └── CustomUserDetailsService.java
│   │   └── exception/
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/
│   │       ├── V1__Create_roles_table.sql
│   │       ├── V2__Create_users_table.sql
│   │       ├── V3__Create_doctors_table.sql
│   │       ├── V4__Create_patients_table.sql
│   │       ├── V5__Create_appointments_table.sql
│   │       ├── V6__Create_refresh_tokens_table.sql
│   │       └── V7__Insert_seed_data.sql
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios API modules
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # React Context (Auth)
│   │   ├── pages/        # Page components
│   │   ├── routes/       # ProtectedRoute
│   │   ├── types/        # TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── .env.example
```

---

## ✨ Features

### Authentication & Security
- ✅ JWT-based authentication (access + refresh tokens)
- ✅ BCrypt password encryption
- ✅ Role-based authorization (ADMIN / DOCTOR / PATIENT)
- ✅ Token refresh & revocation
- ✅ CORS configuration
- ✅ Global exception handling

### Doctor Module
- ✅ Full CRUD operations
- ✅ Specialization, experience, consultation fee
- ✅ Available time slots per day
- ✅ Status management (ACTIVE / INACTIVE / ON_LEAVE)
- ✅ Search by name or specialization

### Patient Module
- ✅ Full CRUD operations
- ✅ Medical notes, blood group, emergency contact
- ✅ Appointment history
- ✅ Profile management

### Appointment Module
- ✅ Book appointments with conflict detection
- ✅ Update, cancel, delete
- ✅ Status workflow (PENDING → CONFIRMED → COMPLETED)
- ✅ Today's and upcoming appointments
- ✅ Paginated search with filters (status, date range)
- ✅ AI-generated summaries

### AI Module (Spring AI + OpenAI)
- ✅ Natural language slot suggestions
- ✅ Appointment summary generation
- ✅ Doctor search via natural language
- ✅ Reminder message generation
- ✅ General chat assistant

### Dashboard
- ✅ Total doctors, patients, appointments
- ✅ Today's appointments
- ✅ Upcoming, completed, cancelled, pending stats

---

## 🚀 Quick Start

### Prerequisites
- Java 21
- Maven 3.9+
- Node.js 20+
- PostgreSQL 16 (or Docker)
- OpenAI API Key

---

## 🔧 Run Commands

### 1. Database Setup (Local PostgreSQL)
```sql
CREATE DATABASE appointment_db;
CREATE USER appointment_user WITH PASSWORD 'appointment_pass';
GRANT ALL PRIVILEGES ON DATABASE appointment_db TO appointment_user;
```

### 2. Backend (Spring Boot)

#### Option A: Zero-Dependency Local Dev (Recommended)
This runs using an in-memory H2 database (PostgreSQL mode) and automatically seeds all tables and users on startup. No local database installation or Docker is required.
```bash
cd backend
# Run with H2 dev profile on port 8081
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```
H2 console is available at `http://localhost:8081/api/h2-console` (JDBC URL: `jdbc:h2:mem:appointment_db`, Username: `sa`, empty password).

#### Option B: Real PostgreSQL Local Dev
This connects to a real PostgreSQL instance on port 5432 and uses Flyway for schema migrations.
```bash
cd backend
# Run with default profile on port 8080
mvn spring-boot:run
```

### 3. Frontend (React + Vite)
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
npm run preview
```

---

## 🐳 Docker Commands

### Start Everything
```bash
# Copy env file and add your OpenAI key
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...

# Build and start all services
docker compose up --build -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f frontend
```

### Stop & Cleanup
```bash
# Stop all containers
docker compose down

# Stop and remove volumes (DELETES DATA)
docker compose down -v

# Rebuild specific service
docker compose up --build backend -d
```

### Useful Docker Commands
```bash
# Check running containers
docker compose ps

# Shell into backend container
docker exec -it appointment_backend bash

# Shell into database container
docker exec -it appointment_db psql -U appointment_user -d appointment_db
```

---

## 🏗️ Maven Commands

```bash
cd backend

# Clean and compile
mvn clean compile

# Run tests
mvn test

# Package (skip tests)
mvn clean package -DskipTests

# Run the app
mvn spring-boot:run

# Generate project with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

---

## 📦 NPM Commands

```bash
cd frontend

npm install          # Install dependencies
npm run dev          # Start development server (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

---

## 🗄️ Database Credentials

| Property | Value |
|---|---|
| Host | localhost |
| Port | 5432 |
| Database | appointment_db |
| Username | appointment_user |
| Password | appointment_pass |
| pgAdmin URL | http://localhost:5050 |
| pgAdmin Email | admin@appointment.com |
| pgAdmin Password | admin123 |

---

## 🔐 Login Credentials (Seeded Data)

| Role | Email | Password |
|---|---|---|
| Admin | admin@appointment.com | Admin@123 |
| Doctor | dr.smith@appointment.com | Doctor@123 |
| Patient | jane.doe@appointment.com | Patient@123 |

---

## 📖 API Documentation

### Swagger UI
```
http://localhost:8080/api/swagger-ui.html
```

### API Base URL
```
http://localhost:8080/api
```

### Key Endpoints

#### Authentication
```
POST /api/auth/register       - Register new user
POST /api/auth/login          - Login
POST /api/auth/refresh-token  - Refresh access token
POST /api/auth/logout         - Logout
```

#### Doctors
```
GET    /api/doctors           - Get all (paginated + search)
GET    /api/doctors/{id}      - Get by ID
POST   /api/doctors           - Create (ADMIN only)
PUT    /api/doctors/{id}      - Update
DELETE /api/doctors/{id}      - Delete (ADMIN only)
PATCH  /api/doctors/{id}/status - Update status
```

#### Patients
```
GET    /api/patients          - Get all (paginated)
GET    /api/patients/{id}     - Get by ID
POST   /api/patients          - Create
PUT    /api/patients/{id}     - Update
DELETE /api/patients/{id}     - Delete (ADMIN only)
```

#### Appointments
```
POST   /api/appointments              - Book appointment
GET    /api/appointments/{id}         - Get by ID
GET    /api/appointments/today        - Today's appointments
GET    /api/appointments/upcoming     - Upcoming appointments
GET    /api/appointments/search       - Search with filters
PATCH  /api/appointments/{id}/cancel  - Cancel
PATCH  /api/appointments/{id}/status  - Update status
DELETE /api/appointments/{id}         - Delete (ADMIN only)
```

#### AI
```
POST /api/ai/suggest-slots           - Suggest slots (NL query)
GET  /api/ai/appointment-summary/{id}- Generate summary
POST /api/ai/search-doctors          - NL doctor search
GET  /api/ai/reminder/{id}           - Generate reminder
POST /api/ai/chat                    - General AI chat
```

#### Dashboard
```
GET /api/dashboard/stats     - Get all dashboard statistics
```

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                       │
│   Login │ Dashboard │ Doctors │ Patients │ AI Assistant       │
│                     Tailwind CSS + React Query                │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP / REST (JWT Bearer)
┌──────────────────────▼──────────────────────────────────────┐
│                    BACKEND (Spring Boot)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │   Auth   │  │  Doctor  │  │ Patient  │  │ Appointment│  │
│  │Controller│  │Controller│  │Controller│  │ Controller │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │              │              │               │          │
│  ┌────▼──────────────▼──────────────▼───────────────▼──────┐ │
│  │              Service Layer (Business Logic)               │ │
│  └────────────────────────────┬─────────────────────────────┘ │
│                                │                               │
│  ┌─────────────────────────────▼─────────────────────────────┐│
│  │          Spring Data JPA (Repository Layer)                ││
│  └─────────────────────────────┬─────────────────────────────┘│
│                                │                               │
│  ┌─────────────────────────────▼─────────────────────────────┐│
│  │  Spring AI  │   Spring Security  │  Flyway Migrations      ││
│  │  (OpenAI)   │   (JWT + RBAC)     │  (DB Schema)            ││
│  └─────────────────────────────────────────────────────────── ┘│
└───────────────────────────┬─────────────────────────────────┘
                            │ JDBC
┌───────────────────────────▼─────────────────────────────────┐
│                      PostgreSQL 16                            │
│  users │ roles │ doctors │ patients │ appointments │ tokens   │
└─────────────────────────────────────────────────────────────┘
```

---
