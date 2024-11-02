import streamlit as st
import os
import time
import google.generativeai as genai
from pypdf import PdfReader
from dotenv import load_dotenv

load_dotenv()
# Retrieve the API keys from the environment variables
GEMINI_API_KEY = os.environ["GOOGLE_API_KEY"]
genai.configure(api_key=GEMINI_API_KEY)

st.write("Hougang Factory :sunglasses: Testing Gemini 1.5 Pro :sunglasses:")

gemini = genai.GenerativeModel('gemini-1.5-pro-latest')

instruction = st.text_input("Customise your own unique prompt:", "You are my reading assistant. There are one or more articles below. Please read them carefully. For each one, generate a short summary that captures the main ideas and key details. Present the summary of each article as one concise and coherent paragraph.")

uploaded_files = st.file_uploader("**Upload** the PDF documents to analyse:", type = "pdf", accept_multiple_files = True)
count = 0
input_text = ""
for uploaded_file in uploaded_files:
  raw_text = ""
  if uploaded_file is not None:
    count = count + 1
    raw_text = raw_text + "\n**[Start of Article " + str(count) + "]**\n"
    doc_reader = PdfReader(uploaded_file)
    for i, page in enumerate(doc_reader.pages):
      text = page.extract_text()
      if text:
        raw_text = raw_text + text + "\n"
    raw_text = raw_text + "\n**[End of Article " + str(count) + "]**\n"
  input_text = input_text + raw_text
  #st.write(input_text)

if st.button(":rocket:"):
  with st.spinner("Running AI Model..."):
    start = time.time()
    prompt = "Read the text below." + instruction + "\n\n" + input_text
    response = gemini.generate_content(prompt, timeout=300)  # Timeout in seconds
    answer = response.text
    st.write(response.prompt_feedback)  
    end = time.time()
    st.write(answer)
    st.write("Time to generate: " + str(round(end-start,2)) + " seconds")