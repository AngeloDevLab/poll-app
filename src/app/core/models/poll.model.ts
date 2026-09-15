export const POLL_CATEGORIES = [
  'Team Activities',
  'Health & Wellness',
  'Gaming & Entertainment',
  'Education & Learning',
  'Lifestyle & Preferences',
  'Technology & Innovation',
] as const;

export type PollCategory = (typeof POLL_CATEGORIES)[number];

export interface Poll {
  id: string;
  title: string;
  description?: string;
  category: PollCategory;
  deadline?: Date;
  createdAt: Date;
}

export interface PollOption {
  id: string;
  pollId: string;
  text: string;
  sortOrder: number;
}

export interface PollResult {
  pollOptionId: string;
  pollId: string;
  text: string;
  voteCount: number;
}
