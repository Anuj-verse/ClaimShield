import os
import pickle
import faiss
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import requests

load_dotenv()

model = SentenceTransformer('all-MiniLM-L6-v2')
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FAISS_INDEX_PATH = os.path.join(BASE_DIR, "vector_store/faiss_index/index.faiss")
METADATA_PATH = os.path.join(BASE_DIR, "vector_store/faiss_index/metadata.pkl")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def get_similar_context(query_text, top_k=5):
    """FAISS se similar cases nikalo"""
    index = faiss.read_index(FAISS_INDEX_PATH)
    with open(METADATA_PATH, 'rb') as f:
        metadata = pickle.load(f)

    query_vector = model.encode([query_text]).astype('float32')
    distances, indices = index.search(query_vector, top_k)

    context = []
    for i, idx in enumerate(indices[0]):
        case = metadata[idx]
        context.append(
            f"Case {i+1}: {case['incident_type']}, "
            f"Severity: {case['incident_severity']}, "
            f"Amount: ₹{case['total_claim_amount']}, "
            f"Fraud: {case['fraud_reported']}"
        )
    return "\n".join(context)

def call_openrouter(prompt):
    """OpenRouter API call"""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    body = {
       "model": "openrouter/free",
        "messages": [
            {
                "role": "system",
                "content": "You are an insurance fraud detection expert. Analyze claims and provide clear forensic insights."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    }
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=body
    )
    
    # Debug line add ki
    print("API Response:", response.json())
    
    data = response.json()
    if 'choices' in data:
        return data['choices'][0]['message']['content']
    else:
        return f"Error: {data}"

def get_rag_response(claim_text):
    """Main RAG function - context + LLM"""
    print("Similar cases dhundh raha hoon...")
    context = get_similar_context(claim_text)

    prompt = f"""
You are analyzing an insurance claim for fraud detection.

New Claim: {claim_text}

Similar Past Cases from Database:
{context}

Based on the similar cases above, analyze:
1. Is this claim suspicious? Why?
2. What patterns match with fraudulent cases?
3. Risk Level: LOW / MEDIUM / HIGH
4. Recommended Action for investigator

Give a clear, concise forensic report.
"""
    print("AI report bana raha hoon...")
    response = call_openrouter(prompt)
    return {
        "similar_cases": context,
        "forensic_report": response
    }

if __name__ == "__main__":
    test_claim = "Single Vehicle Collision at night, Major Damage, claim amount 71000"
    result = get_rag_response(test_claim)
    print("\n--- SIMILAR CASES ---")
    print(result['similar_cases'])
    print("\n--- FORENSIC REPORT ---")
    print(result['forensic_report'])