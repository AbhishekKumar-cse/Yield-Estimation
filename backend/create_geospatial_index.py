import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import GEOSPHERE

async def create_geospatial_index():
    """
    Connects to the database and creates a 2dsphere index on the 'geometry' field
    of the 'districts' collection.
    """
    # Connection details should be ideally loaded from a config file
    client = AsyncIOMotorClient('mongodb://admin:secret@localhost:27017/myapp?authSource=admin')
    db = client['mydb']
    districts_collection = db['districts']
    
    # Create a 2dsphere index on the 'geometry' field
    try:
        await districts_collection.create_index([("geometry", GEOSPHERE)])
        print("Geospatial index created successfully on 'districts' collection.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_geospatial_index())
