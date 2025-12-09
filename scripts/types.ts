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
  | 'lightning-lane'
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
}

export interface VideosData {
  lastUpdated: string;
  totalVideos: number;
  videos: Video[];
}
