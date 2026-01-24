# WebGen AI 🚀  
AI-Powered Website Generator  

WebGen AI is an intelligent web application that takes natural language prompts and automatically generates fully functional, responsive websites with layout, content, and styling using AI.

This project was built as part of an ML Internship Assessment task.

---

## ✨ Features

- 🧠 Natural language website generation  
- 🎨 AI-generated layouts, content, and styling  
- 🧩 Reusable UI component system  
- 📱 Fully responsive design (desktop, tablet, mobile)  
- 👀 Live preview of generated websites  
- 📤 Export generated HTML/CSS/JS files  

---

## 🛠️ Tech Stack

### Frontend
- React + TypeScript  
- Vite  
- Custom UI Components  

### Backend
- Python (FastAPI)  
- REST API architecture  

### AI
- Google Gemini API (via Google AI Studio)  

---

## 📂 Project Structure

WebGen_AI/
│
├── backend/ # FastAPI backend server
│ ├── main.py
│ ├── requirements.txt
│
├── components/ # Reusable React UI components
├── services/ # API & Gemini service handlers
│ └── geminiService.ts
│
├── App.tsx # Main React app
├── index.tsx # React entry point
├── vite.config.ts # Vite configuration
├── package.json # Frontend dependencies
└── README.md


---

## ⚙️ Setup Instructions (Local)

### 1️⃣ Clone the repository

```bash
git clone https://github.com/Liozak/WebGen-AI.git
cd WebGen-AI
2️⃣ Backend Setup
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
Create a .env file inside backend/ and add:

GEMINI_API_KEY=your_api_key_here
Run backend:

python main.py
Backend will run at:

http://127.0.0.1:8000
Health check:

http://127.0.0.1:8000/health
3️⃣ Frontend Setup
From root folder:

npm install
npm run dev
Frontend runs at:

http://localhost:3000
🔗 API Endpoints
GET /health → Backend health check

POST /api/projects → Generate website from prompt

🚀 Deployment Plan
Frontend → Vercel

Backend → Render / Railway

Environment variables configured securely in deployment dashboard

📸 Demo
Users can:

Enter a prompt like:
"Create a simple portfolio website for a photographer"

Instantly preview the generated website

Export the final HTML

🔒 Security
API keys are stored in environment variables

.env files are excluded via .gitignore

👤 Author
Zakie Sayyed
B.Tech CSE (AI/ML) — 2026
Aspiring Cybersecurity & AI Engineer

📄 License
This project is for educational and internship assessment purposes.