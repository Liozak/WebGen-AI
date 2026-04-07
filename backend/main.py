from dotenv import load_dotenv
import os

load_dotenv()
print("GEMINI KEY FOUND:", bool(os.getenv("GEMINI_API_KEY")))


import os
import time
import json
import uvicorn
from typing import List, Optional, Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict, PlainSerializer
from google import genai
from google.genai import types
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from pymongo.errors import ServerSelectionTimeoutError
from typing import Annotated

# --- Configuration & Setup ---

app = FastAPI(title="WebGen AI Backend")

# CORS
# Allow specific origins in production, but keep permissive for this template
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment Variables
API_KEY = os.environ.get("GEMINI_API_KEY")
MONGO_URI = os.environ.get("MONGODB_URI")   # must match Render exactly
DB_NAME = "webgen_db"

@app.on_event("startup")
async def startup_db():
    try:
        await mongo_client.admin.command("ping")
        print("✅ MongoDB connected successfully")
    except Exception as e:
        print("❌ MongoDB connection failed:", e)

# Gemini Client Initialization
client = None
if API_KEY:
    try:
        client = genai.Client(api_key=API_KEY)
    except Exception as e:
        print(f"Failed to initialize Gemini Client: {e}")
else:
    print("WARNING: GEMINI_API_KEY is not set.")

MODEL_NAME = "gemini-2.5-flash"

# MongoDB Client
mongo_client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=3000)
db = mongo_client[DB_NAME]
project_collection = db["projects"]

# --- Data Models ---

# Helper for ObjectId handling in Pydantic V2
PyObjectId = Annotated[
    str, 
    BeforeValidator(str),
    PlainSerializer(lambda x: str(x), return_type=str)
]

class GeneratedSite(BaseModel):
    html: str
    css: Optional[str] = None
    js: Optional[str] = None
    explanation: Optional[str] = None

class ProjectModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    prompt: str
    code: GeneratedSite
    createdAt: int
    version: int = 1

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

class CreateProjectRequest(BaseModel):
    prompt: str

class UpdateProjectRequest(BaseModel):
    name: Optional[str] = None

# --- System Instruction ---

SYSTEM_INSTRUCTION = """
You are an expert AI web developer and UI/UX designer. Your task is to generate complete, production-ready, single-page websites based on user prompts.

**Constraints & Requirements:**
1.  **Output Format:** Strictly return a JSON object with this structure:
    ```json
    {
      "html": "The full HTML5 document string",
      "css": "Optional CSS string",
      "js": "Optional JavaScript string",
      "explanation": "A 1-sentence summary."
    }
    ```
2.  **Tech Stack:** HTML5, Tailwind CSS (CDN), FontAwesome (CDN), Google Fonts.
3.  **Images:** Use `https://picsum.photos/width/height` for placeholders.
4.  **Content:** Realistic placeholder text (no Lorem Ipsum).
5.  **Quality:** Modern, responsive, semantic HTML.
"""

# --- Endpoints ---

@app.get("/health")
async def root_health_check():
    """Lightweight health check for frontend connectivity."""
    return {"status": "ok"}

@app.get("/api/health")
async def health_check():
    """Detailed health check including database status."""
    db_status = "disconnected"
    try:
        await mongo_client.admin.command('ping')
        db_status = "connected"
    except Exception:
        pass
    return {"status": "ok", "db": db_status}

@app.post("/api/projects", response_model=ProjectModel)
async def create_project(request: CreateProjectRequest):
    """Generates a site from a prompt and saves it as a new project."""
    if not client:
        raise HTTPException(status_code=500, detail="Gemini Client not initialized. Check API Key.")

    try:
        # 1. Generate Content
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=request.prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "html": {"type": "STRING"},
                        "css": {"type": "STRING"},
                        "js": {"type": "STRING"},
                        "explanation": {"type": "STRING"}
                    },
                    "required": ["html", "explanation"]
                }
            )
        )

        if not response.text:
             raise HTTPException(status_code=500, detail="AI returned empty response.")
        
        try:
            generated_data = json.loads(response.text)
        except json.JSONDecodeError:
             raise HTTPException(status_code=500, detail="AI returned invalid JSON.")
        
        # 2. Construct Project
        new_project = ProjectModel(
            name=request.prompt[:40] + ("..." if len(request.prompt) > 40 else ""),
            prompt=request.prompt,
            code=GeneratedSite(**generated_data),
            createdAt=int(time.time() * 1000),
            version=1
        )

        # 3. Save to MongoDB
        project_dict = new_project.model_dump(by_alias=True, exclude=["id"])
        try:
            result = await project_collection.insert_one(project_dict)
            # 4. Return created object
            created_project = await project_collection.find_one({"_id": result.inserted_id})
            return created_project
        except ServerSelectionTimeoutError:
             raise HTTPException(status_code=503, detail="Database Unavailable. Cannot save project.")

    except Exception as e:
        print(f"Error creating project: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.get("/api/projects", response_model=List[ProjectModel])
async def get_projects():
    """Fetch all projects ordered by newest first."""
    try:
        projects = await project_collection.find().sort("createdAt", -1).to_list(100)
        return projects
    except ServerSelectionTimeoutError:
        print("Database connection timed out. Returning empty list.")
        return []
    except Exception as e:
        print(f"DB Error: {e}")
        return []

@app.get("/api/projects/{id}", response_model=ProjectModel)
async def get_project(id: str):
    """Fetch a single project by ID."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    try:
        project = await project_collection.find_one({"_id": ObjectId(id)})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return project
    except Exception:
        raise HTTPException(status_code=500, detail="Database Error")

@app.put("/api/projects/{id}", response_model=ProjectModel)
async def update_project(id: str, update: UpdateProjectRequest):
    """Update project details (e.g. rename)."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    if not update_data:
         raise HTTPException(status_code=400, detail="No data provided for update")

    try:
        result = await project_collection.update_one(
            {"_id": ObjectId(id)}, 
            {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        updated_project = await project_collection.find_one({"_id": ObjectId(id)})
        return updated_project
    except Exception:
        raise HTTPException(status_code=500, detail="Database Error")

@app.delete("/api/projects/{id}")
async def delete_project(id: str):
    """Delete a project."""
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    try:
        result = await project_collection.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {"message": "Project deleted successfully"}
    except Exception:
        raise HTTPException(status_code=500, detail="Database Error")

if __name__ == "__main__":
    # Start on port 8000 by default, can be overridden by env
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
# render-fix 
