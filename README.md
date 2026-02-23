# Coordina – Community Collaboration & Resource Platform (CCRP)

## 📌 Overview

Coordina (CCRP) is a full-stack web application designed to help community organizations, NGOs, schools, temples, and societies centrally manage events, donation drives, tasks, resource bookings, forms, chats, and synchronized calendars within a secure, role-based platform.

The platform solves real-world coordination issues such as double bookings, missed deadlines, scattered communication, and lack of transparency by providing a centralized, real-time collaboration system.

---

## 🎯 Key Features

### 👤 User & Role Management

- JWT-based authentication
- Role-Based Access Control (Admin, Organizer, Participant, Viewer)
- Entity-level role assignments
- Audit logging of user actions

### 📅 Multi-Level Synchronized Calendar (Core Innovation)

- Main Dashboard Calendar (global view)
- Entity-Level Calendars (Events / Donation Drives)
- Task-Level Mini Calendars
- Real-time bi-directional synchronization using SignalR
- Drag-and-drop rescheduling (role permitted)
- Export to .ics format

### 📌 Entity Management

- Create Events and Donation Drives
- Tagging and visibility controls
- Invite users via email/link (with expiration)
- Padlet integration for collaborative evidence uploads

### ✅ Task Management

- Task creation & assignment (user/role-based)
- Priority and status tracking
- Kanban board view
- Per-task chat and mini-calendar
- Automatic entity progress calculation

### 🏢 Resource Booking System

- Add and manage resources
- Real-time conflict detection
- Booking approval workflow (Pending → Approved/Rejected)
- Booking cancellation with reason tracking

### 📝 Forms & Data Collection

- Drag-and-drop form builder
- Timestamped responses
- Export to CSV/PDF

### 💬 Real-Time Communication

- Entity-level chat
- Task-level discussion threads
- @mentions and notifications

### 💰 Donation Management

- Target goal tracking
- Live progress bar
- Milestone tracking
- Donor leaderboard (simulated)

### 📊 Reports & Analytics

- Participation rate and task completion metrics
- Donation progress visualization
- Resource occupancy reports
- Booking trends
- Export to PDF / Excel / CSV

---

## 🏗️ System Architecture

Layered Architecture:

Presentation Layer → React.js
Business Logic Layer → ASP.NET Web API
Data Access Layer → ADO.NET
Database Layer → MySQL

Real-Time Communication:

- ASP.NET SignalR Hub (Chat & Calendar Sync)

Deployment:

- Dockerized (multi-stage build)
- Azure App Service
- MySQL hosted on Azure

CI/CD:

- GitHub Actions (build, test, docker push, deploy)

---

## 🛠️ Technology Stack

**Frontend:** React.js (React Router, Material-UI, FullCalendar.js, Chart.js)
**Backend:** ASP.NET Web API
**Database:** MySQL
**Real-Time:** SignalR
**Containerization:** Docker
**Cloud Hosting:** Azure App Service
**Version Control:** GitHub
**Testing:** xUnit, Selenium, JMeter

---

## 🔐 Security Features

- JWT Authentication
- Role-Based Authorization
- Parameterized SQL queries (SQL Injection prevention)
- HTTPS enforcement
- Audit logs for critical actions

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-organization/coordina-ccrp.git
cd coordina-ccrp
```

### 2️⃣ Backend Setup

- Configure `appsettings.json` with MySQL connection string
- Run database migrations / execute SQL scripts
- Start ASP.NET Web API

```bash
dotnet restore
dotnet run
```

### 3️⃣ Frontend Setup

```bash
cd client
npm install
npm start
```

### 4️⃣ Docker Setup (Optional)

```bash
docker-compose up --build
```

---

## 🧪 Testing Strategy

- **Unit Testing:** xUnit
- **Integration Testing:** API-level validation
- **End-to-End Testing:** Selenium
- **Load Testing:** JMeter
- **Code Coverage:** Coverage analysis tools

---

## 🚀 Agile & Development Process

- Methodology: Agile Scrum
- 4 Sprint structure
- Daily stand-up logs
- Sprint planning, review & retrospective meetings
- Mandatory role rotation (BA, Developer, QA, DevOps)

---

## 📈 Non-Functional Requirements

- Response time < 2 seconds under normal load
- Supports 1000+ concurrent users
- 99% uptime target
- Mobile-responsive design
- Maintainable layered architecture

---

## 👥 Team Members

- IT23736382 – K M T Sandeepana
- IT23750838 – G P W Jayasekara
- IT23619258 – K A M K Kaluarachchi
- IT23585126 – I N Hewawitharana

---

## 📄 License

This project is developed for academic purposes as part of a Software Engineering module.

---

## 🌍 Impact

Coordina directly addresses coordination challenges faced by Sri Lankan community organizations by replacing fragmented tools (WhatsApp, spreadsheets, manual logs) with a centralized, secure, and real-time collaboration platform.

It demonstrates full-stack development capability, real-time system design, DevOps practices, and enterprise-level architecture principles.
