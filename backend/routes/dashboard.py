from fastapi import APIRouter
from database import db
from bson import Decimal128
import random
from core.constant import CROPS

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

def to_float(v):
    if v is None:
        return 0.0
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, Decimal128):
        return float(v.to_decimal())
    try:
        return float(v)
    except:
        return 0.0

def normalize(lst):
    out = []
    for doc in lst:
        d = dict(doc)
        for k,v in d.items():
            if isinstance(v, Decimal128):
                d[k] = float(v.to_decimal())
        out.append(d)
    return out


@router.get("/summary")
def summary():
  trend_pipeline = [
    {"$match": {"crop_name": {"$exists": True}, "harvest_year": {"$type": "int"}, "yield": {"$type": "number"}}},
    {"$addFields": {"_crop": {"$toLower": "$crop_name"}}},
    {"$match": {"_crop": {"$in": CROPS}}},
    {"$group": {"_id": {"year": "$harvest_year", "crop": "$_crop"}, "totalYield": {"$sum": "$yield"}}},
    {"$group": {"_id": "$_id.year", "crops": {"$push": {"k": "$_id.crop", "v": "$totalYield"}}}},
    {"$sort": {"_id": 1}}
  ]

  trend_raw = list(db["yield"].aggregate(trend_pipeline, allowDiskUse=True))
  avg_yield = 0
  yieldTrendData = []
  c = 0
  for r in trend_raw:
      year_label = str(r["_id"])
      crop_map = {c: 0 for c in CROPS}
      for kv in r.get("crops", []):
          crop_map[kv["k"]] = to_float(kv["v"]) # type: ignore
      avg_yield += crop_map.get("wheat", 0)
      avg_yield += crop_map.get("maize", 0)
      yieldTrendData.append({
          "year": year_label,
          "wheat": crop_map.get("wheat", 0),
          "maize": crop_map.get("maize", 0),
      })
      c += 1
      

  farm_pipeline = [
    {"$match": {"adm_id": {"$exists": True}, "yield": {"$type": "number"}}},
    {"$group": {"_id": "$adm_id", "totalYield": {"$sum": "$yield"}}},
    {"$sort": {"totalYield": -1}},
    {"$limit": 75}
  ]

  farm_raw = list(db["yield"].aggregate(farm_pipeline, allowDiskUse=True))
  farmComparison = [{"name": f["_id"], "yield": to_float(f["totalYield"]), "target": to_float(f["totalYield"]) + random.randint(-10, 10)} for f in farm_raw]


  crop_pipeline = [
    {"$match": {"crop_name": {"$exists": True}, "yield": {"$type": "number"}}},
    {"$addFields": {"_crop": {"$toLower": "$crop_name"}}},
    {"$group": {"_id": "$_crop", "total": {"$sum": "$yield"}}},
    {"$match": {"_id": {"$in": CROPS}}},
    {"$group": {"_id": None, "totals": {"$push": {"crop": "$_id", "total": "$total"}}, "grandTotal": {"$sum": "$total"}}}
  ]
  crop_raw_list = list(db["yield"].aggregate(crop_pipeline, allowDiskUse=True))
  crop_totals = crop_raw_list[0] if crop_raw_list else {"totals": [], "grandTotal": 0}
  grand_total = to_float(crop_totals.get("grandTotal", 0))
  fill_map = {"wheat": "var(--color-chart-1)", "maize": "var(--color-chart-2)", "rice": "var(--color-chart-3)"}
  cropDistribution = []
  for t in crop_totals.get("totals", []):
      name = t["crop"].capitalize()
      total = to_float(t["total"])
      pct = round((total / grand_total) * 100) if grand_total else 0
      cropDistribution.append({"name": name, "value": int(pct), "fill": fill_map.get(t["crop"], "")})


  variability_pipeline = [
    {"$match": {"adm_id": {"$exists": True}, "yield": {"$type": "number"}}},
    {"$group": {"_id": "$adm_id", "variability": {"$stdDevSamp": "$yield"}, "totalYield": {"$sum": "$yield"}, "count": {"$sum": 1}}},
    {"$project": {"_id": 0, "zone": "$_id", "variability": {"$round": ["$variability", 2]}, "yield": "$totalYield"}},
    {"$sort": {"variability": -1}},
    {"$limit": 50}
  ]
  variabilityData = list(db["yield"].aggregate(variability_pipeline, allowDiskUse=True))

  variabilityData = normalize(variabilityData)

  return { 
    "yield_trend": yieldTrendData,
    "farm_comparison": farmComparison,
    "crop_distribution": cropDistribution,
    "variability": variabilityData,
    "avg_yield": avg_yield // c
  }