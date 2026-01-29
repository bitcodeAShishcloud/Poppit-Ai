from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from run_model_core import generate_response
import os
import json

app = FastAPI()

# Allow browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Prompt(BaseModel):
    message: str

class LikeData(BaseModel):
    instruction: str
    response: str

@app.post("/chat")
def chat(prompt: Prompt):
    reply = generate_response(prompt.message)
    return {"response": reply}

@app.post("/like")
def save_like(data: LikeData):
    try:
        # Read existing likes or create empty list
        likes = []
        if os.path.exists("like.json"):
            try:
                with open("like.json", "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if content:  # Check if file has content
                        likes = json.loads(content)
                    else:
                        likes = []
            except json.JSONDecodeError:
                # If file is corrupted, start fresh
                likes = []
        
        # Add new like
        likes.append({
            "instruction": data.instruction,
            "response": data.response
        })
        
        # Save back to file
        with open("like.json", "w", encoding="utf-8") as f:
            json.dump(likes, f, indent=2, ensure_ascii=False)
        
        return {"status": "success", "message": "Like saved"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Serve UI files
if os.path.exists("ui"):
    app.mount("/ui", StaticFiles(directory="ui", html=True), name="ui")
    
    @app.get("/")
    def read_root():
        return FileResponse("ui/index.html")
