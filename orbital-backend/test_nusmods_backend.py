import requests

# Your backend endpoint
backend_url = "http://localhost:8000/nusmods/modules/2024-2025"
# NUSMods API endpoint
nusmods_url = "https://api.nusmods.com/v2/2024-2025/moduleList.json"

backend_response = requests.get(backend_url).json()
nusmods_response = requests.get(nusmods_url).json()

# Compare a few items to demonstrate similarity
print("Backend sample:", backend_response[:2])
print("NUSMods sample:", nusmods_response[:2])

# Optional: check if they are the same
print("Responses match:", backend_response == nusmods_response)
