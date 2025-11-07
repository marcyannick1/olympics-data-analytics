import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd

from models.train_country_regression import (
    ensure_country_models, predict_country_medals, predict_top25
)
from models.train_athlete_classifier import (
    ensure_athlete_model, predict_athletes_batch
)
from models.train_clustering import (
    ensure_clustering_model, cluster_countries
)

app = Flask(__name__)
CORS(app)  # autorise http://localhost:5173 par défaut

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

# Entraîne/charge modèles au boot
ensure_country_models(DATA_DIR, ARTIFACTS_DIR)
ensure_athlete_model(DATA_DIR, ARTIFACTS_DIR)
ensure_clustering_model(DATA_DIR, ARTIFACTS_DIR)

@app.get("/health")
def health():
    return jsonify(status="ok")

# ---- PREDICTIONS PAYS ----
@app.get("/predict/france")
def api_predict_france():
    year = int(request.args.get("year", 2024))
    out = predict_country_medals(DATA_DIR, ARTIFACTS_DIR, target_noc="FRA", year=year)
    return jsonify(out)

@app.get("/predict/top25")
def api_predict_top25():
    year = int(request.args.get("year", 2024))
    res = predict_top25(DATA_DIR, ARTIFACTS_DIR, year=year, top_k=25)
    return jsonify(res)

# ---- PREDICTIONS ATHLETES ----
@app.post("/predict/athletes")
def api_predict_athletes():
    """
    Requête JSON attendue:
    {
      "examples": [
        {
          "age": 27, "world_rank": 4, "recent_form": 0.82,
          "team_strength": 0.70, "prior_medals": 1,
          "gender": "M", "event_id": 123, "country_id": 33, "is_host": false
        },
        ...
      ]
    }
    """
    payload = request.get_json(force=True)
    df = pd.DataFrame(payload.get("examples", []))
    preds = predict_athletes_batch(ARTIFACTS_DIR, df)
    return jsonify(preds)

# ---- CLUSTERING ----
@app.get("/cluster/countries")
def api_cluster_countries():
    year = int(request.args.get("year", 2020))
    k = int(request.args.get("k", 5))
    labels, centers = cluster_countries(DATA_DIR, ARTIFACTS_DIR, year=year, k=k)
    return jsonify({"year": year, "k": k, "labels": labels, "centroids": centers})

# ---- TRAIN ENDPOINTS (optionnel) ----
@app.post("/train/country")
def api_train_country():
    ensure_country_models(DATA_DIR, ARTIFACTS_DIR, force_retrain=True)
    return jsonify({"status": "retrained"})

@app.post("/train/athletes")
def api_train_athletes():
    ensure_athlete_model(DATA_DIR, ARTIFACTS_DIR, force_retrain=True)
    return jsonify({"status": "retrained"})

@app.post("/train/clustering")
def api_train_clustering():
    ensure_clustering_model(DATA_DIR, ARTIFACTS_DIR, force_retrain=True)
    return jsonify({"status": "retrained"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)