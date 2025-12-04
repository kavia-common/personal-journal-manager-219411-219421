import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JournalEntryService } from '../../services/journal-entry.service';
import { JournalEntry } from '../../models/journal-entry.model';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

// Declare browser global for ESLint in strict configuration
declare const confirm: (message?: string) => boolean;

@Component({
  selector: 'app-journal-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule],
  templateUrl: './journal-list.component.html',
  styleUrl: './journal-list.component.css'
})
export class JournalListComponent implements OnInit {
  // Expose service for template access to buildImageUrl
  api = inject(JournalEntryService);

  loading = false;
  error: string | null = null;
  entries: JournalEntry[] = [];

  // Filters
  titleQuery = '';
  startDate: string | null = null; // YYYY-MM-DD
  endDate: string | null = null;   // YYYY-MM-DD

  private searchInput$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Debounce search/filter changes
    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.load());
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // PUBLIC_INTERFACE
  onFiltersChanged() {
    this.searchInput$.next();
  }

  // PUBLIC_INTERFACE
  clearFilters() {
    this.titleQuery = '';
    this.startDate = null;
    this.endDate = null;
    this.load();
  }

  // PUBLIC_INTERFACE
  load() {
    this.loading = true;
    this.error = null;
    this.api.getAll({
      title: this.titleQuery,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined
    }).subscribe({
      next: (data) => {
        this.entries = data.sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''));
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load entries';
        this.loading = false;
      }
    });
  }

  // PUBLIC_INTERFACE
  delete(entry: JournalEntry) {
    if (!entry.id) return;
    const ok = confirm(`Delete "${entry.title}"? This cannot be undone.`);
    if (!ok) return;

    this.api.delete(entry.id).subscribe({
      next: () => this.load(),
      error: (err) => (this.error = err?.message || 'Failed to delete entry')
    });
  }
}
