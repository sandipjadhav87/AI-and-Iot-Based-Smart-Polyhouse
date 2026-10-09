import firebase_admin
from firebase_admin import credentials, db

# Firebase service account
cred = credentials.Certificate("firebase-service-account.json")

# Initialize Firebase
firebase_admin.initialize_app(
    cred,
    {
        "databaseURL": "https://smart-polyhouse-aa502-default-rtdb.asia-southeast1.firebasedatabase.app/"
    }
)

# Reference to Firebase Realtime Database
sensor_ref = db.reference("/polyhouse/sensors")
prediction_ref = db.reference("/polyhouse/predictions")