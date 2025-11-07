import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sqlalchemy import create_engine, text
from urllib.parse import quote

password = "_#7@bym.9QX6Pvm"

sns.set(style="whitegrid", context="talk")

DB_URI = f"postgresql+psycopg2://jokast38:{quote(password)}@postgresql-jokast38.alwaysdata.net:5432/jokast38_jogpt"

engine = create_engine(DB_URI)

try:
    with engine.connect() as conn:
        print("✅ Connection OK !")
except Exception as e:
    print("❌ Erreur de connexion :", e)

# helper pour exécuter et afficher
def sql(q):
    return pd.read_sql(q, engine)