from fastapi import APIRouter
from pydantic import BaseModel, Field, BeforeValidator, AfterValidator, ConfigDict, field_serializer
from pydantic_core import CoreSchema, PydanticCustomError, core_schema
from bson import ObjectId, Decimal128
from typing import List, Annotated
from database import db
from typing import Union
from enum import Enum


def validate_object_id(v: str) -> ObjectId:
    if not ObjectId.is_valid(v):
        raise ValueError("Invalid ObjectId")
    return ObjectId(v)

PyObjectId = Annotated[
    ObjectId, BeforeValidator(validate_object_id)
]

class District(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id") # type: ignore
    crop_name : str
    adm_id : str
    latitude : float
    longitude : float
    region_area : int
    avg_yield: float
    model_config = ConfigDict(arbitrary_types_allowed=True, populate_by_name=True)

    @field_serializer("id")
    def serialize_id(self, id: PyObjectId):
        return str(id)

class Crops(str, Enum):
    all = "all"
    wheat = "wheat"
    maize = "maize"

def normalize(lst):
    out = []
    for doc in lst:
        d = dict(doc)
        for k,v in d.items():
            if isinstance(v, Decimal128):
                d[k] = float(v.to_decimal())
        out.append(d)
    return out

router = APIRouter(prefix="/maps", tags=["maps"])

@router.get("/districts", response_model=List[District])
def get_districts(crop: Crops | None = None):
  """
  Retrieves a list of districts from the database, optionally filtered by crop name.
  """
  query = {}
  if crop and crop != "all":
    query["crop_name"] = crop.value

  results = list(db["districts"].find(query))

  avg_yield = list(db["yield"].aggregate(
        [
            {"$group": {"_id": {"year": "$harvest_year", "crop": "$_crop"}, "avgYield": {"$avg": "$yield"}}},
        ]
        , allowDiskUse=True
    ))
  average_yield = 0.0
  for y in avg_yield:
    average_yield += y["avgYield"]

  return [District(avg_yield=average_yield, **document) for document in results]


@router.get("/variability")
def get_variability():
    variability_pipeline = [
        {"$match": {"adm_id": {"$exists": True}, "yield": {"$type": "number"}}},
        {"$group": {
            "_id": "$adm_id",
            "variability": {"$stdDevSamp": "$yield"},
            "totalYield": {"$sum": "$yield"},
            "count": {"$sum": 1}
        }},
        {"$lookup": {
            "from": "districts",
            "localField": "_id",
            "foreignField": "adm_id",
            "as": "district_info"
        }},
        {"$unwind": "$district_info"},
        {"$project": {
            "_id": 0,
            "adm_id": "$_id",
            "zone": "$_id",
            "variability": {"$round": ["$variability", 2]},
            "yield": "$totalYield",
            "latitude": "$district_info.latitude",
            "longitude": "$district_info.longitude"
        }},
        {"$sort": {"variability": -1}},
        {"$limit": 25}
    ]

    variabilityData = list(db["yield"].aggregate(variability_pipeline, allowDiskUse=True))

    variabilityData = normalize(variabilityData)

    return variabilityData