from pymongo import MongoClient
import os

MONGO_URI = os.getenv("DB_URI", "mongodb://admin:secret@localhost:27017/myapp")
DB_NAME = os.getenv("DB_NAME", "mydb")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

