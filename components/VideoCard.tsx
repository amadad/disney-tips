import { Youtube } from "lucide-react";

interface VideoCardProps {
  video: {
    id: string;
    channelName: string;
    title: string;
    description: string;
    publishedAt: string;
    thumbnail: string;
    url: string;
  };
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="group">
      <div className="aspect-video rounded-lg overflow-hidden relative">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="mt-3 space-y-2">
        <h3 className="font-bold text-gray-900 group-hover:text-[#4a62d8] transition-colors">
          {video.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2">
          {video.description}
        </p>
        <div className="flex justify-between items-center pt-2">
          <time className="text-sm text-[#746bab]">
            {new Date(video.publishedAt).toLocaleDateString()}
          </time>
          <a 
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#1ab28a] hover:text-[#76d0c0] transition-colors"
          >
            Watch
          </a>
        </div>
      </div>
    </div>
  );
} 