# RAG (Retrieval Augmented Generation) System using Ollama
# =======================================================
#
# This script implements a complete RAG system that:
# 1. Ingests documents and chunks them into smaller segments
# 2. Creates embeddings for each chunk using an embedding model
# 3. Stores these embeddings in a vector database
# 4. Performs semantic search to find relevant documents for a query
# 5. Uses Ollama to generate responses based on the retrieved context
#
# Requirements:
# - pip install ollama langchain langchain_community sentence_transformers chromadb pydantic==1.10.8

import os
import ollama
import logging
from typing import List, Dict, Any
import uuid

# LangChain imports for document loading and processing
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain.docstore.document import Document as LangchainDocument

# Vector database
import chromadb
from chromadb.utils import embedding_functions

# Sentence transformers for embeddings
from sentence_transformers import SentenceTransformer

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Document:
    """
    Simple class to represent a document with content and metadata.
    """
    def __init__(self, content: str, metadata: Dict[str, Any] = None):
        """
        Initialize a Document object.
        
        Args:
            content: The textual content of the document
            metadata: Additional information about the document (source, author, etc.)
        """
        self.content = content
        self.metadata = metadata or {}
        self.id = str(uuid.uuid4())  # Generate a unique ID for each document
    
    def __repr__(self):
        return f"Document(id={self.id}, content={self.content[:50]}..., metadata={self.metadata})"

class DocumentLoader:
    """
    Class responsible for loading documents from different sources.
    """
    def load_from_directory(self, directory_path: str, glob_pattern: str = "**/*.txt") -> List[Document]:
        """
        Load all text documents from a directory.
        
        Args:
            directory_path: Path to the directory containing documents
            glob_pattern: Pattern to match files (default: all .txt files in all subdirectories)
            
        Returns:
            List of Document objects
        """
        logger.info(f"Loading documents from directory: {directory_path}")
        
        # Use LangChain's DirectoryLoader to easily load documents
        loader = DirectoryLoader(
            directory_path,
            glob=glob_pattern,
            loader_cls=TextLoader
        )
        
        # Load the documents
        langchain_docs = loader.load()
        logger.info(f"Loaded {len(langchain_docs)} documents")
        
        # Convert LangChain documents to our Document class
        documents = []
        for doc in langchain_docs:
            # Extract metadata and create our document
            metadata = {
                "source": doc.metadata.get("source", ""),
                # Add any other metadata from the original document
            }
            documents.append(Document(content=doc.page_content, metadata=metadata))
        
        return documents

    def load_from_text(self, text: str, metadata: Dict[str, Any] = None) -> Document:
        """
        Create a document from a text string.
        
        Args:
            text: The text content
            metadata: Optional metadata for the document
            
        Returns:
            A Document object
        """
        return Document(content=text, metadata=metadata)

