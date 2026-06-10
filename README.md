# Engineering Intelligence Hub

A premium, developer-focused **Retrieval-Augmented Generation (RAG) Chatbot** designed to ingest technical documentation, architecture diagrams, code repositories, and incident reports to provide lightning-fast, contextual answers and accelerate engineering workflows.

## ✨ Features
* **Multi-Format Ingestion:** Seamlessly upload `.pdf`, `.txt`, `.py`, and `.js` files.
* **Architecture Diagram OCR:** Upload images (`.png`, `.jpg`) of architecture diagrams and extract their text using Tesseract OCR.
* **Real-Time Streaming:** The AI responds instantly, streaming text token-by-token using Server-Sent Events (SSE).
* **LLM Caching:** Aggressively caches identical queries via an SQLite database, ensuring lightning-fast responses while drastically reducing API costs.
* **Premium Glassmorphism UI:** A breathtaking frontend built with Vite & React, featuring dynamic gradients, smooth micro-animations, and a highly polished dark-mode aesthetic.

## 🛠️ Technology Stack
* **Frontend:** React, Vite, Vanilla CSS
* **Backend:** Python, FastAPI, LangChain
* **Vector Database:** Qdrant (in-memory)
* **LLM:** Support for local models via **Ollama** (`llama3`) or cloud models via **Google Gemini API** (`gemini-1.5-pro-latest`).
* **Embeddings:** HuggingFace Open-Source Models (`all-MiniLM-L6-v2`)

## 🚀 Setup & Installation

### Prerequisites
* **Node.js** (for the frontend)
* **Python 3.10+** (for the backend)
* **Tesseract OCR** (Must be installed on your system to support image OCR)

### 1. Backend Setup
Navigate to the backend directory and set up the Python environment:
```bash
cd backend
python -m venv venv
# Activate on Windows:
.\venv\Scripts\activate
# Install dependencies:
pip install -r requirements.txt
```

*(Optional)* If using the Google Gemini API, create a `.env` file in the backend directory:
```env
GEMINI_API_KEY=your_api_key_here
```

Start the FastAPI server:
```bash
uvicorn main:app
```

### 2. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```

The application will be running locally at `http://localhost:5173`. Enjoy!
