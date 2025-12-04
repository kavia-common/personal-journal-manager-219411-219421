import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface JournalEntry {
  id: number;
  title: string;
  content: string;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryCreate {
  title: string;
  content?: string;
}

export interface JournalEntryUpdate {
  title?: string;
  content?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JournalEntryService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // PUBLIC_INTERFACE
  public list(params?: { start_date?: string; end_date?: string; title?: string }): Observable<JournalEntry[]> {
    /** List journal entries with optional filters. */
    let httpParams = new HttpParams();
    if (params?.start_date) httpParams = httpParams.set('start_date', params.start_date);
    if (params?.end_date) httpParams = httpParams.set('end_date', params.end_date);
    if (params?.title) httpParams = httpParams.set('title', params.title);
    return this.http.get<JournalEntry[]>(`${this.baseUrl}/api/journal-entries`, { params: httpParams });
  }

  // PUBLIC_INTERFACE
  public get(id: number): Observable<JournalEntry> {
    /** Fetch a single journal entry by id. */
    return this.http.get<JournalEntry>(`${this.baseUrl}/api/journal-entries/${id}`);
  }

  // PUBLIC_INTERFACE
  public create(data: JournalEntryCreate, file?: File): Observable<JournalEntry> {
    /** Create an entry; send JSON when no file, multipart when file present. */
    if (!file) {
      return this.http.post<JournalEntry>(`${this.baseUrl}/api/journal-entries`, data);
    }
    const form = new FormData();
    form.append('title', data.title);
    form.append('content', (data.content ?? '').toString());
    form.append('image', file);
    return this.http.post<JournalEntry>(`${this.baseUrl}/api/journal-entries`, form);
    }

  // PUBLIC_INTERFACE
  public update(id: number, data: JournalEntryUpdate, file?: File, imageRemove?: boolean): Observable<JournalEntry> {
    /**
     * Update an entry:
     * - If file provided or imageRemove is true, send multipart/form-data.
     * - Otherwise send application/json with partial fields.
     */
    if (file || imageRemove) {
      const form = new FormData();
      if (data.title !== undefined) form.append('title', data.title);
      if (data.content !== undefined) form.append('content', data.content ?? '');
      if (file) form.append('image', file);
      if (imageRemove) form.append('image_remove', 'true');
      return this.http.put<JournalEntry>(`${this.baseUrl}/api/journal-entries/${id}`, form);
    } else {
      return this.http.put<JournalEntry>(`${this.baseUrl}/api/journal-entries/${id}`, data, {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      });
    }
  }

  // PUBLIC_INTERFACE
  public delete(id: number): Observable<void> {
    /** Delete an entry by id. */
    return this.http.delete<void>(`${this.baseUrl}/api/journal-entries/${id}`);
  }
}
