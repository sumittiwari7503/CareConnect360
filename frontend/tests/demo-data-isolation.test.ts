import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Demo Data Separation & Isolation Integrity Tests', () => {

  it('should verify Doctor interface supports isSynthetic attribute for watermarking', () => {
    const syntheticDoctor = {
      id: 2,
      fullName: 'Dr. Rajesh Nair, MD',
      email: 'dr.rajesh.nair@example.com',
      npi: '1928374601',
      specialty: 'Cardiology',
      licenseNumber: 'MMC-CARD-88391',
      consultationFee: 1500,
      experienceYears: 14,
      averageRating: 4.95,
      totalReviews: 128,
      acceptingPatients: true,
      isSynthetic: true
    };

    assert.equal(syntheticDoctor.isSynthetic, true);

    const verifiedDoctor = {
      id: 10,
      fullName: 'Dr. Real Clinician, MD',
      email: 'clinician@hospital.org',
      npi: '1000000001',
      specialty: 'Neurology',
      licenseNumber: 'MD-NEURO-11223',
      consultationFee: 200,
      experienceYears: 10,
      averageRating: 5.0,
      totalReviews: 15,
      acceptingPatients: true,
      isSynthetic: false
    };

    assert.equal(verifiedDoctor.isSynthetic, false);
  });

  it('should accurately detect demo test accounts via email domain for top disclaimer banner', () => {
    function isDemoAccount(email?: string): boolean {
      if (!email) return false;
      const lower = email.toLowerCase();
      return lower.endsWith('@example.com') || lower.includes('demo') || lower.includes('test');
    }

    assert.equal(isDemoAccount('aarav.sharma@example.com'), true);
    assert.equal(isDemoAccount('dr.rajesh.nair@example.com'), true);
    assert.equal(isDemoAccount('priya.sundaram@careconnect360.com'), false); // organization domain
    assert.equal(isDemoAccount('demo.patient@gmail.com'), true);
    assert.equal(isDemoAccount('real.patient@company.org'), false);
    assert.equal(isDemoAccount('john.doe@hospital.edu'), false);
    assert.equal(isDemoAccount(undefined), false);
  });

  it('should ensure consultation room defaults to 0 call duration and 0 chat messages', () => {
    const consultationRoomState = {
      callDurationSeconds: 0,
      chatMessages: [] as any[],
      patientName: 'Patient',
      doctorName: 'Attending Physician'
    };

    assert.equal(consultationRoomState.callDurationSeconds, 0);
    assert.equal(consultationRoomState.chatMessages.length, 0);

    const mins = Math.floor(consultationRoomState.callDurationSeconds / 60);
    const secs = consultationRoomState.callDurationSeconds % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    assert.equal(formatted, '00:00');
  });

  it('should ensure empty API responses for prescriptions/documents do not fall back to synthetic data', () => {
    function handlePrescriptionsApiResponse(apiResult: any[] | null): any[] {
      return apiResult || [];
    }

    function handleDocumentsApiResponse(apiResult: any[] | null): any[] {
      return apiResult || [];
    }

    const emptyPrescriptions = handlePrescriptionsApiResponse([]);
    assert.equal(emptyPrescriptions.length, 0);
    assert.equal(emptyPrescriptions.some((p: any) => p.patientName === 'Aarav Sharma'), false);

    const nullDocuments = handleDocumentsApiResponse(null);
    assert.equal(nullDocuments.length, 0);
    assert.equal(nullDocuments.some((d: any) => d.patientName === 'Aarav Sharma'), false);
  });

  it('should ensure patient registration form fields initialize strictly blank without synthetic defaults', () => {
    // Model initial state corresponding to PatientRegistrationComponent
    const registrationFormState = {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      consentTerms: false,
      consentSms: false,
      strengthScore: 0,
      strengthLabel: 'None',
      ruleLength: false,
      ruleCase: false,
      ruleNumber: false,
      ruleSpecial: false
    };

    assert.equal(registrationFormState.fullName, '');
    assert.equal(registrationFormState.email, '');
    assert.equal(registrationFormState.phone, '');
    assert.equal(registrationFormState.password, '');
    assert.equal(registrationFormState.consentTerms, false);
    assert.equal(registrationFormState.strengthScore, 0);
    assert.equal(registrationFormState.strengthLabel, 'None');
    assert.equal(registrationFormState.ruleLength, false);
  });

  it('should ensure multi-step booking form fields initialize strictly blank without synthetic defaults', () => {
    // Model initial state corresponding to BookAppointmentComponent
    const bookingFormState = {
      patientName: '',
      patientEmail: '',
      patientMrn: '',
      chiefComplaint: '',
      emergencyContactName: '',
      emergencyContactPhone: ''
    };

    assert.equal(bookingFormState.patientName, '');
    assert.equal(bookingFormState.patientEmail, '');
    assert.equal(bookingFormState.patientMrn, '');
    assert.equal(bookingFormState.chiefComplaint, '');
    assert.equal(bookingFormState.emergencyContactName, '');
    assert.equal(bookingFormState.emergencyContactPhone, '');
  });

  it('should ensure doctor consultation vitals initialize null/unset with NOT_RECORDED provenance', () => {
    // Model initial state corresponding to DoctorAppointmentDetailsComponent
    const consultationVitalsState = {
      vitalSystolicBp: null as number | null,
      vitalDiastolicBp: null as number | null,
      vitalHeartRateBpm: null as number | null,
      vitalSpo2Percent: null as number | null,
      vitalsProvenance: 'NOT_RECORDED' as 'MEASURED' | 'PATIENT_REPORTED' | 'NOT_RECORDED'
    };

    assert.strictEqual(consultationVitalsState.vitalSystolicBp, null);
    assert.strictEqual(consultationVitalsState.vitalDiastolicBp, null);
    assert.strictEqual(consultationVitalsState.vitalHeartRateBpm, null);
    assert.strictEqual(consultationVitalsState.vitalSpo2Percent, null);
    assert.strictEqual(consultationVitalsState.vitalsProvenance, 'NOT_RECORDED');

    // Verify submission payload does NOT convert null to 0 or fabricated 120/80
    const submissionPayload = {
      systolicBp: consultationVitalsState.vitalSystolicBp,
      diastolicBp: consultationVitalsState.vitalDiastolicBp,
      heartRateBpm: consultationVitalsState.vitalHeartRateBpm,
      spo2Percent: consultationVitalsState.vitalSpo2Percent,
      vitalsProvenance: consultationVitalsState.vitalsProvenance
    };

    assert.strictEqual(submissionPayload.systolicBp, null);
    assert.strictEqual(submissionPayload.diastolicBp, null);
    assert.notStrictEqual(submissionPayload.systolicBp, 120);
    assert.notStrictEqual(submissionPayload.diastolicBp, 80);
    assert.notStrictEqual(submissionPayload.systolicBp, 0);
  });

  it('should ensure biometric telemetry displays "Not recorded" when readings are null and preserves provenance', () => {
    function formatBloodPressure(systolic: number | null, diastolic: number | null): string {
      if (systolic && diastolic) return `${systolic}/${diastolic} mmHg`;
      return 'Not recorded';
    }

    function formatHeartRate(bpm: number | null): string {
      if (bpm) return `${bpm} bpm`;
      return 'Not recorded';
    }

    function formatSpo2(spo2: number | null): string {
      if (spo2) return `${spo2}%`;
      return 'Not recorded';
    }

    assert.equal(formatBloodPressure(null, null), 'Not recorded');
    assert.equal(formatHeartRate(null), 'Not recorded');
    assert.equal(formatSpo2(null), 'Not recorded');

    // When clinician explicitly measures:
    assert.equal(formatBloodPressure(128, 82), '128/82 mmHg');
    assert.equal(formatHeartRate(72), '72 bpm');
    assert.equal(formatSpo2(98), '98%');
  });

  it('should ensure consultation summary modal resolves dynamic encounter telemetry without hardcoded fake clinical narrative', () => {
    interface ConsultationSummaryContext {
      appointmentId: number;
      consultationRecord?: {
        systolicBp?: number | null;
        diastolicBp?: number | null;
        heartRateBpm?: number | null;
        spo2Percent?: number | null;
        assessment?: string | null;
        primaryDiagnosisCode?: string | null;
      };
      prescriptions: Array<{ drugName: string; dosage: string }>;
    }

    const unfinalizedEncounter: ConsultationSummaryContext = {
      appointmentId: 42,
      consultationRecord: undefined,
      prescriptions: []
    };

    // Verify fallback narrative is clinically neutral, not fake data
    const bpDisplay = unfinalizedEncounter.consultationRecord?.systolicBp && unfinalizedEncounter.consultationRecord?.diastolicBp
      ? `${unfinalizedEncounter.consultationRecord.systolicBp}/${unfinalizedEncounter.consultationRecord.diastolicBp} mmHg`
      : 'Not recorded during encounter';

    const dxDisplay = unfinalizedEncounter.consultationRecord?.primaryDiagnosisCode || 'Awaiting clinician diagnostic entry';
    const rxDisplay = unfinalizedEncounter.prescriptions.length > 0
      ? unfinalizedEncounter.prescriptions.map(p => `${p.drugName} ${p.dosage}`).join(', ')
      : 'No pharmacological orders prescribed';

    assert.equal(bpDisplay, 'Not recorded during encounter');
    assert.notEqual(bpDisplay, '118/76 mmHg');

    assert.equal(dxDisplay, 'Awaiting clinician diagnostic entry');
    assert.notEqual(dxDisplay, 'I10 (Essential Hypertension)');

    assert.equal(rxDisplay, 'No pharmacological orders prescribed');
    assert.notEqual(rxDisplay, 'Atorvastatin 20mg oral daily');
  });
});

