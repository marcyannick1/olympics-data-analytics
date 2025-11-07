import os
import joblib
import numpy as np
import pandas as pd

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from .utils import read_medals, features_athletes_from_json

MODEL_PATH = "athlete_classifier.joblib"
PREPROC_PATH = "preproc_athlete.pkl"

def _toy_athlete_training(df_medals: pd.DataFrame):
    """
    MVP: on génère un dataset artificiel d'athlètes à partir des pays.
    Dans la vraie vie, tu chargeras un vrai CSV athletes + résultats.
    """
    rows = []
    for _, r in df_medals.iterrows():
        # génère un petit échantillon par pays/année
        total = int(r["Total"])
        n = max(50, total * 5)  # faux nombre d'athlètes
        for i in range(n):
            ex = {
                "age": np.random.randint(18, 35),
                "world_rank": np.random.uniform(1, 200),
                "recent_form": np.random.uniform(0, 1),
                "team_strength": min(1.0, 0.2 + np.log1p(r["Total"])/5),
                "prior_medals": np.random.poisson(0.2),
                "gender": np.random.choice(["M","F"]),
                "event_id": np.random.randint(1, 200),
                "country_id": hash(r["NOC"]) % 5000,
                "is_host": False,
            }
            # probabilité artificielle basée sur le total pays
            p = min(0.25, 0.02 + r["Total"]/400.0)
            y = (np.random.rand() < p)
            rows.append({**ex, "label_medal": int(y)})
    df = pd.DataFrame(rows)
    return df

def _fit_athlete_model(df_train: pd.DataFrame):
    X, num_cols, cat_cols = features_athletes_from_json(df_train)
    y = df_train["label_medal"].values

    pre = ColumnTransformer([
        ("num", StandardScaler(), num_cols),
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols)
    ])

    # Baseline: LogReg équilibrée
    clf = LogisticRegression(max_iter=300, class_weight="balanced")
    pipe = Pipeline([("pre", pre), ("clf", clf)])
    pipe.fit(X, y)
    return pipe

def ensure_athlete_model(data_dir: str, artifacts_dir: str, force_retrain: bool=False):
    path = os.path.join(artifacts_dir, MODEL_PATH)
    if os.path.exists(path) and not force_retrain:
        return
    medals = read_medals(data_dir)
    df_train = _toy_athlete_training(medals)
    model = _fit_athlete_model(df_train)
    joblib.dump(model, path)

def predict_athletes_batch(artifacts_dir: str, df_examples: pd.DataFrame):
    model = joblib.load(os.path.join(artifacts_dir, MODEL_PATH))
    proba = model.predict_proba(df_examples)[:, 1]
    pred = (proba >= 0.5).astype(int)
    out = df_examples.copy()
    out["proba_medal"] = proba
    out["pred_medal"] = pred
    return {"count": len(out), "predictions": out.to_dict(orient="records")}