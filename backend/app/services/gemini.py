import logging
import time
from typing import List, Dict, Optional, Any
import google.generativeai as genai
from google.api_core import exceptions
from app.core.config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    _configured = False

    @classmethod
    def _ensure_configured(cls) -> bool:
        if cls._configured:
            return True
        
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.warning("GEMINI_API_KEY is not set. Gemini calls will run in Mock/Simulation mode.")
            return False
            
        try:
            genai.configure(api_key=api_key)
            cls._configured = True
            logger.info("Successfully configured google-generativeai client.")
            return True
        except Exception as e:
            logger.error(f"Failed to configure google-generativeai: {e}")
            return False

    @classmethod
    def generate_text(
        cls, 
        prompt: str, 
        system_instruction: Optional[str] = None,
        temperature: Optional[float] = None,
        max_output_tokens: Optional[int] = None
    ) -> str:
        """
        Generates text using Google Gemini with retry logic.
        Falls back to a simulated response if no API key is configured.
        """
        if not cls._ensure_configured():
            return cls._generate_mock_response(prompt)

        model_name = settings.GEMINI_MODEL
        temp = temperature if temperature is not None else settings.GEMINI_TEMPERATURE
        max_tokens = max_output_tokens if max_output_tokens is not None else settings.GEMINI_MAX_OUTPUT_TOKENS

        config = genai.types.GenerationConfig(
            temperature=temp,
            max_output_tokens=max_tokens
        )

        model = genai.GenerativeModel(
            model_name=model_name,
            generation_config=config,
            system_instruction=system_instruction
        )

        max_retries = 3
        backoff = 2
        for attempt in range(max_retries):
            try:
                response = model.generate_content(prompt)
                return response.text
            except exceptions.ResourceExhausted as e:
                logger.warning(f"Gemini API Rate limit hit. Retrying in {backoff} seconds... (Attempt {attempt+1}/{max_retries})")
                time.sleep(backoff)
                backoff *= 2
            except exceptions.GoogleAPIError as e:
                logger.error(f"Gemini API error: {e}")
                raise e
            except Exception as e:
                logger.error(f"Unexpected error during Gemini generation: {e}")
                raise e

        raise Exception("Failed to generate content from Gemini after multiple retries due to rate limiting.")

    @classmethod
    def chat(cls, messages: List[Dict[str, str]], system_instruction: Optional[str] = None) -> str:
        """
        Sends a multi-turn conversation history to Gemini.
        Messages is a list of dicts with keys 'role' ('user' or 'assistant') and 'content'.
        """
        if not cls._ensure_configured():
            prompt = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
            return cls._generate_mock_response(prompt)

        model_name = settings.GEMINI_MODEL
        config = genai.types.GenerationConfig(
            temperature=settings.GEMINI_TEMPERATURE,
            max_output_tokens=settings.GEMINI_MAX_OUTPUT_TOKENS
        )

        model = genai.GenerativeModel(
            model_name=model_name,
            generation_config=config,
            system_instruction=system_instruction
        )

        # Convert standard OpenAI/Ollama messages to Gemini Chat history format
        # Gemini expects history format: contents = [{'role': 'user', 'parts': [...]}, {'role': 'model', 'parts': [...]}]
        gemini_history = []
        for msg in messages[:-1]:  # All messages except the last one
            role = 'user' if msg['role'] == 'user' else 'model'
            gemini_history.append({
                'role': role,
                'parts': [msg['content']]
            })

        # Start chat with history
        chat_session = model.start_chat(history=gemini_history)
        
        # Send the final message
        last_message = messages[-1]['content'] if messages else ""

        max_retries = 3
        backoff = 2
        for attempt in range(max_retries):
            try:
                response = chat_session.send_message(last_message)
                return response.text
            except exceptions.ResourceExhausted as e:
                logger.warning(f"Gemini API Rate limit hit. Retrying in {backoff} seconds... (Attempt {attempt+1}/{max_retries})")
                time.sleep(backoff)
                backoff *= 2
            except exceptions.GoogleAPIError as e:
                logger.error(f"Gemini API chat error: {e}")
                raise e
            except Exception as e:
                logger.error(f"Unexpected error during Gemini chat generation: {e}")
                raise e

        raise Exception("Failed to get chat response from Gemini after multiple retries due to rate limiting.")

    @classmethod
    def _generate_mock_response(cls, prompt: str) -> str:
        """
        Generates simulated legal responses for testing when API key is missing.
        """
        prompt_lower = prompt.lower()
        logger.info("Generating simulated legal response (mock mode).")
        
        # Mock answers based on keywords
        if "labor" in prompt_lower or "work" in prompt_lower or "contract" in prompt_lower:
            return (
                "Based on the simulated legal database context:\n\n"
                "1. Under Article 74 of the Labor Regulations, a contract may be terminated by mutual consent of both parties "
                "or if the contract term has expired without renewal.\n"
                "2. Article 80 stipulates the legal grounds for employer termination without notice or indemnity (e.g., misconduct, absence).\n"
                "3. Article 84 details the calculation of end-of-service benefits.\n\n"
                "Step-by-Step Legal Analysis:\n"
                "- Verify if the contract is fixed-term or indefinite.\n"
                "- Determine if termination is justified under Article 80 or if it warrants notice indemnity under Article 75.\n"
                "- Calculate standard end-of-service awards according to service duration.\n\n"
                "Confidence Indicator: HIGH (Simulated Grounding)\n"
                "Disclaimer: This is general legal information and does not constitute official legal advice."
            )
        elif "tax" in prompt_lower or "vat" in prompt_lower:
            return (
                "Based on the simulated VAT regulations context:\n\n"
                "1. Article 2 of the Tax Law defines standard taxable supplies at the specified VAT rate (e.g., 15%).\n"
                "2. Financial services and residential real estate leases are typically exempt or zero-rated under Article 34.\n\n"
                "Confidence Indicator: MEDIUM (Simulated Grounding)\n"
                "Disclaimer: This is general legal information and does not constitute official tax/legal advice."
            )
        else:
            return (
                "Simulated Legal AI Response:\n\n"
                "I have processed your query about the legal issues raised. In a real deployment, "
                "this response is grounded in the retrieved legal codes (e.g., Civil Law, Commercial Law) "
                "and related judicial precedents from the Knowledge Graph.\n\n"
                "Confidence Indicator: LOW (Mock Fallback)\n"
                "Disclaimer: Please configure `GEMINI_API_KEY` in the environment variables to receive live, grounded responses."
            )
