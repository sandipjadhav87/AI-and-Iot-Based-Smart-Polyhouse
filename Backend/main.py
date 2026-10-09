import os
import joblib
import firebase_admin

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from firebase_admin import credentials, db
from huggingface_hub import hf_hub_download

# -----------------------------
# PATHS
# -----------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "Models")

# -----------------------------
# FIREBASE
# -----------------------------

cred = credentials.Certificate(
    os.path.join(BASE_DIR, "Backend", "firebase-service-account.json")
)

firebase_admin.initialize_app(
    cred,
    {
        "databaseURL": "https://smart-polyhouse-aa502-default-rtdb.asia-southeast1.firebasedatabase.app/"
    }
)

sensor_ref = db.reference("/polyhouse/sensors")
prediction_ref = db.reference("/polyhouse/predictions")

# -----------------------------
# LOAD AI MODELS FROM HUGGING FACE
# -----------------------------

MODEL_REPO = "sandip87/smart-polyhouse-ai-models"


def download_model(filename):
    return hf_hub_download(
        repo_id=MODEL_REPO,
        filename=filename,
        repo_type="model"
    )


irrigation_model = joblib.load(
    download_model("final_irrigation_model_compressed.pkl")
)

fan_model = joblib.load(
    download_model("final_fan_model_compressed.pkl")
)

temperature_model = joblib.load(
    download_model("final_temperature_model_compressed.pkl")
)
# -----------------------------
# FASTAPI
# -----------------------------

app = FastAPI(title="Smart Polyhouse AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "status": "online",
        "system": "Smart Polyhouse AI"
    }


@app.get("/api/predict")
def predict():

    # Get sensor data from Firebase
    sensor = sensor_ref.get()

    temperature = float(sensor["temperature"])
    humidity = float(sensor["humidity"])
    soil_moisture = float(sensor["soil_moisture"])
    light_intensity = float(sensor["light_intensity"])

    # Same feature order used for training
    features = [[
        temperature,
        humidity,
        soil_moisture,
        light_intensity
    ]]

    # AI predictions
    irrigation_time = max(
        0,
        float(irrigation_model.predict(features)[0])
    )

    fan_time = max(
        0,
        float(fan_model.predict(features)[0])
    )

    target_temperature = max(
        0,
        float(temperature_model.predict(features)[0])
    )

    # 5 HP pump = 40,000 L/hour
    pump_flow_lph = 40000
    pump_flow_lpm = pump_flow_lph / 60

    estimated_water = irrigation_time * pump_flow_lpm

    # Prediction result
    prediction = {
        "irrigation_time": round(irrigation_time, 2),
        "fan_time": round(fan_time, 2),
        "target_temperature": round(target_temperature, 2),
        "estimated_water_litres": round(estimated_water, 2),
        "pump_hp": 5,
        "pump_flow_lph": 40000
    }

    # Save prediction to Firebase
    prediction_ref.set(prediction)

    return {
        "sensor_data": sensor,
        "prediction": prediction
    }
