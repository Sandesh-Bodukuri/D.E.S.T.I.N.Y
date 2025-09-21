from flask import Flask, request, jsonify, render_template
import os

app = Flask(__name__)

# NEW: This route will serve your index.html file as the homepage
@app.route('/')
def index():
    # Flask will look for index.html in a 'templates' folder
    return render_template('index.html')

# This is your existing API route for generating career paths
@app.route('/navigate', methods=['POST'])
def navigate():
    # For the demo, we are using the mock response
    # When you are ready for the live AI, you would put the Gemini API call here
    print("Returning mock response from production server...")
    mock_response = [
        {
            "title": "AI Specialist (Live Demo)",
            "description": "This career focuses on developing cutting-edge AI technologies, deploying machine learning models, and analyzing complex data.",
            "skill_gaps": ["Advanced Python", "TensorFlow/PyTorch", "Cloud Computing (GCP/AWS)"]
        },
        {
            "title": "Data Scientist (Live Demo)",
            "description": "Data Scientists analyze large, complex data sets to identify trends, make predictions, and drive business decisions through data.",
            "skill_gaps": ["Statistical Analysis", "SQL Databases", "Data Visualization Tools"]
        }
    ]
    return jsonify(mock_response)

if __name__ == '__main__':
    # This part is only for local development, Render will use Gunicorn
    app.run(debug=True)

