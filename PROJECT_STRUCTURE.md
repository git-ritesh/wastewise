# WasteWise Project Structure

**Last Updated:** April 29, 2026  
**Total Files:** 120+ (excluding node_modules, build artifacts, git)

---

## 📦 Root Level

```
wastewise/
├── README.md                          # Main project documentation
├── TECH_STACK_REPORT.md              # Comprehensive technology stack analysis
├── DEPLOY_GUIDE.md                    # Deployment instructions for all platforms
├── HOW_TO_INSTALL_AND_USE.md          # Local installation & setup guide
├── credentials.md                     # API credentials and keys (⚠️ not in Git)
├── whatwedo.md                        # Project mission and features
├── package-lock.json                  # Root-level lock file (if any)
│
├── backend/                           # 🔧 Node.js Express API server
├── frontend/                          # 🌐 React web application
└── mobile/                            # 📱 React Native Expo app
```

---

## 🔧 Backend (`/backend`) - Express.js API Server

### Core Application Files
```
backend/
├── server.js                          # Express server entry point (port 5000)
├── package.json                       # Backend dependencies (Express, MongoDB, JWT, etc.)
├── package-lock.json                  # Locked dependency versions
├── Dockerfile                         # Docker containerization (Node 20 Alpine)
├── .env                               # Environment variables (MONGO_URI, JWT_SECRET, etc.)
├── .env.example                       # Template for .env configuration
├── check_bins.js                      # IoT bin status checking utility
├── send_test_data.js                  # Test data generator for development
│
├── config/
│   └── db.js                          # MongoDB connection setup (Mongoose)
│
├── controllers/                       # Route handlers & business logic
│   ├── authController.js              # Login, register, OTP, password reset
│   ├── dashboardController.js         # User reports, leaderboard, report creation
│   ├── collectorController.js         # Collector task management
│   ├── adminController.js             # Admin statistics, report approval
│   ├── rewardController.js            # Reward operations, redemption
│   ├── iotController.js               # Smart bin sensor data handling
│   └── notificationController.js      # Notification retrieval & management
│
├── routes/                            # API endpoint definitions
│   ├── authRoutes.js                  # /api/auth/* → authentication endpoints
│   ├── dashboardRoutes.js             # /api/dashboard/* → report management
│   ├── collectorRoutes.js             # /api/collector/* → collector tasks
│   ├── adminRoutes.js                 # /api/admin/* → admin operations
│   ├── rewardRoutes.js                # /api/rewards/* → reward system
│   ├── iotRoutes.js                   # /api/iot/* → sensor data ingestion
│   ├── notificationRoutes.js          # /api/notifications/* → notifications
│   └── uploadRoutes.js                # /api/upload/* → image uploads
│
├── models/                            # MongoDB Mongoose schemas
│   ├── User.js                        # User schema (email, password, role, rewards)
│   ├── GarbageReport.js               # GarbageReport schema (location, images, status)
│   ├── CollectorProfile.js            # Collector metadata (service areas, status)
│   ├── RewardTransaction.js           # Reward audit trail (earned/redeemed)
│   ├── Notification.js                # User notifications
│   ├── RewardItem.js                  # Reward catalog items
│   └── Dustbin.js                     # IoT smart bin schema
│
├── middleware/                        # Express middleware functions
│   ├── auth.js                        # JWT token verification
│   ├── roleCheck.js                   # Role-based access control (user/collector/admin)
│   ├── upload.js                      # Multer configuration for file uploads
│   └── uploadCloudinary.js            # Cloudinary integration middleware
│
├── services/                          # Business logic services
│   └── notificationService.js         # Socket.io notifications, Socket emit
│
├── utils/                             # Utility functions
│   ├── emailService.js                # SMTP email sending (OTP, notifications)
│   └── generateToken.js               # JWT token generation
│
└── uploads/                           # Temporary upload storage (before Cloudinary)
    └── (empty - files uploaded to Cloudinary)
```

