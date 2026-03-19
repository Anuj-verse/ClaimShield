import os
import json
import requests
from dotenv import load_dotenv
from rag_pipeline import get_similar_context
from risk_scorer import calculate_risk_score

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def call_openrouter(prompt):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": "arcee-ai/trinity-mini-20251201:free",
        "messages": [
            {
                "role": "system",
                "content": """You are an insurance fraud detection expert. 
                Always respond in valid JSON format only. No extra text."""
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
    return response.json()['choices'][0]['message']['content']

def generate_report(claim_data: dict):
    claim_text = (
        f"{claim_data.get('incident_type')}, "
        f"Severity: {claim_data.get('severity')}, "
        f"Amount: {claim_data.get('amount')}, "
        f"Hour: {claim_data.get('hour')}, "
        f"Police Report: {claim_data.get('police_report')}, "
        f"Witnesses: {claim_data.get('witnesses')}"
    )
    
    context = get_similar_context(claim_text)

    prompt = f"""
Analyze this insurance claim and return ONLY a JSON object.

Claim Details:
{claim_text}

Similar Past Cases:
{context}

Return this exact JSON structure:
{{
    "risk_score": <number 0-100>,
    "risk_level": "<LOW|MEDIUM|HIGH>",
    "is_suspicious": <true|false>,
    "red_flags": ["<flag1>", "<flag2>"],
    "matching_patterns": ["<pattern1>", "<pattern2>"],
    "recommended_actions": ["<action1>", "<action2>"],
    "summary": "<2-3 sentence summary>"
}}
"""
    
    raw = call_openrouter(prompt)
    
    clean = raw.strip()
    if clean.startswith("```"):
        clean = clean.split("```")[1]
        if clean.startswith("json"):
            clean = clean[4:]
    clean = clean.strip()
    
    try:
        report = json.loads(clean)
    except:
        report = {
            "risk_score": 50,
            "risk_level": "MEDIUM",
            "is_suspicious": True,
            "red_flags": ["Unable to parse AI response"],
            "matching_patterns": [],
            "recommended_actions": ["Manual review required"],
            "summary": raw[:200]
        }
    
    # Hybrid scoring add karo
    hybrid = calculate_risk_score(claim_data, ai_score=report.get('risk_score', 50))
    report['rule_based_score'] = hybrid['rule_based_score']
    report['final_score'] = hybrid['final_score']
    report['risk_level'] = hybrid['risk_level']
    report['triggered_rules'] = hybrid['triggered_rules']
    
    return report

if __name__ == "__main__":
    test_claim = {
        "incident_type": "Single Vehicle Collision",
        "severity": "Major Damage",
        "amount": 71000,
        "hour": 2,
        "police_report": "YES",
        "witnesses": 1
    }
    
    report = generate_report(test_claim)
    print(json.dumps(report, indent=2))