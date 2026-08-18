# OmniQuery AI - Intelligent Enquiry Bot with SQLite & Google Colab API Bridge

A full-stack, enterprise-grade Enquiry Bot web application built with **React, Vite, Tailwind CSS, Node.js, SQLite3**, and a **Google Colab API bridge**.

---

## 🌟 Key Features

1. **Futuristic Dark Glassmorphism UI**:
   - **Interactive Chat Assistant**: Quick Q&A suggestion chips, voice synthesis (text-to-speech), speech-to-text dictation simulator, and typing indicators.
   - **Source Transparency Badges**: Real-time indicators showing response origin (`⚡ Google Colab LLM` vs `💾 SQLite KB` vs `ℹ️ System Fallback`).
   - **Instant Lead Transfer**: Convert any chat response into a formal enquiry lead with 1 click.

2. **SQLite Lead Capture & Knowledge Base**:
   - **Structured Lead Form**: Full field validation (Name, Email, Phone, Category, Subject, Priority, Message).
   - **SQLite Database Persistence**: All leads and chat query histories are saved in `backend/enquiry_bot.db`.
   - **Admin Analytics Dashboard**: Metrics cards, search & category filters, status triage dropdowns (`pending`, `in_progress`, `resolved`), and 1-click **CSV Export**.

3. **Google Colab API Bridge**:
   - **Dynamic URL Manager**: Easily connect and test live Google Colab Ngrok / Localtunnel HTTPS endpoints.
   - **Routing Engine Modes**: Toggle between **Hybrid Mode** (tries Colab first, falls back to SQLite KB), **Colab Only**, or **SQLite KB Only**.
   - **Ready-to-Run Google Colab Package**:
     - `colab/colab_enquiry_bot.ipynb`: Step-by-step Jupyter Notebook for 1-click execution in Google Colab.
     - `colab/colab_server.py`: Standalone Python FastAPI server script with Ngrok tunnel.

---

## 🚀 Quick Start Guide

### 1. Install & Run Locally

```bash
# Install dependencies
npm install

# Start both Node.js SQLite Backend (port 5000) and Vite React Frontend (port 3000)
npm start
```

Open your browser at [http://localhost:3000](http://localhost:3000).

---

## 🔗 Connecting Google Colab API

1. Open `colab/colab_enquiry_bot.ipynb` in [Google Colab](https://colab.research.google.com).
2. Execute the cells to install dependencies (`fastapi`, `pyngrok`, `uvicorn`) and start the FastAPI tunnel.
3. Copy the printed Ngrok HTTPS URL (e.g. `https://xxxx-xx-xxx-xxx-xx.ngrok-free.app`).
4. In the Enquiry Bot web app, go to the **Colab Settings** tab, paste the URL, and click **Save & Test Connection**!

---

## 📁 Project Structure

```
Enquiry_Bot/
├── backend/
│   ├── db.js                 # SQLite schema initialization & query helpers
│   ├── server.js             # Express API server & proxy router
│   └── enquiry_bot.db        # SQLite database (auto-created)
├── colab/
│   ├── colab_enquiry_bot.ipynb # Google Colab Jupyter Notebook
│   └── colab_server.py       # FastAPI Python backend script
├── src/
│   ├── components/
│   │   ├── Navbar.jsx        # Glassmorphism header & connection status
│   │   ├── ChatBot.jsx       # Interactive live chat assistant
│   │   ├── EnquiryForm.jsx   # Customer lead capture form
│   │   ├── AdminDashboard.jsx# Admin metrics & SQLite lead table
│   │   └── ColabSettings.jsx # Colab API connection panel & guide
│   ├── context/
│   │   └── AppContext.jsx    # Global state & API provider
│   ├── App.jsx               # App shell & router tabs
│   ├── main.jsx              # React entrypoint
│   └── index.css             # Design tokens & Tailwind utilities
├── package.json
└── vite.config.js
```