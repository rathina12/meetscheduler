# 📅 MeetScheduler — Meeting Scheduler & Calendar Sync

A full-stack enterprise-grade meeting scheduling application with Google Calendar and Microsoft Outlook integration, real-time WebSocket notifications, JWT authentication, and a modern React frontend with dark/light theme support.

---

> **Implementation status (October 2026):** The `feature/meet-scheduler-ui-reliability` branch introduces a responsive visual refresh, fixes edit-time reschedule detection, and offers genuine one-time iCalendar (.ics) export. Google/Microsoft two-way sync is **not implemented**: earlier backend code simulated tokens and sync counts. Those paths now fail closed, rather than falsely reporting success. Do not treat the original integration claims below as verified functionality. Builds, database migrations, integration tests and external OAuth credentials still need end-to-end verification before production deployment.

## 🗂️ Project Structure

```
meetscheduler/
├── backend/                          # Spring Boot application
│   ├── src/main/java/com/meetscheduler/
│   │   ├── MeetingSchedulerApplication.java
│   │   ├── config/
│   │   │   ├── SecurityConfig.java       # JWT + CORS + Spring Security
│   │   │   ├── WebSocketConfig.java      # STOMP WebSocket
│   │   │   └── GlobalExceptionHandler.java
│   │   ├── controller/
│   │   │   ├── AuthController.java       # POST /api/auth/*
│   │   │   ├── MeetingController.java    # CRUD /api/meetings/*
│   │   │   └── NotificationCalendarController.java
│   │   ├── entity/
│   │   │   ├── User.java
│   │   │   ├── Meeting.java
│   │   │   ├── Participant.java
│   │   │   ├── Notification.java
│   │   │   └── CalendarIntegration.java
│   │   ├── repository/               # Spring Data JPA repos
│   │   ├── security/
│   │   │   ├── JwtUtils.java
│   │   │   ├── JwtAuthFilter.java
│   │   │   └── UserDetailsServiceImpl.java
│   │   └── service/
│   │       ├── AuthService.java
│   │       ├── MeetingService.java    # Core logic + conflict detection
│   │       ├── NotificationService.java
│   │       ├── EmailService.java      # HTML email templates
│   │       └── CalendarSyncService.java  # Google + Outlook sync
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── schema.sql
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                         # React JSX application
│   ├── src/
│   │   ├── App.jsx                   # Router + providers
│   │   ├── index.js
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   └── ForgotPassword.jsx
│   │   │   ├── dashboard/Dashboard.jsx   # Stats + today schedule
│   │   │   ├── calendar/
│   │   │   │   ├── CalendarView.jsx  # Month/Week/Day views
│   │   │   │   └── CalendarSync.jsx  # Google/Outlook connect
│   │   │   ├── meetings/
│   │   │   │   ├── MeetingsList.jsx  # Search + filter
│   │   │   │   ├── MeetingForm.jsx   # Create/Edit form
│   │   │   │   └── MeetingDetail.jsx # RSVP + participants
│   │   │   ├── notifications/Notifications.jsx
│   │   │   ├── profile/Profile.jsx
│   │   │   ├── layout/AppLayout.jsx  # Sidebar + Topbar
│   │   │   └── common/ProtectedRoute.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── hooks/useWebSocket.js     # STOMP real-time hook
│   │   ├── services/api.js           # Axios + interceptors
│   │   ├── utils/helpers.js
│   │   └── styles/global.css        # CSS variables, dark/light theme
│   ├── public/index.html
│   ├── Dockerfile
│   ├── nginx-frontend.conf
│   └── package.json
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ✨ Features

### 🔐 Authentication
- JWT access + refresh token flow
- BCrypt password hashing
- Role-based access control (ADMIN / USER)
- Protected routes on both frontend and backend

### 📅 Meeting Management
- Create, view, edit, cancel, delete meetings
- Time conflict detection (prevents double-booking)
- Recurring meetings (Daily / Weekly / Monthly / Yearly)
- Participant invitation by email
- RSVP system (Accept / Decline / Tentative)
- Meeting types: Online (with link) / Offline (with venue)

### 🗓️ Calendar Views
- **Month View** — full calendar grid with color-coded events
- **Week View** — hourly timeline for 7 days
- **Day View** — full day hour-by-hour breakdown

### 🔄 Calendar Sync
- Google Calendar OAuth2 integration
- Microsoft Outlook Calendar integration
- Two-way synchronization
- Connect / Disconnect providers anytime

### 🔔 Notifications
- In-app notification center with unread badges
- Email invitations with HTML templates
- Automatic 15-minute meeting reminders (scheduled job)
- Real-time updates via WebSocket (STOMP over SockJS)

### 🎨 UI/UX
- Dark / Light theme toggle (CSS custom properties)
- Fully responsive (mobile-friendly sidebar)
- Clean card-based layout with smooth transitions
- Loading skeletons and toast feedback

---

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.0+
- Maven 3.9+
- Docker & Docker Compose (optional)

---

### Option A — Docker Compose (Recommended)

```bash
# 1. Clone and enter directory
git clone <repo-url>
cd meetscheduler

