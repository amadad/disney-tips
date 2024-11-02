import os
import logging
from typing import List, Tuple, Optional
from pprint import pprint
from pydantic import BaseModel, Field
from phi.assistant import Assistant
from phi.llm.anthropic import Claude
from youtube_transcript_api import YouTubeTranscriptApi
from pytube import YouTube
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("ANTHROPIC_API_KEY")

video_urls = [
        "https://www.youtube.com/watch?v=dBGk6V5AVhg",
        "https://www.youtube.com/watch?v=S8hk9JuER94",
        "https://www.youtube.com/watch?v=QcfLliUn6bA",
        "https://www.youtube.com/watch?v=qVAysC5C4fk",
        "https://www.youtube.com/watch?v=hO2LhHUL_jM",
        "https://www.youtube.com/watch?v=RI_cbYb8jDE",
        "https://www.youtube.com/watch?v=qVGZCCn_X8g",
    ]

class Attraction(BaseModel):
    name: str
    description: Optional[str] = Field(None, description="A brief description of the attraction.")

class DiningOption(BaseModel):
    name: str
    cuisine: Optional[str] = Field(None, description="Type of cuisine offered.")
    price_range: Optional[str] = Field(None, description="Approximate price range.")

class ParkTips(BaseModel):
    park_updates: Optional[str] = Field(None, description="Recent updates or changes to the park.")
    best_time_to_visit: Optional[str] = Field(None, description="Recommendations for the best time to visit the park.")
    must_do_attractions: List[Attraction] = Field(..., description="List of must-do attractions or rides at the park.")
    dining_recommendations: List[DiningOption] = Field(..., description="Recommendations for dining options at the park.")
    premium_tips: Optional[str] = Field(None, description="Tips and tricks for using premium services at the park.")
    budget_tips: Optional[str] = Field(None, description="Tips for saving money and sticking to a budget while visiting the park.")
    packing_essentials: List[str] = Field(..., description="Essential items to pack for a trip to the park.")
    transportation_options: Optional[str] = Field(None, description="Information on transportation options within the park.")

class DisneyWorldTripTips(BaseModel):
    park_hollywood: ParkTips = Field(..., description="Information and tips for Hollywood Studios at Disney World.")
    planning_resources: List[str] = Field(..., description="Useful resources for planning a Disney World trip.")
    #publish_date_video_url: List[Tuple[str, str]] = Field(..., description="Publish date and URL of the YouTube video related to Disney World tips.")

disney_world_assistant = Assistant(
    description="You help people plan their Disney World trip by providing tips, tricks, and updates.",
    output_model=DisneyWorldTripTips,
    markdown=True,
    llm=Claude(model="claude-3-haiku-20240307", api_key=api_key),
)

def fetch_video_data(url):
    video_id = url.split("v=")[1]
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    transcript_text = " ".join([entry["text"] for entry in transcript])
    # Assuming you want to process and return the combined transcript text
    return transcript_text

chosen_video_url = video_urls[0]  # Example: Selecting the first video URL
transcript_text = fetch_video_data(chosen_video_url)
# Now pass the transcript text to the assistant's run method
assistant_response = disney_world_assistant.run(transcript_text)
pprint(assistant_response)