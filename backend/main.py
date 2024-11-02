import concurrent.futures
from typing import List, Tuple
from pydantic import BaseModel, Field
from phi.assistant import Assistant
from youtube_transcript_api import YouTubeTranscriptApi
from pytube import YouTube
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ParkAttraction(BaseModel):
    park_name: str
    attraction_names: List[str]

class DisneyWorldTripTips(BaseModel):
    park_updates: str = Field(..., description="Recent updates or changes to the Disney World parks.")
    best_time_to_visit: str = Field(..., description="Recommendations for the best time to visit Disney World.")
    must_do_attractions: List[ParkAttraction] = Field(..., description="List of must-do attractions or rides at Disney World.")
    dining_recommendations: List[str] = Field(..., description="Recommendations for dining options at Disney World.")
    premium_tips: str = Field(..., description="Tips and tricks for using Genie+ and Lightning Lanes at Disney World.")
    budget_tips: str = Field(..., description="Tips for saving money and sticking to a budget at Disney World.")
    packing_essentials: List[str] = Field(..., description="Essential items to pack for a Disney World trip.")
    transportation_options: str = Field(..., description="Information on transportation options within Disney World.")
    planning_resources: List[str] = Field(..., description="Useful resources for planning a Disney World trip.")
    publish_date_video_url: List[Tuple[str, str]] = Field(..., description="Publish date and URL of the YouTube video.")

disney_world_assistant = Assistant(
    description="You help people plan their Disney World trip by providing tips, tricks, and updates.",
    output_model=DisneyWorldTripTips,
    markdown=True,
    llm="gpt-3.5-turbo-0125"
)

def fetch_video_data(url):
    try:
        logger.info(f"Processing video: {url}")
        video_id = url.split("v=")[1]
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        transcript_text = " ".join([entry["text"] for entry in transcript])
        trip_tips = disney_world_assistant.run(transcript_text)
        video = YouTube(url)
        publish_date = video.publish_date.strftime("%B %d, %Y")
        trip_tips.publish_date_video_url = [(publish_date, url)]
        return trip_tips
    except Exception as e:
        logger.error(f"Error processing video {url}: {str(e)}")
        return None

def aggregate_data(trip_tips_list):
    aggregated_data = {
        "park_updates": [],
        "best_time_to_visit": [],
        "must_do_attractions": [],
        "dining_recommendations": [],
        "premium_tips": [],
        "budget_tips": [],
        "packing_essentials": [],
        "transportation_options": [],
        "planning_resources": [],
        "publish_date_video_url": [],
    }
    for trip_tips in trip_tips_list:
        if trip_tips is None:
            continue
        for field_name, field_value in trip_tips.__dict__.items():
            if field_name == "must_do_attractions":
                aggregated_data[field_name].extend(field_value)
            else:
                aggregated_data[field_name].append(field_value)
    return aggregated_data

def generate_markdown(aggregated_data):
    markdown_content = "# Disney World Trip Tips\n\n"
    for field_name, field_values in aggregated_data.items():
        if field_name == "publish_date_video_url":
            continue
        markdown_content += f"## {field_name.replace('_', ' ').title()}\n"
        if field_name == "must_do_attractions":
            for park_attraction in field_values:
                markdown_content += f"### {park_attraction.park_name}\n"
                for attraction in park_attraction.attraction_names:
                    markdown_content += f"- {attraction}\n"
            markdown_content += "\n"
        else:
            for field_value in field_values:
                markdown_content += f"- {field_value}\n"
        markdown_content += "\n"

    markdown_content += "## Publish Date and Video URLs\n\n"
    for item_list in aggregated_data["publish_date_video_url"]:
        if isinstance(item_list, list) and len(item_list) == 1 and isinstance(item_list[0], tuple):
            publish_date, video_url = item_list[0]
            markdown_content += f"- {publish_date}: {video_url}\n"
        else:
            logger.error(f"Unexpected data structure for publish_date_video_url: {item_list}")

    return markdown_content



app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # Update with your Next.js app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/markdown")
def get_markdown():
    video_urls = [
        "https://www.youtube.com/watch?v=dBGk6V5AVhg",
        "https://www.youtube.com/watch?v=S8hk9JuER94",
        "https://www.youtube.com/watch?v=QcfLliUn6bA",
        "https://www.youtube.com/watch?v=qVAysC5C4fk",
        "https://www.youtube.com/watch?v=hO2LhHUL_jM",
        "https://www.youtube.com/watch?v=RI_cbYb8jDE",
        "https://www.youtube.com/watch?v=qVGZCCn_X8g",
    ]
    with concurrent.futures.ThreadPoolExecutor() as executor:
        trip_tips_list = list(executor.map(fetch_video_data, video_urls))
    aggregated_data = aggregate_data(trip_tips_list)
    markdown_content = generate_markdown(aggregated_data)
    return {"markdown": markdown_content}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)