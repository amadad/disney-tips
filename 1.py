import os
from typing import List, Optional
from pydantic import BaseModel, Field
from rich.pretty import pprint
from phi.assistant import Assistant
from phi.llm.anthropic import Claude
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi
from pytube import YouTube
from youtube_transcript_api.formatters import TextFormatter

load_dotenv()
api_key = os.getenv("ANTHROPIC_API_KEY")

class Attraction(BaseModel):
    name: str = Field(..., description="Name of the attraction")
    description: Optional[str] = Field(None, description="A brief description of the attraction")
    is_open: Optional[bool] = Field(None, description="Indicates if the attraction is currently open")

class DiningOption(BaseModel):
    name: str = Field(..., description="Name of the dining option")
    cuisine: Optional[str] = Field(None, description="Type of cuisine offered")
    price_range: Optional[str] = Field(None, description="Approximate price range")

class ParkUpdate(BaseModel):
    update_date: str = Field(..., description="Date of the update")
    update_description: str = Field(..., description="Description of the update")

class ParkTips(BaseModel):
    best_time_to_visit: str = Field(..., description="Recommendations for the best time to visit the park")
    premium_tips: Optional[str] = Field(None, description="Tips and tricks for using premium services at the park")
    budget_tips: Optional[str] = Field(None, description="Tips for saving money and sticking to a budget while visiting the park")
    packing_essentials: List[str] = Field(..., description="Essential items to pack for a trip to the park")

class Park(BaseModel):
    park_name: str = Field(..., description="Name of the Disney World park")
    updates: List[ParkUpdate] = Field(..., description="List of recent updates for the park")
    attractions: List[Attraction] = Field(..., description="List of attractions in the park")
    dining_options: List[DiningOption] = Field(..., description="List of dining options available in the park")
    tips: ParkTips = Field(..., description="Useful tips for visitors to this park")

class DisneyWorldInfo(BaseModel):
    parks: List[Park] = Field(..., description="Information about each of the four main Disney World parks")
    planning_resources: List[str] = Field(..., description="Useful resources for planning a trip to Disney World")

def fetch_video_transcript(url: str) -> Optional[str]:
    video_id = url.split("v=")[1]
    transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
    #print(transcript_list)
    transcript_text = " ".join([entry['text'] for entry in transcript_list])
    return transcript_text

# Example usage
video_url = "https://www.youtube.com/watch?v=dBGk6V5AVhg"
transcript_text = fetch_video_transcript(video_url)

disney_assistant = Assistant(
    llm=Claude(model="claude-3-haiku-20240307", api_key=api_key),
    description="You help people write movie scripts.",
    output_model=DisneyWorldInfo,
    #debug_mode=True,
    markdown_mode=True,
    tools=[fetch_video_transcript],
    show_tool_calls=True,
)

disney_assistant.print_response("Get me the latest information Disney World", markdown=True)
#pprint(disney_assistant.run("Get me the latest information Disney World", markdown=True))