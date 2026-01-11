import { Routes } from '@angular/router';
import { FileUploadComponent } from './pages/file-upload/file-upload';




export const routes: Routes = [
  {
    path: '',
    component: FileUploadComponent  
  },
  {
    path: '',
    redirectTo: 'upload',
    pathMatch: 'full'
  }
];