# 2. Configure environment
cp .env.example .env
# Edit .env with your SMTP, Google, and Microsoft credentials

# 3. Start all services
docker-compose up --build -d

# 4. View logs
docker-compose logs -f backend

# Access:
#   Frontend  → http://localhost:3000
#   Backend   → http://localhost:8080
#   Swagger   → http://localhost:8080/swagger-ui.html
#   MySQL     → localhost:3306
```

---

### Option B — Manual Setup

#### Backend

```bash
cd backend

# Configure database
mysql -u root -p -e "CREATE DATABASE meeting_scheduler;"

# Set environment variables (or edit application.properties)
export DB_USERNAME=root
export DB_PASSWORD=yourpassword
export JWT_SECRET=your-64-char-secret
export MAIL_USERNAME=you@gmail.com
export MAIL_PASSWORD=your-app-password

# Run
mvn spring-boot:run
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env
echo "REACT_APP_API_URL=http://localhost:8080" > .env

# Start development server
npm start
# Opens → http://localhost:3000
```

---

## 🌐 API Reference

### Authentication
| Method | Endpoint              | Description         | Auth |
|--------|-----------------------|---------------------|------|
| POST   | /api/auth/register    | Create account      | ❌   |
| POST   | /api/auth/login       | Login               | ❌   |
| POST   | /api/auth/refresh     | Refresh token       | ❌   |

### Meetings
| Method | Endpoint                  | Description              | Auth |
|--------|---------------------------|--------------------------|------|
| GET    | /api/meetings             | List all user meetings   | ✅   |
| GET    | /api/meetings/today       | Today's meetings         | ✅   |
| GET    | /api/meetings/upcoming    | Upcoming meetings        | ✅   |
| GET    | /api/meetings/range       | Meetings in date range   | ✅   |
| GET    | /api/meetings/dashboard   | Stats + next meetings    | ✅   |
| GET    | /api/meetings/{id}        | Meeting detail           | ✅   |
| POST   | /api/meetings             | Create meeting           | ✅   |
| PUT    | /api/meetings/{id}        | Update meeting           | ✅   |
| PATCH  | /api/meetings/{id}/cancel | Cancel meeting           | ✅   |
| DELETE | /api/meetings/{id}        | Delete meeting           | ✅   |
| POST   | /api/meetings/respond     | RSVP to invitation       | ✅   |

### Notifications
| Method | Endpoint                        | Description            | Auth |
|--------|---------------------------------|------------------------|------|
| GET    | /api/notifications              | All notifications      | ✅   |
| PATCH  | /api/notifications/{id}/read    | Mark one as read       | ✅   |
| PATCH  | /api/notifications/read-all     | Mark all as read       | ✅   |

### Calendar Sync
| Method | Endpoint                         | Description             | Auth |
|--------|----------------------------------|-------------------------|------|
| GET    | /api/calendar/google/auth-url    | Get Google OAuth URL    | ✅   |
| GET    | /api/calendar/outlook/auth-url   | Get Outlook OAuth URL   | ✅   |
| POST   | /api/calendar/google/connect     | Connect Google          | ✅   |
| POST   | /api/calendar/outlook/connect    | Connect Outlook         | ✅   |
| POST   | /api/calendar/sync               | Trigger sync            | ✅   |
| GET    | /api/calendar/integrations       | List connected providers| ✅   |
| DELETE | /api/calendar/{provider}/disconnect | Disconnect provider  | ✅   |

---

## ⚙️ Google Calendar Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project → Enable **Google Calendar API**
3. Create credentials → **OAuth 2.0 Client ID** (Web application)
4. Add redirect URI: `http://localhost:3000/calendar/google/callback`
5. Copy Client ID and Client Secret to `.env`

