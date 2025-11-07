import os
import joblib
import numpy as np
import pandas as pd

from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import PoissonRegressor

# ✅ on importe seulement notre builder final
from features.build_country_features import build_country_features

# chemins de sauvegarde
GOLD_PATH = "country_gold.joblib"
SILVER_PATH = "country_silver.joblib"
BRONZE_PATH = "country_bronze.joblib"
SCALER_PATH = "scaler_country.pkl"


# ----------------------------------------------------
# 1️⃣ Fonction d'entraînement interne
# ----------------------------------------------------
def _fit_models(X, y_gold, y_silver, y_bronze):
    """
    Entraîne trois modèles séparés (Gold, Silver, Bronze)
    sur les mêmes features.
    """
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    m_gold   = RandomForestRegressor(n_estimators=400, random_state=42)
    m_silver = GradientBoostingRegressor(n_estimators=500, learning_rate=0.05, random_state=42)
    m_bronze = PoissonRegressor(alpha=1.0, max_iter=500)

    m_gold.fit(X_scaled, y_gold)
    m_silver.fit(X_scaled, y_silver)
    m_bronze.fit(X_scaled, y_bronze)

    return scaler, m_gold, m_silver, m_bronze


# ----------------------------------------------------
# 2️⃣ Entraînement et sauvegarde des modèles
# ----------------------------------------------------
def ensure_country_models(data_dir: str, artifacts_dir: str, force_retrain: bool = False):
    """
    Construit les features pays et entraîne les modèles
    pour prédire les médailles Gold/Silver/Bronze.
    """
    gold_f = os.path.join(artifacts_dir, GOLD_PATH)
    if all(os.path.exists(os.path.join(artifacts_dir, p)) for p in [GOLD_PATH, SILVER_PATH, BRONZE_PATH, SCALER_PATH]) and not force_retrain:
        return  # les modèles existent déjà

    # 🔹 on construit le dataset complet
    df = build_country_features(data_dir)

    # 🔹 on définit X et les cibles
    target_cols = ["Gold", "Silver", "Bronze"]
    feature_cols = [c for c in df.columns if c not in target_cols + ["Country", "NOC", "Year", "Season"]]

    X = df[feature_cols]
    y_gold = df["Gold"].values
    y_silver = df["Silver"].values
    y_bronze = df["Bronze"].values

    scaler, m_gold, m_silver, m_bronze = _fit_models(X, y_gold, y_silver, y_bronze)

    # 🔹 on sauvegarde les modèles
    os.makedirs(artifacts_dir, exist_ok=True)
    joblib.dump(m_gold, os.path.join(artifacts_dir, GOLD_PATH))
    joblib.dump(m_silver, os.path.join(artifacts_dir, SILVER_PATH))
    joblib.dump(m_bronze, os.path.join(artifacts_dir, BRONZE_PATH))
    joblib.dump(scaler, os.path.join(artifacts_dir, SCALER_PATH))

    print("✅ Modèles pays entraînés et sauvegardés.")


# ----------------------------------------------------
# 3️⃣ Fonction de prédiction pour un pays
# ----------------------------------------------------
def predict_country_medals(data_dir: str, artifacts_dir: str, target_noc: str, year: int, season: str = "Summer"):
    """
    Prédit les médailles pour un pays donné à une année future.
    """
    df = build_country_features(data_dir)

    # on prend la dernière année connue pour ce pays/saison
    last = df[(df["NOC"] == target_noc) & (df["Season"] == season)].sort_values("Year").tail(1)
    if last.empty:
        raise ValueError(f"Aucune donnée historique trouvée pour {target_noc} ({season}).")

    # on met à jour l'année pour la projection
    last["Year"] = year

    # rechargement des modèles
    scaler = joblib.load(os.path.join(artifacts_dir, SCALER_PATH))
    m_gold = joblib.load(os.path.join(artifacts_dir, GOLD_PATH))
    m_silver = joblib.load(os.path.join(artifacts_dir, SILVER_PATH))
    m_bronze = joblib.load(os.path.join(artifacts_dir, BRONZE_PATH))

    # features
    feature_cols = [c for c in last.columns if
                    c not in ["Country", "NOC", "Gold", "Silver", "Bronze", "Season", "Year"]]
    X = last[feature_cols]
    X_scaled = scaler.transform(X)

    pred_gold = int(round(m_gold.predict(X_scaled)[0]))
    pred_silver = int(round(m_silver.predict(X_scaled)[0]))
    pred_bronze = int(round(m_bronze.predict(X_scaled)[0]))
    pred_total = pred_gold + pred_silver + pred_bronze

    return {
        "year": year,
        "season": season,
        "country_code": last["NOC"].iloc[0],
        "country": last["Country"].iloc[0],
        "predictions": {
            "gold": pred_gold,
            "silver": pred_silver,
            "bronze": pred_bronze,
            "total": pred_total
        }
    }


# ----------------------------------------------------
# 4️⃣ Fonction de prédiction pour le top 25
# ----------------------------------------------------
def predict_top25(data_dir: str, artifacts_dir: str, year: int, season: str = "Summer", top_k: int = 25):
    """
    Prédit le top K des pays pour une année donnée.
    """
    df = build_country_features(data_dir)

    # dernière année connue pour chaque pays
    last = (
        df[df["Season"] == season]
        .sort_values(["NOC", "Year"])
        .groupby("NOC", as_index=False)
        .tail(1)
    )
    last["Year"] = year

    # modèles
    scaler = joblib.load(os.path.join(artifacts_dir, SCALER_PATH))
    m_gold = joblib.load(os.path.join(artifacts_dir, GOLD_PATH))
    m_silver = joblib.load(os.path.join(artifacts_dir, SILVER_PATH))
    m_bronze = joblib.load(os.path.join(artifacts_dir, BRONZE_PATH))

    # prédictions
    feature_cols = [c for c in last.columns if
                    c not in ["Country", "NOC", "Gold", "Silver", "Bronze", "Season", "Year"]]
    X = last[feature_cols]
    X_scaled = scaler.transform(X)

    preds_gold = np.maximum(0, np.round(m_gold.predict(X_scaled))).astype(int)
    preds_silver = np.maximum(0, np.round(m_silver.predict(X_scaled))).astype(int)
    preds_bronze = np.maximum(0, np.round(m_bronze.predict(X_scaled))).astype(int)
    preds_total = preds_gold + preds_silver + preds_bronze

    last["pred_gold"] = preds_gold
    last["pred_silver"] = preds_silver
    last["pred_bronze"] = preds_bronze
    last["pred_total"] = preds_total

    # tri
    top = last.sort_values(["pred_total", "pred_gold", "pred_silver"], ascending=False).head(top_k)

    return {
        "year": year,
        "season": season,
        "top": [
            {
                "country_code": row["NOC"],
                "country": row["Country"],
                "pred_gold": int(row["pred_gold"]),
                "pred_silver": int(row["pred_silver"]),
                "pred_bronze": int(row["pred_bronze"]),
                "pred_total": int(row["pred_total"])
            }
            for _, row in top.iterrows()
        ]
    }