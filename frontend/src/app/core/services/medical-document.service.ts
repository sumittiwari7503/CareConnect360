import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MedicalDocument } from '../models/medical-document.model';

@Injectable({
  providedIn: 'root'
})
export class MedicalDocumentService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/documents';

  uploadDocument(patientId: number, file: File, title: string, category: string): Observable<MedicalDocument> {
    const formData = new FormData();
    formData.append('patientId', patientId.toString());
    formData.append('title', title);
    formData.append('category', category);
    formData.append('file', file);

    return this.http.post<MedicalDocument>(`${this.apiUrl}/upload`, formData);
  }

  getPatientDocuments(patientId: number): Observable<MedicalDocument[]> {
    return this.http.get<MedicalDocument[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getDocumentMetadata(id: number): Observable<MedicalDocument> {
    return this.http.get<MedicalDocument>(`${this.apiUrl}/${id}/metadata`);
  }

  downloadDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
