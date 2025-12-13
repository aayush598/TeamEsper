import streamlit as st
from db import (
    init_db,
    insert_topic,
    get_topics,
    insert_prompt,
    get_prompts,
    get_prompt_by_id
)
from agent import generate_questions
from prompts import DEFAULT_QUIZ_PROMPT

init_db()

st.set_page_config(page_title="AI Quiz Generator", layout="wide")
st.title("🎯 Interview-Grade AI Quiz Generator")

# Load topics
all_topics = get_topics()

# -------------------------------
# Topic Management
# -------------------------------
st.header("🗂 Skill / Topic Management")

with st.expander("Add New Topic"):
    topic = st.text_input("Topic name")
    if st.button("Add Topic"):
        if topic.strip():
            insert_topic(topic.strip())
            st.success("Topic added")
            st.rerun()

st.write("**Stored Topics:**")
st.write(all_topics if all_topics else "No topics added yet")

# -------------------------------
# Prompt Management
# -------------------------------
st.header("🧠 Prompt Templates")

with st.expander("Create / Edit Prompt"):
    p_title = st.text_input("Prompt Title")
    p_text = st.text_area(
        "Prompt Content",
        value=DEFAULT_QUIZ_PROMPT,
        height=300
    )
    if st.button("Save Prompt"):
        if p_title.strip():
            insert_prompt(p_title.strip(), p_text.strip())
            st.success("Prompt saved")

prompt_records = get_prompts()
prompt_map = {p["title"]: p["id"] for p in prompt_records}

selected_prompt_title = st.selectbox(
    "Select Prompt",
    options=["Default"] + list(prompt_map.keys())
)

if selected_prompt_title == "Default":
    active_prompt = DEFAULT_QUIZ_PROMPT
else:
    active_prompt = get_prompt_by_id(prompt_map[selected_prompt_title])

# -------------------------------
# Quiz Configuration
# -------------------------------
st.header("📋 Quiz Configuration")

use_all_topics = st.checkbox("Use all topics", value=True)

if use_all_topics:
    selected_topics = all_topics
else:
    selected_topics = st.multiselect(
        "Select Topics",
        options=all_topics
    )

quiz_mode = st.radio(
    "Quiz Mode",
    ["combined", "individual", "selective"],
    horizontal=True
)

question_type = st.radio(
    "Question Type",
    ["conceptual", "coding", "both"],
    horizontal=True
)

num_questions = st.number_input(
    "Number of Questions",
    min_value=1,
    max_value=50,
    value=15
)

# -------------------------------
# Generate Quiz
# -------------------------------
if st.button("🚀 Generate Quiz"):
    if not selected_topics:
        st.error("No topics selected.")
    else:
        final_prompt = active_prompt.format(
            topics=", ".join(selected_topics),
            quiz_mode=quiz_mode,
            question_type=question_type,
            num_questions=num_questions
        )

        with st.spinner("Generating interview-grade questions..."):
            output = generate_questions(final_prompt)

        st.subheader("📝 Generated Questions")
        st.text(output)
