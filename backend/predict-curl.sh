#!/bin/bash

curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "adm_id": "IN-14-0001",
    "crop_name": "Wheat",
    "awc": 12.0,
    "bulk_density": 1.45,
    "drainage_class": 3,
    "ssm": 15.6,
    "rsm": 326.0,
    "ndvi": 0.3,
    "tmin": 13.5,
    "tmax": 25.1,
    "prec": 0.0,
    "rad": 16028750.0,
    "tavg": 18.8,
    "et0": 3.37,
    "vpd": 2.09,
    "cwb": -3.37,
    "fpar": 0.21,
    "harvest_area": 2000,
    "harvest_year": 2020,
    "crop_area_percentage": 0.7
  }' \
  http://localhost:8000/predict/


curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "9876543210",
    "issue": "crop-loss-not-detected",
    "aadhaar": "123456789012",
    "pmfby": "PMFBY123456",
    "crop": "Wheat",
    "details": "My wheat crop suffered significant loss due to unseasonal rains, but it was not detected by the survey."
  }' \
  http://localhost:8000/complaint/