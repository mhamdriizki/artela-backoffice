import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InvitationService } from '../../core/services/invitation-service';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';

// Interface Invitation
interface Invitation {
  slug: string;
  couple_name: string;
  theme: string;
  created_at: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmDialog], // Import Component Baru
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private invService = inject(InvitationService);
  private cdr = inject(ChangeDetectorRef);

  invitations: Invitation[] = [];
  isLoading = true;
  errorMessage = '';

  // State untuk Modal Delete
  showDeleteModal = false;
  slugToDelete = '';

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.invService.getAll().subscribe({
      next: (res: any) => {
        if (res && res.output_schema && Array.isArray(res.output_schema.data)) {
          this.invitations = res.output_schema.data;
        } else {
          this.invitations = [];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 401) {
          this.errorMessage = 'Sesi habis. Silakan login ulang.';
        } else {
          this.errorMessage = 'Gagal memuat data.';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // 1. Trigger saat tombol Hapus ditekan (Buka Modal)
  onDeleteRequest(slug: string) {
    this.slugToDelete = slug;
    this.showDeleteModal = true;
  }

  // 2. Eksekusi Hapus (Dipanggil dari Modal)
  onConfirmDelete() {
    if (!this.slugToDelete) return;

    // Tutup modal dulu biar smooth
    this.showDeleteModal = false;
    this.isLoading = true; // Set loading state table
    this.cdr.detectChanges();

    this.invService.delete(this.slugToDelete).subscribe({
      next: () => {
        // Auto fetch data terbaru
        this.loadData();
        this.slugToDelete = '';
      },
      error: (err) => {
        alert('Gagal menghapus data.'); // Fallback alert error
        this.isLoading = false;
        this.loadData();
      }
    });
  }

  // 3. Batal Hapus
  onCancelDelete() {
    this.showDeleteModal = false;
    this.slugToDelete = '';
  }
}
