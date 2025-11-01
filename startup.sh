# Startup command for Azure App Service
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT