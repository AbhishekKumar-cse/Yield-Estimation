from fastapi import APIRouter
from pydantic import BaseModel, Field
import pandas as pd
import joblib
from core.predict import TargetEncoder
import sys
from core.get_agri_data import get_agri_data
from core.get_nearby_field import get_nearby_field
from database import db
from core.constant import CROPS
from datetime import datetime

router = APIRouter(prefix="/predict", tags=["predict"])

# This is a workaround for joblib/pickle unpickling issues
# when a class was pickled in a __main__ context and unpickled
# in a different __main__ context.
sys.modules['__main__'].TargetEncoder = TargetEncoder # type: ignore

crop_mask_collection = db["crop_mask"]


# Load the trained model and encoder
try:
    loaded_pipeline = joblib.load('model/final_production_pipeline.pkl')
    loaded_encoder = joblib.load('model/target_encoder.pkl')
except FileNotFoundError as e:
    print(f"Error loading model files: {e}")
    # Handle the error appropriately, maybe disable the endpoint
    loaded_pipeline = None
    loaded_encoder = None

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

class PredictionInput(BaseModel):
    adm_id: str
    crop_name: str
    awc: float
    bulk_density: float
    drainage_class: int
    ssm: float
    rsm: float
    ndvi: float
    tmin: float
    tmax: float
    prec: float
    rad: float
    tavg: float
    et0: float
    vpd: float
    cwb: float
    fpar: float
    harvest_area: int
    harvest_year: int
    crop_area_percentage: float

@router.post("/")
def predict_yield(input_data: PredictionInput):
    """
    Predicts crop yield based on input data.
    """
    if not loaded_pipeline or not loaded_encoder:
        return {"error": "Model not loaded. Check server logs."}

    try:
        new_data = pd.DataFrame([input_data.model_dump()])
        
        # The TargetEncoder expects the original column name to be present for transformation
        # and then it drops it.
        X_new_encoded = loaded_encoder.transform(new_data)
        
        production = loaded_pipeline.predict(X_new_encoded)

        predicted_yield = float(float(production[0]) / input_data.harvest_area)

        return {"Predicted Yield": predicted_yield}

    except Exception as e:
        return {"error": f"Error during prediction: {e}"}

@router.post("/year")
def predict_yield_with_year(lat: float, lon: float, harvest_area: int, adm_id:str, crop_name:str, harvest_year: int):
    """
    Predicts crop yield based on input data.
    """
    if not loaded_pipeline or not loaded_encoder:
        return {"error": "Model not loaded. Check server logs."}

    data = get_agri_data(lat, lon)
    cap = crop_mask_collection.find_one({ "adm_id": adm_id })
    avg_yield = list(db["yield"].aggregate(
        [
            {"$group": {"_id": {"year": "$harvest_year", "crop": "$_crop"}, "avgYield": {"$avg": "$yield"}}},
        ]
        , allowDiskUse=True
    ))
    average_yield = 0.0
    for y in avg_yield:
        average_yield += y["avgYield"]
    data["harvest_area"] = harvest_area
    data["adm_id"] = adm_id
    data["harvest_year"] = harvest_year
    data["crop_name"] = crop_name
    data["crop_area_percentage"] = cap["crop_area_percentage"] if cap else 0.5

    try:
        new_data = pd.DataFrame([data])
        X_new_encoded = loaded_encoder.transform(new_data)
        production = loaded_pipeline.predict(X_new_encoded)
        predicted_yield = float(float(production[0]) / data["harvest_area"])

        response_data = rename_response_keys(data)
        return {"Predicted Yield": predicted_yield, **response_data, "Average Yield": average_yield}

    except Exception as e:
        return {"error": f"Error during prediction: {e}"}

@router.post("/my-field")
def predict_yield_for_my_field(lat: float, lon: float, harvest_area: int, crop_name:str, crop_area_percentage: float = 0.5):
    if not loaded_pipeline or not loaded_encoder:
        return {"error": "Model not loaded. Check server logs."}

    is_found = False
    viewing_distance = 1000
    while not is_found:
        field = get_nearby_field(lat, lon, viewing_distance)
        if field:
           is_found = True
        else:
            viewing_distance *= 10

    harvest_year = datetime.now().year

    data = get_agri_data(lat, lon)
    data["harvest_area"] = harvest_area
    data["adm_id"] = field["adm_id"] # type: ignore
    data["harvest_year"] = harvest_year
    data["crop_name"] = crop_name
    data["crop_area_percentage"] = crop_area_percentage
    try:
        new_data = pd.DataFrame([data])
        X_new_encoded = loaded_encoder.transform(new_data)
        production = loaded_pipeline.predict(X_new_encoded)
        predicted_yield = float(float(production[0]) / data["harvest_area"])
        response_data = rename_response_keys(data)
        return {"predicted_yield": predicted_yield, **response_data}
    except Exception as e:
        return {"error": f"Error during prediction: {e}"}

