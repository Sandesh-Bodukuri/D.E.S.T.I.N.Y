from flask import Flask, request, jsonify, render_template
import vertexai
from vertexai.preview.generative_models import GenerativeModel
import json

# --- Initialize Flask App and Vertex AI ---
app = Flask(__name__)

# Directly set your Google Cloud Project ID here
PROJECT_ID = "destiny-472810"  
LOCATION = "us-central1"  

try:
    vertexai.init(project=PROJECT_ID, location=LOCATION)
except Exception as e:
    print(f"Could not initialize Vertex AI. Please ensure you are authenticated and project details are correct. Error: {e}")

# Load the Gemini Pro model
gemini_pro_model = GenerativeModel("gemini-1.0-pro")

# --- API Route for Career Navigation ---
@app.route('/navigate', methods=['POST'])
def navigate():
    """
    Receives user skills and interests, gets career advice from Gemini,
    and returns it as JSON.
    """
    try:
        data = request.get_json()
        if not data or 'skills' not in data or 'interests' not in data:
            return jsonify({"error": "Missing skills or interests in request body"}), 400

        skills = data.get('skills', 'none')
        interests = data.get('interests', 'none')

        # Prompt for the Gemini Pro model
        prompt = (
            "You are an expert career advisor AI. Given the following user profile:\n"
            f"- Skills: {skills}\n"
            f"- Interests: {interests}\n\n"
            "Analyze this information and suggest exactly 3 distinct career paths that best fit the user's background and aspirations.\n"
            "For each career path, provide:\n"
            "  1. \"title\": A concise name for the career path.\n"
            "  2. \"description\": A brief paragraph describing what the career involves and why it fits the user.\n"
            "  3. \"skill_gaps\": A list of key skills or knowledge areas the user may need to develop to pursue this path.\n\n"
            "Respond ONLY with a valid JSON array of 3 objects, each with the keys: \"title\", \"description\", and \"skill_gaps\".\n"
            "Do not include any extra text, explanations, or markdown formatting."
        )

        # Call the Gemini model
        response = gemini_pro_model.generate_content(prompt)

        # Clean the response to ensure it is valid JSON
        cleaned_text = response.text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
        cleaned_text = cleaned_text.strip()

        # Parse the model's JSON string into a Python object
        career_suggestions = json.loads(cleaned_text)

        # Return the dynamic response from Gemini
        return jsonify(career_suggestions)

    except Exception as e:
        print(f"An error occurred in the navigate route: {e}")
        error_response = {
            "error": "Could not generate career paths at this time. The AI model might be busy or an internal error occurred."
        }
        return jsonify(error_response), 500

# --- Route to Serve the Frontend HTML ---
@app.route('/')
def index():
    return render_template('index.html')

# --- To run the app directly ---
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)