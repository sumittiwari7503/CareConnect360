import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminDashboardMetrics,
  DoctorCredentialing,
  VerifyCredentialRequest,
  AdminUserSummary,
  AdminCreateDoctorRequest,
  AuditIntegrityReport
} from '../models/admin.model';
import { AuditEvent } from '../models/audit.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/v1/admin';

  getMetrics(): Observable<AdminDashboardMetrics> {
    return this.http.get<AdminDashboardMetrics>(`${this.baseUrl}/metrics`);
  }

  getCredentialingQueue(status: string = 'ALL'): Observable<DoctorCredentialing[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<DoctorCredentialing[]>(`${this.baseUrl}/credentialing-queue`, { params });
  }

  verifyDoctorCredentials(doctorId: number, request: VerifyCredentialRequest): Observable<DoctorCredentialing> {
    return this.http.post<DoctorCredentialing>(`${this.baseUrl}/doctors/${doctorId}/verify-credentials`, request);
  }

  getDoctors(search?: string, status?: string): Observable<AdminUserSummary[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (status && status !== 'ALL') params = params.set('status', status);
    return this.http.get<AdminUserSummary[]>(`${this.baseUrl}/doctors`, { params });
  }

  onboardDoctor(request: AdminCreateDoctorRequest): Observable<DoctorCredentialing> {
    return this.http.post<DoctorCredentialing>(`${this.baseUrl}/doctors`, request);
  }

  getPatients(search?: string): Observable<AdminUserSummary[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<AdminUserSummary[]>(`${this.baseUrl}/patients`, { params });
  }

  toggleUserStatus(userId: number, active: boolean, reason: string = 'Admin state change'): Observable<AdminUserSummary> {
    return this.http.patch<AdminUserSummary>(`${this.baseUrl}/users/${userId}/status`, { active, reason });
  }

  getAuditLogs(actionType?: string, actorRole?: string): Observable<AuditEvent[]> {
    let params = new HttpParams();
    if (actionType) params = params.set('actionType', actionType);
    if (actorRole) params = params.set('actorRole', actorRole);
    return this.http.get<AuditEvent[]>(`${this.baseUrl}/audit-logs`, { params });
  }

  verifyAuditIntegrity(): Observable<AuditIntegrityReport> {
    return this.http.get<AuditIntegrityReport>(`${this.baseUrl}/audit-logs/verify-integrity`);
  }
}
