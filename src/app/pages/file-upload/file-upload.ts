import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FileService } from '../../services/file';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
declare var bootstrap: any


export interface FileItem {
  id: string;
  name: string;        // frontend display name mapped from originalName
  filename: string;    // actual stored filename on server
  mimetype: string;
  size: number;
  path: string;
  previewUrl?: SafeResourceUrl; // for image/pdf preview
}

@Component({
  selector: 'app-file-upload',
  imports: [CommonModule,FormsModule],
  templateUrl: './file-upload.html',
  styleUrls: ['./file-upload.css']
})
export class FileUploadComponent {

 files: FileItem[] = [];
  filteredFiles: FileItem[] = [];
  selectedFile: File | null = null;
  selectedFilePreview: FileItem | null = null;
  searchText: string = '';
  currentPage = 1;
  pageSize = 10;

  @ViewChild('previewModalRef', { static: false }) previewModalRef!: ElementRef;

  constructor(public fileService: FileService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

 async uploadFile(): Promise<void> {
  if (!this.selectedFile) return;

  try {
    await this.fileService.upload(this.selectedFile);

    // Reload entire page
    window.location.reload();

  } catch (error) {
    console.error('Upload failed', error);
  }
}



  async loadFiles(): Promise<void> {
    try {
      const response = await this.fileService.getAll();
      this.files = response.data.map((f: any) => ({
        id: f._id || f.id,
        name: f.originalName,
        filename: f.filename,
        mimetype: f.mimetype,
        size: f.size,
        path: f.path,
      }));
      this.applyFilter();
    } catch (error) {
      console.error('Failed to load files', error);
    }
  }

  async deleteFile(id: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      await this.fileService.delete(id);
      await this.loadFiles();
    } catch (error) {
      console.error('Delete failed', error);
    }
  }

  // -------------------- Preview --------------------
  openPreview(file: FileItem) {
    file.previewUrl = this.getPreviewUrl(file);
    this.selectedFilePreview = file;

    setTimeout(() => {
      if (this.previewModalRef) {
        const modal = new bootstrap.Modal(this.previewModalRef.nativeElement);
        modal.show();
      }
    });
  }

  closePreview() {
    const modalEl = this.previewModalRef.nativeElement;
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal?.hide();
  }

  getPreviewUrl(file: FileItem): SafeResourceUrl {
    if (!file) return '';

    // Images & PDF inline
    if (this.isImage(file.mimetype) || this.isPdf(file.mimetype)) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `http://localhost:3000/files/view/${file.id}`
      );
    }

    // Word/Excel/Text via Google Docs Viewer
    if (this.isWord(file.mimetype) || this.isExcel(file.mimetype) || this.isText(file.mimetype)) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://docs.google.com/gview?url=http://localhost:3000/files/download/${file.id}&embedded=true`
      );
    }

    // Other fallback: force download
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `http://localhost:3000/files/download/${file.id}`
    );
  }

  // -------------------- Helpers --------------------
  isImage(type: string) {
    return type.startsWith('image/');
  }
  isPdf(type: string) {
    return type === 'application/pdf';
  }
  isWord(type: string) {
    return type === 'application/msword' ||
           type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  isExcel(type: string) {
    return type === 'application/vnd.ms-excel' ||
           type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  isText(type: string) {
    return type === 'text/plain';
  }
  canPreview(file: FileItem) {
    return this.isImage(file.mimetype) || this.isPdf(file.mimetype) ||
           this.isWord(file.mimetype) || this.isExcel(file.mimetype) || this.isText(file.mimetype);
  }

  applyFilter(): void {
    const search = this.searchText.toLowerCase();
    this.filteredFiles = this.files.filter(file =>
      (file.name ?? '').toLowerCase().includes(search)
    );
    this.currentPage = 1;
  }

  get paginatedFiles(): FileItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredFiles.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredFiles.length / this.pageSize);
  }

  totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  downloadFile(file: FileItem) {
    const link = document.createElement('a');
    link.href = `http://localhost:3000/files/download/${file.id}`;
    link.target = '_blank';
    link.click();
  }
}