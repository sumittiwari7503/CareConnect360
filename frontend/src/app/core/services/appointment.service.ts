import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Appointment,
  BookingRequest,
  RescheduleRequest,
  CompleteConsultationRequest,
  ConsultationRecord,
  RoomSession
} from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/appointments';

  constructor(private http: HttpClient) {}

  getAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl);
  }

  getAppointmentById(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
  }

  scheduleAppointment(payload: BookingRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, payload);
  }

  rescheduleAppointment(id: number, payload: RescheduleRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/reschedule`, payload);
  }

  cancelAppointment(id: number, reason?: string): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/cancel`, { reason: reason || 'Cancelled by patient' });
  }

  startConsultation(id: number): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/start-consultation`, {});
  }

  completeConsultation(id: number, payload: CompleteConsultationRequest): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/complete-consultation`, payload);
  }

  getConsultationRecord(id: number): Observable<ConsultationRecord> {
    return this.http.get<ConsultationRecord>(`${this.apiUrl}/${id}/consultation-record`);
  }

  getRoomToken(id: number): Observable<RoomSession> {
    return this.http.get<RoomSession>(`${this.apiUrl}/${id}/room-token`);
  }
}
