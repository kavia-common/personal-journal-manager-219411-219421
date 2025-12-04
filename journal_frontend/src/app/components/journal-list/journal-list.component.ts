import { Component, OnInit } from '@angular/core';
import { JournalEntry, JournalEntryService } from '../../services/journal-entry.service';

@Component({
  selector: 'app-journal-list',
  templateUrl: './journal-list.component.html',
  styleUrls: ['./journal-list.component.css']
})
export class JournalListComponent implements OnInit {
  entries: JournalEntry[] = [];
  loading = false;
  error?: string;

  editId?: number;
  showEditor = false;

  constructor(private service: JournalEntryService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.error = undefined;
    this.service.list().subscribe({
      next: (data) => this.entries = data,
      error: () => this.error = 'Failed to load entries',
      complete: () => this.loading = false
    });
  }

  onCreate(): void {
    this.editId = undefined;
    this.showEditor = true;
  }

  onEdit(entry: JournalEntry): void {
    this.editId = entry.id;
    this.showEditor = true;
  }

  onDelete(entry: JournalEntry): void {
    const confirmed = window.confirm('Are you sure you want to delete this entry?');
    if (!confirmed) return;
    this.service.delete(entry.id).subscribe({
      next: () => this.refresh(),
      error: () => this.error = 'Failed to delete entry'
    });
  }

  onSaved(): void {
    this.showEditor = false;
    this.refresh();
  }

  onCancelled(): void {
    this.showEditor = false;
  }
}
