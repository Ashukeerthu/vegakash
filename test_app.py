from fastapi import FastAPI

app = FastAPI(title="Test API")

@app.get("/")
def read_root():
    return {"message": "Hello World"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}