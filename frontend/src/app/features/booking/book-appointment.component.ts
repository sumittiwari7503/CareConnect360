import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../core/services/doctor.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { Doctor, TimeSlot } from '../../core/models/doctor.model';
import { Appointment, BookingRequest } from '../../core/models/appointment.model';

@Component({
  selector: 'app-book-appointment',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto pb-16" *ngIf="doctor; else loadingDoctor">
      <!-- Breadcrumb Navigation & Security Indicator -->
      <div class="flex items-center justify-between gap-4 mb-2">
        <nav class="flex items-center gap-2 text-on-surface-variant font-body-regular text-body-regular">
          <a routerLink="/patient/find-doctors" class="hover:text-primary transition-colors">Find Doctors</a>
          <span class="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
          <a [routerLink]="['/doctors', doctor.id]" class="hover:text-primary transition-colors">{{ doctor.fullName }}</a>
          <span class="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
          <span class="text-on-surface font-body-medium text-body-medium font-semibold">Book Appointment</span>
        </nav>
        <div class="hidden sm:flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full text-on-surface-variant border border-[#E2E8F0]">
          <span class="material-symbols-outlined text-[15px] text-primary">lock</span>
          <span class="font-caption-caps text-caption-caps">Level-4 Encrypted Telehealth Workflow</span>
        </div>
      </div>

      <!-- Stepper Progress Tracker -->
      <div class="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          <!-- Step 1 -->
          <div class="flex items-center gap-3.5 relative" [ngClass]="{ 'opacity-60': currentStep !== 1 }">
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center font-headline-3 text-headline-3 shrink-0 shadow-sm"
              [ngClass]="currentStep >= 1 ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'"
            >
              1
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-caption-caps text-caption-caps uppercase font-bold tracking-wider" [ngClass]="currentStep === 1 ? 'text-primary' : 'text-on-surface-variant'">
                Step 01 {{ currentStep === 1 ? '• Active' : (currentStep > 1 ? '• Done' : '') }}
              </span>
              <span class="font-headline-3 text-headline-3 text-on-surface truncate">Select Date & Time</span>
            </div>
            <div class="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-6 h-px bg-surface-container-high"></div>
          </div>

          <!-- Step 2 -->
          <div class="flex items-center gap-3.5 relative" [ngClass]="{ 'opacity-60': currentStep !== 2 }">
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center font-headline-3 text-headline-3 shrink-0"
              [ngClass]="currentStep >= 2 ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant'"
            >
              2
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-caption-caps text-caption-caps uppercase font-bold tracking-wider" [ngClass]="currentStep === 2 ? 'text-primary' : 'text-on-surface-variant'">
                Step 02 {{ currentStep === 2 ? '• Active' : (currentStep > 2 ? '• Done' : '') }}
              </span>
              <span class="font-headline-3 text-headline-3 text-on-surface truncate">Patient & Clinical Details</span>
            </div>
            <div class="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-6 h-px bg-surface-container-high"></div>
          </div>

          <!-- Step 3 -->
          <div class="flex items-center gap-3.5" [ngClass]="{ 'opacity-60': currentStep !== 3 }">
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center font-headline-3 text-headline-3 shrink-0"
              [ngClass]="currentStep === 3 ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant'"
            >
              3
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-caption-caps text-caption-caps uppercase font-bold tracking-wider" [ngClass]="currentStep === 3 ? 'text-primary' : 'text-on-surface-variant'">
                Step 03 {{ currentStep === 3 ? '• Active' : '' }}
              </span>
              <span class="font-headline-3 text-headline-3 text-on-surface truncate">Review & Confirmation</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= STEP 1: DATE & TIME ================= -->
      <div *ngIf="currentStep === 1" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Left: Scheduling Engine (7 Cols) -->
        <div class="lg:col-span-7 flex flex-col gap-6">
          <!-- Modality Selector -->
          <div class="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="font-headline-2 text-headline-2 text-on-surface font-semibold">Consultation Modality</h2>
                <p class="font-label-regular text-label-regular text-on-surface-variant mt-0.5">Select how you would prefer to connect with {{ doctor.fullName }}</p>
              </div>
              <span class="px-2.5 py-1 rounded-md bg-secondary-container text-on-secondary-container font-caption-caps text-caption-caps uppercase font-bold">
                Insurance Covered
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Video Option -->
              <div
                (click)="selectedModality = 'VIDEO'"
                class="cursor-pointer p-4 rounded-xl transition-all border-2"
                [ngClass]="selectedModality === 'VIDEO' ? 'border-primary bg-surface-container-lowest shadow-md' : 'border-[#E2E8F0] bg-surface-container-low hover:bg-surface-container'"
              >
                <div class="flex items-start justify-between">
                  <div class="w-10 h-10 rounded-lg bg-surface-container-low text-primary flex items-center justify-center">
                    <span class="material-symbols-outlined text-[24px]">videocam</span>
                  </div>
                  <div class="w-5 h-5 rounded-full flex items-center justify-center" [ngClass]="selectedModality === 'VIDEO' ? 'bg-primary text-on-primary' : 'bg-surface-container text-transparent'">
                    <span class="material-symbols-outlined text-[14px]">check</span>
                  </div>
                </div>
                <div class="mt-4">
                  <div class="flex items-center gap-2">
                    <span class="font-headline-3 text-headline-3 text-on-surface font-semibold">Telehealth Video Call</span>
                    <span class="px-1.5 py-0.5 rounded bg-surface-container-high font-caption-caps text-caption-caps text-on-surface-variant">50 min</span>
                  </div>
                  <p class="font-label-regular text-label-regular text-on-surface-variant mt-1">High-definition WebRTC encrypted room sent upon booking</p>
                  <div class="mt-3 pt-3 border-t border-[#E2E8F0] flex items-baseline justify-between">
                    <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">Verified Co-Pay</span>
                    <div class="text-right">
                      <span class="font-headline-3 text-headline-3 text-primary font-bold">₹{{ (doctor.consultationFee * 0.20) | number:'1.0-0' }}</span>
                      <span class="font-label-regular text-label-regular text-on-surface-variant line-through ml-1">₹{{ doctor.consultationFee | number }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- In-Clinic Option -->
              <div
                (click)="selectedModality = 'IN_PERSON'"
                class="cursor-pointer p-4 rounded-xl transition-all border-2"
                [ngClass]="selectedModality === 'IN_PERSON' ? 'border-primary bg-surface-container-lowest shadow-md' : 'border-[#E2E8F0] bg-surface-container-low hover:bg-surface-container'"
              >
                <div class="flex items-start justify-between">
                  <div class="w-10 h-10 rounded-lg bg-surface-container-low text-on-surface-variant flex items-center justify-center">
                    <span class="material-symbols-outlined text-[24px]">apartment</span>
                  </div>
                  <div class="w-5 h-5 rounded-full flex items-center justify-center" [ngClass]="selectedModality === 'IN_PERSON' ? 'bg-primary text-on-primary' : 'bg-surface-container text-transparent'">
                    <span class="material-symbols-outlined text-[14px]">check</span>
                  </div>
                </div>
                <div class="mt-4">
                  <div class="flex items-center gap-2">
                    <span class="font-headline-3 text-headline-3 text-on-surface font-semibold">In-Clinic Comprehensive</span>
                    <span class="px-1.5 py-0.5 rounded bg-surface-container-high font-caption-caps text-caption-caps text-on-surface-variant">45 min</span>
                  </div>
                  <p class="font-label-regular text-label-regular text-on-surface-variant mt-1">Metro Health Pavilion, Suite 410 (Valet available)</p>
                  <div class="mt-3 pt-3 border-t border-[#E2E8F0] flex items-baseline justify-between">
                    <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">Verified Co-Pay</span>
                    <div class="text-right">
                      <span class="font-headline-3 text-headline-3 text-on-surface font-bold">₹{{ ((doctor.consultationFee + 300) * 0.20) | number:'1.0-0' }}</span>
                      <span class="font-label-regular text-label-regular text-on-surface-variant line-through ml-1">₹{{ (doctor.consultationFee + 300) | number }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Date Picker -->
          <div class="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 class="font-headline-2 text-headline-2 text-on-surface font-semibold">Select Appointment Date</h2>
                <p class="font-label-regular text-label-regular text-on-surface-variant mt-0.5">Choose an open consultation date</p>
              </div>
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low w-fit border border-[#E2E8F0]">
                <span class="material-symbols-outlined text-[18px] text-outline">schedule</span>
                <span class="font-label-medium text-label-medium text-on-surface-variant">Timezone: Asia/Kolkata (IST)</span>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <input
                type="date"
                [(ngModel)]="selectedDate"
                (change)="loadSlots()"
                [min]="todayDateString"
                class="w-full sm:w-64 h-11 px-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-regular text-body-regular outline-none border border-[#E2E8F0] cursor-pointer"
              />
              <span class="font-body-medium text-body-medium text-on-surface-variant">
                {{ formatSelectedDateReadable() }}
              </span>
            </div>
          </div>

          <!-- Slots Grid -->
          <div class="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
            <!-- Hold Banner -->
            <div *ngIf="selectedSlot" class="mb-5 p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between gap-3 border border-[#E2E8F0]">
              <div class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-primary text-[22px]">timer</span>
                <div class="flex flex-col">
                  <span class="font-body-medium text-body-medium text-on-surface font-semibold">Slot Held for Checkout</span>
                  <span class="font-label-regular text-label-regular text-on-surface-variant">
                    Temporarily reserving <strong class="text-primary font-semibold">{{ selectedSlot.formattedTime }} IST</strong>
                  </span>
                </div>
              </div>
              <div class="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-headline-3 text-headline-3 font-bold">
                09:42
              </div>
            </div>

            <!-- Conflict Alert Banner (HTTP 409 or conflict) -->
            <div *ngIf="slotConflictError" class="mb-5 p-4 rounded-xl bg-error-container text-on-error-container flex items-start gap-3 border border-error/30">
              <span class="material-symbols-outlined text-error text-[24px] shrink-0 mt-0.5">warning</span>
              <div class="flex flex-col flex-1">
                <span class="font-body-medium text-body-medium font-bold text-error">Slot Conflict Rejection</span>
                <span class="font-label-regular text-label-regular text-on-error-container mt-0.5">
                  {{ slotConflictError }}
                </span>
                <button
                  type="button"
                  (click)="loadSlots()"
                  class="mt-2 self-start px-3 py-1 bg-surface-container-lowest text-primary rounded font-label-medium text-label-medium font-semibold hover:bg-surface-container"
                >
                  Refresh Available Slots
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between gap-3 mb-4">
              <span class="font-headline-3 text-headline-3 text-on-surface font-semibold">Available Consultation Windows</span>
              <span class="px-2 py-0.5 rounded-full bg-surface-container font-caption-caps text-caption-caps text-on-surface-variant font-bold">
                {{ availableSlots.length }} Slots
              </span>
            </div>

            <div *ngIf="isLoadingSlots" class="p-8 text-center">
              <div class="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p class="font-label-medium text-label-medium text-on-surface-variant">Synchronizing doctor schedule...</p>
            </div>

            <div *ngIf="!isLoadingSlots && availableSlots.length === 0" class="p-6 text-center text-on-surface-variant font-body-regular">
              No available slots for this date. Please pick another business day above.
            </div>

            <div *ngIf="!isLoadingSlots && availableSlots.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                *ngFor="let slot of availableSlots"
                type="button"
                [disabled]="!slot.available"
                (click)="selectSlot(slot)"
                [ngClass]="{
                  'bg-primary text-on-primary ring-2 ring-primary/40 shadow-md font-bold': selectedSlot?.startTime === slot.startTime,
                  'bg-surface-container-low hover:bg-surface-container text-on-surface border border-[#E2E8F0]': slot.available && selectedSlot?.startTime !== slot.startTime,
                  'opacity-40 cursor-not-allowed bg-surface-container line-through text-outline': !slot.available
                }"
                class="p-3 rounded-xl text-center transition-all flex flex-col items-center"
              >
                <span class="font-headline-3 text-headline-3">{{ slot.formattedTime }}</span>
                <span class="font-caption-caps text-caption-caps" [ngClass]="selectedSlot?.startTime === slot.startTime ? 'text-on-primary-container' : 'text-on-surface-variant'">
                  {{ slot.available ? (selectedModality === 'VIDEO' ? '50 min • Video' : '45 min • Clinic') : 'Booked' }}
                </span>
              </button>
            </div>
          </div>

          <!-- Bottom Navigation -->
          <div class="flex items-center justify-between pt-2">
            <a
              [routerLink]="['/doctors', doctor.id]"
              class="px-5 py-3 rounded-xl bg-surface-container-lowest text-on-surface font-body-medium text-body-medium font-semibold hover:bg-surface-container transition-all flex items-center gap-2 shadow-sm border border-[#E2E8F0]"
            >
              <span class="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Doctor Profile</span>
            </a>
            <button
              type="button"
              [disabled]="!selectedSlot"
              (click)="goToStep(2)"
              [ngClass]="selectedSlot ? 'bg-primary text-on-primary hover:bg-primary-container shadow-md cursor-pointer' : 'bg-surface-container text-outline cursor-not-allowed'"
              class="px-7 py-3 rounded-xl font-body-medium text-body-medium font-semibold transition-all flex items-center gap-2"
            >
              <span>Continue to Visit Details</span>
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>

        <!-- Right: Doctor Summary (5 Cols) -->
        <div class="lg:col-span-5 flex flex-col gap-6 sticky top-24">
          <div class="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
            <div class="flex items-start gap-4">
              <div class="h-16 w-16 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-xl shrink-0 shadow-sm">
                {{ getInitials(doctor.fullName) }}
              </div>
              <div class="flex flex-col min-w-0">
                <h3 class="font-headline-2 text-headline-2 text-on-surface font-bold truncate">{{ doctor.fullName }}</h3>
                <span class="font-label-regular text-label-regular text-on-surface-variant">{{ doctor.specialty }}</span>
                <span class="font-caption-caps text-caption-caps text-outline">NPI: {{ doctor.npi }} • License: {{ doctor.licenseNumber }}</span>
                <div class="flex items-center gap-2 mt-2">
                  <span class="flex items-center gap-0.5 text-amber-700 font-label-medium text-label-medium">
                    <span class="material-symbols-outlined text-[15px]" style="font-variation-settings: 'FILL' 1;">star</span>
                    {{ doctor.averageRating || 4.9 }}
                  </span>
                  <span class="font-caption-caps text-caption-caps text-on-surface-variant">({{ doctor.totalReviews || 184 }} reviews)</span>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-[#E2E8F0] flex flex-col gap-2 font-label-medium text-label-medium">
              <div class="flex items-center justify-between">
                <span class="text-on-surface-variant">Consultation Modality:</span>
                <span class="font-semibold text-on-surface">{{ selectedModality === 'VIDEO' ? 'Telehealth Video Call' : 'In-Clinic Comprehensive' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-on-surface-variant">Selected Date:</span>
                <span class="font-semibold text-on-surface">{{ selectedDate }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-on-surface-variant">Scheduled Window:</span>
                <span class="font-semibold text-primary">{{ selectedSlot ? selectedSlot.formattedTime : 'Not selected' }}</span>
              </div>
              <div class="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                <span class="text-on-surface font-semibold">Estimated Co-Pay:</span>
                <span class="font-headline-3 text-headline-3 text-primary font-bold">₹{{ (doctor.consultationFee * 0.20) | number:'1.0-0' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= STEP 2: PATIENT & CLINICAL DETAILS ================= -->
      <div *ngIf="currentStep === 2" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div class="lg:col-span-7 flex flex-col gap-6">
          <!-- Patient Identification -->
          <div class="p-6 rounded-xl bg-surface-container-lowest shadow-sm border border-[#E2E8F0] flex flex-col gap-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined text-[20px]">badge</span>
                </div>
                <h2 class="font-headline-2 text-headline-2 text-on-surface font-semibold">Patient Identification</h2>
              </div>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-caption-caps text-caption-caps font-semibold">
                <span class="material-symbols-outlined text-[14px]">verified</span> Active Patient Record
              </span>
            </div>

            <!-- Demographics Card -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-container-low border border-[#E2E8F0]">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-lg shrink-0">
                  EV
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="font-headline-3 text-headline-3 text-on-surface font-semibold truncate">{{ patientName }}</span>
                  <span class="font-caption-caps text-caption-caps text-on-surface-variant">DOB: Oct 14, 1988 (Age 36)</span>
                  <span class="font-caption-caps text-caption-caps text-primary font-mono font-semibold">MRN: {{ patientMrn }}</span>
                </div>
              </div>
              <div class="flex flex-col justify-center gap-1 text-on-surface-variant text-sm">
                <div>Email: <strong class="text-on-surface">{{ patientEmail }}</strong></div>
                <div>Phone: <strong class="text-on-surface">+91 98765 43210</strong></div>
                <div class="text-xs text-primary font-medium">Jurisdiction: India (Telemedicine Practice Guidelines 2020)</div>
              </div>
            </div>
          </div>

          <!-- Insurance Card -->
          <div class="p-6 rounded-xl bg-surface-container-lowest shadow-sm border border-[#E2E8F0] flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined text-[20px]">shield</span>
                </div>
                <h2 class="font-headline-2 text-headline-2 text-on-surface font-semibold">Insurance Coverage</h2>
              </div>
              <span class="font-caption-caps text-caption-caps px-2 py-0.5 rounded bg-surface-container-high text-primary font-semibold">
                Verified In-Network
              </span>
            </div>

            <div class="p-4 rounded-xl bg-surface-container-low border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <span class="font-headline-3 text-headline-3 text-on-surface font-semibold">Star Health Comprehensive Insurance</span>
                <p class="font-body-regular text-body-regular text-on-surface-variant">Policy: STAR-IND-••••9024 • Group #8492-AX</p>
                <p class="font-caption-caps text-caption-caps text-primary mt-1">100% Telemedicine Parity Covered (80% Claim, 20% Co-pay)</p>
              </div>
              <div class="text-right">
                <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase">Required Co-Pay</span>
                <span class="font-headline-1 text-headline-1 text-primary font-bold block">₹{{ (doctor.consultationFee * 0.20) | number:'1.0-0' }}</span>
              </div>
            </div>
          </div>

          <!-- Reason for Consultation Form -->
          <div class="p-6 rounded-xl bg-surface-container-lowest shadow-sm border border-[#E2E8F0] flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined text-[20px]">medical_information</span>
                </div>
                <h2 class="font-headline-2 text-headline-2 text-on-surface font-semibold">Reason for Consultation</h2>
              </div>
              <span class="font-caption-caps text-caption-caps text-on-surface-variant">DISHA / ABDM Architecture</span>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-label-medium text-label-medium text-on-surface font-semibold">Primary Clinical Category *</label>
              <select
                [(ngModel)]="primaryCategory"
                class="w-full h-11 px-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-regular text-body-regular outline-none border border-[#E2E8F0] cursor-pointer"
              >
                <option value="General Consultation">General Medical Consultation</option>
                <option value="Routine Follow-up">Routine Follow-up / Health Review</option>
                <option value="New Symptom Evaluation">New Symptom Evaluation</option>
                <option value="Prescription Review">Prescription Review & Refill</option>
                <option value="Chronic Condition Monitoring">Chronic Condition Telemetry Check</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <label class="font-label-medium text-label-medium text-on-surface font-semibold">Chief Complaint & Symptoms *</label>
                <span class="font-caption-caps text-caption-caps text-outline">{{ chiefComplaint.length }} / 300</span>
              </div>
              <textarea
                [(ngModel)]="chiefComplaint"
                maxlength="300"
                rows="3"
                class="w-full p-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline font-body-regular text-body-regular outline-none border border-[#E2E8F0] focus:bg-surface-container-lowest transition-all"
                placeholder="Describe your primary reason for visiting, onset of symptoms, or current medication inquiries..."
              ></textarea>
              <span *ngIf="validationError" class="text-xs font-semibold text-error">
                {{ validationError }}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="font-label-medium text-label-medium text-on-surface font-semibold">Emergency Contact Name</label>
                <input
                  type="text"
                  [(ngModel)]="emergencyContactName"
                  class="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-regular text-body-regular outline-none border border-[#E2E8F0]"
                  placeholder="Full Name (optional)"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="font-label-medium text-label-medium text-on-surface font-semibold">Emergency Contact Phone</label>
                <input
                  type="text"
                  [(ngModel)]="emergencyContactPhone"
                  class="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-regular text-body-regular outline-none border border-[#E2E8F0]"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          <!-- Bottom Step 2 Navigation -->
          <div class="flex items-center justify-between pt-2">
            <button
              type="button"
              (click)="goToStep(1)"
              class="px-5 py-3 rounded-xl bg-surface-container-lowest text-on-surface font-body-medium text-body-medium font-semibold hover:bg-surface-container transition-all flex items-center gap-2 shadow-sm border border-[#E2E8F0]"
            >
              <span class="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back to Time Selection</span>
            </button>
            <button
              type="button"
              [disabled]="isSubmitting"
              (click)="submitBooking()"
              class="px-8 py-3.5 rounded-xl bg-primary text-on-primary font-headline-3 text-headline-3 font-semibold hover:bg-primary-container shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span *ngIf="isSubmitting" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>{{ isSubmitting ? 'Confirming Booking...' : 'Confirm & Reserve Appointment' }}</span>
              <span *ngIf="!isSubmitting" class="material-symbols-outlined text-[20px]">check</span>
            </button>
          </div>
        </div>

        <!-- Right Summary in Step 2 -->
        <div class="lg:col-span-5 flex flex-col gap-6 sticky top-24">
          <div class="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
            <h3 class="font-headline-3 text-headline-3 text-on-surface font-semibold mb-4">Reservation Summary</h3>
            <div class="space-y-3 font-body-medium text-body-medium">
              <div class="flex items-center justify-between">
                <span class="text-on-surface-variant">Attending Doctor:</span>
                <span class="font-semibold text-on-surface">{{ doctor.fullName }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-on-surface-variant">Modality:</span>
                <span class="font-semibold text-primary">{{ selectedModality === 'VIDEO' ? 'Telehealth Video' : 'In-Clinic' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-on-surface-variant">Appointment Date:</span>
                <span class="font-semibold text-on-surface">{{ selectedDate }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-on-surface-variant">Time Window:</span>
                <span class="font-semibold text-primary">{{ selectedSlot ? selectedSlot.formattedTime : '' }}</span>
              </div>
              <div class="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                <span class="font-semibold text-on-surface">Patient Co-Pay:</span>
                <span class="font-headline-2 text-headline-2 text-primary font-bold">₹{{ (doctor.consultationFee * 0.20) | number:'1.0-0' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= STEP 3: CONFIRMATION ================= -->
      <div *ngIf="currentStep === 3 && confirmedAppointment" class="max-w-4xl mx-auto space-y-6">
        <!-- Success Banner -->
        <div class="p-6 rounded-2xl bg-[#F0FDFA] border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-2xl shadow-sm">
              <span class="material-symbols-outlined text-[28px]">check_circle</span>
            </div>
            <div>
              <h2 class="font-headline-1 text-headline-1 text-on-surface font-bold">Appointment Confirmed!</h2>
              <p class="font-body-regular text-body-regular text-on-surface-variant">
                Your consultation has been successfully scheduled and encrypted under Level-4 security protocols.
              </p>
            </div>
          </div>
          <span class="px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-caption-caps text-caption-caps font-bold">
            CONFIRMED
          </span>
        </div>

        <!-- Boarding Pass Aesthetics Card -->
        <div class="rounded-2xl bg-surface-container-lowest shadow-sm border border-[#E2E8F0] overflow-hidden">
          <!-- Top Strip -->
          <div class="px-6 py-3 bg-surface-container-low border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[20px]">confirmation_number</span>
              <span class="font-caption-caps text-caption-caps font-mono font-bold text-on-surface">
                Encounter Code: {{ confirmedAppointment.encounterNumber }}
              </span>
            </div>
            <div class="font-caption-caps text-caption-caps text-on-surface-variant">
              Patient: <strong>{{ confirmedAppointment.patientName }}</strong> (MRN: {{ confirmedAppointment.patientMrn }})
            </div>
          </div>

          <!-- Body -->
          <div class="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-xl shadow-sm">
                  {{ getInitials(confirmedAppointment.doctorName) }}
                </div>
                <div>
                  <span class="font-caption-caps text-caption-caps text-primary font-semibold uppercase">Attending Physician</span>
                  <h3 class="font-headline-2 text-headline-2 text-on-surface font-bold">{{ confirmedAppointment.doctorName }}</h3>
                  <p class="font-body-regular text-body-regular text-on-surface-variant">{{ confirmedAppointment.doctorSpecialty }}</p>
                </div>
              </div>

              <div class="p-4 rounded-xl bg-surface-container-low border border-[#E2E8F0] flex flex-col gap-1">
                <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">Virtual Exam Room</span>
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  <span class="font-headline-3 text-headline-3 text-primary font-bold">Room #CC-9021</span>
                </div>
                <p class="font-caption-caps text-caption-caps text-on-surface-variant mt-1">
                  WebRTC telehealth link activates 10 minutes before start time. Browser camera/mic permissions required.
                </p>
              </div>
            </div>

            <div class="flex flex-col gap-4">
              <div class="grid grid-cols-2 gap-3">
                <div class="p-4 rounded-xl bg-surface-container-low border border-[#E2E8F0]">
                  <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold block mb-1">Date</span>
                  <span class="font-headline-3 text-headline-3 text-on-surface font-bold block">{{ confirmedAppointment.scheduledTime | date:'dd/MM/yyyy' }}</span>
                  <span class="text-xs text-primary font-medium mt-1 inline-flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">event</span> Confirmed
                  </span>
                </div>
                <div class="p-4 rounded-xl bg-surface-container-low border border-[#E2E8F0]">
                  <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold block mb-1">Time</span>
                  <span class="font-headline-3 text-headline-3 text-on-surface font-bold block">{{ confirmedAppointment.scheduledTime | date:'shortTime' }} IST</span>
                  <span class="text-xs text-on-surface-variant mt-1 inline-flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">timer</span> 50 Minutes
                  </span>
                </div>
              </div>

              <div class="p-4 rounded-xl bg-surface-container-low border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">Consultation Modality</span>
                  <span class="font-headline-3 text-headline-3 text-on-surface font-semibold block">{{ confirmedAppointment.modality }}</span>
                </div>
                <div class="text-right">
                  <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">Co-Pay Status</span>
                  <span class="font-headline-3 text-headline-3 text-primary font-bold block">Paid (₹{{ ((doctor.consultationFee || 1000) * 0.20) | number:'1.0-0' }})</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Action Strip -->
          <div class="p-6 bg-surface-container-low/60 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
            <a
              routerLink="/patient/appointments"
              class="px-6 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-medium text-body-medium font-semibold hover:bg-surface-container transition-all border border-[#E2E8F0] shadow-sm flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-[18px]">calendar_today</span>
              <span>View in My Appointments</span>
            </a>
            <a
              routerLink="/consultation/room"
              class="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-body-medium text-body-medium font-semibold hover:bg-primary-container transition-all shadow-md flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-[18px]">meeting_room</span>
              <span>Go to Virtual Consult Room</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Doctor Loading Fallback -->
    <ng-template #loadingDoctor>
      <div class="p-16 text-center max-w-lg mx-auto bg-surface-container-lowest rounded-xl shadow-sm border border-[#E2E8F0] space-y-4">
        <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p class="font-headline-3 text-headline-3 text-on-surface font-semibold">Loading Doctor Booking Schedule...</p>
      </div>
    </ng-template>
  `
})
export class BookAppointmentComponent implements OnInit {
  private doctorService = inject(DoctorService);
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  doctor: Doctor | null = null;
  currentStep = 1;

  // Step 1 values
  selectedModality: 'VIDEO' | 'IN_PERSON' = 'VIDEO';
  todayDateString: string = '';
  selectedDate: string = '';
  availableSlots: TimeSlot[] = [];
  selectedSlot: TimeSlot | null = null;
  isLoadingSlots = false;
  slotConflictError: string | null = null;

  // Step 2 values (Initialized blank - no synthetic patient pre-population)
  patientName = '';
  patientEmail = '';
  patientMrn = '';
  primaryCategory = 'General Consultation';
  chiefComplaint = '';
  emergencyContactName = '';
  emergencyContactPhone = '';
  validationError: string | null = null;
  isSubmitting = false;

  // Step 3 values
  confirmedAppointment: Appointment | null = null;

  ngOnInit(): void {
    const today = new Date();
    const nextDay = new Date();
    nextDay.setDate(today.getDate() + 1);

    this.todayDateString = this.formatDate(today);
    this.selectedDate = this.formatDate(nextDay);

    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.patientName = currentUser.fullName || '';
      this.patientEmail = currentUser.email || '';
    }

    const doctorId = Number(this.route.snapshot.paramMap.get('doctorId'));
    const qp = this.route.snapshot.queryParams;
    if (qp['date']) this.selectedDate = qp['date'];
    if (qp['modality'] === 'IN_PERSON' || qp['modality'] === 'VIDEO') {
      this.selectedModality = qp['modality'];
    }

    if (doctorId) {
      this.doctorService.getDoctorById(doctorId).subscribe({
        next: (doc) => {
          this.doctor = doc;
          this.loadSlots(qp['time'] || qp['preferredTime']);
        },
        error: () => {
          this.router.navigate(['/patient/find-doctors']);
        }
      });
    }
  }

  formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatSelectedDateReadable(): string {
    if (!this.selectedDate) return '';
    try {
      const parts = this.selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return this.selectedDate;
    }
  }

  loadSlots(preferredTime?: string): void {
    if (!this.doctor || !this.selectedDate) return;
    this.isLoadingSlots = true;
    this.slotConflictError = null;

    this.doctorService.getDoctorSlots(this.doctor.id, this.selectedDate).subscribe({
      next: (slots) => {
        this.availableSlots = slots;
        this.isLoadingSlots = false;

        if (preferredTime) {
          const matched = slots.find((s) => s.startTime.includes(preferredTime) && s.available);
          if (matched) {
            this.selectedSlot = matched;
            return;
          }
        }
        const firstAvail = slots.find((s) => s.available);
        if (firstAvail) {
          this.selectedSlot = firstAvail;
        }
      },
      error: () => {
        this.isLoadingSlots = false;
      }
    });
  }

  selectSlot(slot: TimeSlot): void {
    if (slot.available) {
      this.selectedSlot = slot;
      this.slotConflictError = null;
    }
  }

  goToStep(step: number): void {
    if (step === 2 && !this.selectedSlot) {
      return;
    }
    this.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  submitBooking(): void {
    if (!this.doctor || !this.selectedSlot) return;

    if (!this.chiefComplaint.trim()) {
      this.validationError = 'Please provide a brief reason or chief complaint for this consultation.';
      return;
    }
    this.validationError = null;
    this.isSubmitting = true;
    this.slotConflictError = null;

    const bookingPayload: BookingRequest = {
      doctorId: this.doctor.id,
      scheduledTime: this.selectedSlot.startTime,
      durationMinutes: 50,
      modality: this.selectedModality,
      chiefComplaint: `[${this.primaryCategory}] ${this.chiefComplaint.trim()}`,
      emergencyContactName: this.emergencyContactName,
      emergencyContactPhone: this.emergencyContactPhone
    };

    this.appointmentService.scheduleAppointment(bookingPayload).subscribe({
      next: (appointment) => {
        this.isSubmitting = false;
        this.confirmedAppointment = appointment;
        this.currentStep = 3;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.status === 409) {
          // Slot conflict error handling
          this.slotConflictError =
            err.error?.message ||
            `The requested time slot (${this.selectedSlot?.formattedTime}) was just booked by another patient. Please choose an alternate slot.`;
          this.currentStep = 1;
          this.loadSlots();
        } else {
          this.validationError = err.error?.message || 'Failed to complete reservation. Please try again.';
        }
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'CC';
    return name
      .replace(/^Dr\.\s*/i, '')
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