### Backend Key Features
- **Authentication:** JWT-based auth with email/OTP verification
- **Real-Time:** Socket.io for task assignments, status updates
- **Database:** MongoDB with Mongoose ODM, indexed queries
- **Image Hosting:** Multer + Cloudinary integration
- **Validation:** Express-validator for input sanitization
- **Security:** CORS, bcryptjs password hashing, role-based middleware

---

## 🌐 Frontend (`/frontend`) - React Web Application

### Core Application Files
```
frontend/
├── package.json                       # Frontend dependencies (React, Vite, Leaflet, etc.)
├── package-lock.json                  # Locked dependency versions
├── vite.config.js                     # Vite build configuration & dev proxy
├── vercel.json                        # Vercel deployment configuration
├── .env.development                   # Dev environment (API_BASE_URL=localhost:5000)
├── .env.production                    # Prod environment (API_BASE_URL=https://api.wastewise.com)
├── index.html                         # HTML entry point
│
├── src/
│   ├── main.jsx                       # React application entry point
│   ├── App.jsx                        # Root App component with routing
│   ├── App.css                        # Global app styles
│   ├── index.css                      # Global index styles
│   │
│   ├── components/                    # Reusable React components
│   │   ├── Navbar.jsx                 # Navigation bar (header with logout)
│   │   ├── NotificationCenter.jsx     # Notification dropdown/alert center
│   │   ├── NotificationCenter.css     # Notification styles
│   │   ├── ProtectedRoute.jsx         # Auth-gated route wrapper
│   │   │
│   │   └── dashboard/                 # Dashboard-specific components
│   │       ├── ReportForm.jsx         # Create garbage report form (GPS, images, category)
│   │       ├── ReportForm.css         # Report form styles
│   │       ├── ReportsList.jsx        # Display list of user's reports
│   │       ├── Leaderboard.jsx        # Top collectors leaderboard view
│   │       ├── StatsGrid.jsx          # Statistics cards (total reports, points, etc.)
│   │       ├── ProfileCard.jsx        # User profile display card
│   │       └── CollectorLiveMap.jsx   # (Optional) Live collector tracking map
│   │
│   ├── pages/                         # Full-page components (routes)
│   │   ├── Login.jsx                  # Login page
│   │   ├── Register.jsx               # User registration page
│   │   ├── VerifyOTP.jsx              # OTP verification page
│   │   ├── ForgotPassword.jsx         # Forgot password request page
│   │   ├── ResetPassword.jsx          # Password reset with token page
│   │   │
│   │   └── dashboards/                # Role-specific dashboard pages
│   │       ├── Dashboard.css          # Shared dashboard styles
│   │       ├── UserDashboard.jsx      # User main dashboard (reports, rewards)
│   │       ├── CollectorDashboard.jsx # Collector dashboard (task list, map preview, navigation)
│   │       ├── CollectorDashboard.css # Collector dashboard styles
│   │       ├── AdminDashboard.jsx     # Admin dashboard (statistics, report approval)
│   │       ├── AdminDashboard.css     # Admin dashboard styles
│   │       ├── RewardsDashboard.jsx   # Rewards shop & history page
│   │       ├── RewardsDashboard.css   # Rewards page styles
│   │       ├── IoTDashboard.jsx       # Smart bin monitoring dashboard
│   │       └── IoTDashboard.css       # IoT dashboard styles
│   │
│   ├── context/                       # React Context for global state
│   │   ├── AuthContext.jsx            # Authentication state (user, token, isAuthenticated)
│   │   └── NotificationContext.jsx    # Real-time notification state (Socket.io)
│   │
│   └── services/                      # API client & utilities
│       └── api.js                     # Axios HTTP client with interceptors (auth header injection)
```

### Frontend Key Features
- **Routing:** React Router v6 for page navigation
- **State:** Context API for auth & notifications
- **Maps:** Leaflet + React-Leaflet for interactive mapping (OpenStreetMap)
- **HTTP:** Axios with request/response interceptors
- **Real-Time:** Socket.io-client for notifications & updates
- **Build:** Vite for fast dev server & production bundling
- **Deployment:** Vercel/Netlify compatible

