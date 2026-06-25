# TaskMaster - Modern Todo List App

A full-featured productivity application built with React, TypeScript, and Tailwind CSS. Features task management with priorities & timers, calendar planner, notes, pomodoro timer, and dashboard — all with authentication, optional cloud sync, and native app builds.

![TaskMaster](https://img.shields.io/badge/TaskMaster-Productivity-indigo)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-teal)
![Firebase](https://img.shields.io/badge/Firebase-Optional-orange)

## ✨ Features

### 📋 Task Management
- Create, complete, and delete tasks with **priority levels** (high/medium/low)
- **Due dates** with date picker and **date-wise grouping** (Today, Tomorrow, Overdue)
- **Per-task countdown timers** (5 min to custom duration) with play/pause/reset
- **Tags** — add comma-separated tags to tasks for categorization
- Hide completed tasks toggle, clear completed, overdue warnings
- Visual progress indicators per date group

### 📅 Calendar Planner
- Interactive monthly calendar view
- Create events with title, description, time, and color (8 options)
- Quick navigation (Today, Previous/Next month)
- Upcoming events preview (7 days)
- Click any date to view/add events

### 📝 Notes
- Create and edit rich notes
- 8 color-coded backgrounds
- Pin/unpin important notes
- Search notes by title or content
- Grid layout with hover actions

### ⏱️ Pomodoro Timer
- Configurable work duration, short break, and long break
- SVG ring countdown animation
- Audio notification on completion
- Session counter stored in localStorage
- Timer state preserved across tab switches

### 📊 Dashboard
- KPI cards (total tasks, completed, active, overdue)
- SVG completion rate ring chart
- Active tasks by priority with horizontal bars
- 7-day completion activity chart
- Tag cloud with usage counts
- Overview summary (events, notes, pomodoro sessions)

### 🔍 Global Search
- Press `⌘K` (or `Ctrl+K`) to open search modal
- Searches across tasks (including tags), events, and notes
- Results grouped by type with highlighted matches

### 🌙 Dark Mode
- Toggle via header button
- Persists to localStorage
- Respects system `prefers-color-scheme`
- Full Tailwind `dark:` variant support across all components

### 🔐 Authentication
- **Email/Password** sign in & sign up
- **Google Sign-In** (with Firebase)
- Password reset functionality
- Persistent sessions
- User profile with stats

### ☁️ Data Storage
- **Local Mode**: Works without any setup — data persisted via REST API server
- **Cloud Mode**: With Firebase — real-time sync across devices via Firestore
- **Export/Import** — download all data as JSON or upload to restore

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

3. **Start the development server** (local API mode)
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
| `npm run build:mac` | Build macOS DMG (Intel) via Electron |
| `npm run build:mac:arm` | Build macOS DMG (Apple Silicon) via Electron |
| `npm run build:apk` | Build Android APK via Capacitor |

---

## 🖥️ Desktop Build (macOS DMG)

Build the app as a native macOS application using Electron.

### Prerequisites
- macOS (builds are platform-specific)
- [electron-builder](https://www.electron.build/) (included in devDependencies)

### Build for Intel Macs
```bash
npm run build:mac
```

### Build for Apple Silicon (M1/M2/M3)
```bash
npm run build:mac:arm
```

The DMG file will be output to `electron-build/TaskMaster-<version>.dmg` and `dist_electron/`.

---

## 📱 Android Build (APK)

Build the app as an Android APK using Capacitor.

### Prerequisites
- [Android Studio](https://developer.android.com/studio) with Android SDK
- Java 17+
- Gradle (bundled with Android Studio)

### Build Steps

1. **Build the web app**
   ```bash
   npm run build
   ```

2. **Sync with Capacitor**
   ```bash
   npx cap sync android
   ```

3. **Open in Android Studio**
   ```bash
   npx cap open android
   ```

4. **Generate APK** (in Android Studio)
   - Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   - Find the APK at `android/app/build/outputs/apk/debug/app-debug.apk`

Alternatively, build directly from the command line:
```bash
cd android && ./gradlew assembleDebug
```

The APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.

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
│   │   ├── AuthPage.tsx       # Sign in/Sign up page
│   │   ├── TodoList.tsx       # Task management with priorities, timers, tags
│   │   ├── Planner.tsx        # Calendar planner component
│   │   ├── Notes.tsx          # Notes component
│   │   ├── Pomodoro.tsx       # Pomodoro timer with SVG ring
│   │   ├── Dashboard.tsx      # Stats dashboard with charts
│   │   └── SearchModal.tsx    # Global search modal
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Authentication context (local + Firebase)
│   │   └── ThemeContext.tsx   # Dark mode context with localStorage
│   ├── hooks/
│   │   ├── useFirestore.ts   # Firestore real-time sync hook
│   │   ├── useApiCollection.ts # Local REST API hook
│   │   └── useLocalStorage.ts # localStorage hook
│   ├── utils/
│   │   ├── cn.ts             # Tailwind class merger
│   │   └── dates.ts          # Date formatting utilities
│   ├── App.tsx               # Main app with tab routing
│   ├── firebase.ts           # Firebase configuration
│   ├── types.ts              # TypeScript interfaces
│   └── main.tsx              # Entry point
├── electron/
│   ├── main.cjs             # Electron main process
│   └── preload.cjs          # Electron preload script
├── android/                 # Android (Capacitor) project
├── capacitor.config.ts      # Capacitor configuration
├── index.html
├── package.json
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
- **Database**: Firebase Firestore (optional) + REST API fallback
- **Desktop**: Electron + electron-builder
- **Mobile**: Capacitor (Android)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

> **Note:** For any app changes, enhancements, or PRs — please reach out to the author first to discuss the scope and ensure alignment.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Sachi Sagar**

- GitHub: [@SachiSagar5](https://github.com/SachiSagar5)

---

Made with ❤️ using React + Tailwind CSS
