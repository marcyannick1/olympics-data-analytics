import numpy as np
import pandas as pd
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    f1_score,
    precision_score,
    recall_score,
    accuracy_score,
    confusion_matrix,
    silhouette_score
)

# -----------------------------
# 📊 RÉGRESSION : MAE / RMSE / R2
# -----------------------------
def evaluate_regression(y_true, y_pred):
    """
    Évalue les performances d'un modèle de régression.
    Retourne un dictionnaire avec MAE, RMSE, et R².
    """
    mae = mean_absolute_error(y_true, y_pred)
    rmse = mean_squared_error(y_true, y_pred, squared=False)
    r2 = r2_score(y_true, y_pred)
    return {
        "MAE": round(mae, 3),
        "RMSE": round(rmse, 3),
        "R2": round(r2, 3)
    }


# -----------------------------
# 🧮 CLASSIFICATION : F1 / PRÉCISION / RAPPEL / MATRICE
# -----------------------------
def evaluate_classification(y_true, y_pred):
    """
    Évalue un modèle de classification binaire.
    Retourne Accuracy, Precision, Recall, F1, et la confusion matrix.
    """
    acc = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    cm = confusion_matrix(y_true, y_pred).tolist()

    return {
        "Accuracy": round(acc, 3),
        "Precision": round(precision, 3),
        "Recall": round(recall, 3),
        "F1_score": round(f1, 3),
        "Confusion_Matrix": cm
    }


# -----------------------------
# 🌍 CLUSTERING : MÉTHODE DU COUDE + SILHOUETTE
# -----------------------------
def evaluate_clustering(X_scaled, labels, inertias=None):
    """
    Évalue la qualité du clustering KMeans.
    - X_scaled : données normalisées (StandardScaler)
    - labels : clusters assignés
    - inertias : (optionnel) liste des inerties si test multi-k
    """
    sil = silhouette_score(X_scaled, labels)
    results = {"Silhouette_Score": round(sil, 3)}

    if inertias is not None:
        # Si plusieurs k ont été testés (méthode du coude)
        results["Inertia_List"] = [round(i, 2) for i in inertias]

    return results


# -----------------------------
# 🧾 EXEMPLE RAPIDE (pour test local)
# -----------------------------
if __name__ == "__main__":
    # Exemple régression
    y_true = [126, 91, 65, 64]
    y_pred = [121, 102, 67, 35]
    print("Régression:", evaluate_regression(y_true, y_pred))

    # Exemple classification
    # y_true = [1, 0, 1, 0, 1, 1]
    # y_pred = [1, 0, 0, 0, 1, 1]
    # print("Classification:", evaluate_classification(y_true, y_pred))