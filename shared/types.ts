// Shared type definitions for Disney Tips Aggregator
// Used by both pipeline scripts and frontend

export const DISNEY_CHANNEL_SOURCES = [
  {
    key: 'AllEars.net',
    displayName: 'AllEars.net',
    channelId: 'UCfzP_CiebRdveD9rRZv5Ndw',
    focus: 'Broad Walt Disney World planning, food, and park updates',
  },
  {
    key: 'DFBGuide',
    displayName: 'DFB Guide',
    channelId: 'UCnpWedLQdHpZqhgTLdB9Yyg',
    focus: 'Disney dining, snack, hotel, and budget planning',
  },
  {
    key: 'PixieDustedMom',
    displayName: 'Pixie Dusted Mom',
    channelId: 'UCnYjpNazZ0ixJCXxH7Z2B7g',
    focus: 'Family-focused Disney parks planning',
  },
  {
    key: 'MillennialOnMainStreet',
    displayName: 'Millennial on Main Street',
    channelId: 'UCe8XA4Z14D0gCg_LO65QaYw',
    focus: 'Parks, hotels, dining, and trip reports',
  },
  {
    key: 'DisneyInDetail',
    displayName: 'Disney In Detail',
    channelId: 'UCMy03Ou7q60HYfbzWvulQHQ',
    focus: 'Disney parks trip planning and onsite reports',
  },
  {
    key: 'TheTimTracker',
    displayName: 'The Tim Tracker',
    channelId: 'UCoocMG5lMACNKgpvqKay2lg',
    focus: 'Orlando parks, resorts, food, and family trip reports',
  },
  {
    key: 'MickeyViews',
    displayName: 'Mickey Views',
    channelId: 'UCRQvSjD0MT-EztE2iRqLQJA',
    focus: 'Disney parks news, construction, and operations analysis',
  },
  {
    key: 'ResortTV1',
    displayName: 'ResortTV1',
    channelId: 'UCAjpFyA7FCRoGOuj5i4kq9g',
    focus: 'In-park Walt Disney World livestreams and ambience',
  },
  {
    key: 'PagingMrMorrow',
    displayName: 'Paging Mr. Morrow',
    channelId: 'UCscn2aSpMrS2U_mf7OF-UwQ',
    focus: 'Walt Disney World parks, resorts, dining, and events',
  },
  {
    key: 'TPMvids',
    displayName: 'TPMvids',
    channelId: 'UCMddDi4iCT8Rz8L0JL-bH7Q',
    focus: 'Disney parks history, ride details, and guest experience context',
  },
  {
    key: 'FreshBaked',
    displayName: 'FreshBaked',
    channelId: 'UCRDgYztYctlZ5Z2dN9CW49w',
    focus: 'Disneyland news, construction, parks, and planning',
  },
  {
    key: 'ProvostParkPass',
    displayName: 'Provost Park Pass',
    channelId: 'UCKvDB_EkpKW4dT7QNAhWRVQ',
    focus: 'Disneyland and Walt Disney World tips, history, and park strategy',
  },
  {
    key: 'JustinScarred',
    displayName: 'JustinScarred',
    channelId: 'UCZ_d0QNVKLOEhEud9Ble6IA',
    focus: 'Disneyland, travel, history, and park-adjacent trip context',
  },
  {
    key: 'EarScouts',
    displayName: 'Ear Scouts',
    channelId: 'UC8Hi16TxWYG8LHn2aP6Ze5w',
    focus: 'Walt Disney World Lightning Lane, dining, and day-planning strategy',
  },
  {
    key: 'MammothClub',
    displayName: 'Mammoth Club',
    channelId: 'UCXGQTkyIfrJJ7ZT1A9MuJ0A',
    focus: 'Disney parks challenges, hotel reviews, food, and planning decisions',
  },
  {
    key: 'WDWPrepSchool',
    displayName: 'WDW Prep School',
    channelId: 'UCB3nESm-zFTOs7d4cX43qqQ',
    focus: 'Walt Disney World planning, timing, cruise, and family logistics',
  },
  {
    key: 'SoCalDisneyDad',
    displayName: 'SoCal Disney Dad',
    channelId: 'UC9NWZzDU9UAoPglcDo-h_NQ',
    focus: 'Disneyland planning from a parent and kid-focused perspective',
  },
] as const;

export type ChannelName = typeof DISNEY_CHANNEL_SOURCES[number]['key'];

export const DISNEY_CHANNELS = Object.fromEntries(
  DISNEY_CHANNEL_SOURCES.map((source) => [source.key, source.channelId])
) as Record<ChannelName, string>;

export const DISNEY_CHANNEL_URLS = Object.fromEntries(
  DISNEY_CHANNEL_SOURCES.map((source) => [
    source.key,
    `https://www.youtube.com/channel/${source.channelId}`,
  ])
) as Record<ChannelName, string>;

export interface Video {
  id: string;
  channelName: ChannelName;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
  transcript?: string;
  /** Number of times transcript fetch was attempted and failed */
  transcriptRetries?: number;
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
  lastChecked: string;
  totalTips: number;
  tips: ExtractedTip[];
  topTips?: string[]; // IDs of curated top tips
}

export interface VideosData {
  lastUpdated: string;
  lastChecked: string;
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
