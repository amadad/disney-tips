import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface Tip {
  text: string;
  category: 'ride' | 'dining' | 'planning' | 'savings' | 'general';
  confidence: number;
  timestamp: string;
  videoTitle: string;
  videoUrl: string;
  channelTitle: string;
}

const categoryColors = {
  ride: "bg-blue-500",
  dining: "bg-green-500",
  planning: "bg-purple-500",
  savings: "bg-yellow-500",
  general: "bg-gray-500",
} as const;

export default function TipCard({ tip }: { tip: Tip }) {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge 
            variant="secondary" 
            className={`${categoryColors[tip.category]} text-white`}
          >
            {tip.category}
          </Badge>
          <Badge variant="outline">
            {new Date(tip.timestamp).toLocaleDateString()}
          </Badge>
        </div>

        <p className="text-sm">{tip.text}</p>

        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            From: {tip.videoTitle}
          </span>
          <a 
            href={tip.videoUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
          >
            Watch <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </Card>
  );
} 