## ⚙️ Microsoft Outlook Setup

1. Go to [portal.azure.com](https://portal.azure.com) → App registrations → New
2. Add redirect URI: `http://localhost:3000/calendar/outlook/callback`
3. API Permissions → Add `Calendars.ReadWrite` (Delegated)
4. Create a Client Secret under Certificates & Secrets
5. Copy Application (client) ID and secret to `.env`

---

## 🗄️ Database Schema

```
users ──────────────────────────────────────────────
  id, name, email, password, role, timezone, created_at

meetings ───────────────────────────────────────────
  id, title, description, start_time, end_time,
  location, meeting_type, meeting_link,
  organizer_id (→ users), status, is_recurring,
  recurrence_pattern, recurrence_end_date,
  parent_meeting_id (→ meetings), created_at

participants ───────────────────────────────────────
  id, meeting_id (→ meetings), user_id (→ users),
  email, response_status, invited_at, responded_at

notifications ──────────────────────────────────────
  id, user_id (→ users), meeting_id (→ meetings),
  type, message, read_status, created_at

calendar_integrations ──────────────────────────────
  id, user_id (→ users), provider, access_token,
  refresh_token, token_expiry, sync_status, last_synced_at
```

---

## 🔧 Configuration Reference

| Variable              | Description                   | Default              |
|-----------------------|-------------------------------|----------------------|
| DB_USERNAME           | MySQL username                | root                 |
| DB_PASSWORD           | MySQL password                | root                 |
| JWT_SECRET            | 64+ char signing secret       | (change this!)       |
| MAIL_HOST             | SMTP host                     | smtp.gmail.com       |
| MAIL_USERNAME         | SMTP login email              | —                    |
| MAIL_PASSWORD         | SMTP app password             | —                    |
| GOOGLE_CLIENT_ID      | Google OAuth2 client ID       | —                    |
| GOOGLE_CLIENT_SECRET  | Google OAuth2 client secret   | —                    |
| MICROSOFT_CLIENT_ID   | Azure app client ID           | —                    |
| MICROSOFT_CLIENT_SECRET | Azure client secret         | —                    |

---

## 🏗️ Tech Stack

| Layer      | Technology                                        |
|------------|---------------------------------------------------|
| Frontend   | React 18, React Router 6, Axios, date-fns         |
| Real-time  | STOMP over SockJS (WebSocket)                     |
| Backend    | Spring Boot 3.2, Spring Security, Spring Data JPA |
| Auth       | JWT (JJWT 0.11), BCrypt                          |
| Database   | MySQL 8.0 + Hibernate ORM                        |
| Email      | Spring Mail (JavaMailSender)                     |
| Calendar   | Google Calendar Java Client, Microsoft Graph SDK  |
| API Docs   | SpringDoc OpenAPI 3 (Swagger UI)                  |
| Container  | Docker, Docker Compose, Nginx                    |

---

## 📦 Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.yml build

# Start in detached mode
docker-compose up -d

# Scale backend if needed
docker-compose up -d --scale backend=2

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

For HTTPS production, add SSL certificates to `./nginx/ssl/` and update `nginx.conf` with your domain.

---

## 👥 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built with ❤️ using Spring Boot + React*
