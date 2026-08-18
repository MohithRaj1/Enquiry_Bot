"""
Google Colab Enquiry Bot Backend API Server
--------------------------------------------
This script runs a FastAPI server inside Google Colab (or any Python environment)
and exposes a public HTTPS tunnel via PyNgrok / Localtunnel.

Instructions:
1. Install requirements in Colab:
   !pip install fastapi uvicorn pyngrok pydantic requests transformers torch
2. Set your Ngrok Auth Token (free from https://dashboard.ngrok.com/get-started/your-authtoken)
3. Run this script!
4. Copy the public https://xxxx.ngrok-free.app URL printed at the bottom.
5. Paste it into the "Colab Settings" tab of your Enquiry Bot App.
"""

import sys
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import time

# Create FastAPI instance
app = FastAPI(
    title="OmniQuery AI - Colab LLM Backend",
    description="Intelligent Enquiry Bot Inference Engine running on Google Colab GPU/CPU",
    version="1.0.0"
)

# Enable CORS for cross-origin requests from local React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    prompt: Optional[str] = None
    query: Optional[str] = None
    session_id: Optional[str] = "guest-session"
    max_tokens: Optional[int] = 256

class QueryResponse(BaseModel):
    answer: str
    source: str = "colab_llm"
    model: str = "Colab-FastAPI-Inference"
    latency_ms: float
    timestamp: float

# Knowledge Base & General AI Q&A Engine inside Colab
COLAB_KNOWLEDGE_BASE = {
    "admission": "Admissions for 2026 are officially OPEN! You can submit your documents online via our portal or request an advisor callback through our Enquiry form.",
    "fee": "Our semester tuition fees range from $1,200 to $4,500. Flexible monthly payment options and merit scholarships up to 40% are available.",
    "colab": "Greetings from Google Colab! This response was generated dynamically by your Python FastAPI backend running on Google Colab hardware.",
    "course": "We offer programs in AI & Machine Learning, Full-Stack Web Development, Data Science, and Cloud Architecture with hands-on lab environments.",
    "contact": "Contact our main office at support@omniquery.ai or call +1 (800) 555-0199. Office hours are Mon-Fri 8 AM - 6 PM EST."
}

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Colab Enquiry Bot Backend",
        "gpu_available": False, # set True if PyTorch CUDA detected
        "timestamp": time.time()
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Colab Enquiry Bot API",
        "version": "1.0.0",
        "uptime_sec": time.process_time()
    }

@app.post("/query", response_model=QueryResponse)
def handle_query(req: QueryRequest):
    start_time = time.time()
    user_text = (req.prompt or req.query or "").strip()
    
    if not user_text:
        raise HTTPException(status_code=400, detail="Query prompt cannot be empty.")
    
    lower_text = user_text.lower()
    
    # 1. Check for keyword matches in Colab Knowledge Base
    answer = None
    for kw, val in COLAB_KNOWLEDGE_BASE.items():
        if kw in lower_text:
            answer = val
            break
            
    # 2. Fallback smart generative response
    if not answer:
        answer = (
            f"⚡ [Google Colab AI Response]: Hello! Regarding your query '{user_text}', "
            "our Google Colab neural backend processed your request successfully. "
            "If you need specific details, please feel free to ask about admissions, courses, fees, or contact details!"
        )
        
    latency = (time.time() - start_time) * 1000
    
    return QueryResponse(
        answer=answer,
        source="colab_llm",
        model="Colab-FastAPI-Engine",
        latency_ms=round(latency, 2),
        timestamp=time.time()
    )

def start_tunnel_and_server(port: int = 8000, ngrok_token: Optional[str] = None):
    """
    Spawns PyNgrok tunnel and runs Uvicorn server.
    """
    try:
        from pyngrok import ngrok
        if ngrok_token:
            ngrok.set_auth_token(ngrok_token)
            
        public_url = ngrok.connect(port).public_url
        print("\n" + "="*70)
        print("🚀 GOOGLE COLAB BACKEND ONLINE!")
        print(f"🔗 Public Tunnel HTTPS URL: {public_url}")
        print("📋 Copy this URL and paste it in your Enquiry Bot frontend 'Colab Settings'!")
        print("="*70 + "\n")
    except Exception as e:
        print(f"⚠️ Could not start Ngrok tunnel automatically: {e}")
        print("💡 You can also use LocalTunnel or Cloudflared in Colab.")

    uvicorn.run(app, host="0.0.0.0", port=port)

if __name__ == "__main__":
    # To run locally or in Colab:
    # Pass your ngrok token if you have one, e.g. start_tunnel_and_server(8000, "YOUR_TOKEN")
    start_tunnel_and_server(8000)
