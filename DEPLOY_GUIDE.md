# 🚀 WasteWise Backend - Deployment Guide (GitHub & Render)

This guide explains how to push your backend to GitHub and host it on the cloud using Render.

---

## 🏗️ Part 1: Push to GitHub

### 1. Initialize Git in the backend folder
Go to your `backend2` directory and run:
```bash
cd backend2
git init
```

### 2. Stage and Commit your code
```bash
git add .
git commit -m "Initial commit for WasteWise Backend with Docker"
```

### 3. Create a Repository on GitHub
1.  Go to [GitHub.com](https://github.com) and create a new **Private** repository named `wastewise-backend`.
2.  Follow the instructions on GitHub to link your local code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/wastewise-backend.git
git branch -M main
git push -u origin main
```

---

## ☁️ Part 2: Deploy to Render.com

### 1. Create a Web Service
1.  Log in to [Render.com](https://render.com).
2.  Click **New +** and select **Web Service**.
3.  Connect your GitHub account and select your `wastewise-backend` repository.

### 2. Basic Configuration
- **Name**: `wastewise-backend`
- **Region**: Select the one closest to you (e.g., Singapore or Frankfurt).
- **Branch**: `main`
- **Root Directory**: `backend2` (Very important since your code is in a subfolder!)
- **Runtime**: `Docker` (Render will automatically detect the `Dockerfile` we created).

### 3. Set Environment Variables (The Key Step)
Render won't have your local `.env` file, so you must enter them manually in the **Environment** tab:
1.  Click the **Environment** tab in Render.
2.  Add the following keys from your `.env`:
    *   `PORT`: `10000` (Render likes to use port 10000 or it will assign one automatically).
    *   `MONGO_URI`: *Your MongoDB connection string*
    *   `JWT_SECRET`: *Your secret key*
    *   `SMTP_USER`: *Your email*
    *   `SMTP_PASS`: *Your app password*

### 4. Direct the App to the New URL
Once Render finishes deploying, it will give you a URL like:
`https://wastewise-backend.onrender.com`

**Update the Mobile App:**
1.  Open `mobile/src/utils/constants.js`.
2.  Change `BASE_URL` from your local IP to this new Render URL:
```javascript
export const BASE_URL = 'https://wastewise-backend.onrender.com/api';
```
3.  Rebuild your **Release APK** one last time. Now, that APK will work anywhere in the world!

---

## 🐳 Why Docker Improves This?
- **Consistency**: Render runs exactly the same "Alpine Linux" image that your Dockerfile defined. No "it works on my machine" issues.
- **Auto-Scale**: If you get more users, Render can spin up more containers in seconds.
- **Portability**: If you decide to move from Render to AWS or Google Cloud, you just take your `Dockerfile` with you. No re-coding needed.
