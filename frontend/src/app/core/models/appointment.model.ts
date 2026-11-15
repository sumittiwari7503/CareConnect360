export type AppointmentModality = 'VIDEO' | 'AUDIO' | 'IN_PERSON';
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface Appointment {
  id: number;
  encounterNumber: string;
  patientId: number;
  patientName: string;
  patientMrn: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialty: string;
  doctorNpi: string;
  consultationFee: number;
  scheduledTime: string;
  durationMinutes: number;
  modality: AppointmentModality;
  status: AppointmentStatus;
  chiefComplaint?: string;
  cancellationReason?: string;
  createdAt: string;
}

export interface BookingRequest {
  doctorId: number;
  scheduledTime: string;
  durationMinutes?: number;
  modality: AppointmentModality;
  chiefComplaint: string;
  symptomsDuration?: string;
  medicalNotes?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface RescheduleRequest {
  newScheduledTime: string;
  reason?: string;
}

export interface CompleteConsultationRequest {
  doctorNotes: string;
  diagnosisCode?: string;
  diagnosisDescription?: string;
  systolicBp?: number | null;
  diastolicBp?: number | null;
  heartRateBpm?: number | null;
  spo2Percent?: number | null;
  vitalsProvenance?: 'MEASURED' | 'PATIENT_REPORTED' | 'NOT_RECORDED';
}

export interface ConsultationRecord {
  id: number;
  appointmentId: number;
  encounterNumber: string;
  patientName: string;
  patientMrn: string;
  doctorName: string;
  doctorNotes?: string;
  diagnosisCode?: string;
  diagnosisDescription?: string;
  systolicBp?: number | null;
  diastolicBp?: number | null;
  heartRateBpm?: number | null;
  spo2Percent?: number | null;
  vitalsProvenance?: 'MEASURED' | 'PATIENT_REPORTED' | 'NOT_RECORDED';
  sessionStartedAt?: string;
  sessionEndedAt?: string;
  createdAt: string;
}

export interface RoomSession {
  appointmentId: number;
  encounterNumber: string;
  roomId: string;
  sessionToken: string;
  participantRole: string;
  participantName: string;
  patientName: string;
  patientMrn: string;
  doctorName: string;
  doctorSpecialty: string;
  scheduledTime: string;
  appointmentStatus: string;
  authorizedUntil: string;
  iceServers: string[];
}
