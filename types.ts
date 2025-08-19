
export enum EntryTypeEnum {
  INFO = 'INFO',
  NOTE = 'NOTE',
  DAY_SEPARATOR = 'DAY_SEPARATOR',
  SEPARATOR = 'SEPARATOR',
}

export enum CategoryEnum {
  INFORMATION = 'INFORMATION',
  ROUTE = 'ROUTE',
  AUSFLUG = 'AUSFLUG',
  ESSEN = 'ESSEN',
  UEBERNACHTEN = 'UEBERNACHTEN',
  FRAGE = 'FRAGE',
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

export interface InfoEntry {
  id: string;
  type: EntryTypeEnum.INFO;
  title: string;
  content: string;
  contentUrl?: string;
  url?: string;
  category: CategoryEnum;
  imageUrl?: string;
  attachment?: Attachment;
  reactions?: Reactions;
  status?: 'loading' | 'loaded' | 'error';
  description?: string;
  domain?: string;
}

export interface NoteEntry {
  id: string;
  type: EntryTypeEnum.NOTE;
  title?: string;
  content: string;
  contentUrl?: string;
  url?: string;
  category: CategoryEnum;
  imageUrl?: string;
  attachment?: Attachment;
  reactions?: Reactions;
}

export interface DaySeparatorEntry {
  id: string;
  type: EntryTypeEnum.DAY_SEPARATOR;
  title: string;
  date: string; // ISO 8601 format: YYYY-MM-DD
}

export interface SeparatorEntry {
  id: string;
  type: EntryTypeEnum.SEPARATOR;
  title?: string;
  style: 'line' | 'section' | 'divider';
}

export type Entry = InfoEntry | NoteEntry | DaySeparatorEntry | SeparatorEntry;

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