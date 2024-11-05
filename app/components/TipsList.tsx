// Assuming this is where your tips mapping happens
interface Tip {
  text: string;
  timestamp: string;
  videoTitle: string;
  videoUrl: string;
  channelTitle: string;
}

interface ChannelGroup {
  channel: string;
  channelTitle: string;
  tips: Tip[];
}

export default function TipsList({ 
  tips, 
  searchQuery = '', 
  selectedChannel = '' 
}: { 
  tips: ChannelGroup[];
  searchQuery?: string;
  selectedChannel?: string;
}) {
  // Add null check and default to empty array
  if (!tips || !Array.isArray(tips)) return null;

  const filteredTips = tips.map((channelGroup) => ({
    ...channelGroup,
    tips: channelGroup.tips.filter((tip) => 
      tip.text.toLowerCase().includes(searchQuery.toLowerCase()) && 
      (!selectedChannel || channelGroup.channel === selectedChannel)
    )
  })).filter(group => group.tips.length > 0);

  if (filteredTips.length === 0) {
    return <div>No tips found</div>;
  }

  return (
    <div>
      {filteredTips.map((channelGroup) => (
        <div key={channelGroup.channel}>
          {/* Your existing rendering logic */}
        </div>
      ))}
    </div>
  );
} 