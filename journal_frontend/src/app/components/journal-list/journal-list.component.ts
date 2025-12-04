import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JournalEntryService } from '../../services/journal-entry.service';
import { JournalEntry } from '../../models/journal-entry.model';

// Declare browser global for ESLint in strict configuration
declare const confirm: (message?: string) => boolean;

@Component({
  selector: 'app-journal-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './journal-list.component.html',
  styleUrl: './journal-list.component.css'
})
export class JournalListComponent implements OnInit {
  private api = inject(JournalEntryService);

  loading = false;
  error: string | null = null;
  entries: JournalEntry[] = [];

  ngOnInit(): void {
    this.load();
  }

  // PUBLIC_INTERFACE
  load() {
    this.loading = true;
    this.error = null;
    this.api.getAll().subscribe({
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
