import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvitationService } from '../../core/services/invitation-service';
import { compressImage } from '../../core/utils/image-compressor';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-invitation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ConfirmDialog],
  templateUrl: './invitation-form.html',
  styleUrls: ['./invitation-form.scss']
})
export class InvitationForm implements OnInit {
  fb = inject(FormBuilder);
  invService = inject(InvitationService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  isEdit = false;
  currentSlug = '';

  // States Loading
  isLoading = false;      // Untuk proses Submit ke Server
  loadingText = '';       // Teks dinamis (Menyimpan / Uploading)
  isCompressing = false;  // Untuk proses Kompresi Client-side

  // State Foto
  existingGallery: any[] = []; // Foto dari DB { id: string, filename: string }
  newFiles: File[] = [];       // Foto baru (Client side)

  // State Modal
  showSizeWarning = false;
  showDeleteConfirm = false;
  photoIdToDelete: string | null = null; // Update: UUID String

  form = this.fb.group({
    slug: ['', Validators.required],
    theme: ['netflix', Validators.required],
    couple_name: ['', Validators.required],
    groom_name: [''],
    bride_name: [''],
  });

  ngOnInit() {
    this.currentSlug = this.route.snapshot.paramMap.get('slug') || '';
    if (this.currentSlug) {
      this.isEdit = true;
      this.form.get('slug')?.disable();
      this.loadData();
    }
  }

  loadData() {
    this.isLoading = true;
    this.loadingText = 'Memuat data...';

    this.invService.getOne(this.currentSlug).subscribe({
      next: (res: any) => {
        // Backend Go return JSON keys lowercase (sesuai struct json tags)
        const data = res.output_schema;

        this.form.patchValue(data);

        // Mapping Gallery
        if (data.gallery && Array.isArray(data.gallery)) {
          this.existingGallery = data.gallery;
        }
        this.isLoading = false;
      },
      error: () => {
        alert('Gagal mengambil data.');
        this.router.navigate(['/dashboard']);
      }
    });
  }

  // --- 1. Logic Upload & Kompresi + Animation ---
  async onFileSelect(event: any) {
    console.log(event);
    if (event.target.files && event.target.files[0].size > 2000000) {
      this.showSizeWarning = true; // Modal Error
      return;
    } else if (event.target.files && event.target.files.length > 0) {
      this.isCompressing = true; // Mulai animasi loading
      const rawFiles = Array.from(event.target.files) as File[];

      for (const file of rawFiles) {
        try {
          // Kompresi (Max 2MB)
          const compressed = await compressImage(file, 2);
          this.newFiles.push(compressed);
        } catch (error: any) {
          if (error.message === 'FILE_TOO_LARGE') {
            this.showSizeWarning = true; // Modal Error
          } else {
            console.error('Compression error:', error);
          }
        }
      }
      this.isCompressing = false; // Selesai animasi
    }
  }

  removeNewFile(index: number) {
    this.newFiles.splice(index, 1);
  }

  // --- 2. Logic Hapus Foto (UUID) ---
  requestDeletePhoto(id: string) {
    this.photoIdToDelete = id;
    this.showDeleteConfirm = true;
  }

  confirmDeletePhoto() {
    if (this.photoIdToDelete) {
      this.isLoading = true;
      this.loadingText = 'Menghapus foto...';

      this.invService.deleteGalleryImage(this.photoIdToDelete).subscribe({
        next: () => {
          // Update UI lokal (Hard Delete effect)
          this.existingGallery = this.existingGallery.filter(img => img.id !== this.photoIdToDelete);
          this.isLoading = false;
          this.closeDialogs();
        },
        error: () => {
          alert('Gagal menghapus foto.');
          this.isLoading = false;
          this.closeDialogs();
        }
      });
    }
  }

  // --- 3. Submit Form ---
  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    this.loadingText = 'Menyimpan Data Undangan...';

    const payload = this.form.getRawValue();

    if (this.isEdit) {
      this.invService.update(this.currentSlug, payload).subscribe({
        next: () => this.handleUploadAndFinish(this.currentSlug),
        error: () => { this.isLoading = false; alert('Gagal Update'); }
      });
    } else {
      this.invService.create(payload).subscribe({
        next: () => this.handleUploadAndFinish(payload.slug || ''),
        error: () => { this.isLoading = false; alert('Gagal Create'); }
      });
    }
  }

  private handleUploadAndFinish(slug: string) {
    if (this.newFiles.length > 0) {
      this.loadingText = `Mengupload ${this.newFiles.length} Foto...`; // Update Status Loading

      this.invService.uploadGallery(slug, this.newFiles).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading = false;
          // Cek Error Code khusus dari Backend (ART-98-007)
          if (err.error?.error_schema?.error_code === 'ART-98-007') {
            alert('GAGAL UPLOAD: Salah satu file melebihi batas 2MB (Ditolak Server).');
          } else {
            alert('Data tersimpan, tapi upload foto gagal.');
          }
          this.router.navigate(['/dashboard']);
        }
      });
    } else {
      this.isLoading = false;
      this.router.navigate(['/dashboard']);
    }
  }

  closeDialogs() {
    this.showSizeWarning = false;
    this.showDeleteConfirm = false;
    this.photoIdToDelete = null;
  }
}
