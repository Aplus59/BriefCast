from fastapi import FastAPI
import uvicorn
from contextlib import asynccontextmanager
from ingestion.scheduler import start_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background scheduler
    start_scheduler()
    yield
    # Shutdown: Add scheduler shutdown logic here if needed

app = FastAPI(title="BriefCast AI Service", lifespan=lifespan)

@app.get("/health")
def health_check():
    return {"status": "AI Service is healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
