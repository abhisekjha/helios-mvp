"""
Vector Embedding Service for Helios Knowledge Base
Handles text chunking, embedding generation, and vector storage/retrieval.
"""

import json
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import pandas as pd
from pymongo.database import Database
from bson import ObjectId
from datetime import datetime

from app.core.config import settings


class VectorEmbeddingService:
    """
    Service for creating and managing vector embeddings for the knowledge base.
    Uses SentenceTransformers for embeddings and FAISS for similarity search.
    """
    
    def __init__(self, db: Database):
        self.db = db
        self.model = SentenceTransformer('all-MiniLM-L6-v2')  # Lightweight, fast model
        self.dimension = 384  # Dimension of all-MiniLM-L6-v2 embeddings
        self.knowledge_base_collection = db.knowledge_base
        self.vector_index_collection = db.vector_indexes
        
        # Ensure indexes exist
        self.knowledge_base_collection.create_index("goal_id")
        self.knowledge_base_collection.create_index("chunk_hash")
        
    def chunk_csv_data(self, df, goal_id: str) -> List[Dict[str, Any]]:
        """
        Convert CSV data into text chunks suitable for embedding.
        
        Args:
            df: Pandas DataFrame containing the CSV data
            goal_id: The goal ID this data belongs to
            
        Returns:
            List of dictionaries containing chunk text and metadata
        """
        chunks = []
        
        # Get column information
        columns = df.columns.tolist()
        
        # Create summary chunk
        summary_text = f"Dataset Overview: This dataset contains {len(df)} records with columns: {', '.join(columns)}."
        if len(df) > 0:
            summary_text += f" Data types: {dict(df.dtypes)}."
        
        chunks.append({
            "text": summary_text,
            "type": "summary",
            "metadata": {
                "goal_id": goal_id,
                "row_count": len(df),
                "columns": columns,
                "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()}
            }
        })
        
        # Create chunks for individual rows (limit to first 1000 rows for performance)
        sample_df = df.head(1000) if len(df) > 1000 else df
        
        for idx, row in sample_df.iterrows():
            # Create a natural language description of the row
            row_description = []
            for col, value in row.items():
                if pd.notna(value) and str(value).strip():
                    row_description.append(f"{col}: {value}")
            
            if row_description:
                text = f"Record {idx + 1}: " + ", ".join(row_description)
                chunks.append({
                    "text": text,
                    "type": "record",
                    "metadata": {
                        "goal_id": goal_id,
                        "row_index": int(idx),
                        "record_data": row.to_dict()
                    }
                })
        
        # Create aggregation chunks for numerical columns
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        for col in numerical_cols:
            if not df[col].empty:
                stats = df[col].describe()
                stats_text = f"Statistical analysis of {col}: mean {stats['mean']:.2f}, " \
                            f"median {stats['50%']:.2f}, min {stats['min']:.2f}, " \
                            f"max {stats['max']:.2f}, standard deviation {stats['std']:.2f}"
                
                chunks.append({
                    "text": stats_text,
                    "type": "statistics",
                    "metadata": {
                        "goal_id": goal_id,
                        "column": col,
                        "statistics": stats.to_dict()
                    }
                })
        
        return chunks
    
    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for a list of texts.
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            NumPy array of embeddings
        """
        return self.model.encode(texts, convert_to_tensor=False)
    
    def store_knowledge_base(self, goal_id: str, chunks: List[Dict[str, Any]]) -> List[str]:
        """
        Store text chunks and their embeddings in the knowledge base.
        
        Args:
            goal_id: The goal ID this knowledge belongs to
            chunks: List of text chunks with metadata
            
        Returns:
            List of chunk IDs that were created
        """
        if not chunks:
            return []
        
        # Extract texts and generate embeddings
        texts = [chunk["text"] for chunk in chunks]
        embeddings = self.generate_embeddings(texts)
        
        # Prepare documents for insertion
        documents = []
        chunk_ids = []
        
        for i, chunk in enumerate(chunks):
            chunk_hash = hashlib.md5(chunk["text"].encode()).hexdigest()
            
            # Check if this chunk already exists
            existing = self.knowledge_base_collection.find_one({
                "goal_id": goal_id,
                "chunk_hash": chunk_hash
            })
            
            if existing:
                chunk_ids.append(str(existing["_id"]))
                continue
            
            doc = {
                "goal_id": goal_id,
                "text": chunk["text"],
                "chunk_hash": chunk_hash,
                "embedding": embeddings[i].tolist(),
                "type": chunk["type"],
                "metadata": chunk["metadata"],
                "created_at": datetime.utcnow()
            }
            
            documents.append(doc)
        
        # Insert new documents
        if documents:
            result = self.knowledge_base_collection.insert_many(documents)
            chunk_ids.extend([str(id) for id in result.inserted_ids])
        
        return chunk_ids
    
    def search_knowledge_base(self, goal_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search the knowledge base for relevant chunks using vector similarity.
        
        Args:
            goal_id: The goal ID to search within
            query: The search query
            top_k: Number of top results to return
            
        Returns:
            List of relevant chunks with similarity scores
        """
        # Generate embedding for the query
        query_embedding = self.generate_embeddings([query])[0]
        
        # Get all chunks for this goal
        goal_chunks = list(self.knowledge_base_collection.find({"goal_id": goal_id}))
        
        if not goal_chunks:
            return []
        
        # Extract embeddings and create FAISS index
        embeddings = np.array([chunk["embedding"] for chunk in goal_chunks])
        
        # Create FAISS index
        index = faiss.IndexFlatIP(self.dimension)  # Inner product for cosine similarity
        
        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)
        faiss.normalize_L2(query_embedding.reshape(1, -1))
        
        index.add(embeddings)
        
        # Search for similar chunks
        scores, indices = index.search(query_embedding.reshape(1, -1), min(top_k, len(goal_chunks)))
        
        # Prepare results
        results = []
        for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if idx >= 0:  # Valid index
                chunk = goal_chunks[idx]
                results.append({
                    "id": str(chunk["_id"]),
                    "text": chunk["text"],
                    "type": chunk["type"],
                    "metadata": chunk["metadata"],
                    "similarity_score": float(score),
                    "rank": i + 1
                })
        
        return results
    
    def get_goal_knowledge_stats(self, goal_id: str) -> Dict[str, Any]:
        """
        Get statistics about the knowledge base for a specific goal.
        
        Args:
            goal_id: The goal ID to get stats for
            
        Returns:
            Dictionary containing knowledge base statistics
        """
        pipeline = [
            {"$match": {"goal_id": goal_id}},
            {"$group": {
                "_id": "$type",
                "count": {"$sum": 1}
            }}
        ]
        
        type_counts = {item["_id"]: item["count"] for item in self.knowledge_base_collection.aggregate(pipeline)}
        total_chunks = sum(type_counts.values())
        
        return {
            "goal_id": goal_id,
            "total_chunks": total_chunks,
            "chunk_types": type_counts,
            "has_data": total_chunks > 0
        }
    
    def delete_goal_knowledge(self, goal_id: str) -> int:
        """
        Delete all knowledge base entries for a specific goal.
        
        Args:
            goal_id: The goal ID to delete knowledge for
            
        Returns:
            Number of chunks deleted
        """
        result = self.knowledge_base_collection.delete_many({"goal_id": goal_id})
        return result.deleted_count


# Global instance
_embedding_service = None

def get_embedding_service(db: Database) -> VectorEmbeddingService:
    """Get the global embedding service instance."""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = VectorEmbeddingService(db)
    return _embedding_service
