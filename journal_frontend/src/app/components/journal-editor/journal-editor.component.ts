import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { JournalEntry, JournalEntryService } from '../../services/journal-entry.service';

@Component({
  selector: 'app-journal-editor',
  templateUrl: './journal-editor.component.html',
  styleUrls: ['./journal-editor.component.css']
})
export class JournalEditorComponent implements OnInit {
  @Input() entryId?: number;
  @Output() saved = new EventEmitter<JournalEntry>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  file?: File;
  imagePreviewUrl?: string | null;
  removeImage = false;
  loading = false;
  error?: string;

  constructor(private fb: FormBuilder, private service: JournalEntryService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      content: ['']
    });

    if (this.entryId) {
      this.loading = true;
      this.service.get(this.entryId).subscribe({
        next: (e) => {
          this.form.patchValue({ title: e.title, content: e.content });
          this.imagePreviewUrl = e.image_url ?? null;
        },
        error: (err) => this.error = 'Failed to load entry',
        complete: () => this.loading = false
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.file = input.files[0];
    this.removeImage = false; // replacing, so do not remove
    const reader = new FileReader();
    reader.onload = () => this.imagePreviewUrl = reader.result as string;
    reader.readAsDataURL(this.file);
  }

  onRemoveImage(): void {
    this.file = undefined;
    this.removeImage = true;
    this.imagePreviewUrl = null;
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = {
      title: this.form.value.title as string,
      content: (this.form.value.content ?? '') as string
    };
    this.loading = true;
    this.error = undefined;

    if (!this.entryId) {
      this.service.create(payload, this.file).subscribe({
        next: (res) => this.saved.emit(res),
        error: () => this.error = 'Failed to create entry',
        complete: () => this.loading = false
      });
    } else {
      const updatePayload: { title?: string; content?: string } = {};
      updatePayload.title = payload.title;
      updatePayload.content = payload.content;
      this.service.update(this.entryId, updatePayload, this.file, this.removeImage).subscribe({
        next: (res) => this.saved.emit(res),
        error: () => this.error = 'Failed to update entry',
        complete: () => this.loading = false
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
