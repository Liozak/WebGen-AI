# WebGen AI - Full Stack with Database

A full-stack AI-powered website generator with persistent project history.

## Prerequisites

- Node.js (Frontend)
- Python 3.9+ (Backend)
- MongoDB (Database)
- A Google Gemini API Key

## Setup

### 1. Database (MongoDB)

Ensure you have MongoDB installed and running locally, or have a connection string for a remote instance (e.g., MongoDB Atlas).

- Default Local URI: `mongodb://localhost:27017`

### 2. Backend (FastAPI)

Navigate to the `backend` folder.

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Configure Environment
export GEMINI_API_KEY="your_api_key_here"
export MONGO_URI="mongodb://localhost:27017" # Optional
export PORT=8000 # Optional

# Run Server
python backend/main.py
```
The backend runs at `http://localhost:8000`. 
Verify connectivity by opening `http://localhost:8000/health`. It should return `{"status": "ok"}`.

### 3. Frontend (React)

```bash
# Install dependencies
npm install

# Configure Backend URL (Optional)
# If your backend runs on a different port or host:
export VITE_BACKEND_URL="http://localhost:8000"

# Run Development Server
npm start
```
The frontend runs at `http://localhost:3000` or `5173`.

## Architecture

- **Frontend**: React, Tailwind CSS. Consumes REST APIs.
- **Backend**: FastAPI. Handles AI generation and CRUD operations.
- **Database**: MongoDB. Stores projects and version history.
- **AI**: Google Gemini 2.0 Flash.