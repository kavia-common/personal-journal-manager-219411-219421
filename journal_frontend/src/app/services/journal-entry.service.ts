/* eslint-disable no-undef */ // Allow DOM globals in strict linter context: File, FormData
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { JournalEntry } from '../models/journal-entry.model';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// PUBLIC_INTERFACE
@Injectable({
  providedIn: 'root'
})
export class JournalEntryService {
  /** HttpClient injected using Angular v16+ inject() API */
  private http = inject(HttpClient);
  /** Base API URL from environment */
  private baseUrl = `${environment.apiBaseUrl}/api/journal-entries`;

  /**
   * PUBLIC_INTERFACE
   * Return a full image URL (absolute) for a possibly relative image path provided by backend.
   * If the url is already absolute (starts with http), it is returned unchanged.
   */
  buildImageUrl(url?: string | null): string | undefined {
    if (!url) return undefined;
    if (/^https?:\/\//i.test(url)) return url;
    // Ensure single slash joining
    const base = environment.apiBaseUrl.replace(/\/+$/, '');
    const path = String(url).replace(/^\/+/, '');
    return `${base}/${path}`;
  }

  /**
   * PUBLIC_INTERFACE
   * Fetch all journal entries with optional title and/or date range filters.
   * Any of the filters can be omitted. Pagination params can be added by caller via options.
   */
  getAll(options?: {
    title?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    extraParams?: Record<string, string | number | boolean | undefined | null>;
  }): Observable<JournalEntry[]> {
    let params = new HttpParams();
    const title = options?.title?.trim();
    const start = options?.startDate?.trim();
    const end = options?.endDate?.trim();
    if (title) params = params.set('title', title);
    if (start) params = params.set('start_date', start);
    if (end) params = params.set('end_date', end);
    if (options?.extraParams) {
      Object.entries(options.extraParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params = params.set(k, String(v));
      });
    }
    return this.http.get<JournalEntry[]>(this.baseUrl, { params }).pipe(catchError(this.handleError));
  }

  /**
   * PUBLIC_INTERFACE
   * Fetch entries by date range (inclusive). Provide ISO date strings (YYYY-MM-DD).
   */
  getByDateRange(startDate: string, endDate: string, title?: string | null): Observable<JournalEntry[]> {
    let params = new HttpParams().set('start_date', startDate).set('end_date', endDate);
    if (title && title.trim()) params = params.set('title', title.trim());
    return this.http.get<JournalEntry[]>(this.baseUrl, { params }).pipe(catchError(this.handleError));
  }

  /**
   * PUBLIC_INTERFACE
   * Fetch entries for a specific date (YYYY-MM-DD), using date-range under the hood.
   */
  getByDate(dateStr: string): Observable<JournalEntry[]> {
    return this.getByDateRange(dateStr, dateStr);
  }

  /**
   * PUBLIC_INTERFACE
   * Fetch only the list of dates that have entries within the range.
   */
  getDatesWithEntries(startDate: string, endDate: string): Observable<{ dates: string[] }> {
    const params = new HttpParams().set('start_date', startDate).set('end_date', endDate);
    return this.http.get<{ dates: string[] }>(`${this.baseUrl}/dates`, { params }).pipe(catchError(this.handleError));
  }

  /**
   * PUBLIC_INTERFACE
   * Fetch a single journal entry by ID.
   */
  getById(id: number): Observable<JournalEntry> {
    return this.http.get<JournalEntry>(`${this.baseUrl}/${id}`).pipe(catchError(this.handleError));
  }

  /**
   * PUBLIC_INTERFACE
   * Create a new journal entry.
   * If imageFile is provided, uses multipart/form-data. Otherwise, sends JSON.
   */
  create(
    entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at' | 'imageUrl'>,
    imageFile?: File | null
  ): Observable<JournalEntry> {
    if (imageFile) {
      const form = new FormData();
      form.append('title', entry.title);
      form.append('content', entry.content);
      form.append('image', imageFile);
      return this.http.post<JournalEntry>(this.baseUrl, form).pipe(catchError(this.handleError));
    }
    return this.http.post<JournalEntry>(this.baseUrl, entry).pipe(catchError(this.handleError));
  }

  /**
   * PUBLIC_INTERFACE
   * Update an existing journal entry by ID.
   * Supports multipart when a new image file is provided. If removeImage is true, indicates removal.
   */
  update(
    id: number,
    entry: Partial<Pick<JournalEntry, 'title' | 'content'>>,
    options?: { imageFile?: File | null; removeImage?: boolean }
  ): Observable<JournalEntry> {
    const imageFile = options?.imageFile ?? null;
    const removeImage = options?.removeImage ?? false;

    if (imageFile || removeImage) {
      const form = new FormData();
      if (entry.title != null) form.append('title', entry.title);
      if (entry.content != null) form.append('content', entry.content);
      if (imageFile) {
        form.append('image', imageFile);
      } else if (removeImage) {
        form.append('image_remove', 'true');
      }
      return this.http.put<JournalEntry>(`${this.baseUrl}/${id}`, form).pipe(catchError(this.handleError));
    }

    return this.http.put<JournalEntry>(`${this.baseUrl}/${id}`, entry).pipe(catchError(this.handleError));
  }

  /**
   * PUBLIC_INTERFACE
   * Delete a journal entry by ID.
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(catchError(this.handleError));
  }

  /**
   * Handle HTTP errors from backend.
   */
  private handleError(err: HttpErrorResponse) {
    console.error('API error:', err);
    return throwError(() => err);
  }
}
