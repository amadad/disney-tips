// Shared types for frontend - mirrors scripts/types.ts
// Keep in sync with scripts/types.ts

export type TipCategory =
  | 'parks'
  | 'dining'
  | 'hotels'
  | 'budget'
  | 'planning'
  | 'transportation';

export type Park =
  | 'magic-kingdom'
  | 'epcot'
  | 'hollywood-studios'
  | 'animal-kingdom'
  | 'disney-springs'
  | 'water-parks'
  | 'disneyland'
  | 'california-adventure'
  | 'all-parks';

export type Priority = 'high' | 'medium' | 'low';

export type Season =
  | 'year-round'
  | 'christmas'
  | 'halloween'
  | 'flower-garden'
  | 'food-wine'
  | 'festival-arts'
  | 'summer';

export interface Tip {
  id: string;
  text: string;
  category: TipCategory;
  park: Park;
  tags: string[];
  priority: Priority;
  season: Season;
  source: {
    videoId: string;
    channelName: string;
    videoTitle: string;
    publishedAt: string;
  };
  extractedAt?: string;
}

export interface TipsData {
  lastUpdated: string;
  totalTips: number;
  tips: Tip[];
}