---

## 📱 Mobile (`/mobile`) - React Native Expo App

### Core Application Files
```
mobile/
├── App.js                             # Root React Native component (Redux provider, fonts, splash)
├── index.js                           # Expo app entry point
├── package.json                       # Mobile dependencies (React Native, Expo, Redux, etc.)
├── package-lock.json                  # Locked dependency versions
├── app.json                           # Expo app configuration (name, version, permissions, icons)
├── eas.json                           # Expo Application Services config (build profiles)
├── .env                               # Environment variables (API_BASE_URL, SOCKET_URL)
├── .env.example                       # Template for .env
├── README.md                          # Mobile app documentation
├── LOCAL_BUILD_GUIDE.md               # Local APK/IPA build instructions
│
├── assets/
│   ├── icon.png                       # App icon (192x192px, displayed on home screen)
│   ├── splash-icon.png                # Splash screen logo (shown on app launch)
│   ├── adaptive-icon.png              # Android adaptive icon (108x108px)
│   └── (other UI assets)
│
├── src/
│   ├── api/
│   │   └── client.js                  # Axios HTTP client instance (API_BASE_URL config)
│   │
│   ├── redux/                         # Redux state management
│   │   ├── store.js                   # Redux store setup + middleware
│   │   ├── authSlice.js               # Auth state (user, token, isLoading)
│   │   └── (other slices if any)
│   │
│   ├── navigation/
│   │   └── AppNavigator.js            # React Navigation stack navigator (role-based routing)
│   │
│   ├── screens/                       # Full-screen components (app pages)
│   │   │
│   │   ├── Auth/                      # Authentication screens
│   │   │   ├── LoginScreen.js         # Login form (email, password)
│   │   │   ├── RegisterScreen.js      # Registration form (name, phone, address)
│   │   │   └── OTPVerifyScreen.js     # OTP verification for email confirmation
│   │   │
│   │   ├── User/                      # User role screens
│   │   │   ├── UserDashboard.js       # Main dashboard (recent reports, total points)
│   │   │   ├── ReportGarbageScreen.js # Report garbage form (GPS capture, image, category)
│   │   │   ├── MapScreen.js           # View all reports on map
│   │   │   ├── RewardScreen.js        # Rewards & redemption history
│   │   │   └── NotificationScreen.js  # Notifications list
│   │   │
│   │   ├── Collector/                 # Collector role screens
│   │   │   ├── CollectorDashboard.js  # Task list (pending/assigned/completed filters)
│   │   │   └── TaskDetailScreen.js    # Full task info (address, map preview, navigation button)
│   │   │
│   │   └── Admin/                     # Admin role screens
│   │       └── AdminDashboard.js      # Admin statistics & management
│   │
│   ├── context/
│   │   └── RealtimeContext.jsx        # Real-time context (Socket.io subscriptions)
│   │
│   ├── components/                    # Reusable components (if separate from screens)
│   │   └── (UI components)
│   │
│   ├── assets/                        # UI assets (images, icons)
│   │   └── (local images, graphics)
│   │
│   └── utils/                         # Utility functions
│       ├── constants.js               # App-wide constants (colors, endpoints)
│       └── notifications.js           # Expo notification handlers
│
├── android/                           # Android-specific native code
│   ├── app/
│   │   ├── build.gradle               # Android app-level build config (SDK version 36)
│   │   ├── proguard-rules.pro         # ProGuard obfuscation rules
│   │   │
│   │   └── src/
│   │       ├── main/
│   │       │   ├── AndroidManifest.xml        # Android app manifest (permissions, activities)
│   │       │   │   # Permissions: CAMERA, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, POST_NOTIFICATIONS
│   │       │   │
│   │       │   ├── java/com/wastewise/app/   # Java/Kotlin native module code
│   │       │   │
│   │       │   └── res/                      # Android resources
│   │       │       ├── drawable/             # App graphics (SVG/XML)
│   │       │       ├── mipmap-*/             # App icons (ldpi to xxxhdpi)
│   │       │       ├── values/               # Colors, strings, styles (light theme)
│   │       │       └── values-night/         # Dark mode colors
│   │       │
│   │       ├── debug/AndroidManifest.xml    # Debug build variant
│   │       └── debugOptimized/AndroidManifest.xml
│   │
│   ├── build.gradle                   # Project-level Gradle config
│   ├── settings.gradle                # Gradle module settings
│   ├── gradlew                        # Gradle wrapper (Unix)
│   ├── gradlew.bat                    # Gradle wrapper (Windows)
│   └── gradle/wrapper/                # Gradle wrapper JAR & properties
│
└── ios/                               # iOS-specific native code
    └── (iOS Xcode project files - generated by Expo)
```

