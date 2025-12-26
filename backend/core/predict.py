import pandas as pd
import joblib
from sklearn.base import BaseEstimator, TransformerMixin

class TargetEncoder(BaseEstimator, TransformerMixin):
    def __init__(self, target_col, smoothing=10.0):
        self.target_col = target_col
        self.smoothing = smoothing
        self.global_mean = None
        self.encodings = {}
    
    def fit(self, X, y):
        self.global_mean = y.mean()
        means = y.groupby(X[self.target_col]).mean()
        counts = y.groupby(X[self.target_col]).count()
        smoothed_means = (means * counts + self.global_mean * self.smoothing) / (counts + self.smoothing)
        self.encodings = smoothed_means.to_dict()
        return self
    
    def transform(self, X):
        X_copy = X.copy()
        X_copy[self.target_col + '_encoded'] = X_copy[self.target_col].map(self.encodings).fillna(self.global_mean)
        return X_copy.drop(columns=[self.target_col])
    
# print("Loading model and encoder...")
# loaded_pipeline = joblib.load('final_production_pipeline.pkl')
# loaded_encoder = joblib.load('target_encoder.pkl')
# print("Loaded successfully.")

# try:
#     X_new_encoded = loaded_encoder.transform(new_data)
#     prediction = loaded_pipeline.predict(X_new_encoded)
 
#     print(f"\nPredicted Production: {prediction[0]:.2f}")


# new_data = pd.DataFrame({
#     'adm_id': ['IN-14-0001'],       # High cardinality category
#     'crop_name': ['Wheat'],           # Low cardinality category
#     'awc': [12.0], 
#     'bulk_density': [1.45], 
#     'drainage_class': [3], 
#     'ssm': [15.6], 
#     'rsm': [326.0], 
#     'ndvi': [0.3], 
#     'tmin': [13.5], 
#     'tmax': [25.1], 
#     'prec': [0.0], 
#     'rad': [16028750.0], 
#     'tavg': [18.8], 
#     'et0': [3.37], 'vpd': [2.09], 'cwb': [-3.37], 'fpar': [0.21],
#     'harvest_area': [2000],
#     'harvest_year': [2020],
#     'crop_area_percentage': [0.7]
# })

# except Exception as e:
#     print(f"Error during prediction: {e}")
#     print("Ensure your new_data has exactly the same columns as the training data (minus the target).")