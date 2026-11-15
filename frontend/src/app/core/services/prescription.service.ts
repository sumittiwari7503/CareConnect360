import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Prescription, CreatePrescriptionRequest } from '../models/prescription.model';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/prescriptions';

  createPrescription(request: CreatePrescriptionRequest): Observable<Prescription> {
    return this.http.post<Prescription>(this.apiUrl, request);
  }

  getPatientPrescriptions(patientId: number): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getDoctorPrescriptions(doctorId: number): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.apiUrl}/doctor/${doctorId}`);
  }

  getPrescriptionById(id: number): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.apiUrl}/${id}`);
  }

  updateStatus(id: number, status: string): Observable<Prescription> {
    return this.http.patch<Prescription>(`${this.apiUrl}/${id}/status`, { status });
  }
}
