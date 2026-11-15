import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { Appointment } from '../../core/models/appointment.model';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto pb-16">
      <!-- DASHBOARD TOP BANNER / CLINICAL BRIEFING BAR -->
      <section class="w-full bg-surface-container-lowest rounded-2xl shadow-sm p-6 relative overflow-hidden border border-[#E2E8F0]">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <!-- Title & Clinic Station Metadata -->
          <div class="flex flex-col gap-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap text-xs">
              <span class="px-2.5 py-0.5 rounded bg-surface-container font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">
                Clinical Station 4B
              </span>
              <span class="text-outline-variant">•</span>
              <span class="font-label-medium text-label-medium text-primary flex items-center gap-1 font-semibold">
                <span class="material-symbols-outlined text-[15px]">sensors</span>
                Room #CC-9021 Online
              </span>
              <span class="text-outline-variant">•</span>
              <span class="font-label-regular text-label-regular text-secondary">{{ todayDisplayString }}</span>
            </div>

            <div class="flex items-baseline gap-2 mt-1">
              <h1 class="font-headline-1 text-headline-1 text-on-surface tracking-tight font-bold">
                Good morning, {{ doctorName }}
              </h1>
              <span class="font-body-regular text-body-regular text-on-surface-variant hidden sm:inline">
                — Morning Clinical Telehealth Duty
              </span>
            </div>

            <div class="flex items-center gap-4 mt-1 text-on-surface-variant text-xs">
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px] text-primary">pace</span>
                <span>Shift Progress: <strong>3h 15m remaining</strong></span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px] text-error">emergency</span>
                <span class="text-on-surface">Emergency Care: <strong class="text-primary font-semibold">Metro Trauma Tier-1</strong></span>
              </div>
            </div>
          </div>

          <!-- Right Quick Actions & Availability Controls -->
          <div class="flex items-center gap-3 flex-wrap shrink-0">
            <!-- Duty Mode Switcher -->
            <div class="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl border border-[#E2E8F0]">
              <div class="flex flex-col text-left">
                <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">On-Call Duty</span>
                <span class="font-label-medium text-label-medium text-primary font-bold">
                  {{ isAcceptingCalls ? 'Accepting Calls' : 'Busy / In-Consult' }}
                </span>
              </div>
              <button
                type="button"
                (click)="toggleDuty()"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer"
                [ngClass]="isAcceptingCalls ? 'bg-primary' : 'bg-secondary'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
                  [ngClass]="isAcceptingCalls ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </div>

            <!-- Ad-hoc Room Direct CTA -->
            <a
              routerLink="/consultation/room"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-body-medium text-body-medium font-semibold shadow-md transition-all"
            >
              <span class="material-symbols-outlined text-[18px]">meeting_room</span>
              <span>Open Virtual Room</span>
            </a>
          </div>
        </div>
      </section>

      <!-- CLINICAL KPI ROW (4 BENTO CARDS) -->
      <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <!-- Card 1: Today's Caseload -->
        <div class="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-[#E2E8F0] flex flex-col justify-between">
          <div class="flex items-start justify-between">
            <div class="flex flex-col">
              <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">Today's Caseload</span>
              <div class="flex items-baseline gap-1.5 mt-1">
                <span class="font-display text-display text-on-surface font-bold">{{ appointments.length || 6 }}</span>
                <span class="font-label-medium text-label-medium text-secondary">Scheduled</span>
              </div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-[22px]">calendar_today</span>
            </div>
          </div>
          <div class="mt-4 pt-2 border-t border-[#E2E8F0] flex flex-col gap-1.5">
            <div class="flex items-center justify-between font-label-regular text-label-regular">
              <span class="text-on-surface-variant">Progress</span>
              <span class="font-body-medium text-body-medium text-primary font-semibold">{{ completedCount }} / {{ appointments.length || 6 }} Done</span>
            </div>
            <div class="h-2 w-full bg-surface-container rounded-full overflow-hidden flex">
              <div class="bg-primary h-full transition-all" [style.width.%]="caseloadProgressPercent"></div>
            </div>
          </div>
        </div>

        <!-- Card 2: Live Patient Queue -->
        <div class="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-[#E2E8F0] flex flex-col justify-between">
          <div class="flex items-start justify-between">
            <div class="flex flex-col">
              <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">Live Telehealth Queue</span>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="font-display text-display text-primary font-bold">{{ readyQueueCount }}</span>
                <span class="font-label-medium text-label-medium text-on-surface font-medium">Checked In</span>
              </div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary relative">
              <span class="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-primary opacity-30"></span>
              <span class="material-symbols-outlined text-[22px]">video_call</span>
            </div>
          </div>
          <div class="mt-4 pt-2 border-t border-[#E2E8F0] bg-surface-container-low rounded-lg p-2 flex items-center justify-between">
            <span class="text-xs text-on-surface-variant truncate font-medium">
              {{ readyPatientName }}
            </span>
            <span class="px-2 py-0.5 rounded bg-primary-container text-on-primary font-caption-caps text-[10px] font-bold">
              Ready Now
            </span>
          </div>
        </div>

        <!-- Card 3: EHR Triage Inbox -->
        <div class="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-[#E2E8F0] flex flex-col justify-between">
          <div class="flex items-start justify-between">
            <div class="flex flex-col">
              <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">EHR Clinical Inbox</span>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="font-display text-display text-on-surface font-bold">3</span>
                <span class="font-label-medium text-label-medium text-error font-medium">Pending Tasks</span>
              </div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-error-container/40 flex items-center justify-center text-error">
              <span class="material-symbols-outlined text-[22px]">assignment_late</span>
            </div>
          </div>
          <div class="mt-4 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-on-surface-variant">
            <span>2 Rx Refills</span>
            <span>•</span>
            <span class="text-error font-semibold">1 Critical Lab</span>
            <span>•</span>
            <span class="text-primary font-semibold">Sign All</span>
          </div>
        </div>

        <!-- Card 4: Quality & Compliance -->
        <div class="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-[#E2E8F0] flex flex-col justify-between">
          <div class="flex items-start justify-between">
            <div class="flex flex-col">
              <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">Quality Index</span>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="font-display text-display text-on-surface font-bold">98.4%</span>
                <span class="font-label-medium text-label-medium text-primary font-semibold flex items-center">
                  <span class="material-symbols-outlined text-[16px]">trending_up</span> +2.1%
                </span>
              </div>
            </div>
            <div class="w-10 h-10 rounded-xl bg-secondary-container/40 flex items-center justify-center text-secondary">
              <span class="material-symbols-outlined text-[22px]">verified</span>
            </div>
          </div>
          <div class="mt-4 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-on-surface-variant">
            <span>Level-4 Encrypted</span>
            <span class="px-2 py-0.5 rounded bg-surface-container text-primary font-bold">Audited</span>
          </div>
        </div>
      </section>

      <!-- TWO-COLUMN CLINICAL WORKSPACE -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- LEFT / PRIMARY WORKSPACE (8 COLS) -->
        <div class="lg:col-span-8 flex flex-col gap-6">
          <!-- Schedule Section -->
          <div class="bg-surface-container-lowest rounded-2xl shadow-sm p-6 flex flex-col gap-5 border border-[#E2E8F0]">
            <!-- Header + Filter Tabs -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
              <div>
                <h2 class="font-headline-2 text-headline-2 text-on-surface font-semibold tracking-tight">Today's Schedule & Patient Queue</h2>
                <p class="font-label-regular text-label-regular text-on-surface-variant">Cardiology Virtual Suite 4B • Telehealth Encounters</p>
              </div>

              <!-- Filter tabs -->
              <div class="flex items-center bg-surface-container-low p-1 rounded-xl gap-1 border border-[#E2E8F0]">
                <button
                  type="button"
                  (click)="activeFilter = 'ALL'"
                  [ngClass]="activeFilter === 'ALL' ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface'"
                  class="px-3 py-1 rounded-lg font-label-medium text-label-medium transition-all"
                >
                  All ({{ appointments.length }})
                </button>
                <button
                  type="button"
                  (click)="activeFilter = 'READY'"
                  [ngClass]="activeFilter === 'READY' ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface'"
                  class="px-3 py-1 rounded-lg font-label-medium text-label-medium transition-all flex items-center gap-1"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  Ready ({{ readyQueueCount }})
                </button>
                <button
                  type="button"
                  (click)="activeFilter = 'UPCOMING'"
                  [ngClass]="activeFilter === 'UPCOMING' ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface'"
                  class="px-3 py-1 rounded-lg font-label-medium text-label-medium transition-all"
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  (click)="activeFilter = 'COMPLETED'"
                  [ngClass]="activeFilter === 'COMPLETED' ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface'"
                  class="px-3 py-1 rounded-lg font-label-medium text-label-medium transition-all"
                >
                  Completed
                </button>
              </div>
            </div>

            <!-- READY NOW HERO PATIENT CARD -->
            <div *ngIf="heroAppointment" class="rounded-2xl p-5 bg-gradient-to-br from-surface-container-low via-surface-container-lowest to-primary/5 border border-primary/30 shadow-md flex flex-col gap-4">
              <!-- Live Pulse Indicator -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="flex h-3 w-3 relative">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  <span class="font-caption-caps text-caption-caps uppercase text-primary tracking-wide font-bold">
                    Patient Checked In • Ready for Consultation
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-surface-container font-caption-caps text-caption-caps text-on-surface-variant">
                    {{ heroAppointment.modality }}
                  </span>
                  <span class="px-2.5 py-0.5 rounded bg-primary-container text-on-primary font-caption-caps text-caption-caps font-semibold">
                    {{ heroAppointment.scheduledTime | date:'shortTime' }} IST
                  </span>
                </div>
              </div>

              <!-- Patient Core Info -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex items-start gap-4">
                  <div class="w-14 h-14 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-xl shrink-0 shadow-sm">
                    {{ getInitials(heroAppointment.patientName) }}
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <h3 class="font-headline-2 text-headline-2 text-on-surface font-bold">{{ heroAppointment.patientName }}</h3>
                      <span class="px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-caption-caps text-caption-caps">
                        {{ heroAppointment.patientMrn }}
                      </span>
                    </div>
                    <p class="font-body-regular text-body-regular text-on-surface-variant mt-0.5">
                      {{ heroAppointment.chiefComplaint || 'Cardiology follow-up & biometric review' }}
                    </p>
                    <div class="flex items-center gap-2 mt-1 text-on-surface-variant font-caption-caps text-caption-caps">
                      <span class="material-symbols-outlined text-[14px] text-primary">lock</span>
                      <span>Encrypted WebRTC Room #CC-9021</span>
                      <span>•</span>
                      <span>Encounter Code: {{ heroAppointment.encounterNumber }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pre-visit Telemetry Diagnostic Strip -->
              <div class="bg-surface-container-lowest rounded-xl p-3.5 border border-[#E2E8F0] shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-1 font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">
                  <span class="material-symbols-outlined text-[16px] text-primary">monitor_heart</span>
                  <span>Pre-Screened Vitals (Home Hub):</span>
                </div>
                <div class="flex items-center gap-3 flex-wrap font-label-medium text-label-medium">
                  <div class="bg-surface-container-low px-2.5 py-1 rounded-lg">
                    <span class="text-on-surface-variant">BP: </span>
                    <strong class="text-on-surface">118/76</strong>
                    <span class="text-[10px] text-on-surface-variant"> mmHg</span>
                  </div>
                  <div class="bg-surface-container-low px-2.5 py-1 rounded-lg">
                    <span class="text-on-surface-variant">Pulse: </span>
                    <strong class="text-on-surface">72</strong>
                    <span class="text-[10px] text-on-surface-variant"> bpm</span>
                  </div>
                  <div class="bg-surface-container-low px-2.5 py-1 rounded-lg">
                    <span class="text-on-surface-variant">SpO2: </span>
                    <strong class="text-on-surface">99%</strong>
                  </div>
                  <div class="bg-surface-container-low px-2.5 py-1 rounded-lg">
                    <span class="text-on-surface-variant">Weight: </span>
                    <strong class="text-on-surface">142.4</strong>
                    <span class="text-[10px] text-on-surface-variant"> lbs</span>
                  </div>
                </div>
                <div class="flex items-center gap-1 text-primary font-caption-caps text-caption-caps font-semibold">
                  <span class="material-symbols-outlined text-[15px]">check_circle</span>
                  <span>Vitals In Range</span>
                </div>
              </div>

              <!-- Hero Actions -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0]">
                <div class="flex items-center gap-2">
                  <a
                    [routerLink]="['/doctor/appointments', heroAppointment.id]"
                    class="px-4 py-2 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-on-surface font-body-medium text-body-medium shadow-sm border border-[#E2E8F0] flex items-center gap-1.5 transition-all"
                  >
                    <span class="material-symbols-outlined text-[18px] text-secondary">clinical_notes</span>
                    <span>Open EHR Chart & Notes</span>
                  </a>
                </div>

                <button
                  type="button"
                  (click)="startEncounter(heroAppointment)"
                  class="px-6 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container font-body-medium text-body-medium font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[20px]">videocam</span>
                  <span>Start Video Consultation</span>
                </button>
              </div>
            </div>

            <!-- UPCOMING QUEUE LIST -->
            <div class="flex flex-col gap-3 pt-2">
              <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold">
                Scheduled Encounters Today ({{ filteredAppointments.length }})
              </span>

              <div *ngIf="isLoading" class="p-8 text-center">
                <div class="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p class="font-label-medium text-label-medium text-on-surface-variant">Loading patient queue...</p>
              </div>

              <div *ngIf="!isLoading && filteredAppointments.length === 0" class="p-8 text-center bg-surface-container-low rounded-xl text-on-surface-variant font-label-medium">
                No encounters found under this filter.
              </div>

              <div
                *ngFor="let apt of filteredAppointments"
                class="bg-surface-container-lowest hover:bg-surface-container-low/60 transition-colors rounded-xl p-4 border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div class="flex items-start gap-4 min-w-0">
                  <div class="w-12 h-12 rounded-xl bg-surface-container-high flex flex-col items-center justify-center shrink-0">
                    <span class="font-label-medium text-label-medium text-primary font-bold">{{ apt.scheduledTime | date:'shortTime' }}</span>
                  </div>
                  <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h4 class="font-body-medium text-body-medium text-on-surface font-bold truncate">{{ apt.patientName }}</h4>
                      <span class="font-caption-caps text-caption-caps text-on-surface-variant">{{ apt.patientMrn }}</span>
                      <span
                        class="px-2 py-0.5 rounded font-caption-caps text-[10px] font-bold uppercase"
                        [ngClass]="{
                          'bg-[#F0FDFA] text-primary border border-primary/20': apt.status === 'CONFIRMED' || apt.status === 'SCHEDULED',
                          'bg-amber-100 text-amber-800': apt.status === 'IN_PROGRESS',
                          'bg-surface-container text-secondary': apt.status === 'COMPLETED',
                          'bg-error-container text-error': apt.status === 'CANCELLED'
                        }"
                      >
                        {{ apt.status }}
                      </span>
                    </div>
                    <p class="font-body-regular text-body-regular text-on-surface-variant text-xs truncate mt-0.5">
                      {{ apt.chiefComplaint || 'Clinical evaluation' }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <a
                    [routerLink]="['/doctor/appointments', apt.id]"
                    class="px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface font-label-medium text-label-medium hover:bg-surface-container transition-all border border-[#E2E8F0]"
                  >
                    Review Chart
                  </a>
                  <button
                    *ngIf="apt.status === 'CONFIRMED' || apt.status === 'SCHEDULED' || apt.status === 'IN_PROGRESS'"
                    type="button"
                    (click)="startEncounter(apt)"
                    class="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-medium text-label-medium font-semibold hover:bg-primary-container shadow-sm transition-all inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span class="material-symbols-outlined text-[16px]">videocam</span>
                    {{ apt.status === 'IN_PROGRESS' ? 'Resume Call' : 'Start Call' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT SIDEBAR: Clinical Inbox & Fast Prescriptions (4 COLS) -->
        <div class="lg:col-span-4 flex flex-col gap-6">
          <div class="bg-surface-container-lowest rounded-2xl shadow-sm p-6 flex flex-col gap-4 border border-[#E2E8F0]">
            <div class="flex items-center justify-between">
              <h3 class="font-headline-3 text-headline-3 text-on-surface font-bold">Fast Actions</h3>
              <span class="material-symbols-outlined text-outline text-[20px]">bolt</span>
            </div>

            <a
              routerLink="/consultation/room"
              class="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex items-center justify-between border border-[#E2E8F0]"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
                  <span class="material-symbols-outlined text-[20px]">video_camera_front</span>
                </div>
                <div>
                  <h4 class="font-body-medium text-body-medium font-semibold text-on-surface">Virtual Clinic Room</h4>
                  <p class="font-caption-caps text-caption-caps text-on-surface-variant">WebRTC Encrypted Suite</p>
                </div>
              </div>
              <span class="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
            </a>

            <div class="p-4 rounded-xl bg-surface-container-low flex items-center justify-between border border-[#E2E8F0]">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-secondary-container text-secondary flex items-center justify-center">
                  <span class="material-symbols-outlined text-[20px]">prescriptions</span>
                </div>
                <div>
                  <h4 class="font-body-medium text-body-medium font-semibold text-on-surface">e-Prescriptions</h4>
                  <p class="font-caption-caps text-caption-caps text-on-surface-variant">Pharmacy Dispatch Ready</p>
                </div>
              </div>
              <span class="px-2 py-0.5 rounded bg-primary-container text-on-primary font-caption-caps text-caption-caps font-bold">2 Due</span>
            </div>

            <div class="p-4 rounded-xl bg-surface-container-low flex items-center justify-between border border-[#E2E8F0]">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined text-[20px]">schedule</span>
                </div>
                <div>
                  <h4 class="font-body-medium text-body-medium font-semibold text-on-surface">Working Hours</h4>
                  <p class="font-caption-caps text-caption-caps text-on-surface-variant">Mon-Fri 09:00 - 17:00 IST</p>
                </div>
              </div>
              <span class="text-xs text-primary font-semibold">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DoctorDashboardComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  private router = inject(Router);

  appointments: Appointment[] = [];
  isLoading = true;
  isAcceptingCalls = true;
  activeFilter: 'ALL' | 'READY' | 'UPCOMING' | 'COMPLETED' = 'ALL';

  doctorName = 'Dr. Priya Patel, MD';
  todayDisplayString = '';

  ngOnInit(): void {
    const today = new Date();
    this.todayDisplayString = today.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const user = this.authService.currentUser();
    if (user && user.fullName) {
      this.doctorName = 'Dr. ' + user.fullName;
    }

    this.loadAppointments();
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.appointmentService.getAppointments().subscribe({
      next: (data) => {
        this.appointments = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get heroAppointment(): Appointment | null {
    // Return first confirmed/scheduled/in_progress appointment
    return this.appointments.find((a) => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS' || a.status === 'SCHEDULED') || null;
  }

  get readyPatientName(): string {
    return this.heroAppointment ? this.heroAppointment.patientName : 'No patients waiting';
  }

  get readyQueueCount(): number {
    return this.appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS' || a.status === 'SCHEDULED').length;
  }

  get completedCount(): number {
    return this.appointments.filter((a) => a.status === 'COMPLETED').length;
  }

  get caseloadProgressPercent(): number {
    if (!this.appointments.length) return 35;
    return Math.round((this.completedCount / this.appointments.length) * 100);
  }

  get filteredAppointments(): Appointment[] {
    if (this.activeFilter === 'READY') {
      return this.appointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS');
    }
    if (this.activeFilter === 'UPCOMING') {
      return this.appointments.filter((a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED');
    }
    if (this.activeFilter === 'COMPLETED') {
      return this.appointments.filter((a) => a.status === 'COMPLETED');
    }
    return this.appointments;
  }

  toggleDuty(): void {
    this.isAcceptingCalls = !this.isAcceptingCalls;
  }

  startEncounter(apt: Appointment): void {
    this.appointmentService.startConsultation(apt.id).subscribe({
      next: (updated) => {
        this.router.navigate(['/consultation/room'], { queryParams: { encounterId: updated.id } });
      },
      error: () => {
        // Fallback navigation even if state already updated
        this.router.navigate(['/consultation/room'], { queryParams: { encounterId: apt.id } });
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