### Mobile Key Features
- **Framework:** Expo SDK 54 (managed React Native)
- **Navigation:** React Navigation with native-stack navigator
- **State:** Redux + Redux Persist for offline capability
- **Location:** Expo-Location for GPS capture
- **Camera:** Expo-Camera for image capture
- **Maps:** Static map preview (no live native rendering)
- **Navigation:** Deep links to Google Maps / Apple Maps
- **Push Notifications:** Expo-Notifications
- **Styling:** Linear-Gradient, Safe-Area-Context
- **Build:** Gradle for Android; Xcode for iOS
- **Deployment:** Google Play Store (Android), App Store (iOS)

---

## 📊 Database Schema (MongoDB Collections)

While not stored as files, the database structure is defined in `/backend/models/`:

```
MongoDB Collections (Mongoose Schema Files)
├── User.js
│   └── Fields: email, password, role, firstName, lastName, phone, address, avatar, rewardPoints, isVerified
│
├── GarbageReport.js
│   └── Fields: user (ref), title, description, wasteType, estimatedWeight, location {address, coordinates {lat, lng}}, images[], status, assignedCollector, rewardPointsEarned
│
├── CollectorProfile.js
│   └── Fields: user (ref), serviceAreas, vehicleInfo, workingHours, status, tasksCompleted, totalWeightHandled
│
├── RewardTransaction.js
│   └── Fields: user (ref), points, type, description, relatedReport, status
│
├── Notification.js
│   └── Fields: recipient (ref), title, message, type, relatedId, isRead
│
├── RewardItem.js
│   └── Fields: name, description, pointsRequired, quantity, image
│
└── Dustbin.js
    └── Fields: binId, location {address, latitude, longitude}, fillLevel, status
```

---

## 🔐 Configuration & Environment Files

```
Config Files (Git-ignored)
├── backend/.env                      # Backend secrets (MONGO_URI, JWT_SECRET, CLOUDINARY_*, SMTP_*)
├── backend/.env.example              # Template for backend/.env
├── frontend/.env.development         # Frontend dev config (API_BASE_URL=http://localhost:5000)
├── frontend/.env.production          # Frontend prod config (API_BASE_URL=https://api.wastewise.com)
├── mobile/.env                       # Mobile config (EXPO_PUBLIC_API_BASE_URL)
└── mobile/.env.example               # Template for mobile/.env
```

---

## 📚 Documentation Files

```
Documentation (Root Level)
├── README.md                         # Main project overview & quick start
├── TECH_STACK_REPORT.md              # Detailed technology analysis (20 sections)
├── DEPLOY_GUIDE.md                   # Production deployment steps (all platforms)
├── HOW_TO_INSTALL_AND_USE.md         # Local setup & development instructions
├── credentials.md                    # API keys & credentials (⚠️ never commit)
├── whatwedo.md                       # Project mission & features
│
├── mobile/README.md                  # Mobile app specific docs
├── mobile/LOCAL_BUILD_GUIDE.md       # Local APK/IPA build instructions
```

---

## 🔨 Build & Configuration Files

