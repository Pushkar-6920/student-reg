# 🎓 Student Registration App — Full Stack with MySQL

Complete project: **Frontend (Nginx) + Backend (Node.js/Express) + Database (MySQL 8)**

---

## 📁 Project Structure

```
student-fullstack/
│
├── frontend/
│   ├── public/
│   │   ├── index.html       ← Multi-step registration form UI
│   │   ├── style.css        ← Dark industrial design system
│   │   └── app.js           ← Calls backend API, handles navigation
│   ├── nginx.conf           ← Nginx static server + API proxy
│   └── Dockerfile           ← Nginx image (port 80)
│
├── backend/
│   ├── server.js            ← Express REST API + MySQL queries
│   ├── package.json
│   ├── .env                 ← DB credentials (local dev)
│   └── Dockerfile           ← Node.js multi-stage image (port 5000)
│
├── database/
│   └── init.sql             ← MySQL schema + seed data (auto-runs)
│
└── docker-compose.yml       ← Wires all 3 services together
```

---

## 🗄️ Database Tables

| Table                | Description                              |
|----------------------|------------------------------------------|
| `courses`            | Master list of available programmes      |
| `students`           | Core personal info (name, DOB, email...) |
| `academic_details`   | Course, year, prev institution, grade    |
| `addresses`          | Street, city, state, PIN, country        |
| `emergency_contacts` | Guardian name, phone, relation           |

---

## 🐳 Run with Docker (recommended)

```bash
# 1. Clone or unzip the project
cd student-fullstack

# 2. Build and start all containers
docker compose up --build

# 3. Open in browser
http://localhost
```

> MySQL may take ~20–30 seconds to initialize on first run. The backend retries automatically.

---

## 🔗 Service URLs

| Service  | URL                           |
|----------|-------------------------------|
| Frontend | http://localhost              |
| Backend  | http://localhost:5000         |
| Health   | http://localhost:5000/health  |
| MySQL    | localhost:3306                |

---

## 🔌 API Endpoints

| Method | Endpoint                        | Description                  |
|--------|---------------------------------|------------------------------|
| GET    | /health                         | DB + server health check     |
| GET    | /api/courses                    | List all courses              |
| POST   | /api/register                   | Submit student registration  |
| GET    | /api/registrations              | List all registrations       |
| GET    | /api/registrations/:appId       | Get single registration      |

### POST /api/register — Request Body
```json
{
  "firstName": "Aarav",
  "lastName": "Sharma",
  "dob": "2002-05-10",
  "gender": "Male",
  "nationality": "Indian",
  "email": "aarav@email.com",
  "phone": "+91 98765 43210",
  "courseId": 1,
  "enrollYear": 2025,
  "prevInstitution": "Delhi Public School",
  "prevGrade": "9.2",
  "scholarship": false,
  "street": "12, MG Road",
  "city": "Pune",
  "state": "Maharashtra",
  "pinCode": "411001",
  "country": "India",
  "emergencyName": "Rajesh Sharma",
  "emergencyPhone": "+91 99999 00000",
  "emergencyRelation": "Father"
}
```

---

## 🛠 Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | HTML5, CSS3, Vanilla JS           |
| Web Server| Nginx 1.25 (Alpine)               |
| Backend   | Node.js 20, Express 4, mysql2     |
| Database  | MySQL 8.0                         |
| Container | Docker, Docker Compose            |

---

## 🔒 Docker Security

- Backend runs as **non-root user** (`appuser`)
- MySQL uses **dedicated user** (`student_user`) — not root
- All services on isolated **bridge network**
- DB data persisted in named **Docker volume**
