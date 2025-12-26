from fastapi import APIRouter
from pydantic import BaseModel, Field
import pandas as pd
import joblib
import pandas as pd
import pickle
from xgboost import XGBRegressor
from core.predict import TargetEncoder
import sys
from core.get_agri_data import get_agri_data
from core.get_nearby_field import get_nearby_field
from database import db
from core.constant import CROPS
import time

router = APIRouter(prefix="/predict-guj", tags=["predict-guj"])

# This is a workaround for joblib/pickle unpickling issues
# when a class was pickled in a __main__ context and unpickled
# in a different __main__ context.

crop_mask_collection = db["crop_mask"]


model = XGBRegressor()
model.load_model("model/xgb_crop_yield_model.json")

with open("model/crop_label_encoder.pkl", "rb") as f:
    le = pickle.load(f)

def rename_response_keys(data_dict):
    rename_map = {
        "awc": "Available Water Capacity",
        "bulk_density": "Bulk Density",
        "drainage_class": "Drainage Class",
        "ssm": "Surface Soil Moisture",
        "rsm": "Root Zone Soil Moisture",
        "ndvi": "NDVI",
        "tmin": "Minimum Temperature",
        "tmax": "Maximum Temperature",
        "prec": "Precipitation",
        "rad": "Solar Radiation",
        "tavg": "Average Temperature",
        "et0": "Reference Evapotranspiration",
        "vpd": "Vapour Pressure Deficit",
        "cwb": "Climatic Water Balance",
        "fpar": "FPAR",
        "harvest_area": "Harvest Area",
        "adm_id": "District Id",
        "harvest_year": "Harvest Year",
        "crop_name": "Crop Name",
        "crop_area_percentage": "Crop Area Percentage"
    }
    renamed_data = {}
    for key, value in data_dict.items():
        if key != "crop_name":
            new_key = rename_map.get(key, key)
            renamed_data[new_key] = value
    return renamed_data

@router.post("/my-field")
def predict_yield_for_my_field():
    sample = {
        "lat": 22.35,
        "lon": 71.80,
        "crop_name": "wheat",
        "adm_id": 1234,
        "harvest_year": 2021,
        "harvest_area": 2.3,
        "crop_area_percentage": 55,
        "awc": 150,
        "bulk_density": 1.3,
        "drainage_class": 4,
        "ssm": 22,
        "rsm": 80,
        "ndvi": 0.65,
        "tmin": 14,
        "tmax": 32,
        "tavg": 23,
        "prec": 12,
        "rad": 18000,
        "et0": 4.1,
        "vpd": 1.3,
        "cwb": -5,
        "fpar": 0.72
    }
    time.sleep(2)
    df = pd.DataFrame([sample])
    df["crop_name"] = le.transform(df["crop_name"])
    pred = model.predict(df)[0]
    return {"estimated_production": round(pred, 2)}

