# ZeroClutter

ZeroClutter is a smart file deduplication assistant that helps users automatically detect and remove duplicate content across their Google Drive, Gmail, and local storage. It is built to streamline digital clutter by scanning and analyzing files, emails, and attachments to surface redundant data and offer one-click cleanup suggestions.

Whether you're dealing with duplicate PDFs, repeated email attachments, or cloned local files, ZeroClutter intelligently surfaces duplicates based on content hashes and metadata. It's ideal for anyone looking to keep their cloud and local environments tidy — with full visibility and control through an intuitive dashboard.

---

## 🧠 Tech Stack

### AI & NLP (Smart Scanning & Deduplication)
- **Flask (Python)** – Lightweight API layer powering AI-based scanning features
- **BERTopic** – Topic modeling and clustering for grouping similar emails/files
- **scikit-learn** – For clustering, TF-IDF vectorization, and similarity metrics
- **SentenceTransformers** – Semantic embedding of textual data using transformer models
- **NLTK** – For preprocessing, tokenization, and text cleaning

### 🌐 Backend (Core API & Services)
- **Node.js + Express.js** – Main backend server handling API logic, authentication, and scanning orchestration
- **Google APIs (Gmail + Drive)** – OAuth 2.0 integration to fetch and scan Gmail and Drive content
- **PostgreSQL** – Stores users, scanned metadata, duplicate analysis, and activity logs

### 🖥️ Frontend
- **React.js** – Components for dynamic UI rendering
- **Tailwind CSS** – Utility-first CSS framework for rapid and responsive styling

### 🔐 Authentication & Security
- **Google OAuth 2.0** – Secure sign-in and access to Gmail & Drive data

---

## ✨ Features

### 🔐 Google OAuth 2.0 Authentication
- Seamless login using your Google account
- Secure access to Gmail and Google Drive with read-only scopes

### 📈 Storage Insights
- View Google account storage usage across Drive, Gmail, and Photos
- Clear breakdown with usage percentages and health status

### 🕒 Last Scan Tracker
- View timestamps of the last scan on Drive, Gmail, and Local

### 🧠 AI-Based Email Analysis
- Group emails by topic using BERTopic
- Declutter suggestions for email clusters

### 📬 Gmail Tools
- Fetch Emails, Trash/Spam Inspector, Promotions View
- Detect duplicate threads and old emails
- Smart Suggestion: Identify emails unopened for 6+ months

### ☁️ Drive Tools
- List files, detect duplicates, empty trash
- Generate duplicate reports

### 💻 Local Folder Tools
- Scan local folders for duplicate files
- Preview and delete duplicates from your system

### 📊 Unified Activity Dashboard
- Track activity across Drive, Gmail, and Local
- Real-time updates with icons and timestamps

---
