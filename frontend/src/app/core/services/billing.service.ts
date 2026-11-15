import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice, ProcessPaymentRequest } from '../models/billing.model';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/billing';

  getPatientInvoices(patientId: number): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/invoices/patient/${patientId}`);
  }

  getInvoiceById(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/invoices/${id}`);
  }

  payInvoice(id: number, request: ProcessPaymentRequest): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/invoices/${id}/pay`, request);
  }

  simulateFailure(id: number): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/invoices/${id}/simulate-failure`, {});
  }
}
