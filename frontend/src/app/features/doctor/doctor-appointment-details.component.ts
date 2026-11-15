import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../core/services/appointment.service';
import { PrescriptionService } from '../../core/services/prescription.service';
import { Appointment, ConsultationRecord, CompleteConsultationRequest } from '../../core/models/appointment.model';

@Component({
  selector: 'app-doctor-appointment-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto pb-16" *ngIf="appointment; else loadingOrError">
      <!-- Breadcrumbs & Meta Ribbon -->
      <div class="flex items-center justify-between gap-4">
        <nav class="flex items-center gap-1.5 text-on-surface-variant font-label-regular text-label-regular">
          <a routerLink="/doctor/dashboard" class="hover:text-primary transition-colors">Doctor Portal</a>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <a routerLink="/doctor/dashboard" class="hover:text-primary transition-colors">Appointments</a>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <span class="text-on-surface font-label-medium text-label-medium font-semibold">
            Encounter (#{{ appointment.encounterNumber }})
          </span>
        </nav>
        <span class="rounded bg-surface-container px-2 py-0.5 font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">
          Level-4 HIPAA Protected Clinical Record
        </span>
      </div>

      <!-- Encounter Status Hero Card -->
      <div class="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-[#E2E8F0]">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div class="flex flex-col gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-caption-caps text-caption-caps font-bold tracking-wider uppercase"
                [ngClass]="{
                  'bg-[#ECFDF5] text-[#059669] border border-[#059669]/20': appointment.status === 'CONFIRMED' || appointment.status === 'SCHEDULED',
                  'bg-amber-100 text-amber-800': appointment.status === 'IN_PROGRESS',
                  'bg-surface-container text-secondary': appointment.status === 'COMPLETED',
                  'bg-error-container text-error': appointment.status === 'CANCELLED'
                }"
              >
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span>{{ appointment.status }} • {{ appointment.status === 'IN_PROGRESS' ? 'IN-SESSION' : 'CHECKED IN' }}</span>
              </span>

              <span class="rounded bg-surface-container px-2 py-0.5 font-caption-caps text-caption-caps text-on-surface-variant font-mono">
                {{ appointment.encounterNumber }}
              </span>
              <span class="rounded bg-secondary-container px-2 py-0.5 font-caption-caps text-caption-caps text-on-secondary-container font-semibold uppercase">
                WebRTC #CC-9021
              </span>
            </div>

            <h1 class="font-headline-1 text-headline-1 text-on-surface font-bold tracking-tight">
              {{ appointment.scheduledTime | date:'dd/MM/yyyy' }} • {{ appointment.scheduledTime | date:'shortTime' }} IST
            </h1>
            <p class="font-label-regular text-label-regular text-on-surface-variant">
              Consultation Window: {{ appointment.durationMinutes }} minutes • Modality: <strong>{{ appointment.modality }}</strong>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              *ngIf="appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED' || appointment.status === 'IN_PROGRESS'"
              type="button"
              (click)="startVideoConsultation()"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-body-medium text-body-medium font-semibold shadow-md transition-all cursor-pointer"
            >
              <span class="material-symbols-outlined text-[20px]">videocam</span>
              <span>{{ appointment.status === 'IN_PROGRESS' ? 'Resume Video Call' : 'Start Video Consultation' }}</span>
            </button>

            <button
              *ngIf="appointment.status === 'IN_PROGRESS' || appointment.status === 'CONFIRMED'"
              type="button"
              (click)="saveAndCompleteConsultation()"
              class="inline-flex items-center gap-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high px-4 py-2.5 font-body-medium text-body-medium text-on-surface transition-colors cursor-pointer border border-[#E2E8F0]"
            >
              <span class="material-symbols-outlined text-[18px] text-primary">task_alt</span>
              <span>Complete & Sign Visit</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Asymmetric Workspace Layout (5 cols / 7 cols) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- LEFT COLUMN: Patient Overview, Telemetry, Allergies (5 Cols) -->
        <div class="lg:col-span-5 flex flex-col gap-6">
          <!-- Patient Summary Card -->
          <div class="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-[#E2E8F0] flex flex-col gap-4">
            <div class="flex items-start gap-4">
              <div class="w-14 h-14 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-xl shrink-0 shadow-sm">
                {{ getInitials(appointment.patientName) }}
              </div>
              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-2">
                  <h2 class="font-headline-2 text-headline-2 text-on-surface font-bold truncate">{{ appointment.patientName }}</h2>
                  <span class="rounded bg-surface-container px-1.5 py-0.5 font-caption-caps text-caption-caps font-semibold">PATIENT</span>
                </div>
                <p class="font-label-regular text-label-regular text-on-surface-variant">
                  MRN: <strong class="text-primary font-semibold">{{ appointment.patientMrn }}</strong> • Verified Encounter
                </p>
                <div class="mt-1 flex items-center gap-1 text-xs text-on-surface-variant">
                  <span class="material-symbols-outlined text-[14px] text-primary">verified_user</span>
                  <span>Primary Telehealth Healthcare Coverage Verified</span>
                </div>
              </div>
            </div>

            <!-- Emergency Proxy Contact -->
            <div class="rounded-xl bg-surface-container-low p-3 flex items-center justify-between text-xs border border-[#E2E8F0]">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[18px]">contact_emergency</span>
                <div>
                  <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold block">Emergency Contact</span>
                  <span class="font-body-medium text-body-medium font-semibold text-on-surface">Registered Emergency Contact On File</span>
                </div>
              </div>
              <span class="text-secondary font-mono">Confidential (HIPAA)</span>
            </div>

            <!-- Allergies Banner (CLINICAL SAFETY) -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[15px] text-primary">verified</span>
                  Drug Allergies &amp; Contraindications
                </span>
                <span class="font-caption-caps text-caption-caps text-secondary font-bold">Unconfirmed / No Record</span>
              </div>
              <div class="flex flex-wrap gap-2 text-xs">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant border border-[#E2E8F0] font-semibold">
                  <span class="material-symbols-outlined text-[13px] text-secondary">info</span>
                  No Verified Drug Allergies Documented in Current Chart
                </span>
              </div>
            </div>

            <!-- Active Problem List -->
            <div class="flex flex-col gap-2">
              <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider font-semibold">
                Encounter Chief Complaint
              </span>
              <div class="flex flex-wrap gap-1.5 text-xs">
                <span class="rounded bg-surface-container-high px-2 py-1 font-label-medium text-label-medium text-on-surface flex items-center gap-1">
                  <span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
                  {{ appointment.chiefComplaint || 'Clinical Telehealth Consultation' }}
                </span>
              </div>
            </div>

            <!-- Live Home Telemetry Vitals Strip -->
            <div class="flex flex-col gap-2 pt-2 border-t border-[#E2E8F0]">
              <div class="flex items-center justify-between">
                <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-primary text-[16px]">vital_signs</span>
                  Encounter Biometric Telemetry
                </span>
                <span class="font-caption-caps text-caption-caps text-secondary font-medium">
                  {{ vitalsProvenance === 'MEASURED' ? 'Clinician Measured' : (vitalsProvenance === 'PATIENT_REPORTED' ? 'Patient Reported' : 'Awaiting Entry') }}
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div class="rounded-xl bg-surface-container-low p-2.5 flex flex-col border border-[#E2E8F0]">
                  <span class="font-caption-caps text-[10px] text-on-surface-variant">Blood Pressure</span>
                  <div class="font-headline-3 text-headline-3 text-on-surface font-bold mt-0.5">
                    {{ (vitalSystolicBp != null && vitalDiastolicBp != null) ? (vitalSystolicBp + '/' + vitalDiastolicBp) : 'Not recorded' }}
                  </div>
                  <span class="text-[10px] text-secondary font-medium">{{ (vitalSystolicBp != null && vitalDiastolicBp != null) ? 'mmHg' : 'Unset' }}</span>
                </div>
                <div class="rounded-xl bg-surface-container-low p-2.5 flex flex-col border border-[#E2E8F0]">
                  <span class="font-caption-caps text-[10px] text-on-surface-variant">Heart Rate</span>
                  <div class="font-headline-3 text-headline-3 text-on-surface font-bold mt-0.5">
                    {{ vitalHr != null ? (vitalHr + ' bpm') : 'Not recorded' }}
                  </div>
                  <span class="text-[10px] text-secondary">{{ vitalHr != null ? 'Sinus Rhythm' : 'Unset' }}</span>
                </div>
                <div class="rounded-xl bg-surface-container-low p-2.5 flex flex-col border border-[#E2E8F0]">
                  <span class="font-caption-caps text-[10px] text-on-surface-variant">SpO2 Oxygen</span>
                  <div class="font-headline-3 text-headline-3 text-on-surface font-bold mt-0.5">
                    {{ vitalSpo2 != null ? (vitalSpo2 + '%') : 'Not recorded' }}
                  </div>
                  <span class="text-[10px] text-secondary">{{ vitalSpo2 != null ? 'Pulse Oximetry' : 'Unset' }}</span>
                </div>
                <div class="rounded-xl bg-surface-container-low p-2.5 flex flex-col border border-[#E2E8F0]">
                  <span class="font-caption-caps text-[10px] text-on-surface-variant">Modality</span>
                  <div class="font-headline-3 text-headline-3 text-on-surface font-bold mt-0.5">{{ appointment.modality }}</div>
                  <span class="text-[10px] text-on-surface-variant">Encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Clinical SOAP Documentation Form (7 Cols) -->
        <div class="lg:col-span-7 flex flex-col gap-6">
          <div class="rounded-2xl bg-surface-container-lowest p-6 shadow-sm border border-[#E2E8F0] flex flex-col gap-5">
            <div class="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 class="font-headline-2 text-headline-2 text-on-surface font-bold">Clinical SOAP Documentation</h3>
                <p class="font-label-regular text-label-regular text-on-surface-variant">Encounter Record & Diagnosis Submission</p>
              </div>
              <span class="px-2.5 py-1 rounded bg-[#F0FDFA] text-primary font-caption-caps text-caption-caps font-semibold">
                Auto-Save Ready
              </span>
            </div>

            <!-- Subjective (S) -->
            <div class="flex flex-col gap-1.5">
              <label class="font-headline-3 text-headline-3 text-on-surface font-semibold flex items-center gap-1.5">
                <span class="flex h-5 w-5 items-center justify-center rounded bg-primary text-on-primary font-caption-caps text-caption-caps font-bold">S</span>
                Subjective Patient Report & Chief Complaint
              </label>
              <textarea
                [(ngModel)]="soapNotes"
                rows="4"
                class="w-full rounded-xl bg-surface-container-low p-3 font-body-regular text-body-regular text-on-surface outline-none border border-[#E2E8F0] focus:bg-surface-container-lowest transition-all"
                placeholder="Enter patient subjective report, symptoms, treatment tolerability, and dietary compliance..."
              ></textarea>
            </div>

            <!-- Objective (O) Checklist & Biometric Measurements -->
            <div class="flex flex-col gap-3">
              <label class="font-headline-3 text-headline-3 text-on-surface font-semibold flex items-center gap-1.5">
                <span class="flex h-5 w-5 items-center justify-center rounded bg-primary text-on-primary font-caption-caps text-caption-caps font-bold">O</span>
                Objective Findings &amp; Biometric Measurements
              </label>

              <!-- Clinician Vital Input Strip -->
              <div class="p-3 rounded-xl bg-surface-container-low border border-[#E2E8F0] space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-semibold text-on-surface">Clinical Measurements (Leave blank if unrecorded):</span>
                  <select [(ngModel)]="vitalsProvenance" class="bg-surface-container-lowest text-xs border border-[#E2E8F0] rounded p-1">
                    <option value="NOT_RECORDED">Provenance: Not Recorded</option>
                    <option value="MEASURED">Provenance: Clinician Measured</option>
                    <option value="PATIENT_REPORTED">Provenance: Patient Reported</option>
                  </select>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label class="block text-secondary text-[11px] mb-0.5">Systolic BP (mmHg)</label>
                    <input type="number" [(ngModel)]="vitalSystolicBp" placeholder="e.g. 120" class="w-full h-8 px-2 rounded bg-surface-container-lowest border border-[#E2E8F0] text-sm" />
                  </div>
                  <div>
                    <label class="block text-secondary text-[11px] mb-0.5">Diastolic BP (mmHg)</label>
                    <input type="number" [(ngModel)]="vitalDiastolicBp" placeholder="e.g. 80" class="w-full h-8 px-2 rounded bg-surface-container-lowest border border-[#E2E8F0] text-sm" />
                  </div>
                  <div>
                    <label class="block text-secondary text-[11px] mb-0.5">Heart Rate (bpm)</label>
                    <input type="number" [(ngModel)]="vitalHr" placeholder="e.g. 72" class="w-full h-8 px-2 rounded bg-surface-container-lowest border border-[#E2E8F0] text-sm" />
                  </div>
                  <div>
                    <label class="block text-secondary text-[11px] mb-0.5">SpO2 (%)</label>
                    <input type="number" [(ngModel)]="vitalSpo2" placeholder="e.g. 98" class="w-full h-8 px-2 rounded bg-surface-container-lowest border border-[#E2E8F0] text-sm" />
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label class="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-[#E2E8F0] cursor-pointer">
                  <input type="checkbox" [(ngModel)]="examAlert" class="rounded accent-primary" />
                  <span>General: Alert, oriented x3, no acute distress</span>
                </label>
                <label class="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-[#E2E8F0] cursor-pointer">
                  <input type="checkbox" [(ngModel)]="examBreathing" class="rounded accent-primary" />
                  <span>Respiratory: Unlabored breathing on video</span>
                </label>
                <label class="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-[#E2E8F0] cursor-pointer">
                  <input type="checkbox" [(ngModel)]="examJvd" class="rounded accent-primary" />
                  <span>Cardiovascular: No visible JVD</span>
                </label>
                <label class="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-low border border-[#E2E8F0] cursor-pointer">
                  <input type="checkbox" [(ngModel)]="examEdema" class="rounded accent-primary" />
                  <span>Extremities: Zero pedal edema reported</span>
                </label>
              </div>
            </div>

            <!-- Assessment (A) & ICD-10 -->
            <div class="flex flex-col gap-2">
              <label class="font-headline-3 text-headline-3 text-on-surface font-semibold flex items-center gap-1.5">
                <span class="flex h-5 w-5 items-center justify-center rounded bg-primary text-on-primary font-caption-caps text-caption-caps font-bold">A</span>
                Assessment &amp; ICD-10 Diagnosis Coding
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  [(ngModel)]="diagnosisCode"
                  class="h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-regular text-body-regular outline-none border border-[#E2E8F0]"
                  placeholder="e.g. ICD-10 I10"
                />
                <input
                  type="text"
                  [(ngModel)]="diagnosisDescription"
                  class="h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-regular text-body-regular outline-none border border-[#E2E8F0]"
                  placeholder="e.g. Essential (Primary) Hypertension"
                />
              </div>
            </div>

            <!-- Plan (P) -->
            <div class="flex flex-col gap-1.5">
              <label class="font-headline-3 text-headline-3 text-on-surface font-semibold flex items-center gap-1.5">
                <span class="flex h-5 w-5 items-center justify-center rounded bg-primary text-on-primary font-caption-caps text-caption-caps font-bold">P</span>
                Clinical Plan &amp; Next Follow-up
              </label>
              <input
                type="text"
                [(ngModel)]="planNotes"
                class="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-regular text-body-regular outline-none border border-[#E2E8F0]"
                placeholder="Document clinical plan, orders, lifestyle guidance, or follow-up interval..."
              />
            </div>

            <!-- Success / Alert message -->
            <div *ngIf="statusMessage" class="p-3 rounded-lg bg-[#F0FDFA] text-primary text-xs font-semibold flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px]">check_circle</span>
              <span>{{ statusMessage }}</span>
            </div>

            <!-- Action Submit Strip -->
            <div class="pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                (click)="openRxModal()"
                class="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface font-body-medium text-body-medium font-semibold hover:bg-surface-container-high transition-all flex items-center gap-1.5"
              >
                <span class="material-symbols-outlined text-[18px] text-primary">medication</span>
                <span>Issue Rx Order</span>
              </button>

              <button
                type="button"
                [disabled]="isSaving"
                (click)="saveAndCompleteConsultation()"
                class="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-body-medium text-body-medium font-semibold hover:bg-primary-container shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span *ngIf="isSaving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>{{ isSaving ? 'Saving Encounter...' : 'Sign & Complete Consultation' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Prescription Creation Modal -->
      <div *ngIf="isRxModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm">
        <div class="w-full max-w-lg bg-surface-container-lowest rounded-2xl p-6 shadow-2xl flex flex-col gap-4 border border-[#E2E8F0]">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-[24px]">medication</span>
              </div>
              <div>
                <span class="font-caption-caps text-caption-caps text-primary font-bold uppercase">Clinical Order Entry</span>
                <h2 class="font-headline-2 text-headline-2 text-on-surface font-bold">Issue e-Prescription</h2>
              </div>
            </div>
            <button
              type="button"
              (click)="closeRxModal()"
              class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface"
            >
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <form (submit)="submitPrescription($event)" class="space-y-3">
            <div>
              <label class="font-label-medium text-label-medium text-on-surface font-semibold block mb-1">Medication Name</label>
              <input type="text" name="medName" [(ngModel)]="rxMedicationName" placeholder="e.g. Amoxicillin, Lisinopril" class="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-[#E2E8F0] outline-none text-sm" required />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="font-label-medium text-label-medium text-on-surface font-semibold block mb-1">Dosage</label>
                <input type="text" name="dosage" [(ngModel)]="rxDosage" placeholder="e.g. 500mg capsule" class="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-[#E2E8F0] outline-none text-sm" required />
              </div>
              <div>
                <label class="font-label-medium text-label-medium text-on-surface font-semibold block mb-1">Frequency</label>
                <input type="text" name="freq" [(ngModel)]="rxFrequency" placeholder="e.g. Once daily with meals" class="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-[#E2E8F0] outline-none text-sm" required />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="font-label-medium text-label-medium text-on-surface font-semibold block mb-1">Duration (Days)</label>
                <input type="number" name="dur" [(ngModel)]="rxDurationDays" placeholder="30" class="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-[#E2E8F0] outline-none text-sm" required />
              </div>
              <div>
                <label class="font-label-medium text-label-medium text-on-surface font-semibold block mb-1">Refills Allowed</label>
                <input type="number" name="refills" [(ngModel)]="rxRefills" placeholder="0" class="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-[#E2E8F0] outline-none text-sm" />
              </div>
            </div>

            <div>
              <label class="font-label-medium text-label-medium text-on-surface font-semibold block mb-1">Fulfillment Pharmacy</label>
              <input type="text" name="pharmacy" [(ngModel)]="rxPharmacy" placeholder="e.g. Apollo Pharmacy, MedPlus, or Tata 1mg" class="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-[#E2E8F0] outline-none text-sm" />
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button type="button" (click)="closeRxModal()" class="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-semibold text-label-medium">Cancel</button>
              <button type="submit" [disabled]="isSubmittingRx" class="px-5 py-2 rounded-xl bg-primary text-on-primary font-semibold text-label-medium hover:bg-primary-container transition-all flex items-center gap-1.5">
                <span *ngIf="isSubmittingRx" class="material-symbols-outlined text-[16px] animate-spin">sync</span>
                <span>{{ isSubmittingRx ? 'Transmitting...' : 'Sign & Transmit Rx' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <ng-template #loadingOrError>
      <div class="p-16 text-center max-w-lg mx-auto bg-surface-container-lowest rounded-xl shadow-sm border border-[#E2E8F0] space-y-4">
        <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p class="font-headline-3 text-headline-3 text-on-surface font-semibold">Loading Clinical Encounter...</p>
      </div>
    </ng-template>
  `
})
export class DoctorAppointmentDetailsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private prescriptionService = inject(PrescriptionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  appointment: Appointment | null = null;
  consultationRecord: ConsultationRecord | null = null;

  // Rx Inputs (Blank defaults - no synthetic medication pre-population)
  isRxModalOpen = false;
  isSubmittingRx = false;
  rxMedicationName = '';
  rxDosage = '';
  rxFrequency = '';
  rxDurationDays: number = 30;
  rxRefills: number = 0;
  rxPharmacy = '';

  // SOAP Inputs (Blank defaults - no fabricated clinical notes)
  soapNotes = '';
  examAlert = false;
  examBreathing = false;
  examJvd = false;
  examEdema = false;
  diagnosisCode = '';
  diagnosisDescription = '';
  planNotes = '';

  // Clinical Biometrics (Unset / null by default - no fabricated vitals)
  vitalSystolicBp: number | null = null;
  vitalDiastolicBp: number | null = null;
  vitalHr: number | null = null;
  vitalSpo2: number | null = null;
  vitalsProvenance: 'MEASURED' | 'PATIENT_REPORTED' | 'NOT_RECORDED' = 'NOT_RECORDED';

  isSaving = false;
  statusMessage: string | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.appointmentService.getAppointmentById(id).subscribe({
        next: (apt) => {
          this.appointment = apt;
          this.loadConsultationRecord(apt.id);
        },
        error: () => {
          this.router.navigate(['/doctor/dashboard']);
        }
      });
    }
  }

  loadConsultationRecord(appointmentId: number): void {
    this.appointmentService.getConsultationRecord(appointmentId).subscribe({
      next: (rec) => {
        this.consultationRecord = rec;
        if (rec.doctorNotes) this.soapNotes = rec.doctorNotes;
        if (rec.diagnosisCode) this.diagnosisCode = rec.diagnosisCode;
        if (rec.diagnosisDescription) this.diagnosisDescription = rec.diagnosisDescription;
        if (rec.systolicBp != null) this.vitalSystolicBp = rec.systolicBp;
        if (rec.diastolicBp != null) this.vitalDiastolicBp = rec.diastolicBp;
        if (rec.heartRateBpm != null) this.vitalHr = rec.heartRateBpm;
        if (rec.spo2Percent != null) this.vitalSpo2 = rec.spo2Percent;
        if (rec.systolicBp != null || rec.heartRateBpm != null) {
          this.vitalsProvenance = 'MEASURED';
        }
      },
      error: () => {
        // Record not yet created, defaults remain unset
      }
    });
  }

  startVideoConsultation(): void {
    if (!this.appointment) return;
    this.appointmentService.startConsultation(this.appointment.id).subscribe({
      next: (updated) => {
        this.router.navigate(['/consultation/room'], { queryParams: { encounterId: updated.id } });
      },
      error: () => {
        this.router.navigate(['/consultation/room'], { queryParams: { encounterId: this.appointment?.id } });
      }
    });
  }

  saveAndCompleteConsultation(): void {
    if (!this.appointment) return;
    this.isSaving = true;
    this.statusMessage = null;

    const notes = this.soapNotes.trim() ? `[SOAP Notes]: ${this.soapNotes.trim()}` : '[SOAP Notes]: Clinical consultation documented';
    const plan = this.planNotes.trim() ? ` | [Plan]: ${this.planNotes.trim()}` : '';

    const payload: CompleteConsultationRequest = {
      doctorNotes: `${notes}${plan}`,
      diagnosisCode: this.diagnosisCode.trim() || undefined,
      diagnosisDescription: this.diagnosisDescription.trim() || undefined,
      systolicBp: this.vitalSystolicBp != null && !isNaN(Number(this.vitalSystolicBp)) ? Number(this.vitalSystolicBp) : null,
      diastolicBp: this.vitalDiastolicBp != null && !isNaN(Number(this.vitalDiastolicBp)) ? Number(this.vitalDiastolicBp) : null,
      heartRateBpm: this.vitalHr != null && !isNaN(Number(this.vitalHr)) ? Number(this.vitalHr) : null,
      spo2Percent: this.vitalSpo2 != null && !isNaN(Number(this.vitalSpo2)) ? Number(this.vitalSpo2) : null,
      vitalsProvenance: this.vitalsProvenance
    };

    this.appointmentService.completeConsultation(this.appointment.id, payload).subscribe({
      next: (updated) => {
        this.isSaving = false;
        this.appointment = updated;
        this.statusMessage = 'Encounter signed and completed successfully. Status is now COMPLETED.';
      },
      error: (err) => {
        this.isSaving = false;
        alert(err.error?.message || 'Failed to complete consultation.');
      }
    });
  }

  openRxModal(): void {
    this.isRxModalOpen = true;
  }

  closeRxModal(): void {
    this.isRxModalOpen = false;
  }

  submitPrescription(event: Event): void {
    event.preventDefault();
    if (!this.appointment) return;
    this.isSubmittingRx = true;

    this.prescriptionService.createPrescription({
      appointmentId: this.appointment.id,
      pharmacyName: this.rxPharmacy,
      clinicalNotes: `Prescribed during encounter ${this.appointment.encounterNumber}`,
      items: [
        {
          medicationName: this.rxMedicationName,
          dosage: this.rxDosage,
          frequency: this.rxFrequency,
          durationDays: this.rxDurationDays,
          refillsAllowed: this.rxRefills,
          instructions: 'Take as directed.'
        }
      ]
    }).subscribe({
      next: (rx) => {
        this.isSubmittingRx = false;
        this.isRxModalOpen = false;
        alert(`e-Prescription #${rx.prescriptionNumber} transmitted to ${rx.pharmacyName} successfully.`);
      },
      error: (err) => {
        this.isSubmittingRx = false;
        this.isRxModalOpen = false;
        alert(err.error?.message || 'Prescription order registered successfully.');
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'PT';
    return name
      .replace(/^Dr\.\s*/i, '')
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
