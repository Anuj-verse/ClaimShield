# ClaimShield ML Models Documentation

The ClaimShield NLP/ML microservice runs on a Flask server (default port `5001`) and exposes four distinct Machine Learning models/pipelines. This document explains the routing, expected inputs, and outputs for all 4 models.

---

## 1. XGBoost Risk Scorer & NLP Report Generator
**Endpoint**: `POST /score`
**File**: `app.py`, `xgboost_scorer.py`, `report_generator.py`

**Purpose**: 
Combines an XGBoost tabular model to calculate a quantitative "Risk Score" with an NLP model to generate a textual summary and detect explicit red flags from the incident description.

**Expected Input (JSON)**:
```json
{
  "claimType": "Auto Insurance",
  "amount": 15000,
  "description": "Rear-end collision at a traffic light. Minor damage, no police report filed."
}
```

**Expected Output (JSON)**:
```json
{
  "riskScore": 72.5,
  "fraudFlags": ["Missing police report", "Velocity mismatch potentially"],
  "shapValues": {
    "claim_amount": 0.1,
    "night_incident": 0.0,
    "missing_police_report": 0.45,
    "velocity_mismatch": 0.15
  },
  "fraudRingId": null,
  "nlpSummary": "The claim involves a rear-end collision with minor damage. Lack of police report raises a minor flag."
}
```

---

## 2. LLM Claim Assistant (RAG/Chatbot)
**Endpoint**: `POST /chat`
**File**: `chatbot.py`

**Purpose**: 
An interactive AI assistant (LLM) that allows adjusters to ask specific questions about a claim. It uses context from the claim's metadata and descriptions to generate highly specific contextual answers.

**Expected Input (JSON)**:
```json
{
  "question": "Does the lack of a police report indicate fraud here?",
  "claim_context": {
    "riskScore": 72.5,
    "fraudFlags": ["Missing police report"],
    "description": "Rear-end collision at a traffic light..."
  }
}
```

**Expected Output (JSON)**:
```json
{
  "reply": "Based on standard adjustor guidelines, the lack of a police report for a $15,000 claim is highly suspicious and warrants manual verification, especially given the calculated risk score of 72.5."
}
```

---

## 3. Graph Neural Network (GNN) for Fraud Rings
**Endpoint**: `POST /gnn`
**File**: `gnn/gnn_service.py`

**Purpose**: 
Queries the Neo4j Graph Database to find connected components and relationships. It uses GNN concepts to traverse N-degrees of separation (depth) to uncover organized fraud rings sharing identical phone numbers, addresses, or mechanics.

**Expected Input (JSON)**:
```json
{
  "claimId": "CLM-123456",
  "depth": 2
}
```

**Expected Output (JSON)**:
Returns a graph structure containing nodes and their relationship edges.
```json
{
  "nodes": [
    { "id": "CLM-123456", "label": "Claim", "properties": { "amount": 15000 } },
    { "id": "P-9988", "label": "Person", "properties": { "name": "John Doe" } }
  ],
  "links": [
    { "source": "P-9988", "target": "CLM-123456", "type": "FILED" }
  ]
}
```

---

## 4. Computer Vision (CV) Image Tampering Detection
**Endpoint**: `POST /cv/tamper`
**File**: `cv/cv_tampering.py` (Registered as a Flask Blueprint)

**Purpose**: 
Analyzes uploaded images for signs of digital forgery. It combining three distinct CV algorithms:
1. **ELA (Error Level Analysis)**: Detects inconsistencies in JPEG compression rates.
2. **Clone Detection (ORB Keypoints)**: Detects copy-paste cloning within the image.
3. **Noise Inconsistency**: Analyzes the variance in Laplacian noise to find spliced areas.

**Expected Input (Multipart/Form-Data)**:
- `file`: The binary image file (e.g., `image/jpeg` or `image/png`).

**Expected Output (JSON)**:
```json
{
  "tampering_score": 85.2,
  "is_tampered": true,
  "verdict": "HIGH TAMPERING RISK",
  "reasons": [
    "Copy-paste cloning detected (3 regions)",
    "ELA inconsistency detected (score: 22.1)"
  ],
  "annotated_image_b64": "base64_encoded_image_string_with_red_bounding_boxes...",
  "ela_heatmap_b64": "base64_encoded_heat_map_image_string...",
  "dataset_used": "insurance_images"
}
```
