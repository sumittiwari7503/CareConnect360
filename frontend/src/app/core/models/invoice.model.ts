export interface PaymentRecord {
  id: number;
  transactionReference: string;
  amountPaid: number;
  paymentMethod: string;
  paymentStatus: string;
  processedAt: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  totalAmount: number;
  insuranceCoveredAmount: number;
  patientCopayAmount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  paidAt?: string;
  paymentRecords?: PaymentRecord[];
}
