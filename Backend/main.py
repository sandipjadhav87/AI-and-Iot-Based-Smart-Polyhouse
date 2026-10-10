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

# -----------------------------
# FIREBASE
# -----------------------------

import json

firebase_credentials_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT")

if not firebase_credentials_json:
    raise RuntimeError(
        "FIREBASE_SERVICE_ACCOUNT environment variable is missing"
    )

firebase_credentials = json.loads(firebase_credentials_json)

cred = credentials.Certificate(firebase_credentials)

firebase_admin.initialize_app(
    cred,
    {
        "databaseURL": (
            "https://smart-polyhouse-aa502-default-rtdb."
            "asia-southeast1.firebasedatabase.app/"
        )
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

allowed_origins = [
    "http://localhost:5173",
]

frontend_url = os.environ.get("FRONTEND_URL")

if frontend_url:
    allowed_origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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

    # Read and average the two temperature sensors
    temperature1 = float(sensor["temperature1"])
    temperature2 = float(sensor["temperature2"])
    temperature = (temperature1 + temperature2) / 2

    # Read and average the two humidity sensors
    humidity1 = float(sensor["humidity1"])
    humidity2 = float(sensor["humidity2"])
    humidity = (humidity1 + humidity2) / 2

    # Read raw soil moisture value from Firebase
    raw_value = float(sensor.get("soil_moisture_raw", 0))

    # Temporary calibration values — replace with actual readings
    DRY_VALUE = 3500
    WET_VALUE = 1500

    # Convert raw ADC value into moisture percentage
    if DRY_VALUE != WET_VALUE:
        soil_moisture = (
            (DRY_VALUE - raw_value) / (DRY_VALUE - WET_VALUE)
        ) * 100
    else:
     soil_moisture = 0

    # Keep percentage between 0 and 100
    soil_moisture = max(0, min(100, soil_moisture))

    # Use default light intensity if unavailable
    light_intensity = float(sensor.get("light_intensity", 600))

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
    estimated_water_litres = irrigation_time * (40000 / 60)

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
        "sensor_data": {
            "temperature": round(temperature, 2),
            "humidity": round(humidity, 2),
            "soil_moisture": soil_moisture,
            "light_intensity": light_intensity
        },
        "prediction": {
            "irrigation_time": round(irrigation_time, 2),
            "fan_time": round(fan_time, 2),
            "target_temperature": round(target_temperature, 2),
            "estimated_water_litres": round(estimated_water_litres, 2),
            "pump_hp": 5,
            "pump_flow_lph": 40000
        }
    }