class DocumentChunker:
    """
    Class responsible for splitting documents into smaller chunks for processing.
    """
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        """
        Initialize the document chunker.
        
        Args:
            chunk_size: The target size of each chunk in characters
            chunk_overlap: The overlap between consecutive chunks in characters
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        # Initialize the LangChain text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
        )
    
    def chunk_document(self, document: Document) -> List[Document]:
        """
        Split a document into smaller chunks.
        
        Args:
            document: The document to split
            
        Returns:
            List of Document objects representing chunks
        """
        # Split the document content into chunks
        chunks = self.text_splitter.split_text(document.content)
        
        # Create new Document objects for each chunk with inherited metadata
        chunked_docs = []
        for i, chunk_text in enumerate(chunks):
            # Create a copy of the original metadata and add chunk information
            chunk_metadata = document.metadata.copy()
            chunk_metadata.update({
                "original_document_id": document.id,
                "chunk_index": i,
                "chunk_count": len(chunks)
            })
            
            # Create a new Document for the chunk
            chunk_doc = Document(content=chunk_text, metadata=chunk_metadata)
            chunked_docs.append(chunk_doc)
        
        logger.info(f"Split document into {len(chunked_docs)} chunks")
        return chunked_docs

class EmbeddingEngine:
    """
    Class responsible for creating and managing document embeddings.
    """
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the embedding engine.
        
        Args:
            model_name: Name of the sentence-transformers model to use
        """
        logger.info(f"Initializing embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
    
    def embed_documents(self, documents: List[Document]) -> Dict[str, List[float]]:
        """
        Create embeddings for a list of documents.
        
        Args:
            documents: List of documents to embed
            
        Returns:
            Dictionary mapping document IDs to embedding vectors
        """
        # Extract the text content from each document
        texts = [doc.content for doc in documents]
        
        # Generate embeddings for all texts in a batch
        logger.info(f"Generating embeddings for {len(texts)} documents")
        embeddings = self.model.encode(texts)
        
        # Create a dictionary mapping document IDs to their embeddings
        document_embeddings = {}
        for i, doc in enumerate(documents):
            document_embeddings[doc.id] = embeddings[i].tolist()
        
        return document_embeddings
    
    def embed_query(self, query: str) -> List[float]:
        """
        Create an embedding for a query string.
        
        Args:
            query: The query text
            
        Returns:
            Embedding vector for the query
        """
        return self.model.encode(query).tolist()

class VectorStore:
    """
    Class to manage storage and retrieval of document embeddings.
    """
    def __init__(self, collection_name: str = "rag_documents", persist_directory: str = "./chroma_db"):
        """
        Initialize the vector store.
        
        Args:
            collection_name: Name of the collection to store documents
            persist_directory: Directory to persist the database
        """
        # Initialize ChromaDB client
        logger.info(f"Initializing ChromaDB with persistence at: {persist_directory}")
        self.client = chromadb.PersistentClient(path=persist_directory)
        
        # Create or get a collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}  # Use cosine similarity for searching
        )
    
    def add_documents(self, documents: List[Document], embeddings: Dict[str, List[float]]):
        """
        Add documents and their embeddings to the vector store.
        
        Args:
            documents: List of documents to add
            embeddings: Dictionary mapping document IDs to embedding vectors
        """
        # Prepare the data for ChromaDB
        ids = [doc.id for doc in documents]
        documents_text = [doc.content for doc in documents]
        embeddings_list = [embeddings[doc.id] for doc in documents]
        metadatas = [doc.metadata for doc in documents]
        
        # Add the documents to the collection
        logger.info(f"Adding {len(documents)} documents to vector store")
        self.collection.add(
            ids=ids,
            embeddings=embeddings_list,
            documents=documents_text,
            metadatas=metadatas
        )
    
    def query(self, query_embedding: List[float], top_k: int = 5) -> List[Document]:
        """
        Query the vector store for similar documents.
        
        Args:
            query_embedding: The embedding vector of the query
            top_k: Number of top results to return
            
        Returns:
            List of retrieved documents
        """
        logger.info(f"Querying vector store for top {top_k} matches")
        
        # Query the collection
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        
        # Convert results to Document objects
        documents = []
        for i in range(len(results["ids"][0])):
            doc_id = results["ids"][0][i]
            content = results["documents"][0][i]
            metadata = results["metadatas"][0][i]
            
            # Create a new Document with the retrieved data
            doc = Document(content=content, metadata=metadata)
            doc.id = doc_id
            documents.append(doc)
        
        return documents

class OllamaClient:
    """
    Class to interact with the Ollama API for LLM generation.
    """
    def __init__(self, model_name: str = "llama2"):
        """
        Initialize the Ollama client.
        
        Args:
            model_name: Name of the model to use with Ollama
        """
        self.model_name = model_name
        logger.info(f"Initialized Ollama client with model: {model_name}")
    
    def generate(self, prompt: str, system_prompt: str = None, temperature: float = 0.7) -> str:
        """
        Generate a response using the Ollama model.
        
        Args:
            prompt: The prompt to send to the model
            system_prompt: Optional system prompt for instruction
            temperature: Controls randomness (higher = more random)
            
        Returns:
            Generated text response
        """
        # Configure generation parameters
        options = {
            "temperature": temperature
        }
        
        # Add system prompt if provided
        if system_prompt:
            options["system"] = system_prompt
        
        # Log the generation request (but not the full prompt for privacy/brevity)
        logger.info(f"Generating response with model {self.model_name}, temperature {temperature}")
        
        # Generate the response using Ollama
        response = ollama.generate(
            model=self.model_name,
            prompt=prompt,
            options=options
        )
        
        return response["response"]

