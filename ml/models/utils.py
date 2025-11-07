import os
import pandas as pd
import numpy as np

def read_medals(data_dir: str) -> pd.DataFrame:
    """
    Adapte le format du fichier olympic_medals.xlsx fourni.
    Attend des colonnes :
      - slug_game (ex: 'beijing-2022')
      - medal_type ('GOLD', 'SILVER', 'BRONZE')
      - country_name, country_3_letter_code
    """
    import re
    path = os.path.join(data_dir, "olympic_medals.xlsx")
    df = pd.read_excel(path)

    # 1️⃣ Nettoyage de base
    df.columns = df.columns.str.strip().str.lower()

    # 2️⃣ Extraire année et saison depuis slug_game
    def parse_slug(slug):
        if isinstance(slug, str):
            if "winter" in slug or "beijing" in slug or "sochi" in slug or "pyeongchang" in slug:
                season = "Winter"
            else:
                season = "Summer"
            year_match = re.search(r"(\d{4})", slug)
            year = int(year_match.group(1)) if year_match else None
            return year, season
        return None, None

    df["year"], df["season"] = zip(*df["slug_game"].map(parse_slug))

    # 3️⃣ Normaliser les médailles
    df["medal_type"] = df["medal_type"].str.capitalize()

    # 4️⃣ Grouper par pays / année / saison
    agg = (
        df.groupby(["year", "season", "country_3_letter_code", "country_name", "medal_type"])
        .size()
        .unstack(fill_value=0)
        .reset_index()
    )

    # 5️⃣ Renommer les colonnes
    rename_map = {
        "year": "Year",
        "season": "Season",
        "country_3_letter_code": "NOC",
        "country_name": "Country",
        "Gold": "Gold",
        "Silver": "Silver",
        "Bronze": "Bronze",
    }

    agg = agg.rename(columns=rename_map)

    # 6️⃣ Ajouter les colonnes manquantes si besoin
    for col in ["Gold", "Silver", "Bronze"]:
        if col not in agg.columns:
            agg[col] = 0

    agg["Total"] = agg[["Gold", "Silver", "Bronze"]].sum(axis=1)

    return agg

def read_hosts(data_dir: str) -> pd.DataFrame:
    """
    Doit contenir au moins: game_year, game_season, game_location
    """
    path = os.path.join(data_dir, "olympic_hosts.xml")
    hosts = pd.read_xml(path)
    # Harmonise colonnes si besoin
    cols = hosts.columns.str.lower()
    hosts.columns = cols
    # On s'attend à 'game_year' & 'game_season'
    # Sinon essaie d'inférer.
    if "game_year" not in hosts.columns and "year" in hosts.columns:
        hosts["game_year"] = hosts["year"]
    if "game_season" not in hosts.columns and "season" in hosts.columns:
        hosts["game_season"] = hosts["season"]

    keep = [c for c in ["game_year","game_season","game_location"] if c in hosts.columns]
    hosts = hosts[keep].drop_duplicates()
    hosts["game_season"] = hosts["game_season"].str.title()
    return hosts

def build_country_panel(df_medals: pd.DataFrame, df_hosts: pd.DataFrame) -> pd.DataFrame:
    """
    Agrège par pays/année/saison et crée des features simples + lags.
    """
    agg = (df_medals
           .groupby(["Year","Season","NOC","Country"], as_index=False)[["Gold","Silver","Bronze","Total"]]
           .sum())
    # Merge host info
    hosts = df_hosts.rename(columns={"game_year":"Year","game_season":"Season"})
    panel = agg.merge(hosts, on=["Year","Season"], how="left")
    panel["is_host"] = False
    # s'il existe la colonne host_noc dans tes données, tu peux l'utiliser.
    # MVP: si Country apparait dans location, on le tag 'host'
    panel["game_location"] = panel.get("game_location", "")
    panel["is_host"] = panel.apply(
        lambda r: (isinstance(r["game_location"], str) and
                   isinstance(r["Country"], str) and
                   r["Country"].split()[0] in r["game_location"]), axis=1
    )

    # Lags par NOC (t-1)
    panel = panel.sort_values(["NOC","Season","Year"]).reset_index(drop=True)
    for c in ["Gold","Silver","Bronze","Total"]:
        panel[f"lag_{c}_prev1"] = panel.groupby(["NOC","Season"])[c].shift(1).fillna(0)

    # Num features factices (tu enrichiras ensuite)
    panel["num_athletes"] = np.nan  # placeholder si tu ajoutes une source
    panel["gdp_usd"] = np.nan
    panel["population"] = np.nan

    return panel

def features_target_country(panel: pd.DataFrame):
    """
    Retourne X (features) et y (gold/silver/bronze) pour régression.
    """
    feat_cols = [
        "is_host", "lag_Gold_prev1", "lag_Silver_prev1", "lag_Bronze_prev1", "lag_Total_prev1"
        # ajoute gdp_usd, population, num_athletes quand tu les as
    ]
    # convert bool -> int
    X = panel.copy()
    X["is_host"] = X["is_host"].astype(int)
    X = X[feat_cols].fillna(0)

    y_gold = panel["Gold"].values
    y_silver = panel["Silver"].values
    y_bronze = panel["Bronze"].values
    meta = panel[["Year","Season","NOC","Country"]].reset_index(drop=True)
    return X, y_gold, y_silver, y_bronze, meta

def features_athletes_from_json(df: pd.DataFrame):
    """
    Utilisé pour /predict/athletes (déjà au bon format).
    Retourne X (num + cat) et garde les colonnes originales pour renvoyer les preds alignées.
    """
    # Types attendus (tu peux enrichir)
    num_cols = ["age","world_rank","recent_form","team_strength","prior_medals"]
    cat_cols = ["gender","event_id","country_id","is_host"]
    for c in num_cols:
        if c not in df.columns:
            df[c] = 0
    for c in cat_cols:
        if c not in df.columns:
            df[c] = "NA" if c in ["gender"] else 0
    return df.copy(), num_cols, cat_cols