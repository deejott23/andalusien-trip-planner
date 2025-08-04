
export enum EntryTypeEnum {
  LINK = 'LINK',
  NOTE = 'NOTE',
  DAY_SEPARATOR = 'DAY_SEPARATOR',
}

export interface Attachment {
  url: string; // data URL
  name: string;
  mimeType: string;
}

export interface Reactions {
  likes: number;
  dislikes: number;
  userReaction: 'like' | 'dislike' | null;
}

export interface LinkEntry {
  id: string;
  type: EntryTypeEnum.LINK;
  url:string;
  title: string;
  description?: string;
  imageUrl?: string;
  domain: string;
  status: 'loading' | 'loaded' | 'error';
  reactions?: Reactions;
}

export interface NoteEntry {
  id: string;
  type: EntryTypeEnum.NOTE;
  content: string;
  attachment?: Attachment;
  reactions?: Reactions;
}

export interface DaySeparatorEntry {
  id: string;
  type: EntryTypeEnum.DAY_SEPARATOR;
  title: string;
  date: string; // ISO 8601 format: YYYY-MM-DD
}

export type Entry = LinkEntry | NoteEntry | DaySeparatorEntry;

export interface Day {
  id: string;
  title: string;
  duration: number; // in nights/days
  color: string; // hex or tailwind color class
  entries: Entry[];
}

export interface Trip {
  id: string;
  title: string;
  dateRange: string;
  startDate: string; // ISO 8601 format: YYYY-MM-DD
  endDate: string;   // ISO 8601 format: YYYY-MM-DD
  days: Day[];
}