import pandas as pd
import joblib
import requests
import sys
from features import create_country_features

if len(sys.argv) < 2:
    print("Usage: python predict_country.py <country_name>")
    sys.exit(1)

country_name_input = " ".join(sys.argv[1:])

# 1️⃣ Charger Excel
df = pd.read_excel("../dataset/olympic_medals.xlsx", engine='openpyxl')


# 2️⃣ Charger l'API GDP + historique
API_URL = "http://localhost:3001/api/stats/gdp-vs-medals"
resp = requests.get(API_URL)
if resp.status_code != 200:
    raise Exception(f"Erreur API: {resp.status_code}")
api_df = pd.DataFrame(resp.json())  # contient country_name et gdp

# 3️⃣ Créer features
country_df = create_country_features(df, api_df[['country_name','gdp']], target_jo='paris-2024')

# 4️⃣ Filtrer le pays
idx = country_df['country_name'] == country_name_input
if not idx.any():
    print(f"Aucune donnée pour le pays : {country_name_input}")
    sys.exit(1)

X_country = country_df.loc[idx, ['n_athletes','n_sports','n_events','gdp','hist_gold','hist_silver','hist_bronze']]

# 5️⃣ Charger le modèle
model = joblib.load("../models/country_model.pkl")

# 6️⃣ Prédiction
pred = model.predict(X_country)
gold, silver, bronze = pred[0].round().astype(int)

print(f"Prédiction pour {country_name_input} (JO Paris 2024) :")
print(f"Or : {gold}, Argent : {silver}, Bronze : {bronze}")