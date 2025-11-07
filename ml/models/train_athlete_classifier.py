import os
import joblib
import numpy as np
import pandas as pd

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from .utils import features_athletes_from_json
from .eval import evaluate_classification

from .utils import read_medals, features_athletes_from_json
from features.build_athlete_features import build_athlete_features

from features.build_athlete_features import build_athlete_features
from sklearn.model_selection import train_test_split
import joblib, os
from .eval import evaluate_classification  # si tu as ajouté eval.py
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression

from .utils import features_athletes_from_json

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
                "team_strength": min(1.0, 0.2 + np.log1p(r["Total"]) / 5),
                "prior_medals": np.random.poisson(0.2),
                "gender": np.random.choice(["M", "F"]),
                "event_id": np.random.randint(1, 200),
                "country_id": hash(r["NOC"]) % 5000,
                "is_host": False,
            }
            # probabilité artificielle basée sur le total pays
            p = min(0.25, 0.02 + r["Total"] / 400.0)
            y = (np.random.rand() < p)
            rows.append({**ex, "label_medal": int(y)})
    df = pd.DataFrame(rows)
    return df


def _fit_athlete_model(df_train: pd.DataFrame):
    """
    df_train doit contenir les colonnes features + 'label_medal'.
    On sécurise contre les NaN avec des SimpleImputer (num & cat).
    """
    assert "label_medal" in df_train.columns, "label_medal manquant dans df_train"

    X_raw = df_train.drop(columns=["label_medal"])
    y = df_train["label_medal"].astype(int).values

    # Laisse utils définir la liste des colonnes attendues et compléter ce qui manque
    X, num_cols, cat_cols = features_athletes_from_json(X_raw)

    # Imputers
    num_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    cat_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("ohe", OneHotEncoder(handle_unknown="ignore"))
    ])

    pre = ColumnTransformer([
        ("num", num_pipe, num_cols),
        ("cat", cat_pipe, cat_cols)
    ])

    clf = LogisticRegression(max_iter=300, class_weight="balanced")

    pipe = Pipeline([
        ("pre", pre),
        ("clf", clf),
    ])

    pipe.fit(X, y)
    return pipe


def ensure_athlete_model(data_dir: str, artifacts_dir: str, force_retrain: bool = False):
    """
    Entraîne le classifieur athlètes sur les VRAIES features construites
    par build_athlete_features() et sauvegarde le pipeline sklearn.
    """
    path = os.path.join(artifacts_dir, MODEL_PATH)
    if os.path.exists(path) and not force_retrain:
        return

    df = build_athlete_features(data_dir)

    if "label_medal" not in df.columns:
        raise ValueError("build_athlete_features doit produire 'label_medal' (0/1).")

    # Sanity check classes
    cls_counts = df["label_medal"].value_counts().to_dict()
    if len(cls_counts) < 2:
        raise ValueError(f"Dataset athlètes non binaire, classes trouvées: {cls_counts}")

    # Split propre
    X = df.drop(columns=["label_medal"])
    y = df["label_medal"].astype(int).values

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    # On reconstruit un df_train conforme à _fit_athlete_model
    df_train = pd.concat([X_tr.reset_index(drop=True),
                          pd.Series(y_tr, name="label_medal")], axis=1)

    # Fit (avec Imputer dans le pipeline)
    model = _fit_athlete_model(df_train)

    # Éval rapide (optionnelle)
    try:
        # On passe par utils.features_athletes_from_json pour garantir les colonnes
        from .utils import features_athletes_from_json
        X_te_fixed, _, _ = features_athletes_from_json(X_te.copy())
        y_pred = model.predict(X_te_fixed)
        metrics = evaluate_classification(y_te, y_pred)
        print("Eval athlètes:", metrics)
    except Exception as e:
        print(f"[warn] Évaluation test athlètes sautée: {e}")

    os.makedirs(artifacts_dir, exist_ok=True)
    joblib.dump(model, path)


def predict_athletes_batch(artifacts_dir: str, df_examples: pd.DataFrame):
    model = joblib.load(os.path.join(artifacts_dir, MODEL_PATH))
    proba = model.predict_proba(df_examples)[:, 1]
    pred = (proba >= 0.5).astype(int)
    out = df_examples.copy()
    out["proba_medal"] = proba
    out["pred_medal"] = pred
    return {"count": len(out), "predictions": out.to_dict(orient="records")}
