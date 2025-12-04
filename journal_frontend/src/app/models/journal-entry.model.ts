export interface JournalEntry {
  id?: number;
  title: string;
  content: string;
  created_at?: string; // ISO date string from backend
  updated_at?: string; // ISO date string from backend
}
