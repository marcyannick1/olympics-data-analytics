import pandas as pd

def create_country_features(df, api_df, target_jo=None):
    """
    Crée les features pour prédire les médailles par pays pour un JO spécifique.
    - df : Excel des médailles
    - api_df : données API GDP + médailles historiques
    - target_jo : slug_game du JO à prédire (ex: 'paris-2024')
    """
    # Nombre d'athlètes, sports, events par pays et édition
    df['n_athletes'] = df.groupby(['country_name','slug_game'])['athlete_full_name'].transform('nunique')
    df['n_sports'] = df.groupby(['country_name','slug_game'])['discipline_title'].transform('nunique')
    df['n_events'] = df.groupby(['country_name','slug_game'])['event_title'].transform('nunique')

    # Médailles par édition
    df['gold'] = df['medal_type'].apply(lambda x: 1 if str(x).upper()=='GOLD' else 0)
    df['silver'] = df['medal_type'].apply(lambda x: 1 if str(x).upper()=='SILVER' else 0)
    df['bronze'] = df['medal_type'].apply(lambda x: 1 if str(x).upper()=='BRONZE' else 0)

    country_df = df.groupby(['country_name','slug_game'])[['n_athletes','n_sports','n_events','gold','silver','bronze']].sum().reset_index()

    # Fusion API pour GDP
    country_df = country_df.merge(api_df[['country_name','gdp']], on='country_name', how='left')
    country_df['gdp'] = pd.to_numeric(country_df['gdp'], errors='coerce').fillna(0)

    # Feature dérivée : ratio historique
    hist = df.groupby('country_name')[['gold','silver','bronze']].sum().reset_index()
    hist = hist.rename(columns={'gold':'hist_gold','silver':'hist_silver','bronze':'hist_bronze'})
    country_df = country_df.merge(hist, on='country_name', how='left')

    # Si target_jo est fourni, filtrer ce JO
    if target_jo:
        country_df = country_df[country_df['slug_game'] != target_jo]

    return country_df