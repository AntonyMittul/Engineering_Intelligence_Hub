import os
from tempfile import NamedTemporaryFile
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    UnstructuredImageLoader
)
from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
    Language
)
import pytesseract
from PIL import Image
from langchain_core.documents import Document
from rag_engine import rag_engine

def process_file(file_content: bytes, filename: str):
    """
    Process an uploaded file, extract text/code, split it into chunks, 
    and ingest it into the vector database.
    """
    # Create a temporary file to work with loaders
    suffix = os.path.splitext(filename)[1]
    
    with NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(file_content)
        temp_path = temp_file.name

    try:
        documents = []
        
        # Determine file type and load
        if suffix.lower() == '.pdf':
            loader = PyPDFLoader(temp_path)
            documents = loader.load()
            
        elif suffix.lower() in ['.txt', '.md']:
            loader = TextLoader(temp_path, encoding='utf-8')
            documents = loader.load()
            
        elif suffix.lower() in ['.py']:
            with open(temp_path, 'r', encoding='utf-8') as f:
                content = f.read()
            # Use code-specific text splitter
            python_splitter = RecursiveCharacterTextSplitter.from_language(
                language=Language.PYTHON, chunk_size=1000, chunk_overlap=200
            )
            chunks = python_splitter.split_text(content)
            documents = [Document(page_content=chunk, metadata={"source": filename}) for chunk in chunks]
            
        elif suffix.lower() in ['.js']:
            with open(temp_path, 'r', encoding='utf-8') as f:
                content = f.read()
            js_splitter = RecursiveCharacterTextSplitter.from_language(
                language=Language.JS, chunk_size=1000, chunk_overlap=200
            )
            chunks = js_splitter.split_text(content)
            documents = [Document(page_content=chunk, metadata={"source": filename}) for chunk in chunks]
            
        elif suffix.lower() in ['.png', '.jpg', '.jpeg']:
            # Use Tesseract OCR to extract text from architecture diagrams
            image = Image.open(temp_path)
            text = pytesseract.image_to_string(image)
            documents = [Document(page_content=text, metadata={"source": filename, "type": "diagram_ocr"})]
            
        else:
            raise ValueError(f"Unsupported file format: {suffix}")

        # If documents were loaded but not chunked yet (e.g., pdf, txt, image)
        if suffix.lower() not in ['.py', '.js']:
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            documents = text_splitter.split_documents(documents)
            
        # Add source metadata to all documents
        for doc in documents:
            if "source" not in doc.metadata or doc.metadata["source"] == temp_path:
                doc.metadata["source"] = filename

        # Add to vector store
        rag_engine.add_documents(documents)
        
        return len(documents)

    finally:
        # Clean up temporary file
        os.unlink(temp_path)
