def calculate_risk_score(claim_data: dict, ai_score: int) -> dict:
    """
    Rule-based + AI hybrid scoring
    """
    score = 0
    flags = []

    # Rule 1: Night time (10pm - 4am)
    hour = claim_data.get('hour', 12)
    if hour >= 22 or hour <= 4:
        score += 20
        flags.append("Night time incident (high risk window)")

    # Rule 2: High claim amount
    amount = claim_data.get('amount', 0)
    if amount > 60000:
        score += 25
        flags.append(f"High claim amount: ₹{amount}")
    elif amount > 40000:
        score += 10
        flags.append(f"Above average amount: ₹{amount}")

    # Rule 3: No police report
    if claim_data.get('police_report') == 'NO':
        score += 20
        flags.append("No police report filed")

    # Rule 4: No witnesses
    if claim_data.get('witnesses', 1) == 0:
        score += 15
        flags.append("No witnesses present")

    # Rule 5: Major damage
    if claim_data.get('severity') == 'Major Damage':
        score += 10
        flags.append("Major damage claimed")

    # Rule 6: Single vehicle (staged accident risk)
    if 'Single Vehicle' in claim_data.get('incident_type', ''):
        score += 10
        flags.append("Single vehicle collision (staged risk)")

    # Hybrid: Rule score + AI score average
    rule_score = min(score, 100)
    final_score = int((rule_score * 0.6) + (ai_score * 0.4))

    # Risk level
    if final_score >= 70:
        risk_level = "HIGH"
    elif final_score >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "rule_based_score": rule_score,
        "ai_score": ai_score,
        "final_score": final_score,
        "risk_level": risk_level,
        "triggered_rules": flags
    }

if __name__ == "__main__":
    test = {
        "incident_type": "Single Vehicle Collision",
        "severity": "Major Damage",
        "amount": 71000,
        "hour": 2,
        "police_report": "NO",
        "witnesses": 0
    }
    result = calculate_risk_score(test, ai_score=45)
    import json
    print(json.dumps(result, indent=2))