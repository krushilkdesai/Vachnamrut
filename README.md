# Vachnamrut LangChain RAG Chatbot

A production-ready Flask web application featuring a LangChain RAG pipeline trained on the Vachnamrut scriptures, using Chroma DB as the vector database, and Mistral AI's `mistral-small-2506` model. It features a premium ChatGPT-like responsive dark-themed UI.

## Project Structure

```
.
├── app.py                  # Main Flask app with routes & RAG pipeline
├── requirements.txt        # Python dependencies
├── vercel.json             # Vercel deployment configuration
├── .env.example            # Environment configuration template
├── chroma_db/              # Chroma Vector Database directory
├── templates/
│   └── index.html          # Chat interface template (HTML5)
├── static/
│   ├── style.css           # Premium styling & dark mode layouts
│   └── script.js           # Client-side API interactions & message handling
└── README.md               # Setup & deployment documentation
```

## Features

- **RAG Pipeline**: Retrieves relevant context from the local `chroma_db` directory using MMR search.
- **Mistral AI Integration**: Leverages Mistral AI's `mistral-small-2506` model to synthesize accurate answers.
- **Premium UI**: Modern dark theme with CSS animations, responsive columns, and ChatGPT-style message bubblings.
- **Suggestion Chips**: Quick click-to-ask questions to guide the user.
- **Serverless Ready**: Configured for immediate deployment on Vercel.

## Local Setup

### 1. Clone & Initialize Environment
Make sure you are in the workspace root directory.

### 2. Configure Environment Variables
Create or check your `.env` file in the root directory (based on `.env.example`):
```bash
MISTRAL_API_KEY=your_mistral_api_key
FLASK_ENV=development
PORT=5001
```

### 3. Install Dependencies
It's recommended to use a virtual environment:
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### 4. Start the Application
Run the Flask server:
```bash
python app.py
```
Open your browser and visit [http://localhost:5001](http://localhost:5001).

---

## Deploying to Vercel

This project is prepared for deployment on Vercel as a Python Serverless Function.

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Deploy
Run the following command in the project root:
```bash
vercel
```
Follow the prompts to link the project. Ensure you set the `MISTRAL_API_KEY` environment variable in your Vercel Dashboard under **Project Settings > Environment Variables**.
