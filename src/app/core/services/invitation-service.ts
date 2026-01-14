import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth-service';

@Injectable({ providedIn: 'root' })
export class InvitationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = environment.BASE_API;

  private getHeaders() {
    return {
      headers: new HttpHeaders().set('Authorization', `Bearer ${this.auth.getToken()}`)
    };
  }

  // --- CRUD Undangan ---
  getAll() {
    return this.http.get(`${this.apiUrl}/api/admin/invitations`, this.getHeaders());
  }

  getOne(slug: string) {
    return this.http.get(`${this.apiUrl}/api/invitation/${slug}`);
  }

  create(data: any) {
    return this.http.post(`${this.apiUrl}/api/admin/create`, data, this.getHeaders());
  }

  update(slug: string, data: any) {
    return this.http.put(`${this.apiUrl}/api/admin/invitation/${slug}`, data, this.getHeaders());
  }

  delete(slug: string) {
    return this.http.delete(`${this.apiUrl}/api/admin/invitation/${slug}`, this.getHeaders());
  }

  // --- CRUD Gallery ---

  uploadGallery(slug: string, files: File[]) {
    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));
    return this.http.post(`${this.apiUrl}/api/invitation/${slug}/gallery`, formData);
  }

  // UPDATE: ID sekarang String (UUID)
  deleteGalleryImage(id: string) {
    return this.http.delete(`${this.apiUrl}/api/admin/gallery/${id}`, this.getHeaders());
  }
}
