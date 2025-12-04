export interface JournalEntry {
  id?: number;
  title: string;
  content: string;
  /**
   * Optional URL (relative path from backend) to the entry's image.
   * When present, the UI will display a thumbnail and the editor will show the image.
   */
  imageUrl?: string;
  created_at?: string; // ISO date string from backend
  updated_at?: string; // ISO date string from backend
}
