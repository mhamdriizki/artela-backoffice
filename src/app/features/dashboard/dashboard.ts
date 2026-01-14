import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DataInvitationResponse, InvitationResponse, InvitationService } from '../../core/services/invitation-service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize, Subject, takeUntil } from 'rxjs';
import { BaseResponse } from '../../core/models/BaseResponse';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  standalone: true,
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  private invService = inject(InvitationService);

  invitations: InvitationResponse[] = [];
  isLoading = true;
  errorMessage = '';
  destroySubject: Subject<void> = new Subject<void>();

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.invService
      .getAll()
      .pipe(
        takeUntil(this.destroySubject),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (res: BaseResponse<DataInvitationResponse>) => {
          // Validasi Data Aman
          if (res.error_schema.error_code === 'ART-00-000') {
            this.invitations = res.output_schema.data;
            console.log('Invitations loaded: ', this.invitations);
          } else {
            this.invitations = [];
          }
        },
        error: (err) => {
          console.error('Error loading data:', err);
          this.errorMessage = 'Gagal memuat data.';
          this.isLoading = false;
        },
      });
  }

  onDelete(slug: string) {
    if (confirm(`Hapus undangan "${slug}"?`)) {
      this.invService.delete(slug).subscribe(() => this.loadData());
    }
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }
}
