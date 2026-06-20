import requests


OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL_NAME = "llama3.2"


def ask_ollama(user_message: str) -> str:
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": user_message,
                "stream": False
            },
            timeout=120
        )

        response.raise_for_status()
        data = response.json()

        return data.get("response", "No response returned from Ollama.")

    except requests.exceptions.ConnectionError:
        return "Ollama is not running. Please run: ollama serve"

    except requests.exceptions.Timeout:
        return "Ollama took too long to respond. Try a shorter question."

    except Exception as e:
        return f"Ollama error: {str(e)}"