```
Build Configuration
├── backend/Dockerfile                # Docker containerization (Node 20 Alpine, port 5000)
├── frontend/vite.config.js           # Vite bundler config (dev proxy, plugins)
├── frontend/vercel.json              # Vercel deployment config
├── mobile/app.json                   # Expo app config (name, version, permissions, icons)
├── mobile/eas.json                   # Expo Application Services build config
├── mobile/android/app/build.gradle   # Android build config (SDK, dependencies, signing)
├── mobile/android/settings.gradle    # Android module configuration
├── mobile/android/build.gradle       # Android project-level config
├── mobile/android/app/proguard-rules.pro  # ProGuard obfuscation rules
├── mobile/android/settings.gradle    # Android gradle settings
```

---

## 📋 Summary Statistics

| Aspect | Count | Details |
|---|---|---|
| **Total Files** | 120+ | Excluding node_modules, build, .git |
| **Backend Controllers** | 7 | auth, dashboard, collector, admin, rewards, iot, notifications |
| **Backend Models** | 7 | User, Report, Collector, Reward, Notification, Dustbin, RewardItem |
| **Backend Routes** | 8 | auth, dashboard, collector, admin, rewards, iot, notifications, upload |
| **Frontend Pages** | 10+ | Login, Register, OTP, Forgot Password, Reset Password, User/Collector/Admin Dashboard, Rewards |
| **Frontend Components** | 15+ | Navbar, NotificationCenter, ReportForm, ReportsList, Leaderboard, StatsGrid, ProfileCard, etc. |
| **Mobile Screens** | 12+ | Auth (3), User (5), Collector (2), Admin (1), + shared components |
| **MongoDB Collections** | 7 | User, GarbageReport, CollectorProfile, RewardTransaction, Notification, RewardItem, Dustbin |
| **Database Indexes** | 4+ | (user, status), (status, createdAt), geospatial location, unique email |
| **Languages** | 4 | JavaScript (backend, web, mobile), Java/Kotlin (Android native) |
| **API Endpoints** | 40+ | Across /auth, /dashboard, /collector, /admin, /rewards, /iot, /notifications, /upload |
| **Platforms** | 3 | Web (React), Mobile (React Native), API (Express.js) |

---

## 🎯 Key Directories Quick Reference

```
Quick Path Guide:
├── Backend API Logic        → /backend/controllers/
├── Database Schemas         → /backend/models/
├── API Routes               → /backend/routes/
├── Web Components           → /frontend/src/components/
├── Web Pages                → /frontend/src/pages/
├── Mobile Screens           → /mobile/src/screens/
├── Mobile State (Redux)     → /mobile/src/redux/
├── Environment Config       → .env files (each folder)
├── Deployment Config        → Dockerfile, vite.config.js, app.json, vercel.json
├── Documentation            → *.md files (root + mobile/)
└── Live Database            → MongoDB (Atlas or local)
```

---

## 🔄 File Relationships

```
Data Flow:
Web Frontend                Mobile App
    ↓                           ↓
    └─→ Axios API Client ←─────┘
            ↓
    Express.js Routes (backend/routes/)
            ↓
    Controllers (backend/controllers/)
            ↓
    Mongoose Models (backend/models/)
            ↓
        MongoDB
            ↓
    Cloudinary (images)
    OpenStreetMap (tiles)
    Google Maps (navigation)
    SMTP Server (emails)
```

---

## 🚀 Development Workflow

```
Make Changes
    ↓
Frontend:  npm run dev          (Vite HMR on :5173)
Backend:   npm run dev          (Nodemon auto-restart on :5000)
Mobile:    npm start            (Expo Metro on :8081)
    ↓
Test locally
    ↓
Build:
  Frontend:  npm run build      → dist/ folder
  Backend:   docker build       → container image
  Mobile:    ./gradlew assembleDebug  → APK (45MB)
    ↓
Deploy:
  Frontend:  Upload to Vercel/Netlify
  Backend:   Deploy container to EC2/GCP/Heroku
  Mobile:    Upload APK to Google Play Store
```

---

## 📦 Dependencies Overview

See **TECH_STACK_REPORT.md** for complete dependency details, including:
- All 50+ npm packages with versions
- Purpose of each technology
- Configuration for each tool
- Third-party service integrations

---

**End of Project Structure Documentation**
