# ⚡ GATE EEE Intelligent Preparation System

A full-stack, AI-powered GATE EEE (Electrical & Electronics Engineering) preparation platform that acts as your personal mentor, tracker, and analyzer.

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Charts | Recharts + Chart.js |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| AI Mentor | OpenAI GPT-3.5 (optional) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

---

### 1. Clone & Setup

```bash
# After unzipping the project
cd gate-eee-system
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your values:
# MONGODB_URI=mongodb://localhost:27017/gate_eee_db
# JWT_SECRET=your_random_secret_here_change_this
# OPENAI_API_KEY=sk-...  (optional - for AI mentor)

# Seed the database with EEE curriculum
npm run seed

# Start the backend server
npm run dev
```

Backend runs on: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

### 4. Open in Browser

Navigate to `http://localhost:5173`

1. **Sign up** for a new account
2. **Complete onboarding** (level, exam date, daily goal)
3. **Explore the dashboard** and all features

---

## 📁 Project Structure

```
gate-eee-system/
├── backend/
│   ├── config/
│   │   └── db.js                  # Database connection
│   ├── middleware/
│   │   └── auth.js                # JWT authentication
│   ├── models/
│   │   ├── User.js                # User schema + XP/rank logic
│   │   ├── Subject.js             # Subject schema
│   │   ├── Topic.js               # Topic schema + PYQ tags
│   │   ├── Performance.js         # Per-topic performance + SM-2
│   │   └── index.js               # StudyLog, Test, Error, Revision
│   ├── routes/
│   │   ├── auth.js                # Signup, login, profile
│   │   ├── studyLogs.js           # Study session logging
│   │   ├── analytics.js           # Dashboard + cognitive state
│   │   ├── tests.js               # Mock test submission + analysis
│   │   ├── errors.js              # Error intelligence
│   │   ├── revision.js            # Spaced repetition
│   │   ├── subjects.js            # Subject listing
│   │   ├── topics.js              # Topic listing + unlock
│   │   ├── performance.js         # Performance heatmap
│   │   └── ai.js                  # AI mentor + daily plan
│   ├── utils/
│   │   └── seeder.js              # Full EEE curriculum seeder
│   ├── server.js                  # Express app entry
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Layout/
    │   │       └── AppLayout.jsx  # Sidebar + navigation
    │   ├── context/
    │   │   └── AuthContext.jsx    # Auth state management
    │   ├── pages/
    │   │   ├── LoginPage.jsx      # Login
    │   │   ├── SignupPage.jsx     # Registration
    │   │   ├── OnboardingPage.jsx # Initial setup wizard
    │   │   ├── DashboardPage.jsx  # Main dashboard
    │   │   ├── StudyTrackerPage.jsx
    │   │   ├── AnalyticsPage.jsx
    │   │   ├── MockTestPage.jsx
    │   │   ├── AIMentorPage.jsx
    │   │   ├── SubjectsPage.jsx
    │   │   ├── ErrorsPage.jsx
    │   │   ├── RevisionPage.jsx
    │   │   └── ProfilePage.jsx
    │   ├── services/
    │   │   └── api.js             # Axios API client
    │   ├── App.jsx                # Router setup
    │   ├── main.jsx               # React entry
    │   └── index.css              # Tailwind + global styles
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/onboarding` | Complete onboarding |
| PUT | `/api/auth/profile` | Update profile |

### Study & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/study-logs` | Log study session |
| GET | `/api/study-logs` | Get study history |
| GET | `/api/study-logs/heatmap` | Annual heatmap data |
| GET | `/api/analytics/dashboard` | Full dashboard data |
| GET | `/api/analytics/progress` | Progress trends |
| GET | `/api/analytics/cognitive` | Cognitive state detection |

### Tests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tests/submit` | Submit test for analysis |
| GET | `/api/tests` | Test history |
| GET | `/api/tests/:id` | Single test details |

### Errors & Revision
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/errors` | Error log |
| POST | `/api/errors` | Log new error |
| PUT | `/api/errors/:id/resolve` | Mark error resolved |
| GET | `/api/revision/due` | Due revisions |
| POST | `/api/revision/complete` | Mark revision done |

### AI Mentor
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/chat` | Chat with AI mentor |
| GET | `/api/ai/daily-plan` | Get today's AI plan |

---

## 🧠 Key Features

### 1. Smart Health Score
Calculated from: Consistency (30%) + Accuracy (40%) + Mastery (30%)

### 2. SM-2 Spaced Repetition
Uses the SuperMemo-2 algorithm for optimal revision scheduling:
- Ease factor adjusts based on recall quality
- Retention decay modeled with Ebbinghaus forgetting curve

### 3. Cognitive State Detection
Automatically detects: Fresh → Focused → Fatigued → Burned Out
Based on recent study hours and performance trends.

### 4. Error Fingerprint
Categorizes mistakes into: Concept / Formula / Calculation / Reading / Time-Pressure
Identifies patterns and suggests targeted interventions.

### 5. XP & Rank System
- Earn XP from study sessions, tests, and revisions
- Ranks: Apprentice → Scholar → Engineer → Expert → Master → GATE Champion

### 6. AI Mentor (with or without OpenAI)
- With OpenAI key: GPT-3.5 powered with real student context
- Without key: Smart rule-based responses using your actual performance data

---

## 🔧 Configuration

### Using MongoDB Atlas (Cloud)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gate_eee_db
```

### Enabling AI Mentor
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```
Get your key at: https://platform.openai.com

---

## 🏗️ Production Build

```bash
# Frontend production build
cd frontend
npm run build

# Backend production start
cd backend
NODE_ENV=production npm start
```

---

## 📊 EEE Curriculum Coverage

| Stage | Subject | GATE Weightage |
|-------|---------|---------------|
| 1 | Engineering Mathematics | 13% |
| 1 | Circuit Theory | 15% |
| 2 | Signals & Control Systems | 18% |
| 2 | Analog Circuits | 8% |
| 2 | Digital Circuits | 4% |
| 3 | Electrical Machines | 14% |
| 4 | Power Electronics | 12% |
| 5 | Power Systems | 16% |

**Total: 100%** — Complete GATE EEE syllabus coverage

---

## 🎯 Design System

| Color | Hex | Usage |
|-------|-----|-------|
| Navy Blue | `#0A3D62` | Primary brand, buttons, sidebar |
| Gold | `#D4AF37` | Highlights, achievements, accents |
| White | `#FFFFFF` | Cards, backgrounds |
| Surface | `#F5F5F5` | Page background |

---

*Built for GATE EEE aspirants who want more than just a study app — a full intelligent preparation ecosystem.*
