export type InvoiceStatus = 'PENDING' | 'PAID' | 'FAILED' | 'OVERDUE' | 'CANCELLED';

export interface PaymentRecord {
  id: number;
  invoiceId: number;
  invoiceNumber: string;
  transactionReference: string;
  amountPaid: number;
  paymentMethod: string;
  paymentStatus: 'SUCCESS' | 'FAILED' | 'PENDING';
  processedAt: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  appointmentId: number;
  encounterNumber: string;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialty: string;
  totalAmount: number;
  insuranceCoveredAmount: number;
  patientCopayAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  paymentRecords: PaymentRecord[];
  createdAt: string;
}

export interface ProcessPaymentRequest {
  amount: number;
  paymentMethod: string;
  syntheticCardNumber?: string;
  cardHolderName?: string;
}
