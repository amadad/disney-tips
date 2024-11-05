"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock } from "lucide-react";

interface TipCardProps {
  tip: {
    text: string;
    timestamp: string;
    videoTitle: string;
    videoUrl: string;
  };
}

// Add date validation
const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString()
  } catch {
    return new Date().toLocaleDateString() // Fallback to current date
  }
}

export default function TipCard({ tip }: TipCardProps) {
  const formattedTime = formatDate(tip.timestamp);

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <h3 className="font-semibold mb-2 line-clamp-2">{tip.videoTitle}</h3>
      <p className="text-muted-foreground mb-4 line-clamp-3">{tip.text}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-1" />
          {formattedTime}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(tip.videoUrl, "_blank")}
          className="gap-2"
        >
          Watch
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}