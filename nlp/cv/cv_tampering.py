"""
cv_tampering.py
---------------
Advanced OpenCV tampering detection with RED BOX annotation + detailed report.
Returns: tampering_score, verdict, annotated_image_b64, ela_heatmap_b64, reasons
"""

import logging
from flask import Blueprint, request, jsonify
import cv2
import numpy as np
from PIL import Image
import io
import base64

logger = logging.getLogger(__name__)
cv_blueprint = Blueprint('cv', __name__)

# ====================== ANALYSIS FUNCTIONS ======================
def _ela_analysis(img_pil: Image.Image) -> tuple[np.ndarray, float]:
    buffer = io.BytesIO()
    img_pil.save(buffer, format='JPEG', quality=75)
    buffer.seek(0)
    compressed = Image.open(buffer).convert('RGB')

    original = np.array(img_pil.convert('RGB'), dtype=np.float32)
    compressed_arr = np.array(compressed, dtype=np.float32)
    ela = np.abs(original - compressed_arr)
    ela_amplified = np.clip(ela * 15, 0, 255).astype(np.uint8)
    return ela_amplified, float(ela_amplified.std())

def _clone_detection(img_gray: np.ndarray) -> tuple[float, list]:
    orb = cv2.ORB_create(nfeatures=500)
    kp, des = orb.detectAndCompute(img_gray, None)
    if des is None or len(des) < 10:
        return 0.0, []
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(des, des)
    suspicious_pairs = 0
    clone_boxes = []
    for m in matches:
        if m.queryIdx != m.trainIdx:
            pt1 = kp[m.queryIdx].pt
            pt2 = kp[m.trainIdx].pt
            dist = np.hypot(pt1[0]-pt2[0], pt1[1]-pt2[1])
            if dist > 20:
                suspicious_pairs += 1
                x, y = int(min(pt1[0], pt2[0])), int(min(pt1[1], pt2[1]))
                w, h = int(abs(pt1[0]-pt2[0]))+30, int(abs(pt1[1]-pt2[1]))+30
                clone_boxes.append((x, y, w, h))
    clone_score = min(suspicious_pairs / 50.0, 1.0)
    return clone_score, clone_boxes

def _noise_inconsistency(img_gray: np.ndarray) -> tuple[float, list]:
    lap = cv2.Laplacian(img_gray, cv2.CV_64F)
    h, w = lap.shape
    block_h, block_w = h//4, w//4
    block_stds = []
    noise_boxes = []
    for i in range(4):
        for j in range(4):
            block = lap[i*block_h:(i+1)*block_h, j*block_w:(j+1)*block_w]
            std = float(block.std())
            block_stds.append(std)
            if std > 40:  # suspicious block
                noise_boxes.append((j*block_w, i*block_h, block_w, block_h))
    variance = float(np.std(block_stds))
    return variance, noise_boxes

def _encode_b64(img: np.ndarray) -> str:
    _, buffer = cv2.imencode('.jpg', img)
    return base64.b64encode(buffer).decode('utf-8')

# ====================== MAIN ENDPOINT (Live Website Ready) ======================
@cv_blueprint.route("/tamper", methods=["POST"])
def detect_tampering():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
            
        file = request.files['file']
        contents = file.read()
        img_pil = Image.open(io.BytesIO(contents)).convert('RGB')
        img_np = np.array(img_pil)
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        img_gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

        # Run analyses
        ela_map, ela_score = _ela_analysis(img_pil)
        clone_score, clone_boxes = _clone_detection(img_gray)
        noise_var, noise_boxes = _noise_inconsistency(img_gray)

        # Composite Score
        ela_norm = min(ela_score / 30.0, 1.0)
        composite = ela_norm * 0.5 + clone_score * 0.3 + (1 if noise_var > 25 else 0) * 0.2
        tampering_score = round(composite * 100, 2)

        # Verdict
        if tampering_score > 60:
            verdict = "HIGH TAMPERING RISK"
            is_tampered = True
        elif tampering_score > 35:
            verdict = "MODERATE — MANUAL REVIEW NEEDED"
            is_tampered = True
        else:
            verdict = "DOCUMENT APPEARS AUTHENTIC"
            is_tampered = False

        # Draw RED BOXES on annotated image
        annotated = img_bgr.copy()
        for box in clone_boxes:
            x, y, w, h = box
            cv2.rectangle(annotated, (x, y), (x+w, y+h), (0, 0, 255), 3)
        for box in noise_boxes:
            x, y, w, h = box
            cv2.rectangle(annotated, (x, y), (x+w, y+h), (0, 0, 255), 3)

        # Generate reasons
        reasons = []
        if ela_score > 15: reasons.append(f"ELA inconsistency detected (score: {ela_score:.1f})")
        if clone_score > 0.3: reasons.append(f"Copy-paste cloning detected ({len(clone_boxes)} regions)")
        if noise_var > 25: reasons.append(f"Noise pattern inconsistency (variance: {noise_var:.1f})")

        return jsonify({
            "tampering_score": tampering_score,
            "is_tampered": is_tampered,
            "verdict": verdict,
            "reasons": reasons or ["No significant tampering indicators"],
            "annotated_image_b64": _encode_b64(annotated),   # RED BOXES wali image
            "ela_heatmap_b64": _encode_b64(ela_map),
            "dataset_used": "insurance_images"
        })

    except Exception as e:
        logger.error(f"Tampering analysis failed: {e}")
        return jsonify({"error": str(e)}), 500