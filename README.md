# D.E.S.T.I.N.Y - Career Navigator

D.E.S.T.I.N.Y is an AI-powered career navigation web app built with Flask and Google Vertex AI Gemini Pro. It helps users discover personalized career paths based on their skills and interests.

## Features

- Enter your skills and interests to get tailored career suggestions
- AI-powered recommendations using Google Vertex AI Gemini Pro
- Clean, modern web interface
- Optional aptitude test and AI chat counselor (see `index.html`)

## Project Structure

```
D.E.S.T.I.N.Y/
│
├── destiny_app.py              # Main Flask application
├── requirements.txt            # Python dependencies (create this file)
├── static/
│   ├── style.css               # App styling
│   ├── script.js               # Frontend JS logic
│   └── mock_data.json          # (Optional) Mock data
└── templates/
    └── index.html              # Main HTML template
```

## Setup Instructions

### 1. Clone the repository

```sh
git clone https://github.com/Sandesh-Bodukuri/D.E.S.T.I.N.Y.git
cd D.E.S.T.I.N.Y
```

### 2. Install Python dependencies

Create a `requirements.txt` file with:
```
Flask
google-cloud-aiplatform
```

Then install:
```sh
pip install -r requirements.txt
```

### 3. Google Cloud Setup

- Make sure you have a Google Cloud project with Vertex AI enabled.
- Authenticate with Google Cloud:
  ```sh
  gcloud auth application-default login
  ```
- Edit `destiny_app.py` and set your actual project ID:
  ```python
  PROJECT_ID = "your-gcp-project-id"
  ```

### 4. Run the app

```sh
python destiny_app.py
```

Visit [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.

## Deployment

You can deploy this app to any platform that supports Python and Flask (Google Cloud Run, Heroku, etc.).

## License

MIT License

---

**Created by Sandesh Bodukuri**
