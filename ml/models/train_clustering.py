import os
import joblib
import numpy as np
import pandas as pd

from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans

from .utils import read_medals, read_hosts, build_country_panel

CLUST_PATH = "clustering.pkl"

def _build_matrix_for_year(panel: pd.DataFrame, year: int, season: str="Summer"):
    df = (panel[(panel["Year"] <= year) & (panel["Season"] == season)]
          .sort_values(["NOC","Year"])
          .groupby("NOC", as_index=False).tail(1))
    X = df[["lag_Gold_prev1","lag_Silver_prev1","lag_Bronze_prev1","lag_Total_prev1"]].fillna(0)
    meta = df[["NOC","Country"]].reset_index(drop=True)
    return X, meta

def ensure_clustering_model(data_dir: str, artifacts_dir: str, force_retrain: bool=False):
    path = os.path.join(artifacts_dir, CLUST_PATH)
    if os.path.exists(path) and not force_retrain:
        return
    # On sauve juste les objets de prétraitement partagés; K variable sera ajusté à la demande
    joblib.dump({"scaler": StandardScaler(), "pca": PCA(n_components=3, random_state=42)}, path)

def cluster_countries(data_dir: str, artifacts_dir: str, year: int, k: int, season: str="Summer"):
    medals = read_medals(data_dir)
    hosts = read_hosts(data_dir)
    panel = build_country_panel(medals, hosts)

    pre = joblib.load(os.path.join(artifacts_dir, CLUST_PATH))
    scaler, pca = pre["scaler"], pre["pca"]

    X, meta = _build_matrix_for_year(panel, year=year, season=season)
    Z = scaler.fit_transform(X)
    Zp = pca.fit_transform(Z)

    kmeans = KMeans(n_clusters=k, n_init="auto", random_state=42)
    labels = kmeans.fit_predict(Zp)
    centers = kmeans.cluster_centers_.tolist()

    meta["cluster"] = labels
    return meta.to_dict(orient="records"), centers