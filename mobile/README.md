# 🗑️ WasteWise Mobile Project

A React Native application for smart waste management, built with Expo and Redux.

## 🚀 Features
- **User Dashboard**: Track reward points and waste stats.
- **Reporting**: Report garbage with camera snapshots and GPS location.
- **Maps**: Discover nearby dustbins via interactive maps.
- **Collector Mode**: Task management for waste collectors with proof-of-work uploads.
- **Rewards**: Transaction history of earned points.

---

## 🛠️ Step 1: Pre-requisites
1. **Node.js**: Installed on your computer.
2. **Local IP Address**: You need your computer's IP (e.g., `192.168.1.101`).
   - Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) in terminal.
3. **Expo Go (Optional)**: Download the "Expo Go" app from Play Store/App Store for instant testing.

---

## ⚙️ Step 2: Configuration
Open `src/utils/constants.js` and update the `BASE_URL` with your computer's IP:
```javascript
export const BASE_URL = 'http://192.168.1.101:5000/api'; // Replace with your IP
```

---

## 💻 Step 3: Running Locally (Development)
1. Navigate to the `mobile` folder:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Metro Bundler:
   ```bash
   npx expo start
   ```
4. **Test on Phone**: Scan the QR code with the **Expo Go** app.
   *(Phone and Computer must be on the same Wi-Fi network)*.

---

## 📦 Step 4: Building the APK (Cloud Build)
Since build tools like Android Studio are not required locally, we use **EAS Build**.

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```
2. **Login to Expo**:
   ```bash
   eas login
   ```
3. **Trigger Build**:
   ```bash
   eas build -p android --profile preview
   ```
4. **Wait & Download**: Once finished, download the APK from the link provided in the terminal.

---

## 📲 Step 5: Installation
1. Transfer the downloaded APK to your Android device.
2. Open the file on your phone.
3. If prompted, allow "Installation from unknown sources".
4. Open **WasteWise** and log in!

---

## 🧪 Troubleshooting
- **Network Error**: Ensure your computer's firewall is not blocking port `5000`.
- **IP Change**: If you restart your router, your IP might change. Update `constants.js` and rebuild.
- **Backend**: Ensure the backend server is running (`npm run dev` in the `backend` folder).
