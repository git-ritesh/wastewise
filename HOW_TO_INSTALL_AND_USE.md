# ♻️ WasteWise — Complete Setup & Usage Guide

WasteWise is a smart waste management platform that connects citizens with municipal collectors to create cleaner cities through IoT tracking, reporting, and a gamified reward system.

---

## 🌟 What Does This App Do?

1.  **Smart Waste Reporting**: Spot garbage on the street? Take a photo, and the app automatically attaches your GPS location and sends a report to the municipal team.
2.  **Reward System**: Earn points for every confirmed report you make. These points can be tracked on your personal dashboard.
3.  **IoT Smart Bin Map**: (Backend Integration Active) View a live map of municipal bins and check their fill levels (Green = Empty, Red = Full) before you walk there.
4.  **Collector Portal**: Specialized interface for waste management staff to view tasks and mark areas as cleaned.

---

## 🚀 1. Installation Guide (For End Users)

If you just want to use the app on your Android phone:

1.  Locate the **`WasteWise_v1.0.apk`** in the root directory of this project.
2.  Transfer this file to your Android phone (via USB, Telegram, or Email).
3.  On your phone, open the file to install it. 
    *   *Note: You may need to enable "Install from Unknown Sources" in your Android settings.*
4.  Open the app and register!

---

## 💻 2. Developer Setup (Run from Source)

### Prerequisites:
-   **Node.js** (v18 or v20)
-   **Java SDK** (v17) & **Android SDK** (for mobile builds)
-   **MongoDB Atlas** account (for the database)

### Backend Setup:
1.  Navigate to the `backend2` folder.
2.  Install dependencies: `npm install`.
3.  Create a `.env` file based on the instructions in the `backend2/` directory:
    -   `MONGO_URI`: Your MongoDB connection string.
    -   `JWT_SECRET`: Any random string.
    -   `SMTP_PASS`: Your Gmail App password (for OTPs).
4.  Start the server: `npm run dev`.

### Mobile App Setup:
1.  Navigate to the `mobile` folder.
2.  Install dependencies: `npm install`.
3.  Update the API link:
    -   Open `src/utils/constants.js`.
    -   Replace the `BASE_URL` with your local IP address (e.g., `http://192.168.1.107:5000/api`) or your deployed Cloud URL.
4.  Run in development: `npm start` (opens Expo Go).
5.  Build APK: `cd android && ./gradlew assembleRelease`.

---

## ☁️ 3. Cloud Deployment (Render + GitHub)

See the dedicated **`DEPLOY_GUIDE.md`** for detailed instructions on hosting the backend on Render.com using our pre-configured **Dockerfile**.

---

## 🔧 Troubleshooting

-   **Network Error on Mobile?**
    -   Ensure your phone and computer are on the same WiFi.
    -   Open port 5000 on your PC firewall: `sudo firewall-cmd --zone=public --add-port=5000/tcp --permanent`.
-   **Build Failing?**
    -   Clear the Gradle cache: `cd android && ./gradlew clean`.
    -   Delete `node_modules` and run `npm install` again.
