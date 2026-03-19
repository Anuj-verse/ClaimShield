import os
import requests
from dotenv import load_dotenv
from rag_pipeline import get_similar_context

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

conversation_history = []

def call_openrouter(messages):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    body = {
        "model": "arcee-ai/trinity-mini-20251201:free",
        "messages": messages
    }
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=body
    )
    data = response.json()
    
    if 'choices' in data:
        return data['choices'][0]['message']['content']
    else:
        print("Error:", data)
        return "Unable to process request. Please try again."

def get_chat_reply(user_question, claim_context=None):
    """
    Investigator ke sawaal ka jawab do
    claim_context = claim details string (optional)
    """
    global conversation_history

    # Pehli baar claim context set karo
    if not conversation_history:
        system_msg = {
            "role": "system",
            "content": """You are an insurance fraud investigation assistant. 
            Help investigators analyze claims, identify red flags, and suggest actions.
            Be concise, professional, and evidence-based."""
        }
        conversation_history.append(system_msg)

        # Agar claim context hai toh add karo
        if claim_context:
            similar = get_similar_context(claim_context)
            context_msg = {
                "role": "system",
                "content": f"Current claim under investigation: {claim_context}\n\nSimilar past cases:\n{similar}"
            }
            conversation_history.append(context_msg)

    # User ka sawaal add karo
    conversation_history.append({
        "role": "user",
        "content": user_question
    })

    # Reply lo
    reply = call_openrouter(conversation_history)

    # Reply history mein add karo
    conversation_history.append({
        "role": "assistant",
        "content": reply
    })

    return reply

def reset_conversation():
    """Naya claim ke liye conversation reset karo"""
    global conversation_history
    conversation_history = []

if __name__ == "__main__":
    # Test claim set karo
    claim = "Single Vehicle Collision, Major Damage, Amount 71000, Night time"
    
    print("=== ClaimShield Investigator Chatbot ===")
    print("Type 'quit' to exit, 'reset' to start fresh\n")

    while True:
        question = input("Investigator: ")
        
        if question.lower() == 'quit':
            break
        elif question.lower() == 'reset':
            reset_conversation()
            print("Conversation reset!\n")
            continue
            
        reply = get_chat_reply(question, claim)
        print(f"\nClaimShield: {reply}\n")