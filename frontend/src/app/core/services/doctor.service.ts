import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Doctor, DoctorProfile, TimeSlot } from '../models/doctor.model';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/doctors';

  constructor(private http: HttpClient) {}

  getDoctors(filters?: {
    keyword?: string;
    specialty?: string;
    maxFee?: number;
    minRating?: number;
  }): Observable<Doctor[]> {
    let params = new HttpParams();
    if (filters?.keyword) {
      params = params.set('keyword', filters.keyword);
    }
    if (filters?.specialty) {
      params = params.set('specialty', filters.specialty);
    }
    if (filters?.maxFee !== undefined && filters?.maxFee !== null) {
      params = params.set('maxFee', filters.maxFee.toString());
    }
    if (filters?.minRating !== undefined && filters?.minRating !== null) {
      params = params.set('minRating', filters.minRating.toString());
    }
    return this.http.get<Doctor[]>(this.apiUrl, { params });
  }

  getDoctorById(id: number): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.apiUrl}/${id}`);
  }

  getDoctorSlots(doctorId: number, date: string, timezone: string = 'UTC'): Observable<TimeSlot[]> {
    const params = new HttpParams()
      .set('date', date)
      .set('timezone', timezone);
    return this.http.get<TimeSlot[]>(`${this.apiUrl}/${doctorId}/slots`, { params });
  }
}
