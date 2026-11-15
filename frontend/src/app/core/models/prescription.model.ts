export interface PrescriptionItem {
  id?: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  refillsAllowed: number;
  instructions?: string;
}

export interface Prescription {
  id: number;
  prescriptionNumber: string;
  appointmentId: number;
  encounterNumber: string;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialty: string;
  issueDate: string;
  status: 'ACTIVE' | 'DISPENSED' | 'CANCELLED' | 'EXPIRED';
  pharmacyName: string;
  clinicalNotes?: string;
  items: PrescriptionItem[];
  createdAt: string;
}

export interface CreatePrescriptionRequest {
  appointmentId: number;
  pharmacyName?: string;
  clinicalNotes?: string;
  items: {
    medicationName: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    refillsAllowed?: number;
    instructions?: string;
  }[];
}
