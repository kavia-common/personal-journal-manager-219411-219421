import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JournalEntryService } from '../../services/journal-entry.service';
import { JournalListComponent } from '../journal-list/journal-list.component';
import { JournalEntry } from '../../models/journal-entry.model';

/**
 * PUBLIC_INTERFACE
 * CalendarViewComponent shows a month grid with highlighted days that have entries.
 * Clicking a day loads and displays that day's entries inline.
 */
@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './calendar-view.component.html',
  styleUrl: './calendar-view.component.css'
})
export class CalendarViewComponent implements OnInit {
  private api = inject(JournalEntryService);

  // Current month being viewed as a Date (first day of month at noon to avoid DST edge cases)
  currentMonth = signal(this.startOfMonth(new Date()));

  // Dates to highlight (string YYYY-MM-DD for quick lookup)
  highlightedDates = signal<Set<string>>(new Set());

  // Selected date entries
  loading = signal(false);
  error = signal<string | null>(null);
  selectedDate = signal<string | null>(null);
  dayEntries = signal<JournalEntry[]>([]);

  monthLabel = computed(() => {
    const d = this.currentMonth();
    return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(d);
  });

  // Build a 6x7 grid of dates for the calendar view
  weeks = computed(() => {
    const start = this.startOfWeek(this.startOfMonth(this.currentMonth()));
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    const rows: Date[][] = [];
    for (let r = 0; r < 6; r++) {
      rows.push(days.slice(r * 7, r * 7 + 7));
    }
    return rows;
  });

  ngOnInit(): void {
    this.loadMonthHighlights();
  }

  private startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1, 12);
  }
  private endOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 12);
  }
  private startOfWeek(d: Date): Date {
    const day = d.getDay(); // 0 Sun .. 6 Sat
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    return start;
  }

  private toISODate(d: Date): string {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // PUBLIC_INTERFACE
  prevMonth() {
    const d = this.currentMonth();
    this.currentMonth.set(new Date(d.getFullYear(), d.getMonth() - 1, 1, 12));
    this.selectedDate.set(null);
    this.dayEntries.set([]);
    this.loadMonthHighlights();
  }

  // PUBLIC_INTERFACE
  nextMonth() {
    const d = this.currentMonth();
    this.currentMonth.set(new Date(d.getFullYear(), d.getMonth() + 1, 1, 12));
    this.selectedDate.set(null);
    this.dayEntries.set([]);
    this.loadMonthHighlights();
  }

  private loadMonthHighlights() {
    const start = this.toISODate(this.startOfMonth(this.currentMonth()));
    const end = this.toISODate(this.endOfMonth(this.currentMonth()));
    this.api.getDatesWithEntries(start, end).subscribe({
      next: (resp) => {
        this.highlightedDates.set(new Set(resp.dates));
      },
      error: (err) => {
        console.error(err);
        this.highlightedDates.set(new Set());
      }
    });
  }

  // PUBLIC_INTERFACE
  selectDate(d: Date) {
    const iso = this.toISODate(d);
    this.selectedDate.set(iso);
    this.loading.set(true);
    this.error.set(null);
    this.api.getByDate(iso).subscribe({
      next: (entries) => {
        // sort by updated_at desc
        this.dayEntries.set(
          [...entries].sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
        );
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to load entries');
        this.loading.set(false);
      }
    });
  }

  isCurrentMonth(d: Date): boolean {
    const cm = this.currentMonth();
    return d.getMonth() === cm.getMonth() && d.getFullYear() === cm.getFullYear();
  }

  hasEntries(d: Date): boolean {
    return this.highlightedDates().has(this.toISODate(d));
  }
}
