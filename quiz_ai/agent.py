from agno.agent import Agent
from agno.models.google import Gemini
import os
from dotenv import load_dotenv

load_dotenv()

# Make sure your GEMINI_API_KEY is exported in environment
MODEL = "gemini-2.5-flash-lite"        # or whichever you prefer

def make_agent():
    """
    Create an Agno agent to generate the quiz questions.
    """
    return Agent(
        name="Quiz Generator",
        model=Gemini(id=MODEL),
    )

def generate_questions(prompt: str) -> str:
    agent = make_agent()
    # Run the agent with the prompt
    result = agent.run(prompt)
    # The agent response content will include the generated questions
    return result.content