class RAGSystem:
    """
    Main class that coordinates the entire RAG workflow.
    """
    def __init__(
        self,
        ollama_model: str = "llama2",
        embedding_model: str = "all-MiniLM-L6-v2",
        chunk_size: int = 500,
        chunk_overlap: int = 50,
        vector_db_dir: str = "./chroma_db",
        collection_name: str = "rag_documents"
    ):
        """
        Initialize the RAG system.
        
        Args:
            ollama_model: Name of the Ollama model to use
            embedding_model: Name of the embedding model
            chunk_size: Size of document chunks
            chunk_overlap: Overlap between chunks
            vector_db_dir: Directory for vector database
            collection_name: Name of the collection in the vector DB
        """
        # Initialize components
        self.document_loader = DocumentLoader()
        self.chunker = DocumentChunker(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        self.embedding_engine = EmbeddingEngine(model_name=embedding_model)
        self.vector_store = VectorStore(collection_name=collection_name, persist_directory=vector_db_dir)
        self.ollama_client = OllamaClient(model_name=ollama_model)
        
        logger.info("RAG system initialized and ready for ingestion/querying")
    
    def ingest_documents(self, directory_path: str):
        """
        Process all documents in a directory and add them to the vector store.
        
        Args:
            directory_path: Path to directory containing documents
        """
        # Step 1: Load documents
        documents = self.document_loader.load_from_directory(directory_path)
        logger.info(f"Loaded {len(documents)} documents from {directory_path}")
        
        # Step 2: Chunk the documents
        all_chunks = []
        for doc in documents:
            chunks = self.chunker.chunk_document(doc)
            all_chunks.extend(chunks)
        
        logger.info(f"Created {len(all_chunks)} chunks from {len(documents)} documents")
        
        # Step 3: Create embeddings for all chunks
        embeddings = self.embedding_engine.embed_documents(all_chunks)
        
        # Step 4: Store chunks and embeddings in the vector database
        self.vector_store.add_documents(all_chunks, embeddings)
        
        logger.info("Document ingestion complete")
    
    def query(self, query_text: str, top_k: int = 5) -> str:
        """
        Process a query through the RAG pipeline.
        
        Args:
            query_text: The user's query
            top_k: Number of documents to retrieve
            
        Returns:
            The generated response
        """
        # Step 1: Create an embedding for the query
        query_embedding = self.embedding_engine.embed_query(query_text)
        
        # Step 2: Retrieve relevant documents
        retrieved_docs = self.vector_store.query(query_embedding, top_k=top_k)
        
        # Log the retrieved documents (first 100 chars of each)
        for i, doc in enumerate(retrieved_docs):
            logger.info(f"Retrieved document {i+1}: {doc.content[:100]}...")
        
        # Step 3: Create a prompt with the retrieved context
        context = "\n\n".join([doc.content for doc in retrieved_docs])
        
        prompt = f"""Context information is below.
---------------------
{context}
---------------------

Given the context information and not prior knowledge, answer the following query:
{query_text}
"""
        
        # Step 4: Generate a response using the LLM
        system_prompt = "You are a helpful assistant that answers queries based on the provided context. If the answer cannot be found in the context, say so."
        
        response = self.ollama_client.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.7
        )
        
        return response

    def add_single_document(self, text: str, metadata: Dict[str, Any] = None):
        """
        Add a single document to the RAG system.
        
        Args:
            text: The text content of the document
            metadata: Optional metadata for the document
        """
        # Create a document
        document = self.document_loader.load_from_text(text, metadata)
        
        # Chunk the document
        chunks = self.chunker.chunk_document(document)
        
        # Create embeddings for the chunks
        embeddings = self.embedding_engine.embed_documents(chunks)
        
        # Add to vector store
        self.vector_store.add_documents(chunks, embeddings)
        
        logger.info(f"Added single document with {len(chunks)} chunks to the system")
        return document.id

# Example usage
if __name__ == "__main__":
    # Initialize the RAG system
    rag = RAGSystem(
        ollama_model="llama2",
        embedding_model="all-MiniLM-L6-v2",
        chunk_size=500,
        chunk_overlap=50
    )
    
    # Example 1: Ingest documents from a directory
    # rag.ingest_documents("./documents")
    
    # Example 2: Add a single document
    sample_text = """
    Retrieval-Augmented Generation (RAG) is an AI framework that enhances large language model (LLM) outputs by 
    incorporating relevant information from external sources. RAG combines the memorization capabilities of 
    parametric memory (the model's internal knowledge) with the ability to access information from 
    non-parametric memory (external knowledge sources). This approach helps ground LLM responses in factual, 
    up-to-date information.
    
    RAG works by first retrieving relevant documents or passages from a knowledge base based on the input query. 
    These retrieved texts provide context that is then used to generate more accurate, informed answers. 
    The retrieval component typically uses semantic search or other information retrieval techniques to find 
    the most relevant information.
    
    Key benefits of RAG include:
    1. Improved accuracy and reduced hallucinations
    2. Access to more current information beyond the LLM's training cutoff
    3. Ability to reference specific documents or proprietary information
    4. More transparent sourcing of information
    
    RAG is particularly valuable for domain-specific applications where accurate, up-to-date information is critical.
    """
    
    rag.add_single_document(sample_text, metadata={"source": "RAG explanation", "author": "AI teaching assistant"})
    
    # Example 3: Query the RAG system
    query = "What are the key benefits of RAG?"
    response = rag.query(query, top_k=3)
    
    print("\nQuery:", query)
    print("\nResponse:", response)