# models/features/build_athlete_features.py
import os
import pandas as pd
import numpy as np
import hashlib

def _hash_to_int(x: str, mod: int = 10_000) -> int:
    if x is None:
        return 0
    return int(hashlib.md5(str(x).encode("utf-8")).hexdigest(), 16) % mod

def build_athlete_features(data_dir: str) -> pd.DataFrame:
    """
    Construit un dataset binaire 'médaille / pas médaille'.
    Source: olympic_medals.xlsx (ne contient que des médaillés => on fabrique des négatifs réalistes).
    """
    path = os.path.join(data_dir, "olympic_medals.xlsx")
    df = pd.read_excel(path)
    df.columns = df.columns.str.lower()

    # Champs attendus dans ton xlsx d’origine
    # discipline_title, slug_game, event_title, event_gender, medal_type,
    # participant_type, participant_title, athlete_url, athlete_full_name,
    # country_name, country_code, country_3_letter_code
    df["medal_type"] = df["medal_type"].astype(str).str.capitalize()
    df["athlete"] = df["athlete_full_name"].astype(str)
    df["country"] = df["country_name"].astype(str)
    df["country_code3"] = df["country_3_letter_code"].astype(str)
    df["event"] = df["event_title"].astype(str)
    df["gender"] = df["event_gender"].fillna("Unknown").astype(str)

    # id numériques stables pour encodage
    df["event_id"] = df["event"].map(lambda s: _hash_to_int(s, 5000))
    df["country_id"] = df["country_code3"].map(lambda s: _hash_to_int(s, 1000))

    # Heuristique is_host depuis le slug
    slug = df["slug_game"].astype(str).str.lower()
    df["is_host"] = np.where(
        slug.str.contains("paris-2024") | slug.str.contains("paris2024"),
        1, 0
    )

    # POSITIFS (médaillés)
    pos = df.copy()
    pos["label_medal"] = 1

    # Quelques features "proxy" (si tu n'as pas encore l'âge/classements réels)
    rng = np.random.default_rng(42)
    pos["age"] = rng.integers(18, 36, size=len(pos))
    pos["world_rank"] = rng.uniform(1, 120, size=len(pos))          # meilleurs rangs
    pos["recent_form"] = rng.uniform(0.6, 1.0, size=len(pos))       # bonne forme
    pos["team_strength"] = rng.uniform(0.5, 1.0, size=len(pos))
    pos["prior_medals"] = rng.poisson(0.6, size=len(pos))

    # NEGATIFS (non médaillés) synthétiques, même distribution pays/épreuves
    # On crée ~1 négatif par positif (tu peux augmenter à 2x si besoin)
    neg = pos[["country", "country_code3", "country_id",
               "event", "event_id", "gender", "is_host"]].copy()
    neg = neg.sample(frac=1.0, random_state=7).reset_index(drop=True)  # shuffle
    neg["athlete"] = neg.index.map(lambda i: f"Synthetic Athlete {i}")
    neg["label_medal"] = 0

    # Features plus "faibles" côté négatifs
    neg["age"] = rng.integers(18, 36, size=len(neg))
    neg["world_rank"] = rng.uniform(80, 300, size=len(neg))          # rangs moins bons
    neg["recent_form"] = rng.uniform(0.0, 0.7, size=len(neg))
    neg["team_strength"] = rng.uniform(0.1, 0.8, size=len(neg))
    neg["prior_medals"] = rng.poisson(0.1, size=len(neg))

    out = pd.concat([pos, neg], axis=0, ignore_index=True)

    # colonnes finales attendues par le pipeline
    cols = [
        "athlete", "country", "country_id", "country_code3",
        "event", "event_id", "gender", "is_host",
        "age", "world_rank", "recent_form", "team_strength", "prior_medals",
        "label_medal"
    ]
    out = out[cols].dropna().reset_index(drop=True)
    return out