import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
   * Fetch all journal entries.
   */
  getAll(): Observable<JournalEntry[]> {
    return this.http.get<JournalEntry[]>(this.baseUrl).pipe(catchError(this.handleError));
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
   */
  create(entry: Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>): Observable<JournalEntry> {
    return this.http.post<JournalEntry>(this.baseUrl, entry).pipe(catchError(this.handleError));
  }

  /**
   * PUBLIC_INTERFACE
   * Update an existing journal entry by ID.
   */
  update(id: number, entry: Partial<JournalEntry>): Observable<JournalEntry> {
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
