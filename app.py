import json
import os
import random
import time
from typing import List

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
import google.generativeai as genai
from pydantic import BaseModel, Field


load_dotenv()

app = Flask(__name__)


class CareerPath(BaseModel):
    title: str = Field(description="A compelling and realistic career path title.")
    description: str = Field(description="A brief summary of the career path.")
    skill_gaps: List[str] = Field(description="3 to 5 specific skills to learn.")


class CareerResponse(BaseModel):
    career_paths: List[CareerPath]


def get_api_key() -> str | None:
    return os.environ.get("GEMINI_API_KEY")


def get_model(model_name: str):
    api_key = get_api_key()
    if not api_key:
        return None

    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/navigate", methods=["GET", "POST"])
def navigate():
    api_key = get_api_key()

    if request.method == "GET":
        status_code = 200 if api_key else 503
        return jsonify(
            {
                "route": "navigate",
                "status": "ready" if api_key else "misconfigured",
                "message": (
                    "Navigation endpoint is available."
                    if api_key
                    else "GEMINI_API_KEY is not configured."
                ),
            }
        ), status_code

    if not api_key:
        return jsonify(
            {"error": "AI service not configured. Set GEMINI_API_KEY before running the app."}
        ), 503

    payload = request.get_json(silent=True) or {}
    skills = payload.get("skills", "")
    interests = payload.get("interests", "")

    prompt = (
        "Analyze the user's skills and interests and suggest 2-3 personalized, realistic career paths.\n\n"
        f'User Skills: "{skills}"\n'
        f'User Interests: "{interests}"\n\n'
        "For each career path provide:\n"
        "- title (string)\n"
        "- description (one short paragraph)\n"
        "- skill_gaps: list of 3-5 concrete skills the user needs to learn\n\n"
        "Return exactly one JSON object matching this schema:\n"
        '{'
        '"career_paths": ['
        "{"
        '"title": "string",'
        '"description": "string",'
        '"skill_gaps": ["string", ...]'
        "}"
        "]"
        "}\n"
        "Do not add any extra text or markdown."
    )

    fallback_models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
    for model_name in fallback_models:
        model = get_model(model_name)
        if model is None:
            break

        max_retries = 5
        delay = 2.0
        for attempt in range(1, max_retries + 1):
            try:
                response = model.generate_content(
                    prompt,
                    generation_config={
                        "response_mime_type": "application/json",
                        "temperature": 0.7,
                    },
                )

                cleaned_text = (response.text or "").strip()
                if cleaned_text.startswith("```json"):
                    cleaned_text = cleaned_text[7:]
                if cleaned_text.endswith("```"):
                    cleaned_text = cleaned_text[:-3]
                cleaned_text = cleaned_text.strip()

                parsed = json.loads(cleaned_text)
                if isinstance(parsed, dict) and "career_paths" in parsed:
                    return jsonify(parsed["career_paths"])
                return jsonify(parsed)

            except Exception as exc:
                message = str(exc).lower()
                if any(token in message for token in ["unavailable", "503", "overloaded", "429", "resource_exhausted"]):
                    if attempt < max_retries:
                        time.sleep(delay + random.uniform(0, 1))
                        delay *= 2
                        continue
                    break

                if any(token in message for token in ["permission denied", "403", "api key"]):
                    return jsonify(
                        {"error": "Credential error. Ensure GEMINI_API_KEY is set and valid."}
                    ), 500

                return jsonify(
                    {"error": "An unexpected error occurred while generating suggestions."}
                ), 500

    return jsonify({"error": "All AI models are currently unavailable. Please try again later."}), 503


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=True)
