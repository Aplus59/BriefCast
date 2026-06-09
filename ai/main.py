from fastapi import FastAPI
import uvicorn

app = FastAPI(title="BriefCast AI Service")

@app.get("/health")
def health_check():
    return {"status": "AI Service is healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
