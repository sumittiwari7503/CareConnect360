export interface DoctorAvailability {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

export interface Doctor {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  npi: string;
  specialty: string;
  subSpecialty?: string;
  licenseNumber: string;
  consultationFee: number;
  experienceYears: number;
  bio?: string;
  averageRating: number;
  totalReviews: number;
  acceptingPatients: boolean;
  nextAvailableSlot?: string;
  weeklyAvailability?: DoctorAvailability[];
  isSynthetic?: boolean;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  formattedTime: string;
  available: boolean;
  conflictReason?: string;
}

export type DoctorProfile = Doctor;

