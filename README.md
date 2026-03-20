ClaimShield – Structured README.md (Production Grade)
Yeh copy-paste ready README hai. ClaimShield/README.md mein daal do.

Markdown# ClaimShield – Insurance Claim Fraud Detection System

**Multi-Modal AI Platform** that detects document tampering, cyber anomalies, and fraud rings in insurance claims using **OpenCV + ONNX XGBoost + GNN** in a **single FastAPI microservice**.

---

##  Project Overview

ClaimShield is a **production-grade multi-modal ML service** that analyzes insurance claims from **two inputs** simultaneously:

- **Document Image** (bill/check/policy) → Tampering detection (OpenCV)
- **Network + Claim Data** (JSON) → Cyber attack + Fraud ring detection

**Single Endpoint**: `/analyze-claim` → Returns unified verdict with annotated image + risk scores.

---

##  Key Features

- **Document Tampering Detection** (ELA + Clone + Noise analysis)
- **Cyber Threat Detection** (Quantized XGBoost ONNX model)
- **Fraud Ring Detection** (Graph Neural Network)
- **Unified Multi-Modal Inference** (one API call = all models)
- **Short Image URLs** (no long base64 strings)
- **Swagger UI** for live testing
- **High-Risk Fraud Examples** included

---

## 🛠 Tech Stack

| Component          | Technology                          |
|--------------------|-------------------------------------|
| Backend            | FastAPI + Uvicorn                   |
| CV Model           | OpenCV + PIL                        |
| Cyber Model        | Quantized XGBoost (ONNX)            |
| GNN / Fraud        | Graph Engine (PyTorch / scikit)     |
| Image Serving      | FastAPI StaticFiles                 |
| Deployment         | Local / Docker-ready                |

---

##  Project Structure
ClaimShield/
├── ml/
│   ├── ml_api/
│   │   └── app.py                 ← Main FastAPI service
│   ├── cv_tampering.py            ← OpenCV tampering logic
│   ├── cyber_anomaly.py           ← ONNX XGBoost inference
│   ├── graph_engine.py            ← GNN + Fraud logic
│   └── static/                    ← Annotated images saved here
├── models/
│   ├── xgb_ids.onnx               ← Cyber model
│   └── gnn_graph.pkl              ← GNN model
├── requirements.txt
└── README.md
text---

##  Installation & Setup

```bash
# 1. Clone / Go to folder
cd ClaimShield

# 2. Create virtual environment
python -m venv .venv
.venv\Scripts\activate     # Windows

# 3. Install dependencies
pip install fastapi uvicorn python-multipart opencv-python pillow onnxruntime scikit-learn torch

# 4. Create static folder
mkdir ml\static

 Running the Service
PowerShell# From ClaimShield root
uvicorn ml.ml_api.app:app --reload --port 8002
Swagger UI: http://127.0.0.1:8002/docs
Root Check: http://127.0.0.1:8002/

 API Endpoints
1. Unified Multi-Modal Endpoint (Recommended)
POST /analyze-claim

document: Image file (multipart)
network_data: JSON string (form data)

Response:
JSON{
  "overall_verdict": "HIGH RISK - FRAUD",
  "cv": { ... },
  "cyber": { ... },
  "gnn_fraud": { ... }
}
2. Individual Endpoints

POST/ml/cv/tamper → Document tampering + annotated_image_url
POST/ml/cyber/score → Cyber attack probability
POST/ml/graph/rings → Fraud ring detection


 Test JSON Examples (Fraudulent)
Cyber (High Attack) – Paste in /ml/cyber/score
JSON{
  "Destination Port": 443,
  "Flow Duration": 150000000,
  "Total Fwd Packets": 185000,
  ...
  "total_claim_amount": 2450000
}
GNN (Fraud Ring) – Paste in /ml/graph/rings
JSON{
  "claims": [
    { "policy_id": "POL98765", "total_claim_amount": 2450000, "claimant_id": "CLM999", ... },
    { "policy_id": "POL98766", "total_claim_amount": 1980000, "claimant_id": "CLM999", ... }
  ]
}

 Demo Flow (Judge Presentation)

Upload document image + network JSON
Hit /analyze-claim
Get:
Annotated image with red boxes (tampering)
Cyber attack probability
GNN fraud ring score
Overall Verdict: HIGH RISK - FRAUD



 Future Improvements

Docker + Nginx deployment
Async parallel inference
RAG-based explanation chatbot
Mobile app integration
Real-time dashboard


Contact & License
Developed by: Kushagra (ClaimShield Team)
For: Insurance Fraud Detection Demo
License: Private (Internal Use Only)

Made with ❤️ using FastAPI + Multi-Modal ML
