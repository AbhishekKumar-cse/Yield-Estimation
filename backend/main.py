from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
from routes.maps import router as maps_router
from routes.predict import router as predict_router
from routes.dashboard import router as dashboard_router
from routes.llm import router as llm_router
from routes.predict_guj import router as guj_router
from routes.complaint import router as complaint_router

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(maps_router)
app.include_router(predict_router)
app.include_router(dashboard_router)
app.include_router(llm_router)
app.include_router(guj_router)
app.include_router(complaint_router)

@app.get("/")
def read_root():
    return {"message": "API for SIH"}

if __name__ == "__main__":
    uvicorn.run("main:app", port=8000, reload=True, host="0.0.0.0")
