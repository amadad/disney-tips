"use client";

import { useEffect, useState, useMemo } from "react";
import { Compass, Youtube, Clock, Search, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import TipCard from "@/components/TipCard";

interface Tip {
  text: string;
  category: 'ride' | 'dining' | 'planning' | 'savings' | 'general';
  confidence: number;
  timestamp: string;
  videoTitle: string;
  videoUrl: string;
  channelTitle: string;
}

interface ChannelTips {
  channelName: string;
  channelTitle: string;
  videoSummary: string;
  tips: Tip[];
  keyTakeaways: string[];
}

const CATEGORIES = ['all', 'ride', 'dining', 'planning', 'savings', 'general'] as const;

export default function Home() {
  const [tips, setTips] = useState<ChannelTips[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>('all');

  useEffect(() => {
    fetchTips();
  }, []);

  async function fetchTips() {
    setLoading(true);
    try {
      const response = await fetch("/api/tips");
      const data = await response.json();
      console.log('Raw API Data:', data);
      
      if (!Array.isArray(data)) {
        console.error('Expected array, got:', typeof data);
        setTips([]);
        return;
      }

      setTips(data);
    } catch (error) {
      console.error("Failed to fetch tips:", error);
      setTips([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredTips = useMemo(() => {
    if (!Array.isArray(tips)) return [];
    
    return tips
      .map(channelGroup => ({
        ...channelGroup,
        tips: channelGroup.tips.filter(tip => 
          tip.text.toLowerCase().includes(searchQuery.toLowerCase()) &&
          (!selectedChannel || channelGroup.channelName === selectedChannel) &&
          (selectedCategory === 'all' || tip.category === selectedCategory) &&
          tip.confidence > 0.5 // Only show high-confidence tips
        )
      }))
      .filter(channelGroup => channelGroup.tips.length > 0);
  }, [tips, searchQuery, selectedChannel, selectedCategory]);

  console.log('Filtered Tips:', filteredTips);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            Disney World Tips Tracker
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover the latest Disney World tips and tricks from your favorite YouTube creators
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-[250px_1fr]">
          <aside className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tips..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categories
              </h2>
              <div className="space-y-2">
                {CATEGORIES.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "secondary" : "ghost"}
                    className="w-full justify-start capitalize"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Compass className="h-4 w-4" />
                Channels
              </h2>
              <div className="space-y-2">
                <Button
                  variant={selectedChannel === null ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedChannel(null)}
                >
                  All Channels
                </Button>
                {tips.map((channelGroup) => (
                  <Button
                    key={channelGroup.channelName}
                    variant={selectedChannel === channelGroup.channelName ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedChannel(channelGroup.channelName)}
                  >
                    {channelGroup.channelTitle}
                  </Button>
                ))}
              </div>
            </Card>
          </aside>

          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="space-y-6">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={`skeleton-group-${i}`} className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <div className="grid gap-4 md:grid-cols-2">
                      {Array.from({ length: 2 }).map((_, j) => (
                        <Skeleton key={`skeleton-item-${i}-${j}`} className="h-48" />
                      ))}
                    </div>
                  </div>
                ))
              ) : filteredTips.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No tips found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : (
                filteredTips.map((channelGroup) => (
                  <div key={channelGroup.channelName} className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
                        <Youtube className="h-5 w-5" />
                        {channelGroup.channelTitle}
                      </h2>
                      <p className="text-muted-foreground mb-4">{channelGroup.videoSummary}</p>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      {channelGroup.tips.map((tip, index) => (
                        <TipCard 
                          key={`${channelGroup.channelName}-${tip.timestamp}-${index}`} 
                          tip={tip} 
                        />
                      ))}
                    </div>

                    <div className="mt-4">
                      <h3 className="font-semibold mb-2">Key Takeaways:</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {channelGroup.keyTakeaways.map((takeaway, index) => (
                          <li 
                            key={`${channelGroup.channelName}-takeaway-${index}`} 
                            className="text-muted-foreground"
                          >
                            {takeaway}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </main>
  );
}