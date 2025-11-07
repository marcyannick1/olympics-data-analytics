import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor
from features import create_country_features

# Charger Excel
df = pd.read_excel("../dataset/olympic_medals.xlsx", engine='openpyxl')

# Charger API GDP + médailles historiques
API_URL = "http://localhost:3001/api/stats/gdp-vs-medals"
import requests

resp = requests.get(API_URL)
if resp.status_code != 200:
    raise Exception(f"Erreur API: {resp.status_code}")
api_df = pd.DataFrame(resp.json())  # contient country_name, gdp, gold_count, etc.

# Créer features
# Ici on passe api_df pour récupérer la colonne gdp
country_df = create_country_features(df, api_df[['country_name', 'gdp']], target_jo='paris-2024')

# Features X
X = country_df[['n_athletes', 'n_sports', 'n_events', 'gdp', 'hist_gold', 'hist_silver', 'hist_bronze']]

# Target y = médailles réelles de ce JO
y = country_df[['gold', 'silver', 'bronze']]

# Split train/test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Entraîner modèle
model = MultiOutputRegressor(RandomForestRegressor(n_estimators=500, random_state=42))
model.fit(X_train, y_train)

# Créer dossier models si nécessaire
os.makedirs("../models", exist_ok=True)

# Sauvegarder modèle
joblib.dump(model, "../models/country_model.pkl")
print("Country model saved !")
