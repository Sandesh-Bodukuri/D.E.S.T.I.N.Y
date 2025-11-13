from flask import Flask, request, jsonify, render_template
import os
import json
import time
import random
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field
from typing import List

load_dotenv()

app = Flask(__name__)

# --- Pydantic Schemas for Structured Output ---
class CareerPath(BaseModel):
    title: str = Field(description="A compelling and realistic career path title.")
    description: str = Field(description="A brief summary of the career path.")
    skill_gaps: List[str] = Field(description="3 to 5 specific skills to learn.")

class CareerResponse(BaseModel):
    career_paths: List[CareerPath]

# --- genai Client Setup using GEMINI_API_KEY ---
api_key = os.environ.get("GEMINI_API_KEY")
if api_key:
    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        print("Failed to initialize genai client with API key:", e)
        client = None
else:
    print("GEMINI_API_KEY not found. Set GEMINI_API_KEY in .env or environment.")
    client = None
# ---------------------------

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/navigate', methods=['POST'])
def navigate():
    if not client:
        return jsonify({"error": "AI service not configured. Set GEMINI_API_KEY before running the app."}), 500

    payload = request.get_json() or {}
    skills = payload.get("skills", "")
    interests = payload.get("interests", "")

    prompt = (
        "Analyze the user's skills and interests and suggest 2-3 personalized, realistic career paths.\n\n"
        f"User Skills: \"{skills}\"\n"
        f"User Interests: \"{interests}\"\n\n"
        "For each career path provide:\n"
        "- title (string)\n"
        "- description (one short paragraph)\n"
        "- skill_gaps: list of 3-5 concrete skills the user needs to learn\n\n"
        "Return exactly one JSON object matching this schema:\n"
        '{'
        '"career_paths": ['
        '{'
        '"title": "string",'
        '"description": "string",'
        '"skill_gaps": ["string", ...]'
        '}'
        ']'
        '}\n'
        "Do not add any extra text or markdown."
    )

    fallback_models = ["gemini-2.5-flash", "gemini-2.1-mini", "gemini-1.0-mini"]
    for model_name in fallback_models:
        max_retries = 5
        delay = 2.0
        for attempt in range(1, max_retries + 1):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json",
                        "temperature": 0.7
                    }
                )

                # extract probable text content from response
                cleaned_text = None
                if hasattr(response, "text") and isinstance(response.text, str):
                    cleaned_text = response.text
                else:
                    # try common alternative shapes
                    if hasattr(response, "candidates") and response.candidates:
                        try:
                            cleaned_text = response.candidates[0].content
                        except Exception:
                            cleaned_text = str(response.candidates[0])
                    else:
                        cleaned_text = str(response)

                cleaned_text = cleaned_text.strip()
                if cleaned_text.startswith("```json"):
                    cleaned_text = cleaned_text[7:]
                if cleaned_text.endswith("```"):
                    cleaned_text = cleaned_text[:-3]
                cleaned_text = cleaned_text.strip()

                parsed = json.loads(cleaned_text)
                # normalize return: prefer returning the career_paths list
                if isinstance(parsed, dict) and "career_paths" in parsed:
                    return jsonify(parsed["career_paths"])
                return jsonify(parsed)

            except Exception as e:
                msg = str(e).lower()
                # Retryable conditions
                if any(x in msg for x in ["unavailable", "503", "overloaded", "429", "resource_exhausted"]):
                    if attempt < max_retries:
                        jitter = random.uniform(0, 1)
                        sleep_time = delay + jitter
                        print(f"API Error (model={model_name}) Retry {attempt}/{max_retries}: {e}. Sleeping {sleep_time:.1f}s")
                        time.sleep(sleep_time)
                        delay *= 2
                        continue
                    else:
                        print(f"Model {model_name} exhausted after {max_retries} retries, trying next model.")
                        break
                # Non-retryable credential errors
                if "default credentials" in msg or "permission denied" in msg or "403" in msg:
                    print("Credential/permission error:", e)
                    return jsonify({"error": "Credential error. Ensure GEMINI_API_KEY is set and valid."}), 500
                # Other errors: return a generic error
                print(f"Unexpected error calling model {model_name}: {e}")
                return jsonify({"error": "An unexpected error occurred while generating suggestions."}), 500

    return jsonify({"error": "All AI models are currently unavailable. Please try again later."}), 503


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)        