import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvitationService } from '../../core/services/invitation-service';
import { compressImage } from '../../core/utils/image-compressor';
import { environment } from '../../../environments/environment';
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
  isLoading = false;
  loadingText = '';
  isCompressing = false; // Flag untuk loading kompresi

  // State Foto Gallery
  existingGallery: any[] = [];
  newFiles: File[] = [];

  // State Foto Mempelai (Single Upload)
  groomFile: File | null = null;
  brideFile: File | null = null;
  previewGroom: string | null = null;
  previewBride: string | null = null;

  // State Guestbook
  guestbooks: any[] = [];

  // Modals
  showSizeWarning = false;
  showDeleteConfirm = false;
  photoIdToDelete: string | null = null;

  form = this.fb.group({
    slug: ['', Validators.required],
    theme: ['netflix', Validators.required],
    couple_name: ['', Validators.required],

    // Data Mempelai
    groom_name: [''],
    bride_name: [''],

    // Detail Acara
    wedding_date: [''],
    akad_location: [''],
    akad_map_url: [''],
    reception_location: [''],
    reception_map_url: [''],

    // Multimedia
    youtube_url: [''],
    background_music_url: ['']
  });

  baseUrl = environment.BASE_API;

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
        const data = res.output_schema;

        // Format Date agar muncul di input type="date"
        if (data.wedding_date) {
          data.wedding_date = data.wedding_date.split('T')[0];
        }

        this.form.patchValue(data);
        this.existingGallery = data.gallery || [];
        this.guestbooks = data.guestbooks || []; // Load Komentar

        // Set Preview Foto Mempelai
        if (data.groom_photo) {
           this.previewGroom = `${this.baseUrl}/uploads/${data.groom_photo}`;
        }
        if (data.bride_photo) {
           this.previewBride = `${this.baseUrl}/uploads/${data.bride_photo}`;
        }

        this.isLoading = false;
      },
      error: () => {
        alert('Gagal mengambil data.');
        this.router.navigate(['/dashboard']);
      }
    });
  }

  // --- 1. Logic Upload Single File (Groom/Bride) ---
  async onSingleFileSelect(event: any, type: 'groom' | 'bride') {
    const file = event.target.files[0];
    if (file) {
      this.isCompressing = true;
      try {
        const compressed = await compressImage(file, 2); // Max 2MB

        // Buat Preview Local
        const reader = new FileReader();
        reader.onload = (e: any) => {
          if (type === 'groom') {
            this.groomFile = compressed;
            this.previewGroom = e.target.result;
          } else {
            this.brideFile = compressed;
            this.previewBride = e.target.result;
          }
          this.isCompressing = false;
        };
        reader.readAsDataURL(compressed);

      } catch (err) {
        this.isCompressing = false;
        alert('File terlalu besar atau gagal diproses');
      }
    }
  }

  // --- 2. Logic Upload Gallery (Multiple) ---
  async onGallerySelect(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.isCompressing = true;
      const rawFiles = Array.from(event.target.files) as File[];

      for (const file of rawFiles) {
        try {
          const compressed = await compressImage(file, 2);
          this.newFiles.push(compressed);
        } catch (error: any) {
          if (error.message === 'FILE_TOO_LARGE') {
            this.showSizeWarning = true;
          }
        }
      }
      this.isCompressing = false;
    }
  }

  removeNewFile(index: number) {
    this.newFiles.splice(index, 1);
  }

  // --- Logic Delete Gallery ---
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

  // --- 3. Submit Form (Multipart/FormData) ---
  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    this.loadingText = 'Menyimpan Data...';

    const formData = new FormData();
    const rawData = this.form.getRawValue();

    // Append Text Data
    Object.keys(rawData).forEach(key => {
        const value = rawData[key as keyof typeof rawData];
        if (value !== null && value !== undefined) {
            // Khusus Wedding Date, pastikan ISO String jika perlu
            if (key === 'wedding_date' && value) {
                 formData.append(key, new Date(value).toISOString());
            } else {
                 formData.append(key, String(value));
            }
        }
    });

    // Append Single Files (Groom/Bride)
    // Key harus sesuai dengan handler backend: 'groom_photo_file', 'bride_photo_file'
    if (this.groomFile) formData.append('groom_photo_file', this.groomFile);
    if (this.brideFile) formData.append('bride_photo_file', this.brideFile);

    // Eksekusi Create / Update
    if (this.isEdit) {
      this.invService.update(this.currentSlug, formData).subscribe({
        next: () => this.handleGalleryUpload(this.currentSlug),
        error: () => { this.isLoading = false; alert('Gagal Update'); }
      });
    } else {
      // Untuk create, ambil slug dari form value karena slug belum ada di URL
      const slugToSend = rawData.slug || '';
      this.invService.create(formData).subscribe({
        next: () => this.handleGalleryUpload(slugToSend),
        error: () => { this.isLoading = false; alert('Gagal Create'); }
      });
    }
  }

  private handleGalleryUpload(slug: string) {
    if (this.newFiles.length > 0) {
      this.loadingText = `Mengupload ${this.newFiles.length} Foto Gallery...`;

      this.invService.uploadGallery(slug, this.newFiles).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.isLoading = false;
          alert('Data tersimpan, tapi sebagian foto gallery gagal terupload.');
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
