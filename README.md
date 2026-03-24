# 🗑️ WasteWise: Smart Waste Management System

WasteWise is a comprehensive solution for urban waste management, featuring a mobile app for citizens and collectors, a web admin dashboard for oversight, and an IoT-ready backend for real-time monitoring.

---

## 🏗️ Project Architecture
- **Backend**: Node.js, Express, MongoDB, Socket.io (Real-time updates)
- **Mobile**: React Native (Expo), Redux Toolkit, Lucide Icons
- **Frontend**: React (Vite/Tailwind) - Admin Dashboard

---

## 🛠️ Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance or MongoDB Atlas URI)
- **EAS CLI** (`npm install -g eas-cli`) for mobile builds
- **Expo Go** (On your mobile device for testing)

---

## 📡 Backend Setup
The backend serves both the mobile app and the web dashboard.

1.  **Navigate to Folder**:
    ```bash
    cd backend
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Variables**: Create a `.env` file in the `backend` folder:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_atlas_uri
    JWT_SECRET=your_secret_key
    CLIENT_URL=http://localhost:5173
    ```
4.  **Run Dev Server**:
    ```bash
    npm run dev
    ```
5.  **Seed Test Data** (Important for first-time setup):
    ```bash
    node seed_test_data.js
    ```

---

## 📱 Mobile App Setup
The mobile app handles garbage reporting, reward tracking, and bin discovery.

1.  **Navigate to Folder**:
    ```bash
    cd mobile
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Configure API URL**:
    Open `src/utils/constants.js` and update the `BASE_URL` with your **Local IP Address**:
    ```javascript
    export const BASE_URL = 'http://192.168.x.x:5000/api';
    ```
    *Tip: Find your IP by running `ipconfig` (Windows) or `ifconfig` (Mac).*

4.  **Run Development Server**:
    ```bash
    npx expo start
    ```
5.  **Open on Device**: Scan the QR code with the **Expo Go** app.

### 📦 Building the APK
To create a standalone installable file:
1.  **Login to Expo**: `eas login`
2.  **Build**: `eas build -p android --profile production`
3.  **Download**: Download the APK from the link provided after the build finishes.

---

## 💻 Web Frontend Setup (Admin/Collector Site)
1.  **Navigate to Folder**:
    ```bash
    cd frontend
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Run Dev Server**:
    ```bash
    npm run dev
    ```

---

## 🧪 Common Fixes & Troubleshooting
- **EADDRINUSE (Port 5000 busy)**: Another process is using the port. Run `npx kill-port 5000` to clear it.
- **Network Error in Mobile**: Ensure your phone and computer are on the same Wi-Fi. Check that your Windows Firewall isn't blocking port 5000.
- **Camera/Location Crash**: Ensure you are using a physical device. Emulators often struggle with camera permissions.
- **Points not showing**: Use the `seed_test_data.js` script in the backend to populate your account with initial data.

---

## 📜 Repository Structure
- `/backend`: Express API, Mongoose Models, Controllers.
- `/mobile`: React Native app source code.
- `/frontend`: Admin Dashboard web application.
- `/backend/uploads`: Store for reported garbage images.
