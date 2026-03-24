# WasteWise — What We Did (Session Log)

> **Project:** WasteWise2  
> **Stack:** React Native (Expo) + Node.js (Express) + MongoDB Atlas  
> **Purpose:** This file tracks every change made across all sessions in detail — what was broken, what was changed, and why.

---

## 📁 Project Structure Overview

```
wastewise2/
├── backend2/          → Node.js + Express REST API (Port 5000)
├── frontend2/         → Vite web dashboard
├── mobile/            → React Native (Expo) Android app
├── whatwedo.md        → This file
└── .env               → Environment variables (Backend)
```

---

## ══════════════════════════════════════════
## HOW TO BUILD THE APK LOCALLY (No Android Studio)
## ══════════════════════════════════════════

We build the APK directly from the terminal using **Gradle**. No EAS cloud build or Android Studio needed.

### 🚀 Commands to build

1. **Navigate to the android folder**
```bash
cd mobile/android
```

2. **Clean previous artifacts (Recommended)**
```bash
./gradlew clean
```

3. **Build Debug APK (For testing with dev server)**
```bash
./gradlew assembleDebug
```
Output: `app/build/outputs/apk/debug/app-debug.apk`

4. **Build Release APK (Production optimized)**
```bash
./gradlew assembleRelease
```
Output: `app/build/outputs/apk/release/app-release.apk`

---

## ══════════════════════════════════════════
## SESSION — 2026-03-14 (Registration, OTP & IoT Fixes)
## ══════════════════════════════════════════

### 🎯 Goals
1. Fix Registration flow & OTP email service.
2. Build working Android APKs (Debug & Release).
3. Handle "Empty State" for IoT Smart Bins on the map.

---

### 🐛 Backend Fixes

**1. Email Service (`backend2/utils/emailService.js`)**
- **Issue:** `SMTP_HOST` was wrongly set to an email address; transporter created too early.
- **Fix:** Corrected to `smtp.gmail.com`, used factory function for transporter, and added a **very visible console fallback** for the OTP so you can test without real emails.

**2. User Model (`backend2/models/User.js`)**
- **Issue:** Phone validation only allowed exactly 10 digits.
- **Fix:** Relaxed to 7–15 digits to support international formats and testing.

---

### 📱 Mobile (App) Fixes

**1. Registration Flow (`RegisterScreen.js`)**
- **Issue:** Skipped OTP verification after signup.
- **Fix:** Integrated client-side validation and now navigates to the new `OTPVerify` screen upon success.

**2. OTP Verification (`OTPVerifyScreen.js`)**
- **New Feature:** Implemented a dedicated screen for entering the 6-digit OTP. 
- **Details:** 6 individual input boxes, auto-focus next, backspace support, and a resend timer.

**3. Map Screen & IoT (`MapScreen.js`)**
- **Issue:** App repeatedly crashed on physical devices when requesting location permissions or initializing `react-native-maps` / `expo-location`.
- **Fix:** 
    - **Completely bypassed** the Map, Location, and API fetching logic for now.
    - Replaced the entire component with a static **Full-Screen "Coming Soon" Page**.
    - This ensures stability until the underlying native map/location crash causes are debugged in a future session.
    - Uses `LinearGradient` and `lucide-react-native` icons for a premium look.

**4. Build System Fix**
- **Issue:** Build was failing with "Node modules not found" because of a stale cache in `android/build/generated/autolinking/autolinking.json`.
- **Fix:** Manually deleted the `android/build` and `android/app/build` folders to force a clean regeneration of paths.

---

### 📁 Files Changed This Session
- `backend2/.env`
- `backend2/utils/emailService.js`
- `backend2/models/User.js`
- `mobile/src/screens/Auth/RegisterScreen.js`
- `mobile/src/screens/Auth/OTPVerifyScreen.js`
- `mobile/src/navigation/AppNavigator.js`
- `mobile/src/screens/User/MapScreen.js`

---

*Last updated: 2026-03-15 00:50*
