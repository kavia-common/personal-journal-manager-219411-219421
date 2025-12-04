/* eslint-disable no-undef */ // Allow DOM globals in strict linter context: File, FileReader, Event, HTMLInputElement
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

  // Local image state for preview and upload
  selectedImageFile: File | null = null;
  imagePreviewUrl: string | null = null; // data URL preview
  removeExistingImage = false;

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
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0] ? input.files[0] : null;

    if (!file) {
      return;
    }

    // Simple client-side validation for image types
    if (!file.type.startsWith('image/')) {
      this.error = 'Please select a valid image file.';
      return;
    }

    this.error = null;
    this.selectedImageFile = file;
    this.removeExistingImage = false; // we are providing a new image

    // Build preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  // PUBLIC_INTERFACE
  clearSelectedImage() {
    this.selectedImageFile = null;
    this.imagePreviewUrl = null;
    // If currently editing and there is an existing image, mark it for removal
    if (this.isEdit && this.entry.imageUrl) {
      this.removeExistingImage = true;
    }
  }

  /**
   * PUBLIC_INTERFACE
   * Return the absolute URL to display for the current image (existing or preview).
   */
  currentImageDisplayUrl(): string | null {
    if (this.imagePreviewUrl) {
      return this.imagePreviewUrl;
    }
    if (this.entry.imageUrl && !this.removeExistingImage) {
      return this.api.buildImageUrl(this.entry.imageUrl) ?? null;
    }
    return null;
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
      this.api
        .update(
          this.entry.id,
          {
            title: this.entry.title,
            content: this.entry.content
          },
          { imageFile: this.selectedImageFile, removeImage: this.removeExistingImage }
        )
        .subscribe({
          next: () => this.router.navigate(['/entries']),
          error: (err) => {
            this.error = err?.message || 'Failed to save entry';
            this.saving = false;
          }
        });
    } else {
      this.api
        .create(
          {
            title: this.entry.title,
            content: this.entry.content
          },
          this.selectedImageFile
        )
        .subscribe({
          next: () => this.router.navigate(['/entries']),
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
