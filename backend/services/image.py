import httpx
import json
import os
import base64
from dotenv import load_dotenv, dotenv_values

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
VISION_API_KEY = os.getenv("OPENAI_API_KEY")

print("Api key", OPENAI_API_KEY)


async def extract_vin_from_image(file_path):
    """Extract VIN from door placard image using Vision API"""
    try:
        async with httpx.AsyncClient() as client:
            with open(file_path, "rb") as f:
                image_content = base64.b64encode(f.read()).decode("utf-8")

            # Using OpenAI Vision for image analysis
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {VISION_API_KEY}",
            }
            payload = {
                "model": "gpt-4o",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Extract the VIN number from this door placard image. Only return the VIN, nothing else.",
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_content}"
                                },
                            },
                        ],
                    }
                ],
                "max_tokens": 100,
            }
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0,
            )

            if response.status_code == 200:
                vin_text = response.json()["choices"][0]["message"]["content"].strip()
                print("VIN text:", vin_text)
                # Typical VIN is 17 alphanumeric characters
                # Extract just the VIN using simple validation
                import re

                vin_match = re.search(r"[A-HJ-NPR-Z0-9]{17}", vin_text)
                print("VIN match:", vin_match)
                if vin_match:
                    return vin_match.group(0)
                return vin_text
            else:
                print(f"Vision API error: {response.text}")
                return ""
    except Exception as e:
        print(f"Error processing image: {e}")
        return ""


async def read_odometer_image(file_path):
    """Extract odometer reading from image using Vision API"""
    try:
        async with httpx.AsyncClient() as client:
            with open(file_path, "rb") as f:
                image_content = base64.b64encode(f.read()).decode("utf-8")

            # Using OpenAI Vision for odometer reading
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {VISION_API_KEY}",
            }
            payload = {
                "model": "gpt-4o",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Read the odometer value from this image. Return only the numeric value in miles, no text.",
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_content}"
                                },
                            },
                        ],
                    }
                ],
                "max_tokens": 100,
            }
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0,
            )

            if response.status_code == 200:
                mileage_text = response.json()["choices"][0]["message"][
                    "content"
                ].strip()
                print("Mileage text:", mileage_text)
                # Try to extract just the number
                import re

                mileage_match = re.search(r"[0-9,]+", mileage_text)
                print("Mileage match:", mileage_match)
                if mileage_match:
                    # Remove commas and convert to integer
                    return mileage_match.group(0).replace(",", "")
                return mileage_text
            else:
                print(f"Vision API error: {response.text}")
                return ""
    except Exception as e:
        print(f"Error processing odometer image: {e}")
        return ""


async def extract_license_from_image(file_path):
    """Extract License Plate Number from image using Vision API"""
    try:
        async with httpx.AsyncClient() as client:
            with open(file_path, "rb") as f:
                image_content = base64.b64encode(f.read()).decode("utf-8")

            # Using OpenAI Vision for image analysis
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {VISION_API_KEY}",
            }
            payload = {
                "model": "gpt-4o",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Extract the license plate number from this vehicle image. Only return the plate number, nothing else.",
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_content}"
                                },
                            },
                        ],
                    }
                ],
                "max_tokens": 100,
            }
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0,
            )

            if response.status_code == 200:
                license_text = response.json()["choices"][0]["message"][
                    "content"
                ].strip()
                print("License text:", license_text)
                return license_text
            else:
                print(f"Vision API error: {response.text}")
                return ""
    except Exception as e:
        print(f"Error processing image: {e}")
        return ""


async def extract_customer_info_from_image(file_path):
    """Extract customer information from an image using Vision API"""
    try:
        async with httpx.AsyncClient() as client:
            with open(file_path, "rb") as f:
                image_content = base64.b64encode(f.read()).decode("utf-8")

            # Using OpenAI Vision for image analysis
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {VISION_API_KEY}",
            }

            prompt = """
            Extract customer information from this image (like a business card or form).
            Return ONLY a JSON object with the following fields:
            {
                "first_name": "First name of the customer",
                "last_name": "Last name of the customer",
                "email": "Email address if visible",
                "phone": "Phone number if visible",
                "address": "Physical address if visible"
            }
            
            If any field is not visible or unclear, leave it as an empty string.
            """

            payload = {
                "model": "gpt-4o",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_content}"
                                },
                            },
                        ],
                    }
                ],
                "max_tokens": 300,
                "response_format": {"type": "json_object"},
            }

            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0,
            )

            if response.status_code == 200:
                result = response.json()["choices"][0]["message"]["content"]
                try:
                    return json.loads(result)
                except json.JSONDecodeError:
                    print(f"Failed to parse JSON from response: {result}")
                    return None
            else:
                print(f"Vision API error: {response.text}")
                return None
    except Exception as e:
        print(f"Error extracting customer info from image: {e}")
        return None
