import os
import pickle
import pandas as pd
import warnings
warnings.filterwarnings("ignore")

model_path = os.path.join(os.path.dirname(__file__), "xgboost/fraud_detection_model.pkl")
scaler_path = os.path.join(os.path.dirname(__file__), "xgboost/scaler.pkl")

# Load globally
with open(model_path, "rb") as f:
    xgb_model = pickle.load(f)
with open(scaler_path, "rb") as f:
    scaler = pickle.load(f)

feature_cols = ['months_as_customer', 'age', 'insured_zip', 'capital-gains', 'capital-loss', 'incident_hour_of_the_day', 'number_of_vehicles_involved', 'bodily_injuries', 'witnesses', 'total_claim_amount', 'injury_claim', 'property_claim', 'vehicle_claim', 'auto_year', 'insured_education_level_encoded', 'insured_sex_MALE', 'insured_occupation_armed-forces', 'insured_occupation_craft-repair', 'insured_occupation_exec-managerial', 'insured_occupation_farming-fishing', 'insured_occupation_handlers-cleaners', 'insured_occupation_machine-op-inspct', 'insured_occupation_other-service', 'insured_occupation_priv-house-serv', 'insured_occupation_prof-specialty', 'insured_occupation_protective-serv', 'insured_occupation_sales', 'insured_occupation_tech-support', 'insured_occupation_transport-moving', 'insured_relationship_not-in-family', 'insured_relationship_other-relative', 'insured_relationship_own-child', 'insured_relationship_unmarried', 'insured_relationship_wife', 'incident_type_Parked Car', 'incident_type_Single Vehicle Collision', 'incident_type_Vehicle Theft', 'collision_type_Rear Collision', 'collision_type_Side Collision', 'collision_type_Unknown', 'authorities_contacted_Fire', 'authorities_contacted_None', 'authorities_contacted_Other', 'authorities_contacted_Police', 'property_damage_No', 'property_damage_YES', 'police_report_available_No', 'police_report_available_YES', 'days_to_incident', 'injury_ratio', 'vehicle_ratio']

def get_xgboost_score(claim_data: dict) -> int:
    if xgb_model is None or scaler is None:
        return 50 # Fallback
        
    data = {col: [0.0] for col in feature_cols}
    data['months_as_customer'] = [24.0]
    data['age'] = [35.0]
    data['auto_year'] = [2018.0]
    
    amount = float(claim_data.get("amount", 0))
    data['total_claim_amount'] = [amount]
    data['vehicle_claim'] = [amount * 0.7]
    data['property_claim'] = [amount * 0.1]
    data['injury_claim'] = [amount * 0.2]
    
    if claim_data.get('police_report') == 'YES':
        data['police_report_available_YES'] = [1.0]
    else:
        data['police_report_available_No'] = [1.0]
        
    incident_type = claim_data.get("incident_type", "")
    if "Single Vehicle" in incident_type:
        data['incident_type_Single Vehicle Collision'] = [1.0]
    elif "Theft" in incident_type:
        data['incident_type_Vehicle Theft'] = [1.0]
        
    data['witnesses'] = [float(claim_data.get('witnesses', 0))]
    
    df = pd.DataFrame(data)
    df_scaled = scaler.transform(df)
    
    proba = xgb_model.predict_proba(df_scaled)[0][1]
    return int(proba * 100)
