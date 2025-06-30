import requests
from fastapi import APIRouter

router = APIRouter(
    prefix="/nusmods",
    tags=["nusmods"]
)

NUSMODS_API_BASE = "https://api.nusmods.com/v2/"

@router.get("/modules/{year}")
def get_modules(year: str):
    """
    Fetch all modules for a given academic year from NUSMods API.
    """
    url = f"{NUSMODS_API_BASE}{year}/moduleList.json"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

@router.get("/module/{year}/{module_code}")
def get_module_info(year: str, module_code: str):
    """
    Fetch module info for a specific module code and year from NUSMods API.
    """
    url = f"{NUSMODS_API_BASE}{year}/modules/{module_code}.json"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

