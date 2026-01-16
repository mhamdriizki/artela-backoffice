import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InvitationService } from '../../core/services/invitation-service';
import { AuthService } from '../../core/services/auth-service';
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
  imports: [CommonModule, RouterLink, ConfirmDialog],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  private invService = inject(InvitationService);
  private authService = inject(AuthService); // Inject Auth Service
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

  onDeleteRequest(slug: string) {
    this.slugToDelete = slug;
    this.showDeleteModal = true;
  }

  onConfirmDelete() {
    if (!this.slugToDelete) return;

    this.showDeleteModal = false;
    this.isLoading = true;
    this.cdr.detectChanges();

    this.invService.delete(this.slugToDelete).subscribe({
      next: () => {
        this.loadData();
        this.slugToDelete = '';
      },
      error: (err) => {
        alert('Gagal menghapus data.');
        this.isLoading = false;
        this.loadData();
      }
    });
  }

  onCancelDelete() {
    this.showDeleteModal = false;
    this.slugToDelete = '';
  }

  // LOGIC LOGOUT
  onLogout() {
    if(confirm('Apakah Anda yakin ingin keluar?')) {
      this.authService.logout();
    }
  }
}
