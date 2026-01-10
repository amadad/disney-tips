// Shared type definitions for Disney Tips Aggregator
// Used by both pipeline scripts and frontend

export const DISNEY_CHANNELS = {
  'AllEars.net': 'UCfzP_CiebRdveD9rRZv5Ndw',
  'DFBGuide': 'UCnpWedLQdHpZqhgTLdB9Yyg',
  'PixieDustedMom': 'UCnYjpNazZ0ixJCXxH7Z2B7g',
  'MillennialOnMainStreet': 'UCe8XA4Z14D0gCg_LO65QaYw',
  'DisneyInDetail': 'UCMy03Ou7q60HYfbzWvulQHQ',
  'TheTimTracker': 'UCoocMG5lMACNKgpvqKay2lg',
  'MickeyViews': 'UCRQvSjD0MT-EztE2iRqLQJA',
  'ResortTV1': 'UCAjpFyA7FCRoGOuj5i4kq9g',
  'PagingMrMorrow': 'UCscn2aSpMrS2U_mf7OF-UwQ',
  'TPMvids': 'UCMddDi4iCT8Rz8L0JL-bH7Q'
} as const;

export type ChannelName = keyof typeof DISNEY_CHANNELS;

export interface Video {
  id: string;
  channelName: ChannelName;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
  transcript?: string;
}

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

// Alias for frontend compatibility
export type Tip = ExtractedTip;

export interface ExtractedTip {
  id: string;
  text: string;
  category: TipCategory;
  park: Park;
  tags: string[];
  priority: Priority;
  season: Season;
  source: {
    videoId: string;
    channelName: ChannelName;
    videoTitle: string;
    publishedAt: string;
  };
  extractedAt: string;
}

export interface TipsData {
  lastUpdated: string;
  totalTips: number;
  tips: ExtractedTip[];
  topTips?: string[]; // IDs of curated top tips
}

export interface VideosData {
  lastUpdated: string;
  totalVideos: number;
  videos: Video[];
}

// Constants for UI
export const PARK_LABELS: Record<Park, string> = {
  'magic-kingdom': 'Magic Kingdom',
  'epcot': 'EPCOT',
  'hollywood-studios': 'Hollywood Studios',
  'animal-kingdom': 'Animal Kingdom',
  'disney-springs': 'Disney Springs',
  'water-parks': 'Water Parks',
  'disneyland': 'Disneyland',
  'california-adventure': 'California Adventure',
  'all-parks': 'All Parks',
};

export const CATEGORY_LABELS: Record<TipCategory, string> = {
  'parks': 'Parks',
  'dining': 'Dining',
  'hotels': 'Hotels',
  'budget': 'Budget',
  'planning': 'Planning',
  'transportation': 'Transport',
};

export const PRIORITY_ICONS: Record<Priority, string> = {
  'high': '🔥',
  'medium': '⭐',
  'low': '💡',
};

export const SEASON_LABELS: Record<Season, string> = {
  'year-round': '📅 Year Round',
  'christmas': '🎄 Christmas',
  'halloween': '🎃 Halloween',
  'flower-garden': '🌸 Flower & Garden',
  'food-wine': '🍷 Food & Wine',
  'festival-arts': '🎨 Festival of Arts',
  'summer': '☀️ Summer',
};
