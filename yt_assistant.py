import logging
from pytube import YouTube
from youtube_transcript_api import YouTubeTranscriptApi
import httpx
import json

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fetch_video_data(url: str):
    try:
        logger.info(f"Processing video: {url}")
        video_id = url.split("v=")[1]
        video = YouTube(url)
        
        # Extract video details
        video_details = {
            "title": video.title,
            "publish_date": video.publish_date.strftime("%B %d, %Y"),
            "url": url
        }
        
        # Try to fetch the transcript
        try:
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
            transcript_text = " ".join([entry["text"] for entry in transcript])
            video_details["transcript"] = transcript_text
        except Exception as e:
            logger.error(f"Could not fetch transcript: {str(e)}")
            video_details["transcript"] = None
        
        return video_details
    except Exception as e:
        logger.error(f"Error processing video {url}: {str(e)}")
        return None

# Example usage
video_url = "https://www.youtube.com/watch?v=2PKCOVqhngY"
video_data = fetch_video_data(video_url)
print(json.dumps(video_data, indent=2))