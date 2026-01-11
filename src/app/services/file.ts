import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({ providedIn: 'root' })
export class FileService {

  // ✅ NO trailing slash
  private API = 'http://localhost:3000';

  // Upload file
  upload(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${this.API}/files/upload`, formData);
  }

  // Get all files
  getAll() {
    return axios.get(`${this.API}/files`);
  }

  // Download file
  download(id: string): string {
    return `${this.API}/files/download/${id}`;
  }

  // Delete file
  delete(id: string) {
    return axios.delete(`${this.API}/files/${id}`);
  }

  view(id: string): string {
    return `${this.API}/files/view/${id}`;
  }
}
