from flask import Flask, request, jsonify
from report_generator import generate_report
from chatbot import get_chat_reply
from xgboost_scorer import get_xgboost_score
from gnn.gnn_service import get_neighbours
from cv.cv_tampering import cv_blueprint

app = Flask(__name__)
app.register_blueprint(cv_blueprint, url_prefix='/cv')

@app.route('/score', methods=['POST'])
def score():
    try:
        data = request.json
        # Convert JS keys to Python keys for consistency
        claim_data = {
            "incident_type": data.get("claimType", "Unknown"),
            "severity": "Major Damage" if data.get("amount", 0) > 50000 else "Minor Damage",
            "amount": data.get("amount", 0),
            "hour": 14, # default as it's not in the UI form currently
            "police_report": "YES" if "police" in data.get("description", "").lower() else "NO",
            "witnesses": 1 if "witness" in data.get("description", "").lower() else 0
        }
        
        report = generate_report(claim_data)
        
        # Use the brand new XGBoost pre-trained fraud model
        xgb_risk = get_xgboost_score(claim_data)
        
        # Map python report to what JS frontend expects
        transformed = {
            "riskScore": xgb_risk,
            "fraudFlags": report.get("red_flags", []) + report.get("triggered_rules", []),
            "shapValues": {
                "claim_amount": 0.35 if claim_data["amount"] > 50000 else 0.1,
                "night_incident": 0.2 if claim_data["hour"] < 5 else 0.0,
                "missing_police_report": 0.45 if claim_data["police_report"] == "NO" else -0.1,
                "velocity_mismatch": 0.15
            },
            "fraudRingId": "RING-X" if report.get("is_suspicious") else None,
            "nlpSummary": report.get("summary", "")
        }
        return jsonify(transformed)
    except Exception as e:
        print("Error during scoring:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        question = data.get('question', '')
        context = data.get('claim_context', '')
        
        # Format context for python prompt
        ctx_str = f"Score: {context.get('riskScore')}. Flags: {context.get('fraudFlags')}. Desc: {context.get('description')}. SHAP: {context.get('shapValues')}" if context else ""
        
        reply = get_chat_reply(question, ctx_str)
        return jsonify({"reply": reply})
    except Exception as e:
        print("Error during chat:", e)
        return jsonify({"error": str(e)}), 500


@app.route('/gnn', methods=['POST'])
def gnn():
    try:
        data = request.json
        claim_id = data.get('claimId', '')
        depth = int(data.get('depth', 2))
        result = get_neighbours(claim_id, depth)
        return jsonify(result)
    except Exception as e:
        print('GNN error:', e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
