import os
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv

# Import langchain components as specified
from langchain_chroma import Chroma
from langchain_mistralai import ChatMistralAI, MistralAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate

# Load environment variables using python-dotenv
load_dotenv()

app = Flask(__name__)

# Initialize components globally to avoid reloading them on each request
try:
    # Create embeddings using MistralAI
    embedding_model = MistralAIEmbeddings(
        model="mistral-embed"
    )
    
    # Load the Chroma database using those embeddings from chroma_dbbb directory
    vectorstore = Chroma(
        persist_directory="chroma_dbbb",
        embedding_function=embedding_model
    )
    
    # Configure the retriever with MMR and parameters: k=4, fetch_k=10, lambda_mult=0.5
    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 4,
            "fetch_k": 10,
            "lambda_mult": 0.5
        }
    )
    
    # Use ChatMistralAI model mistral-small-2506
    llm = ChatMistralAI(model="mistral-small-2506")
    
    # System & Human prompts
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are a helpful AI assistant.\n\nUse ONLY the provided context to answer the question.\n\nIf the answer is not present in the context, say:\n'I could not find the answer in the document.'"
        ),
        (
            "human",
            "Context:\n{context}\n\nQuestion:\n{question}"
        )
    ])
    
    print("RAG components initialized successfully.")
except Exception as e:
    print(f"Error initializing RAG components: {e}")

@app.route("/")
def index():
    """Render the chat interface home page."""
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    """
    POST /chat endpoint.
    Workflow:
    1. Receive a question from the frontend.
    2. Retrieve relevant documents from Chroma.
    3. Combine document contents into one context string.
    4. Invoke the prompt template.
    5. Send the prompt to Mistral.
    6. Return only the generated answer as JSON.
    """
    try:
        # Check if RAG components are loaded
        if 'retriever' not in globals() or 'llm' not in globals() or 'prompt' not in globals():
            return jsonify({
                "error": "Backend RAG components are not initialized. Check API keys and logs."
            }), 500

        data = request.get_json()
        if not data or "message" not in data:
            return jsonify({"error": "Invalid request format. JSON body must contain 'message'."}), 400
        
        query = data["message"]
        if not query.strip():
            return jsonify({"error": "Message cannot be empty."}), 400
        
        # 2. Retrieve relevant documents from Chroma
        docs = retriever.invoke(query)
        
        # 3. Combine document contents into one context string
        context = "\n\n".join([doc.page_content for doc in docs])
        
        # 4. Invoke the prompt template
        final_prompt = prompt.invoke({
            "context": context,
            "question": query
        })
        
        # 5. Send the prompt to Mistral
        response = llm.invoke(final_prompt)
        
        # 6. Return only the generated answer as JSON
        return jsonify({"answer": response.content})
        
    except Exception as e:
        app.logger.error(f"Error handling chat request: {e}")
        return jsonify({"error": f"An error occurred on the server: {str(e)}"}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    # Run server locally. In production, vercel handles execution or gunicorn is used.
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_ENV") == "development")
