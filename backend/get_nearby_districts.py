
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure

async def get_nearby_districts(longitude: float, latitude: float, max_distance: int = 50000):
    """
    Finds districts within a certain distance of a given point.
    """
    client = AsyncIOMotorClient('mongodb://admin:secret@localhost:27017/myapp?authSource=admin')
    try:
        await client.admin.command('ping')
    except ConnectionFailure:
        print("Server not available")
        return

    db = client['mydb']
    districts_collection = db['districts']

    # GeoJSON point for the query
    point = {
        "type": "Point",
        "coordinates": [longitude, latitude]
    }

    found_districts = False
    try:
        cursor = districts_collection.find({
            "geometry": {
                "$near": {
                    "$geometry": point,
                    "$maxDistance": max_distance
                }
            }
        }).limit(1)
        async for district in cursor:
            found_districts = True
            # Assuming the district document has a 'adm_id' field
            if 'adm_id' in district:
                print(district['adm_id'])
            else:
                print("Found a document without an 'adm_id' field.")
        
        if not found_districts:
            print("No districts found within the specified distance.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python get_nearby_districts.py <longitude> <latitude>")
        sys.exit(1)

    try:
        lon = float(sys.argv[1])
        lat = float(sys.argv[2])
    except ValueError:
        print("Invalid longitude or latitude. Please provide numbers.")
        sys.exit(1)

    asyncio.run(get_nearby_districts(lon, lat))
