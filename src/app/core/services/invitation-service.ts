import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth-service';
import { Observable } from 'rxjs';

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

  // GET ALL
  getAll() {
    return this.http.get(`${this.apiUrl}/api/admin/invitations`, this.getHeaders());
  }

  // GET ONE
  getOne(slug: string) {
    return this.http.get(`${this.apiUrl}/api/invitation/${slug}`);
  }

  // CREATE (JSON ONLY)
  create(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/admin/create`, data, this.getHeaders());
  }

  // UPDATE (JSON ONLY)
  update(slug: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/admin/invitation/${slug}`, data, this.getHeaders());
  }

  // DELETE
  delete(slug: string) {
    return this.http.delete(`${this.apiUrl}/api/admin/invitation/${slug}`, this.getHeaders());
  }

  // UPLOAD COUPLE PHOTOS (Groom & Bride)
  uploadCouplePhotos(slug: string, groomFile: File | null, brideFile: File | null) {
    const formData = new FormData();
    if (groomFile) formData.append('groom_photo_file', groomFile);
    if (brideFile) formData.append('bride_photo_file', brideFile);

    return this.http.post(
      `${this.apiUrl}/api/admin/invitation/${slug}/upload-couple`,
      formData,
      this.getHeaders()
    );
  }

  // UPLOAD GALLERY
  uploadGallery(slug: string, files: File[]) {
    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));
    // Gallery endpoint public (sesuai BE sebelumnya), atau tambahkan header jika protected
    return this.http.post(`${this.apiUrl}/api/invitation/${slug}/gallery`, formData);
  }

  // DELETE GALLERY IMAGE
  deleteGalleryImage(id: string) {
    return this.http.delete(`${this.apiUrl}/api/admin/gallery/${id}`, this.getHeaders());
  }
}
