from firebase_config import sensor_ref

data = sensor_ref.get()

print("Firebase connection successful!")
print("Sensor data:")
print(data)