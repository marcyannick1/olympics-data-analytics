import os
import pandas as pd
import numpy as np
from models.utils import read_medals, read_hosts

def build_country_features(data_dir: str) -> pd.DataFrame:
    """
    Construit un jeu de données agrégé par pays / année / saison
    avec des features exploitables pour la régression.
    """

    #Chargement des données
    medals = read_medals(data_dir)
    hosts = read_hosts(data_dir)

    # jointure avec les hôtes
    hosts = hosts.rename(columns={"game_year": "Year", "game_season": "Season"})
    df = medals.merge(hosts, on=["Year", "Season"], how="left")

    # Feature "is_host"
    df["is_host"] = np.where(df["Country"].str.lower().isin(df["game_location"].astype(str).str.lower()), 1, 0)

    # Lags : valeurs des années précédentes
    df = df.sort_values(["NOC", "Season", "Year"]).reset_index(drop=True)
    for col in ["Gold", "Silver", "Bronze", "Total"]:
        df[f"lag_{col}_prev1"] = df.groupby(["NOC", "Season"])[col].shift(1)
        df[f"lag_{col}_prev2"] = df.groupby(["NOC", "Season"])[col].shift(2)

    # Gestion des valeurs manquantes
    df = df.fillna(0)


    # Finalisation
    features = [
        "Year", "Season", "NOC", "Country", "is_host",
        "Gold", "Silver", "Bronze", "Total",
        "lag_Gold_prev1", "lag_Silver_prev1", "lag_Bronze_prev1", "lag_Total_prev1",
        "lag_Gold_prev2", "lag_Silver_prev2", "lag_Bronze_prev2", "lag_Total_prev2"
    ]

    df = df[features].fillna(0)
    return df


# Test rapide
if __name__ == "__main__":
    data_dir = "data"
    df = build_country_features(data_dir)
    print(df.head(10))
    print(df.columns)