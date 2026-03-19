import pandas as pd
import numpy as np
import faiss
import pickle
import os
from sentence_transformers import SentenceTransformer

# Model load karo
model = SentenceTransformer('all-MiniLM-L6-v2')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FAISS_INDEX_PATH = os.path.join(BASE_DIR, "vector_store/faiss_index/index.faiss")
METADATA_PATH = os.path.join(BASE_DIR, "vector_store/faiss_index/metadata.pkl")
def prepare_text(row):
    """CSV ke columns se ek sentence banao"""
    return (
        f"Incident: {row['incident_type']}, "
        f"Severity: {row['incident_severity']}, "
        f"Collision: {row['collision_type']}, "
        f"Amount: {row['total_claim_amount']}, "
        f"Fraud: {row['fraud_reported']}"
    )

def build_faiss_index(csv_path="data/raw/insurance_claims.csv"):
    """CSV padho, vectors banao, FAISS mein save karo"""
    print("CSV padh raha hoon...")
    df = pd.read_csv(csv_path)
    df = df.dropna(subset=['incident_type', 'incident_severity', 'total_claim_amount'])
    
    print("Text bana raha hoon...")
    texts = df.apply(prepare_text, axis=1).tolist()
    
    print("Embeddings bana raha hoon...")
    embeddings = model.encode(texts, show_progress_bar=True)
    embeddings = np.array(embeddings).astype('float32')
    
    print("FAISS index bana raha hoon...")
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    
    # Save karo
    os.makedirs("nlp/vector_store/faiss_index", exist_ok=True)
    faiss.write_index(index, FAISS_INDEX_PATH)
    
    # Metadata save karo
    metadata = df[['incident_type', 'incident_severity', 
                   'total_claim_amount', 'fraud_reported', 
                   'collision_type']].to_dict('records')
    with open(METADATA_PATH, 'wb') as f:
        pickle.dump(metadata, f)
    
    print(f"Done! {len(texts)} claims index ho gayi!")
    return index, metadata

def find_similar_claims(query_text, top_k=5):
    """Naya claim aaya - similar purane cases dhundo"""
    # Index load karo
    index = faiss.read_index(FAISS_INDEX_PATH)
    with open(METADATA_PATH, 'rb') as f:
        metadata = pickle.load(f)
    
    # Query ko vector banao
    query_vector = model.encode([query_text]).astype('float32')
    
    # Search karo
    distances, indices = index.search(query_vector, top_k)
    
    # Results banao
    results = []
    for i, idx in enumerate(indices[0]):
        results.append({
            "rank": i + 1,
            "similarity_score": float(1 / (1 + distances[0][i])),
            "incident_type": metadata[idx]['incident_type'],
            "severity": metadata[idx]['incident_severity'],
            "amount": metadata[idx]['total_claim_amount'],
            "was_fraud": metadata[idx]['fraud_reported']
        })
    return results

if __name__ == "__main__":
    # Pehli baar index banao
    build_faiss_index()
    
    # Test karo
    test_query = "Single Vehicle Collision, Major Damage, night time"
    results = find_similar_claims(test_query)
    print("\nSimilar Cases:")
    for r in results:
        print(f"Rank {r['rank']}: {r['incident_type']} | "
              f"Amount: {r['amount']} | Fraud: {r['was_fraud']}")