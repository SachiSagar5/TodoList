# TaskMaster - Modern Todo List App

A full-featured productivity application built with React, TypeScript, and Tailwind CSS. Features task management, calendar planner, and notes — all with authentication and optional cloud sync.

![TaskMaster](https://img.shields.io/badge/TaskMaster-Productivity-indigo)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-teal)
![Firebase](https://img.shields.io/badge/Firebase-Optional-orange)

## ✨ Features

### 📋 Task Management
- Create, complete, and delete tasks
- **Due dates** with date picker
- **Date-wise grouping** (Today, Tomorrow, Overdue, etc.)
- **Hide completed tasks** toggle
- Visual progress indicators per date group
- Overdue task warnings

### 📅 Calendar Planner
- Interactive monthly calendar view
- Create events with title, description, time, and color
- 8 color options for event categorization
- Quick navigation (Today, Previous/Next month)
- Upcoming events preview (7 days)
- Click any date to view/add events

### 📝 Notes
- Create and edit rich notes
- 8 color-coded backgrounds
- Pin/unpin important notes
- Search notes by title or content
- Grid layout with hover actions

### 🔐 Authentication
- **Email/Password** sign in & sign up
- **Google Sign-In** (with Firebase)
- Password reset functionality
- Persistent sessions
- User profile with stats

### ☁️ Data Storage
- **Local Mode**: Works without any setup — data stored in browser localStorage
- **Cloud Mode**: With Firebase — real-time sync across devices via Firestore

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SachiSagar5/TodoList.git
   cd TodoList
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

That's it! The app works immediately in **Local Mode** — no additional setup required.

---

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start development server (http://localhost:5173) |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |

---

## ☁️ Firebase Setup (Optional)

To enable **cloud sync** and **Google Sign-In**, set up Firebase:

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" and follow the wizard
3. Once created, click the **Web** icon (</>) to add a web app
4. Register your app and copy the config values

### Step 2: Enable Authentication
1. In Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** (optional, for Google Sign-In)

### Step 3: Create Firestore Database
1. In Firebase Console → **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (for development)
4. Select a location closest to your users

### Step 4: Add Environment Variables
Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:0000000000000000
```

### Step 5: Restart the server
```bash
npm run dev
```

The app will automatically detect Firebase and switch to **Cloud Mode**.

---

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── AuthPage.tsx      # Sign in/Sign up page
│   │   ├── TodoList.tsx      # Task management component
│   │   ├── Planner.tsx       # Calendar planner component
│   │   └── Notes.tsx         # Notes component
│   ├── contexts/
│   │   └── AuthContext.tsx   # Authentication context (local + Firebase)
│   ├── hooks/
│   │   ├── useFirestore.ts   # Firestore real-time sync hook
│   │   └── useLocalStorage.ts # localStorage hook
│   ├── utils/
│   │   ├── cn.ts             # Tailwind class merger
│   │   └── dates.ts          # Date formatting utilities
│   ├── App.tsx               # Main app component
│   ├── firebase.ts           # Firebase configuration
│   ├── types.ts              # TypeScript interfaces
│   └── main.tsx              # Entry point
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4.1
- **Icons**: Lucide React
- **Build Tool**: Vite 7
- **Authentication**: Firebase Auth (optional) + Local Auth fallback
- **Database**: Firebase Firestore (optional) + localStorage fallback

---

## 📱 Screenshots

### Authentication
- Clean sign in / sign up forms
- Mode indicator (Local vs Cloud)
- Google Sign-In support

### Dashboard
- Tab navigation (Tasks, Planner, Notes)
- User profile with stats
- Responsive design

### Tasks
- Date-grouped task lists
- Completion toggle
- Hide completed option

### Planner
- Monthly calendar grid
- Color-coded events
- Event creation modal

### Notes
- Grid of color-coded notes
- Pin functionality
- Search filter

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Sachi Sagar**

- GitHub: [@SachiSagar5](https://github.com/SachiSagar5)

---

Made with ❤️ using React + Tailwind CSS
