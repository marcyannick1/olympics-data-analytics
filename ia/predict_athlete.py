import pandas as pd
import joblib
import sys
import json
import numpy as np

(model, oh) = joblib.load("../models/athlete_model.pkl")

input_json = sys.argv[1]
data = pd.DataFrame([json.loads(input_json)])
X_cat = oh.transform(data[['discipline_title','country_name']])
X_num = data[['athlete_n_events']].values
X = np.hstack([X_num, X_cat])
pred = model.predict(X)
print(json.dumps({"medal": int(pred[0])}))