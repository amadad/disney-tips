from typing import List
from pydantic import BaseModel, Field
from phi.assistant import Assistant
from youtube_transcript_api import YouTubeTranscriptApi
from pytube import YouTube

class DisneyWorldTripTips(BaseModel):
    park_updates: str = Field(..., description="Recent updates or changes to the Disney World parks.")
    best_time_to_visit: str = Field(..., description="Recommendations for the best time to visit Disney World.")
    must_do_attractions: List[str] = Field(..., description="List of must-do attractions or rides at Disney World.")
    dining_recommendations: List[str] = Field(..., description="Recommendations for dining options at Disney World.")
    premium_tips: str = Field(..., description="Tips and tricks for using Genie+ and Lightning Lanesat Disney World.")
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

# List of YouTube video URLs
video_urls = [
    "https://www.youtube.com/watch?v=dBGk6V5AVhg",
    "https://www.youtube.com/watch?v=S8hk9JuER94",
    "https://www.youtube.com/watch?v=QcfLliUn6bA",
    "https://www.youtube.com/watch?v=qVAysC5C4fk",
    "https://www.youtube.com/watch?v=hO2LhHUL_jM",
    "https://www.youtube.com/watch?v=RI_cbYb8jDE",
    "https://www.youtube.com/watch?v=qVGZCCn_X8g",
    "https://www.youtube.com/watch?v=qVGZCCn_X8g",
]

aggregated_data = {}

for url in video_urls:
    print(f"Processing video: {url}")

    # Get the video ID from the YouTube URL
    video_id = url.split("v=")[1]

    # Fetch the transcript
    transcript = YouTubeTranscriptApi.get_transcript(video_id)

    # Convert the transcript to plain text
    transcript_text = " ".join([entry["text"] for entry in transcript])

    # Extract the relevant data using the assistant
    trip_tips = disney_world_assistant.run(transcript_text)

    # Get the publish date of the video using pytube
    video = YouTube(url)
    publish_date = video.publish_date.strftime("%B %d, %Y")

    # Add the publish date and video URL to the trip_tips object
    trip_tips.publish_date = publish_date
    trip_tips.video_url = url

    # Aggregate the data
    for field_name, field_value in trip_tips:
        if field_name not in aggregated_data:
            aggregated_data[field_name] = []
        aggregated_data[field_name].append(f"{field_value} [{len(aggregated_data[field_name]) + 1}]")

# Generate the markdown content
markdown_content = "# Disney World Trip Tips\n\n"

for field_name, field_values in aggregated_data.items():
    markdown_content += f"## {field_name.replace('_', ' ').title()}\n\n"
    for field_value in field_values:
        markdown_content += f"- {field_value}\n"
    markdown_content += "\n"

# Print the markdown content
print(markdown_content)