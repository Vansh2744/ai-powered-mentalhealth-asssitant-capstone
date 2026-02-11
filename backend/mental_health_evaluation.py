from typing import TypedDict, List, Dict
from collections import Counter
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain.messages import SystemMessage, HumanMessage
import re
from system_prompt import evaluation_prompt
import os
from dotenv import load_dotenv

load_dotenv()


class MentalHealthState(TypedDict):
    conversation: List[Dict[str, str]]
    face_logs: str
    face_analysis: Dict
    convo_score: int
    classification: str
    evaluation: str



def analyze_face(state: MentalHealthState):
    logs = re.findall(r"-\s*(\w+)", state["face_logs"].lower())
    counter = Counter(logs)
    total = sum(counter.values())

    negative_emotions = ["sad", "fear", "angry", "disgust"]
    negative_count = sum(counter[e] for e in negative_emotions if e in counter)

    negative_ratio = negative_count / total if total > 0 else 0
    dominant = counter.most_common(1)[0][0] if total > 0 else "unknown"

    state["face_analysis"] = {
        "dominant": dominant,
        "distribution": dict(counter),
        "negative_ratio": round(negative_ratio, 2)
    }

    return state



def analyze_conversation(state: MentalHealthState):
    negative_keywords = [
        "exhausted", "tired", "sad",
        "hopeless", "drained", "angry",
        "anxious", "stressed"
    ]

    score = 0
    for turn in state["conversation"]:
        user_text = turn.user.lower()
        for word in negative_keywords:
            if word in user_text:
                score += 1

    state["convo_score"] = score
    return state



def classify_state(state: MentalHealthState):
    negative_ratio = state["face_analysis"]["negative_ratio"]
    convo_score = state["convo_score"]

    combined_score = (negative_ratio * 5) + convo_score

    if combined_score <= 2:
        classification = "Stable"

    elif combined_score <= 4:
        classification = "Mild Emotional Strain"

    elif combined_score <= 6:
        classification = "Moderate Emotional Strain"

    else:
        classification = "Elevated Emotional Concern"

    state["classification"] = classification
    return state




llm = ChatGroq(model="llama-3.3-70b-versatile",
    temperature=0.7,
    max_tokens=500,
    groq_api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = evaluation_prompt

def generate_evaluation(state: MentalHealthState):

    # Format conversation cleanly
    formatted_convo = ""
    for turn in state["conversation"]:
        user_msg = turn.user.lower()
        ai_msg = turn.ai.lower()

        if user_msg:
            formatted_convo += f"User: {user_msg}\n"
        if ai_msg:
            formatted_convo += f"Assistant: {ai_msg}\n"

    context = f"""
    Here is the conversation history:
    {formatted_convo}

    Face emotion summary:
    - Dominant Emotion: {state['face_analysis']['dominant']}
    - Negative Emotion Ratio: {state['face_analysis']['negative_ratio']}

    Emotional Classification Level:
    {state['classification']}
    """

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=context)
    ]

    response = llm.invoke(messages)

    state["evaluation"] = response.content
    return state




graph = StateGraph(MentalHealthState)

graph.add_node("analyze_face", analyze_face)
graph.add_node("analyze_conversation", analyze_conversation)
graph.add_node("classify", classify_state)
graph.add_node("generate", generate_evaluation)

graph.set_entry_point("analyze_face")

graph.add_edge("analyze_face", "analyze_conversation")
graph.add_edge("analyze_conversation", "classify")
graph.add_edge("classify", "generate")
graph.add_edge("generate", END)

evaluate_app = graph.compile()
