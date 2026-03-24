# 🛠️ Local Android Build Guide (Gradle)

This guide explains how to build the WasteWise Android APK locally on your machine without using Expo's cloud services (EAS).

---

## 📋 Prerequisites

Before you start, ensure you have the following installed and configured:

1.  **JDK 17**: React Native 0.73+ and Expo 50+ require Java 17.
    *   *Checked*: You have `Eclipse Adoptium JDK 17` installed.
2.  **Android SDK**: Installed via Android Studio.
    *   Ensure `ANDROID_HOME` environment variable is set.
    *   Required SDK Platforms: Android 14 (API 34).
3.  **Local IP Address**: Ensure `mobile/src/utils/constants.js` has your computer's local IP.

---

## ⚙️ Configuration Fixes

If you encounter Java version mismatches, ensure your `mobile/android/gradle.properties` contains the correct path to your JDK:

```properties
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-17
```

---

## 🚀 Build Steps

Follow these steps in your terminal:

1.  **Navigate to the Android folder**:
    ```bash
    cd mobile/android
    ```

2.  **Clean the project**:
    This removes old build artifacts and prevents "cache" errors.
    ```bash
    ./gradlew clean
    ```

3.  **Generate Debug APK**:
    Fastest way to test on a real device.
    ```bash
    ./gradlew assembleDebug
    ```

4.  **Generate Release APK (Unsigned)**:
    For a production-like file.
    ```bash
    ./gradlew assembleRelease
    ```

---

## 📂 Where is my APK?

After a successful build, you can find the `.apk` files here:

*   **Debug**: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
*   **Release**: `mobile/android/app/build/outputs/apk/release/app-release.apk`

---

## 🧪 Common Build Errors

### 1. `SDK location not found`
Create a file named `mobile/android/local.properties` and add:
```properties
sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

### 2. `Execution failed for task ':app:checkDebugAarMetadata'`
This usually means a dependency conflict. Run:
```bash
./gradlew clean
```
Then try building again.

### 3. `Daemon will be stopped at the end of the build`
This is usually just a warning about memory. If the build says **BUILD SUCCESSFUL**, you can ignore it.

---

## 📲 Installing on Phone
1. Connect your phone via USB.
2. Enable **USB Debugging** in Developer Options.
3. Run:
   ```bash
   adb install app-debug.apk
   ```
   *(Or just copy the file to your phone and tap to install)*
