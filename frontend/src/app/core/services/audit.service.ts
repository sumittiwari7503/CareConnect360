import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditEvent } from '../models/audit.model';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly apiUrl = 'http://localhost:8080/api/v1/admin/audit-logs';

  constructor(private http: HttpClient) {}

  getRecentAuditLogs(): Observable<AuditEvent[]> {
    return this.http.get<AuditEvent[]>(this.apiUrl);
  }
}
