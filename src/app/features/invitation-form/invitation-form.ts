import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvitationService } from '../../core/services/invitation-service';
import { compressImage } from '../../core/utils/image-compressor';
import { environment } from '../../../environments/environment';
import { switchMap, of, catchError, tap, Observable } from 'rxjs';
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
  isCompressing = false;

  // Data State
  existingGallery: any[] = [];
  newFiles: File[] = [];
  guestbooks: any[] = [];

  // Single Photos State
  groomFile: File | null = null;
  brideFile: File | null = null;
  previewGroom: string | null = null;
  previewBride: string | null = null;

  // Modals
  showSizeWarning = false;
  showDeleteConfirm = false;
  photoIdToDelete: string | null = null;

  baseUrl = environment.BASE_API;

  form = this.fb.group({
    slug: ['', Validators.required],
    theme: ['netflix', Validators.required],
    couple_name: ['', Validators.required],
    groom_name: [''],
    bride_name: [''],
    // Tanggal dalam format YYYY-MM-DD
    wedding_date: [''],
    akad_location: [''],
    akad_map_url: [''],
    reception_location: [''],
    reception_map_url: [''],
    youtube_url: [''],
    background_music_url: ['']
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
        const data = res.output_schema;

        // Format Wedding Date (ambil YYYY-MM-DD saja)
        if (data.wedding_date) {
           data.wedding_date = data.wedding_date.split('T')[0];
        }

        this.form.patchValue(data);
        this.existingGallery = data.gallery || [];
        this.guestbooks = data.guestbooks || [];

        if (data.groom_photo) this.previewGroom = `${this.baseUrl}/uploads/${data.groom_photo}`;
        if (data.bride_photo) this.previewBride = `${this.baseUrl}/uploads/${data.bride_photo}`;

        this.isLoading = false;
      },
      error: () => {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  // --- HANDLER FOTO MEMPELAI ---
  async onSingleFileSelect(event: any, type: 'groom' | 'bride') {
    const file = event.target.files[0];
    if (file) {
      this.isCompressing = true;
      try {
        const compressed = await compressImage(file, 2); // Max 2MB
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
        alert('Gagal memproses gambar');
      }
    }
  }

  // --- HANDLER GALLERY ---
  async onGallerySelect(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.isCompressing = true;
      const rawFiles = Array.from(event.target.files) as File[];
      for (const file of rawFiles) {
        try {
          const compressed = await compressImage(file, 2);
          this.newFiles.push(compressed);
        } catch (error: any) {
          if (error.message === 'FILE_TOO_LARGE') this.showSizeWarning = true;
        }
      }
      this.isCompressing = false;
    }
  }

  removeNewFile(index: number) {
    this.newFiles.splice(index, 1);
  }

  requestDeletePhoto(id: string) {
    this.photoIdToDelete = id;
    this.showDeleteConfirm = true;
  }

  confirmDeletePhoto() {
    if (this.photoIdToDelete) {
      this.isLoading = true;
      this.invService.deleteGalleryImage(this.photoIdToDelete).subscribe({
        next: () => {
          this.existingGallery = this.existingGallery.filter(img => img.id !== this.photoIdToDelete);
          this.isLoading = false;
          this.closeDialogs();
        },
        error: () => {
          this.isLoading = false;
          this.closeDialogs();
          alert('Gagal hapus foto');
        }
      });
    }
  }

  closeDialogs() {
    this.showSizeWarning = false;
    this.showDeleteConfirm = false;
    this.photoIdToDelete = null;
  }

  // --- SUBMIT UTAMA ---
  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    this.loadingText = 'Menyimpan Data Teks...';

    const formData = this.form.getRawValue();
    // Pastikan Wedding Date dikirim sebagai ISO String (RFC3339) ke Backend
    // Backend Go expect: 2025-08-17T00:00:00Z
    if (formData.wedding_date) {
        const d = new Date(formData.wedding_date);
        (formData as any).wedding_date = d.toISOString();
    }

    let saveObs: Observable<any>;
    // Tentukan Create atau Update
    if (this.isEdit) {
        saveObs = this.invService.update(this.currentSlug, formData);
    } else {
        saveObs = this.invService.create(formData);
    }

    saveObs.pipe(
        // 1. Setelah Save Teks Sukses, Lanjut Upload Foto Mempelai
        tap(() => this.loadingText = 'Mengupload Foto Mempelai...'),
        switchMap((res: any) => {
            // Jika create, slug diambil dari response atau form
            // Jika update, pakai currentSlug
            const targetSlug = this.isEdit ? this.currentSlug : formData.slug;

            // Cek apakah ada foto mempelai yg perlu diupload
            if (this.groomFile || this.brideFile) {
                return this.invService.uploadCouplePhotos(targetSlug || '', this.groomFile, this.brideFile)
                   .pipe(
                       catchError(err => {
                           console.error('Foto mempelai gagal', err);
                           // Return null agar stream tidak putus, cuma foto yg gagal
                           return of(null);
                       }),
                       // Teruskan slug untuk step berikutnya
                       switchMap(() => of(targetSlug))
                   );
            }
            return of(targetSlug);
        }),
        // 2. Lanjut Upload Gallery
        tap(() => this.loadingText = 'Mengupload Gallery...'),
        switchMap((slug: any) => {
            if (this.newFiles.length > 0 && slug) {
                return this.invService.uploadGallery(slug, this.newFiles);
            }
            return of(true);
        })
    ).subscribe({
        next: () => {
            this.isLoading = false;
            this.router.navigate(['/dashboard']);
        },
        error: (err) => {
            console.error(err);
            this.isLoading = false;
            alert('Terjadi kesalahan saat menyimpan data.');
        }
    });
  }
}
