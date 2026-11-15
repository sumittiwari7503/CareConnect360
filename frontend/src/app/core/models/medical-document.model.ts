export type DocumentCategory = 'LAB_REPORT' | 'RADIOLOGY' | 'CLINICAL_NOTE' | 'DISCHARGE_SUMMARY' | 'PATIENT_UPLOAD';

export interface MedicalDocument {
  id: number;
  patientId: number;
  patientName: string;
  uploadedById: number;
  uploadedByName: string;
  documentTitle: string;
  category: DocumentCategory | string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  createdAt: string;
}
