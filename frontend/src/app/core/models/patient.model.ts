export interface PatientProfile {
  id: number;
  mrn: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  houseFlatNumber?: string;
  streetLocality?: string;
  landmark?: string;
  city?: string;
  district?: string;
  stateUt?: string;
  pinCode?: string;
  country?: string;
}
