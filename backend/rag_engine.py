import os
from dotenv import load_dotenv
from langchain_community.llms import Ollama
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

# Caching imports
import langchain
from langchain_community.cache import SQLiteCache

# Load environment variables (GEMINI_API_KEY)
load_dotenv()

# Setup SQLite Cache to aggressively reduce API calls
langchain.llm_cache = SQLiteCache(database_path=".langchain.db")

# Configuration
OLLAMA_MODEL = "llama3"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
QDRANT_PATH = ":memory:"
COLLECTION_NAME = "engineering_docs"

class RAGEngine:
    def __init__(self):
        # 1. Initialize Embeddings
        self.embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
        
        # 2. Initialize Qdrant Client
        self.client = QdrantClient(path=QDRANT_PATH)
        
        # Ensure collection exists
        try:
            self.client.get_collection(collection_name=COLLECTION_NAME)
        except Exception:
            self.client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE),
            )
            
        self.vector_store = QdrantVectorStore(
            client=self.client,
            collection_name=COLLECTION_NAME,
            embedding=self.embeddings
        )
        
        # 3. Initialize LLM (Ollama)
        self.llm = Ollama(model=OLLAMA_MODEL)
        
        # 4. Setup Prompt and Chain
        self.setup_chain()

    def setup_chain(self):
        system_prompt = (
            "You are the Engineering Intelligence Hub, a helpful assistant for software developers. "
            "Use the following pieces of retrieved context to answer the question. "
            "If you don't know the answer, say that you don't know. "
            "Use markdown and code blocks where appropriate.\n\n"
            "Context: {context}"
        )
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}"),
        ])
        
        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
        
        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)
            
        self.rag_chain = (
            self.prompt
            | self.llm
            | StrOutputParser()
        )

    def ask(self, question: str):
        # Retrieve documents
        docs = self.retriever.invoke(question)
        context_str = "\n\n".join(doc.page_content for doc in docs)
        
        # Generate answer (Uses Gemini API + SQLite cache implicitly)
        answer = self.rag_chain.invoke({"context": context_str, "input": question})
        
        # Return answer and source documents
        return {
            "answer": answer,
            "sources": [doc.metadata for doc in docs]
        }

    def ask_stream(self, question: str):
        # Retrieve documents
        docs = self.retriever.invoke(question)
        context_str = "\n\n".join(doc.page_content for doc in docs)
        
        # Yield sources first as a special chunk
        yield {"type": "sources", "sources": [doc.metadata for doc in docs]}
        
        # Stream answer chunks
        for chunk in self.rag_chain.stream({"context": context_str, "input": question}):
            yield {"type": "chunk", "text": chunk}

    def add_documents(self, documents):
        if documents:
            self.vector_store.add_documents(documents)

# Singleton instance
rag_engine = RAGEngine()
