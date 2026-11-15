export interface AdminDashboardMetrics {
  registeredPatients: number;
  credentialedPhysicians: number;
  pendingCredentialing: number;
  totalAppointments: number;
  completedConsultations: number;
  totalPlatformRevenue: number;
  systemUptimePercent: number;
  totalAuditEvents: number;
}

export interface DoctorCredentialing {
  doctorId: number;
  fullName: string;
  email: string;
  phone: string;
  npi: string;
  specialty: string;
  subSpecialty?: string;
  licenseNumber: string;
  licenseState: string;
  boardCertifications?: string;
  credentialingStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  licenseExpiryDate?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: number;
  verifiedByName?: string;
  submittedAt?: string;
  active: boolean;
}

export interface VerifyCredentialRequest {
  action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'REACTIVATE';
  notes?: string;
}

export interface AdminUserSummary {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
  active: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  mrn?: string;
  npi?: string;
  specialty?: string;
  insuranceProvider?: string;
  emergencyContactName?: string;
}

export interface AdminCreateDoctorRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  npi: string;
  specialty: string;
  subSpecialty?: string;
  licenseNumber: string;
  licenseState?: string;
  consultationFee: number;
  experienceYears?: number;
  boardCertifications?: string;
  bio?: string;
  autoApprove: boolean;
}

export interface AuditIntegrityReport {
  totalEventsChecked: number;
  verifiedIntactEvents: number;
  corruptedEvents: number;
  integrityStatus: string;
  verifiedAt: string;
}
