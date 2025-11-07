import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from imblearn.over_sampling import SMOTE
import numpy as np

df = pd.read_excel("../dataset/olympic_medals.xlsx", engine='openpyxl')


# Label médaille
df['label_medal'] = df['medal_type'].notnull().astype(int)
df['athlete_n_events'] = df.groupby(['athlete_full_name','slug_game'])['event_title'].transform('nunique')

# Encode catégoriel
X_cat = df[['discipline_title','country_name']]
oh = OneHotEncoder(sparse=False, handle_unknown='ignore')
X_cat_enc = oh.fit_transform(X_cat)
X_num = df[['athlete_n_events']].values
X = np.hstack([X_num, X_cat_enc])
y = df['label_medal'].values

# Imbalance
sm = SMOTE(random_state=42)
X_res, y_res = sm.fit_resample(X, y)

model = RandomForestClassifier(n_estimators=200, random_state=42)
model.fit(X_res, y_res)

joblib.dump((model, oh), "../models/athlete_model.pkl")
print("Athlete model saved !")