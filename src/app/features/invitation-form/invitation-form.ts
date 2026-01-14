import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { InvitationService } from '../../core/services/invitation-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invitation-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './invitation-form.html',
  styleUrl: './invitation-form.scss',
})
export class InvitationForm implements OnInit {
  fb = inject(FormBuilder);
  invService = inject(InvitationService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  isEdit = false;
  currentSlug = '';
  selectedFiles: File[] = [];
  isLoading = false;

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
    this.invService.getOne(this.currentSlug).subscribe((res: any) => {
      const data = res.output_schema;
      this.form.patchValue(data);
    });
  }

  onFileSelect(event: any) {
    if (event.target.files) {
      this.selectedFiles = Array.from(event.target.files);
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.isLoading = true;
    const payload = this.form.getRawValue();

    if (this.isEdit) {
      // --- LOGIC UPDATE ---
      this.invService.update(this.currentSlug, payload).subscribe({
        next: () => this.handleUploadAndFinish(this.currentSlug),
        error: () => {
          this.isLoading = false;
          alert('Gagal Update');
        },
      });
    } else {
      // --- LOGIC CREATE (Baru) ---
      // 1. Create Data dulu
      this.invService.create(payload).subscribe({
        next: () => {
          // 2. Data sukses dibuat, pakai Slug dari form untuk upload foto
          const newSlug = payload.slug || '';
          this.handleUploadAndFinish(newSlug);
        },
        error: () => {
          this.isLoading = false;
          alert('Gagal Membuat Undangan');
        },
      });
    }
  }

  // Helper untuk upload foto & redirect
  private handleUploadAndFinish(slug: string) {
    if (this.selectedFiles.length > 0) {
      this.invService.uploadGallery(slug, this.selectedFiles).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.isLoading = false;
          alert('Data tersimpan tapi Foto Gagal Upload');
          this.router.navigate(['/dashboard']);
        },
      });
    } else {
      this.isLoading = false;
      this.router.navigate(['/dashboard']);
    }
  }
}
