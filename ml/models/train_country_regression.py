import os
import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import PoissonRegressor

from .utils import read_medals, read_hosts, build_country_panel, features_target_country

GOLD_PATH = "country_gold.joblib"
SILVER_PATH = "country_silver.joblib"
BRONZE_PATH = "country_bronze.joblib"
SCALER_PATH = "scaler_country.pkl"
OHE_PATH = "ohe_country.pkl"

def _fit_models(X, y_gold, y_silver, y_bronze):
    # Prétraitement très simple (is_host + lags -> StandardScaler pour num)
    # Ici pas de catégorielles (tout num), on garde un scaler
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)

    # 3 modèles (tu peux switcher avec GB/Poisson selon perfs)
    m_gold   = RandomForestRegressor(n_estimators=400, random_state=42)
    m_silver = GradientBoostingRegressor(n_estimators=500, learning_rate=0.05, random_state=42)
    m_bronze = PoissonRegressor(alpha=1.0, max_iter=500)

    m_gold.fit(Xs, y_gold)
    m_silver.fit(Xs, y_silver)
    m_bronze.fit(Xs, y_bronze)

    return scaler, m_gold, m_silver, m_bronze

def ensure_country_models(data_dir: str, artifacts_dir: str, force_retrain: bool=False):
    gold_f = os.path.join(artifacts_dir, GOLD_PATH)
    if all(os.path.exists(os.path.join(artifacts_dir, p)) for p in [GOLD_PATH, SILVER_PATH, BRONZE_PATH, SCALER_PATH]) and not force_retrain:
        return

    df_medals = read_medals(data_dir)
    df_hosts = read_hosts(data_dir)
    panel = build_country_panel(df_medals, df_hosts)

    X, y_gold, y_silver, y_bronze, meta = features_target_country(panel)
    scaler, m_gold, m_silver, m_bronze = _fit_models(X, y_gold, y_silver, y_bronze)

    joblib.dump(m_gold, os.path.join(artifacts_dir, GOLD_PATH))
    joblib.dump(m_silver, os.path.join(artifacts_dir, SILVER_PATH))
    joblib.dump(m_bronze, os.path.join(artifacts_dir, BRONZE_PATH))
    joblib.dump(scaler, os.path.join(artifacts_dir, SCALER_PATH))

def _predict_one_year(panel_year: pd.DataFrame, scaler, m_gold, m_silver, m_bronze):
    X, _, _, _, meta = features_target_country(panel_year)
    Xs = scaler.transform(X)
    pred_g = np.maximum(0, np.round(m_gold.predict(Xs))).astype(int)
    pred_s = np.maximum(0, np.round(m_silver.predict(Xs))).astype(int)
    pred_b = np.maximum(0, np.round(m_bronze.predict(Xs))).astype(int)
    out = meta.copy()
    out["pred_gold"] = pred_g
    out["pred_silver"] = pred_s
    out["pred_bronze"] = pred_b
    out["pred_total"] = out[["pred_gold","pred_silver","pred_bronze"]].sum(axis=1)
    return out

def predict_country_medals(data_dir: str, artifacts_dir: str, target_noc: str, year: int, season: str="Summer"):
    df_medals = read_medals(data_dir)
    df_hosts = read_hosts(data_dir)
    panel = build_country_panel(df_medals, df_hosts)
    scaler = joblib.load(os.path.join(artifacts_dir, SCALER_PATH))
    m_gold = joblib.load(os.path.join(artifacts_dir, GOLD_PATH))
    m_silver = joblib.load(os.path.join(artifacts_dir, SILVER_PATH))
    m_bronze = joblib.load(os.path.join(artifacts_dir, BRONZE_PATH))

    # Construit la ligne de features pour l'année cible: on duplique la dernière ligne par NOC/Season pour créer les lags
    last = panel[(panel["NOC"] == target_noc) & (panel["Season"] == season)].sort_values("Year").tail(1)
    if last.empty:
        # fallback: prend des médianes globales
        base = panel[panel["Season"] == season].groupby("NOC", as_index=False).tail(1)
    else:
        base = last.copy()
    base["Year"] = year
    pred_df = _predict_one_year(base, scaler, m_gold, m_silver, m_bronze)
    row = pred_df.iloc[0].to_dict()
    return {
        "year": year, "season": season,
        "noc": row.get("NOC"), "country": row.get("Country"),
        "pred": {
            "gold": int(row["pred_gold"]),
            "silver": int(row["pred_silver"]),
            "bronze": int(row["pred_bronze"]),
            "total": int(row["pred_total"])
        }
    }

def predict_top25(data_dir: str, artifacts_dir: str, year: int, season: str="Summer", top_k: int=25):
    df_medals = read_medals(data_dir)
    df_hosts = read_hosts(data_dir)
    panel = build_country_panel(df_medals, df_hosts)
    scaler = joblib.load(os.path.join(artifacts_dir, SCALER_PATH))
    m_gold = joblib.load(os.path.join(artifacts_dir, GOLD_PATH))
    m_silver = joblib.load(os.path.join(artifacts_dir, SILVER_PATH))
    m_bronze = joblib.load(os.path.join(artifacts_dir, BRONZE_PATH))

    # prend la dernière ligne connue par NOC/Season et projette à 'year'
    last = (panel[panel["Season"] == season]
            .sort_values(["NOC","Year"])
            .groupby("NOC", as_index=False).tail(1))
    last["Year"] = year

    preds = _predict_one_year(last, scaler, m_gold, m_silver, m_bronze)
    preds = preds.sort_values(["pred_total","pred_gold","pred_silver"], ascending=False).head(top_k)
    return {
        "year": year, "season": season,
        "top": preds[["NOC","Country","pred_gold","pred_silver","pred_bronze","pred_total"]].to_dict(orient="records")
    }