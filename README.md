# 🎓 Student Performance Tracker

A polished web application for educators to track student performance using a structured 100-point evaluation framework. Built with React, Firebase, and Tailwind CSS for dependable functionality, responsive design, and secure data handling.

![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

## 🔗 Live Demo

[https://student-performance-trac-5f0f4.web.app](https://student-performance-trac-5f0f4.web.app)

---

## ✨ Features

- Secure Firebase email/password authentication
- Teacher-specific student data isolation
- Add, edit, and delete student profiles
- Search and filter students by name or roll number
- Configurable 100-point performance scoring system
- Monthly analytics with charts, cards, and detailed logs
- PDF report export for easy sharing

### Evaluation Categories

| Category | Max Marks | Description |
|----------|-----------|-------------|
| Daily Routine Discipline | 50 | Wake-up, lineup, dining hall, lights out, behavior |
| Hygiene & Turnout | 35 | Grooming, uniform, footwear, belongings |
| Study Discipline (Toye) | 12 | Toye 1 and Toye 2 attendance and performance |
| Sports & Activities | 10 | Sports participation and house events |
| Academics | 25 | Tests, homework, class behavior, improvement |
| Penalty System | Deductions | Minor, serious, and major infractions |
| Bonus | 16 | Cleanliness, punctuality, competitions |

---

## 🧰 Tech Stack

- React 19
- Vite
- Tailwind CSS
- Firebase Auth
- Firestore
- Firebase Hosting
- Recharts
- jsPDF
- Lucide React

---

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/           # Login, Signup, AuthGuard
│   ├── layout/         # Header, Sidebar, Layout
│   ├── roster/         # StudentCard, StudentModal, RosterGrid
│   ├── tracker/        # DetailedMarksForm, rating controls
│   └── reports/        # MonthlyChart, ReportCard, PDFGenerator
├── config/
│   └── marksSystem.js  # 100-point marks configuration
├── context/
│   └── AuthContext.jsx # Global auth state
├── hooks/
│   ├── useAuth.js
│   ├── useStudents.js
│   └── usePerformance.js
├── lib/
│   ├── firebase.js     # Firebase initialization
│   └── utils.js        # Shared utilities
├── pages/
│   ├── DashboardPage.jsx
│   ├── LoginPage.jsx
│   ├── TrackerPage.jsx
│   └── ReportsPage.jsx
└── services/
    ├── authService.js
    ├── performanceService.js
    └── studentService.js
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or newer
- Firebase account

### Installation

```bash
git clone https://github.com/Taranaveed/student-performance-tracker.git
cd student-performance-tracker
npm install
```

### Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable Email/Password authentication.
3. Create a Firestore database.
4. Register a web app and copy the Firebase configuration.
5. Create a `.env` file with your Firebase settings.

Example `.env` values:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Local Development

```bash
npm run dev
```

### Build and Deployment

```bash
npm run build
firebase deploy
```

---

## �‍💻 Author

- Sitara Naveed
- GitHub: [@Taranaveed](https://github.com/Taranaveed)
- Project: student-performance-tracker

---

## �📌 Notes

- Use Firestore security rules to restrict access to authenticated users only.
- Update `.env` with your Firebase configuration before running the app.
- This project is intended for teacher-led tracking of student progress and behavior.
