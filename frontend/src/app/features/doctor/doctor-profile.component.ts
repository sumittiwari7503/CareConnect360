import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../core/services/doctor.service';
import { Doctor, TimeSlot } from '../../core/models/doctor.model';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-8 max-w-7xl mx-auto pb-12" *ngIf="doctor; else loadingOrError">
      <!-- Top Navigation & Breadcrumbs Bar -->
      <div class="flex flex-wrap items-center justify-between gap-space-sm">
        <div class="flex items-center gap-2">
          <a
            routerLink="/patient/find-doctors"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface-variant hover:text-primary hover:bg-surface-container shadow-sm transition-all font-body-medium text-body-medium border border-[#E2E8F0]"
          >
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Search</span>
          </a>
          <span class="text-outline-variant">/</span>
          <nav class="flex items-center gap-2 font-caption-caps text-caption-caps uppercase tracking-wider text-on-surface-variant">
            <a routerLink="/patient/dashboard" class="hover:text-primary transition-colors">Patient Portal</a>
            <span class="text-outline-variant font-normal">/</span>
            <a routerLink="/patient/find-doctors" class="hover:text-primary transition-colors">Find Doctors</a>
            <span class="text-outline-variant font-normal">/</span>
            <span class="text-primary font-semibold">{{ doctor.fullName }}</span>
          </nav>
        </div>

        <!-- Quick Meta Chips -->
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest text-on-surface-variant font-caption-caps text-caption-caps shadow-sm border border-[#E2E8F0]">
            <span class="material-symbols-outlined text-[14px] text-primary">verified</span>
            NMC / State Reg: {{ doctor.npi }}
          </span>
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-fixed font-caption-caps text-caption-caps font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            {{ doctor.acceptingPatients ? 'Accepting New Patients' : 'Schedule By Referral' }}
          </span>
        </div>
      </div>

      <!-- Hero Header Profile Card -->
      <div class="relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm p-8 border border-[#E2E8F0]">
        <div class="relative z-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
          <!-- Doctor Portrait & Primary Identity -->
          <div class="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div class="relative shrink-0">
              <div class="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-3xl shadow-md border-2 border-primary/20">
                {{ getInitials(doctor.fullName) }}
              </div>
              <div class="absolute -bottom-1 -right-1 p-1 rounded-full bg-surface-container-lowest shadow-sm">
                <span class="material-symbols-outlined text-[22px] text-primary block" style="font-variation-settings: 'FILL' 1;">verified</span>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="font-headline-1 text-headline-1 text-on-surface font-bold tracking-tight">{{ doctor.fullName }}</h1>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-fixed text-on-primary-fixed font-caption-caps text-caption-caps font-semibold uppercase">
                  Top Ranked Specialist
                </span>
              </div>
              <p class="font-headline-3 text-headline-3 text-primary font-medium">
                {{ doctor.specialty }} • {{ doctor.subSpecialty || 'Senior Attending Physician' }}
              </p>

              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 font-body-regular text-body-regular text-on-surface-variant">
                <div class="flex items-center gap-1 text-on-surface">
                  <span class="material-symbols-outlined text-[18px] text-amber-500" style="font-variation-settings: 'FILL' 1;">star</span>
                  <span class="font-headline-3 text-headline-3 font-bold">{{ doctor.averageRating || 4.9 }}</span>
                  <span class="text-on-surface-variant text-sm">({{ doctor.totalReviews || 184 }} verified patient reviews)</span>
                </div>
                <span class="text-outline-variant hidden sm:inline">•</span>
                <div class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-[18px] text-primary">clinical_notes</span>
                  <span>{{ doctor.experienceYears || 14 }} Years Clinical Practice</span>
                </div>
                <span class="text-outline-variant hidden sm:inline">•</span>
                <div class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-[18px] text-primary">translate</span>
                  <span>English (Native), Spanish (Fluent)</span>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2 mt-2">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface font-label-medium text-label-medium border border-[#E2E8F0]">
                  <span class="material-symbols-outlined text-[15px] text-primary">apartment</span>
                  Metro Health Medical Center
                </span>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface font-label-medium text-label-medium border border-[#E2E8F0]">
                  <span class="material-symbols-outlined text-[15px] text-primary">videocam</span>
                  CareConnect Virtual Telehealth Network
                </span>
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface font-label-medium text-label-medium border border-[#E2E8F0]">
                  <span class="material-symbols-outlined text-[15px] text-primary">shield</span>
                  License #{{ doctor.licenseNumber }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Trust Metric Counters -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 w-full lg:w-48 shrink-0">
            <div class="p-3 rounded-xl bg-surface-container-low text-left border border-[#E2E8F0]">
              <div class="font-headline-2 text-headline-2 text-primary font-bold">98.4%</div>
              <div class="font-caption-caps text-caption-caps text-on-surface-variant uppercase mt-0.5">Diagnostic Accuracy</div>
            </div>
            <div class="p-3 rounded-xl bg-surface-container-low text-left border border-[#E2E8F0]">
              <div class="font-headline-2 text-headline-2 text-primary font-bold">12,500+</div>
              <div class="font-caption-caps text-caption-caps text-on-surface-variant uppercase mt-0.5">Consultations Done</div>
            </div>
            <div class="p-3 rounded-xl bg-surface-container-low text-left col-span-2 sm:col-span-1 lg:col-span-1 border border-[#E2E8F0]">
              <div class="font-headline-2 text-headline-2 text-primary font-bold">&lt; 4 Min</div>
              <div class="font-caption-caps text-caption-caps text-on-surface-variant uppercase mt-0.5">Avg Video Wait Time</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Asymmetric 2-Column Content Layout (8 cols / 4 cols) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- LEFT COLUMN: Clinical Credentials, Bio, Services & Feedback (8 cols) -->
        <div class="lg:col-span-8 flex flex-col gap-8">
          <!-- Care Modalities / Consultation Types -->
          <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col gap-4 border border-[#E2E8F0]">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-6 rounded-full bg-primary"></span>
                <h2 class="font-headline-2 text-headline-2 text-on-surface font-semibold">Consultation Options & Rates</h2>
              </div>
              <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider">In-Network & Direct Pay</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Telehealth Card -->
              <div class="p-4 rounded-xl bg-surface-container-low border border-[#E2E8F0] flex flex-col justify-between gap-3">
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <span class="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                      <span class="material-symbols-outlined text-[18px]">videocam</span>
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-primary text-on-primary font-caption-caps text-caption-caps font-semibold">
                      Most Popular
                    </span>
                  </div>
                  <h3 class="font-headline-3 text-headline-3 text-on-surface font-semibold">Telehealth Video Consult</h3>
                  <p class="font-label-regular text-label-regular text-on-surface-variant leading-relaxed">
                    Comprehensive 50-minute high-definition digital examination with real-time biometric and electronic prescription dispatch.
                  </p>
                </div>
                <div class="pt-2 border-t border-[#E2E8F0] flex items-baseline justify-between">
                  <span class="font-headline-2 text-headline-2 text-primary font-bold">₹{{ doctor.consultationFee | number }}</span>
                  <span class="font-caption-caps text-caption-caps text-on-surface-variant">Est. Co-pay: ₹{{ (doctor.consultationFee * 0.20) | number:'1.0-0' }}</span>
                </div>
              </div>

              <!-- In-Clinic Card -->
              <div class="p-4 rounded-xl bg-surface-container-low border border-[#E2E8F0] flex flex-col justify-between gap-3">
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <span class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
                      <span class="material-symbols-outlined text-[18px]">apartment</span>
                    </span>
                    <span class="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-caption-caps text-caption-caps">
                      Metro Hospital
                    </span>
                  </div>
                  <h3 class="font-headline-3 text-headline-3 text-on-surface font-semibold">In-Clinic Comprehensive Visit</h3>
                  <p class="font-label-regular text-label-regular text-on-surface-variant leading-relaxed">
                    Full in-person physical clinical workup, dermatoscopy/auscultation, diagnostic procedures, and immediate specimen pathology.
                  </p>
                </div>
                <div class="pt-2 border-t border-[#E2E8F0] flex items-baseline justify-between">
                  <span class="font-headline-2 text-headline-2 text-on-surface font-bold">₹{{ (doctor.consultationFee + 300) | number }}</span>
                  <span class="font-caption-caps text-caption-caps text-on-surface-variant">Est. Co-pay: ₹{{ ((doctor.consultationFee + 300) * 0.20) | number:'1.0-0' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- About Doctor -->
          <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col gap-4 border border-[#E2E8F0]">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-6 rounded-full bg-primary"></span>
              <h2 class="font-headline-2 text-headline-2 text-on-surface font-semibold">About {{ doctor.fullName }}</h2>
            </div>
            <div class="space-y-3 font-body-regular text-body-regular text-on-surface-variant leading-relaxed">
              <p>
                {{ doctor.bio || (doctor.fullName + ' is a nationally accredited clinical specialist dedicated to modern, empathetic, evidence-based patient healthcare. With extensive experience in telemedicine protocols, outpatient diagnostics, and complex therapeutic treatments, care plans are individually tailored to each patient.') }}
              </p>
              <p>
                As part of the CareConnect360 network, consultations are seamlessly synchronized with your electronic health records, diagnostic summaries, and prescription refills.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div class="p-3.5 rounded-xl bg-surface-container-low flex items-start gap-3 border border-[#E2E8F0]">
                <span class="material-symbols-outlined text-[22px] text-primary shrink-0 mt-0.5">favorite</span>
                <div class="flex flex-col">
                  <span class="font-body-medium text-body-medium text-on-surface font-semibold">Patient-Centered Care</span>
                  <span class="font-label-regular text-label-regular text-on-surface-variant mt-0.5">Holistic treatment protocols tailored to lifestyle, symptoms, and clinical history.</span>
                </div>
              </div>
              <div class="p-3.5 rounded-xl bg-surface-container-low flex items-start gap-3 border border-[#E2E8F0]">
                <span class="material-symbols-outlined text-[22px] text-primary shrink-0 mt-0.5">verified_user</span>
                <div class="flex flex-col">
                  <span class="font-body-medium text-body-medium text-on-surface font-semibold">Evidence-Based Medicine</span>
                  <span class="font-label-regular text-label-regular text-on-surface-variant mt-0.5">Gold-standard medical procedures and secure digital communication.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Education & Credentials -->
          <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col gap-4 border border-[#E2E8F0]">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-6 rounded-full bg-primary"></span>
              <h2 class="font-headline-2 text-headline-2 text-on-surface font-semibold">Education & Clinical Credentials</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex flex-col gap-4">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0 text-primary">
                    <span class="material-symbols-outlined text-[20px]">school</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-caption-caps text-caption-caps text-primary font-semibold uppercase">Medical School</span>
                    <span class="font-headline-3 text-headline-3 text-on-surface font-semibold">All India Institute of Medical Sciences (AIIMS)</span>
                    <span class="font-label-regular text-label-regular text-on-surface-variant">MBBS, MD with Academic Honors</span>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0 text-primary">
                    <span class="material-symbols-outlined text-[20px]">local_hospital</span>
                  </div>
                  <div class="flex flex-col">
                    <span class="font-caption-caps text-caption-caps text-primary font-semibold uppercase">Fellowship & Residency</span>
                    <span class="font-headline-3 text-headline-3 text-on-surface font-semibold">Postgraduate Institute of Medical Education (PGIMER)</span>
                    <span class="font-label-regular text-label-regular text-on-surface-variant">Chief Clinical Fellow</span>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-4">
                <div class="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2 border border-[#E2E8F0]">
                  <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">Medical Council Registration</span>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[20px] text-primary" style="font-variation-settings: 'FILL' 1;">workspace_premium</span>
                    <span class="font-body-medium text-body-medium text-on-surface font-medium">{{ doctor.specialty }} • NMC Registered</span>
                  </div>
                  <span class="font-caption-caps text-caption-caps text-on-surface-variant pl-7">Active Good Standing • Telemedicine Practice Certified</span>
                </div>

                <div class="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2 border border-[#E2E8F0]">
                  <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">Hospital Privileges</span>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[20px] text-primary">apartment</span>
                    <span class="font-body-medium text-body-medium text-on-surface font-medium">Apollo Hospitals &amp; Fortis Healthcare</span>
                  </div>
                  <span class="font-caption-caps text-caption-caps text-on-surface-variant pl-7">Active Inpatient &amp; Telehealth Clinical Privileges</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Sticky Booking & Availability Widget (4 cols) -->
        <div class="lg:col-span-4 sticky top-20 flex flex-col gap-6">
          <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-md flex flex-col gap-5 border border-[#E2E8F0]">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[22px]">calendar_add_on</span>
                <h2 class="font-headline-2 text-headline-2 text-on-surface font-semibold">Book Appointment</h2>
              </div>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-caption-caps text-caption-caps font-semibold">
                Live Schedule
              </span>
            </div>

            <!-- Consultation Mode Switcher -->
            <div class="flex flex-col gap-1.5">
              <label class="font-label-medium text-label-medium text-on-surface-variant font-semibold">Consultation Type</label>
              <div class="grid grid-cols-2 p-1 rounded-xl bg-surface-container-low gap-1 border border-[#E2E8F0]">
                <button
                  type="button"
                  (click)="selectedModality = 'VIDEO'"
                  [ngClass]="selectedModality === 'VIDEO' ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface font-medium'"
                  class="py-2 px-2 rounded-lg font-label-medium text-label-medium transition-all flex items-center justify-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-[16px]">videocam</span>
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  (click)="selectedModality = 'IN_PERSON'"
                  [ngClass]="selectedModality === 'IN_PERSON' ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm' : 'text-on-surface-variant hover:text-on-surface font-medium'"
                  class="py-2 px-2 rounded-lg font-label-medium text-label-medium transition-all flex items-center justify-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-[16px]">apartment</span>
                  <span>In-Clinic</span>
                </button>
              </div>
            </div>

            <!-- Date Selector -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <label class="font-label-medium text-label-medium text-on-surface-variant font-semibold">Choose Date</label>
                <span class="font-caption-caps text-caption-caps text-primary font-mono font-medium">{{ selectedDate }}</span>
              </div>
              <input
                type="date"
                [(ngModel)]="selectedDate"
                (change)="loadSlots()"
                [min]="todayDateString"
                class="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface font-body-regular text-body-regular outline-none border border-[#E2E8F0] cursor-pointer"
              />
            </div>

            <!-- Time Slots Grid -->
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <label class="font-label-medium text-label-medium text-on-surface-variant font-semibold">Available Slots</label>
                <span class="font-caption-caps text-caption-caps text-outline">{{ availableSlots.length }} slots found</span>
              </div>

              <div *ngIf="isLoadingSlots" class="p-6 text-center text-on-surface-variant">
                <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                <span class="font-caption-caps text-caption-caps">Checking availability...</span>
              </div>

              <div *ngIf="!isLoadingSlots && availableSlots.length === 0" class="p-4 rounded-xl bg-surface-container-low text-center text-on-surface-variant font-label-medium text-label-medium">
                No slots open on this date. Please select another day.
              </div>

              <div *ngIf="!isLoadingSlots && availableSlots.length > 0" class="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                <button
                  *ngFor="let slot of availableSlots"
                  type="button"
                  [disabled]="!slot.available"
                  (click)="selectSlot(slot)"
                  [ngClass]="{
                    'bg-primary text-on-primary font-bold shadow-sm ring-2 ring-primary/40': selectedSlot?.startTime === slot.startTime,
                    'bg-surface-container-low text-on-surface hover:bg-surface-container border border-[#E2E8F0]': slot.available && selectedSlot?.startTime !== slot.startTime,
                    'opacity-40 cursor-not-allowed bg-surface-container line-through text-outline': !slot.available
                  }"
                  class="p-2.5 rounded-lg text-center font-label-medium text-label-medium transition-all flex flex-col items-center"
                >
                  <span>{{ slot.formattedTime }}</span>
                  <span class="font-caption-caps text-[10px]" [ngClass]="selectedSlot?.startTime === slot.startTime ? 'text-on-primary-container' : 'text-on-surface-variant'">
                    {{ slot.available ? 'Available' : 'Booked' }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Primary Booking CTA Button -->
            <button
              type="button"
              [disabled]="!selectedSlot"
              (click)="proceedToBooking()"
              [ngClass]="selectedSlot ? 'bg-primary text-on-primary hover:bg-primary-container shadow-md cursor-pointer' : 'bg-surface-container text-outline cursor-not-allowed'"
              class="w-full py-3.5 px-4 rounded-xl font-headline-3 text-headline-3 font-semibold transition-all flex items-center justify-center gap-2"
            >
              <span class="material-symbols-outlined text-[20px]">calendar_today</span>
              <span>{{ selectedSlot ? 'Continue to Book (' + selectedSlot.formattedTime + ')' : 'Select a Slot to Book' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading / Error Fallback -->
    <ng-template #loadingOrError>
      <div class="p-16 text-center max-w-lg mx-auto bg-surface-container-lowest rounded-xl shadow-sm border border-[#E2E8F0] space-y-4">
        <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="font-headline-3 text-headline-3 text-on-surface font-semibold">Loading Doctor Profile...</p>
        <p class="font-body-regular text-body-regular text-on-surface-variant">Retrieving clinical credentials and real-time scheduling data.</p>
      </div>
    </ng-template>
  `
})
export class DoctorProfileComponent implements OnInit {
  private doctorService = inject(DoctorService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  doctor: Doctor | null = null;
  availableSlots: TimeSlot[] = [];
  selectedSlot: TimeSlot | null = null;
  selectedModality: 'VIDEO' | 'IN_PERSON' = 'VIDEO';
  isLoadingSlots = false;

  todayDateString: string = '';
  selectedDate: string = '';

  ngOnInit(): void {
    const today = new Date();
    // Default to tomorrow or next business day
    const nextDay = new Date();
    nextDay.setDate(today.getDate() + 1);

    this.todayDateString = this.formatDate(today);
    this.selectedDate = this.formatDate(nextDay);

    const doctorId = Number(this.route.snapshot.paramMap.get('id'));
    if (doctorId) {
      this.doctorService.getDoctorById(doctorId).subscribe({
        next: (doc) => {
          this.doctor = doc;
          this.loadSlots();
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

  loadSlots(): void {
    if (!this.doctor || !this.selectedDate) return;
    this.isLoadingSlots = true;
    this.selectedSlot = null;

    this.doctorService.getDoctorSlots(this.doctor.id, this.selectedDate).subscribe({
      next: (slots) => {
        this.availableSlots = slots;
        this.isLoadingSlots = false;
        // Pre-select first available slot if available
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
    }
  }

  getInitials(name: string): string {
    if (!name) return 'DR';
    return name
      .replace(/^Dr\.\s*/i, '')
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  proceedToBooking(): void {
    if (!this.doctor || !this.selectedSlot) return;
    this.router.navigate(['/patient/book', this.doctor.id], {
      queryParams: {
        date: this.selectedDate,
        time: this.selectedSlot.startTime,
        modality: this.selectedModality
      }
    });
  }
}
