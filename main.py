from typing import List
from pydantic import BaseModel, Field
from phi.assistant import Assistant
from youtube_transcript_api import YouTubeTranscriptApi
from pytube import YouTube
import concurrent.futures
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DisneyWorldTripTips(BaseModel):
    park_updates: str = Field(..., description="Recent updates or changes to the Disney World parks.")
    best_time_to_visit: str = Field(..., description="Recommendations for the best time to visit Disney World.")
    must_do_attractions: List[str] = Field(..., description="List of must-do attractions or rides at Disney World.")
    dining_recommendations: List[str] = Field(..., description="Recommendations for dining options at Disney World.")
    premium_tips: str = Field(..., description="Tips and tricks for using Genie+ and Lightning Lanes at Disney World.")
    budget_tips: str = Field(..., description="Tips for saving money and sticking to a budget at Disney World.")
    packing_essentials: List[str] = Field(..., description="Essential items to pack for a Disney World trip.")
    transportation_options: str = Field(..., description="Information on transportation options within Disney World.")
    planning_resources: List[str] = Field(..., description="Useful resources for planning a Disney World trip.")
    publish_date: str = Field(..., description="Publish date of the YouTube video.")
    video_url: str = Field(..., description="URL of the YouTube video.")

disney_world_assistant = Assistant(
    description="You help people plan their Disney World trip by providing tips, tricks, and updates.",
    output_model=DisneyWorldTripTips,
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
        trip_tips.publish_date = publish_date
        trip_tips.video_url = url
        return trip_tips
    except Exception as e:
        logger.error(f"Error processing video {url}: {str(e)}")
        return None

def aggregate_data(trip_tips_list):
    aggregated_data = {}
    for trip_tips in trip_tips_list:
        if trip_tips is None:
            continue
        for field_name, field_value in trip_tips:
            if field_name not in aggregated_data:
                aggregated_data[field_name] = []
            aggregated_data[field_name].append(field_value)
    return aggregated_data

def generate_markdown(aggregated_data):
    markdown_content = "# Disney World Trip Tips\n\n"
    for field_name, field_values in aggregated_data.items():
        markdown_content += f"## {field_name.replace('_', ' ').title()}\n"
        for field_value in field_values:
            markdown_content += f"- {field_value}\n"
        markdown_content += "\n"
    return markdown_content

def main():
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
    print(markdown_content)

if __name__ == "__main__":
    main()