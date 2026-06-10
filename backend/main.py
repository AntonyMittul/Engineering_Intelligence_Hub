from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from ingestion import process_file
from rag_engine import rag_engine

app = FastAPI(title="Engineering Intelligence Hub API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

from fastapi.responses import StreamingResponse
import json

@app.post("/api/chat")
def chat_endpoint(request: ChatRequest):
    def generate():
        try:
            response_gen = rag_engine.ask_stream(request.message)
            for chunk in response_gen:
                yield f"data: {json.dumps(chunk)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/api/ingest")
async def ingest_file(file: UploadFile = File(...)):
    try:
        content = await file.read()
        num_chunks = process_file(content, file.filename)
        return {"status": "success", "filename": file.filename, "chunks_processed": num_chunks}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
