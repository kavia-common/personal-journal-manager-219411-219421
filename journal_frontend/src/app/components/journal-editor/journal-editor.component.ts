import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { JournalEntryService } from '../../services/journal-entry.service';
import { JournalEntry } from '../../models/journal-entry.model';

@Component({
  selector: 'app-journal-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './journal-editor.component.html',
  styleUrl: './journal-editor.component.css'
})
export class JournalEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(JournalEntryService);

  loading = false;
  saving = false;
  error: string | null = null;

  entry: JournalEntry = {
    title: '',
    content: ''
  };

  isEdit = false;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!Number.isNaN(id)) {
        this.isEdit = true;
        this.fetch(id);
      }
    }
  }

  private fetch(id: number) {
    this.loading = true;
    this.api.getById(id).subscribe({
      next: (e) => {
        this.entry = e;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load entry';
        this.loading = false;
      }
    });
  }

  // PUBLIC_INTERFACE
  save() {
    if (!this.entry.title.trim() || !this.entry.content.trim()) {
      this.error = 'Please provide both title and content.';
      return;
    }

    this.error = null;
    this.saving = true;

    if (this.isEdit && this.entry.id) {
      this.api.update(this.entry.id, {
        title: this.entry.title,
        content: this.entry.content
      }).subscribe({
        next: (e) => this.router.navigate(['/entries']),
        error: (err) => {
          this.error = err?.message || 'Failed to save entry';
          this.saving = false;
        }
      });
    } else {
      this.api.create({
        title: this.entry.title,
        content: this.entry.content
      }).subscribe({
        next: (e) => this.router.navigate(['/entries']),
        error: (err) => {
          this.error = err?.message || 'Failed to create entry';
          this.saving = false;
        }
      });
    }
  }

  // PUBLIC_INTERFACE
  cancel() {
    this.router.navigate(['/entries']);
  }
}
