"use client";

import { useEffect, useState, useMemo } from "react";
import { DISNEY_CHANNELS } from '@/lib/constants';
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/VideoCard";
import { Tag } from 'lucide-react';
import { Input } from "@/components/ui/input";

type VideoType = {
  id: string;
  channelName: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
  url: string;
};

const CATEGORIES = [
  'All',
  'Parks',
  'Hotels',
  'Food',
  'Money Saving',
  'Planning',
  'News'
] as const;

export default function Home() {
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    fetchVideos();
  }, []);

  async function fetchVideos() {
    try {
      setLoading(true);
      const response = await fetch("/api/tips");
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setVideos(data);
      } else {
        console.error('Expected array of videos, got:', typeof data);
        setVideos([]);
      }
    } catch (error) {
      console.error("Failed to fetch videos:", error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const matchesSearch = !searchQuery || 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        video.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesChannel = !selectedChannel || video.channelName === selectedChannel;
      const matchesCategory = selectedCategory === 'All' || 
        video.title.toLowerCase().includes(selectedCategory.toLowerCase());
      return matchesSearch && matchesChannel && matchesCategory;
    });
  }, [videos, searchQuery, selectedChannel, selectedCategory]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="flex justify-center mb-20">
          <h1 className="text-4xl font-bold text-[#4a62d8]">
            Disney Trip Tips
          </h1>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-12">
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 px-4 rounded-lg border border-gray-200 text-lg text-gray-500 focus:outline-none focus:border-[#4a62d8] focus:ring-0"
          />
        </div>

        {/* Category Tags */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`inline-flex items-center px-6 py-2 rounded-full text-base transition-colors ${
                selectedCategory === category
                  ? 'bg-[#4a62d8] text-white'
                  : 'bg-[#F5F7FF] text-[#4a62d8] hover:bg-[#4a62d8]/10'
              }`}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {category}
            </button>
          ))}
        </div>

        {/* Channel Selection */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            className={`px-6 py-3 rounded-lg transition-colors ${
              selectedChannel === null 
                ? 'bg-[#4a62d8] text-white' 
                : 'bg-[#F5F7FF] text-[#4a62d8] hover:bg-[#4a62d8]/10'
            }`}
            onClick={() => setSelectedChannel(null)}
          >
            All Channels
          </button>
          {Object.keys(DISNEY_CHANNELS).map(channel => (
            <button
              key={channel}
              className={`px-6 py-3 rounded-lg transition-colors ${
                selectedChannel === channel 
                  ? 'bg-[#4a62d8] text-white' 
                  : 'bg-[#F5F7FF] text-[#4a62d8] hover:bg-[#4a62d8]/10'
              }`}
              onClick={() => setSelectedChannel(channel)}
            >
              {channel}
            </button>
          ))}
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="aspect-video bg-[#76d0c0]/20 rounded-lg" />
                <div className="h-4 bg-[#76d0c0]/20 rounded w-3/4" />
                <div className="h-4 bg-[#76d0c0]/20 rounded w-1/2" />
              </div>
            ))
          ) : filteredVideos.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No videos found matching your criteria</p>
            </div>
          ) : (
            filteredVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}