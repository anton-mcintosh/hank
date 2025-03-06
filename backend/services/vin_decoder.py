import json
import asyncio
import httpx


async def get_vehicle_info(vin):
    """Get vehicle information from NHTSA API"""
    link = f"https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{vin}?format=json"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(link)
            if response.status_code == 200:
                data = response.json()
                return data
            else:
                print(f"NHTSA API error: {response.text}")
                return {}
    except Exception as e:
        print(f"Error getting vehicle info: {e}")
        return {}
