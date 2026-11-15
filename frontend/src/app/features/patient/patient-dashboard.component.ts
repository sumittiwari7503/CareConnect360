import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { Appointment } from '../../core/models/appointment.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  template: `
    <div class="space-y-space-xl max-w-7xl mx-auto">
      <!-- Welcome Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-surface-container text-primary font-caption-caps text-caption-caps font-semibold mb-1">
            PATIENT CARE PORTAL • V1.0
          </div>
          <h1 class="font-display text-display text-on-surface tracking-tight">Good morning, {{ patientName }}</h1>
          <p class="font-body-regular text-body-regular text-on-surface-variant">
            Here is your clinical schedule, telemetry biometrics, and upcoming consultations.
          </p>
        </div>

        <div class="flex items-center gap-space-sm">
          <a routerLink="/patient/find-doctors" class="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-medium text-label-medium font-semibold shadow-sm hover:bg-primary-container transition-all flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">calendar_add_on</span>
            <span>Book an Appointment</span>
          </a>
        </div>
      </div>

      <!-- Hero Card: Next Appointment -->
      <div *ngIf="upcomingAppointment as nextAppt; else noUpcomingAppointment" class="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-[#E2E8F0]">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div class="flex items-start gap-space-md">
            <div class="w-12 h-12 rounded-xl bg-[#F0FDFA] text-primary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[28px]">videocam</span>
            </div>
            <div>
              <div class="flex items-center gap-space-sm mb-1">
                <app-status-badge [status]="nextAppt.status"></app-status-badge>
                <span class="font-label-medium text-label-medium text-secondary">{{ nextAppt.scheduledTime | date:'dd/MM/yyyy • hh:mm a' }} IST</span>
              </div>
              <h2 class="font-headline-2 text-headline-2 text-on-surface font-bold">{{ nextAppt.doctorName }}</h2>
              <p class="font-body-regular text-body-regular text-on-surface-variant">
                Encounter: <strong>{{ nextAppt.encounterNumber }}</strong> • {{ nextAppt.chiefComplaint || 'Virtual Consultation Visit' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-space-sm">
            <a [routerLink]="['/consultation/room']" [queryParams]="{ appointmentId: nextAppt.id }" class="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-medium text-label-medium font-semibold hover:bg-primary-container transition-all flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">meeting_room</span>
              <span>Join Consultation Room</span>
            </a>
          </div>
        </div>
      </div>

      <ng-template #noUpcomingAppointment>
        <div class="rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <div class="flex items-center gap-space-md">
            <div class="w-12 h-12 rounded-xl bg-surface-container-low text-secondary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[28px]">event_busy</span>
            </div>
            <div>
              <h2 class="font-headline-2 text-headline-2 text-on-surface font-bold">No Upcoming Consultations</h2>
              <p class="font-body-regular text-body-regular text-on-surface-variant">
                You currently have no scheduled appointments. Find board-certified specialists and schedule a virtual visit.
              </p>
            </div>
          </div>
          <a routerLink="/patient/find-doctors" class="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-medium text-label-medium font-semibold hover:bg-primary-container transition-all flex items-center gap-2 shrink-0">
            <span class="material-symbols-outlined text-[18px]">search</span>
            <span>Find a Doctor</span>
          </a>
        </div>
      </ng-template>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-space-md">
        <div class="p-space-md rounded-xl bg-surface-container-lowest border border-[#E2E8F0] shadow-sm">
          <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase">Blood Pressure</span>
          <div class="font-headline-1 text-headline-1 text-on-surface font-bold mt-1">{{ latestVitals.bp }} <span class="text-xs font-normal text-secondary">mmHg</span></div>
          <span class="text-xs text-primary font-medium">{{ latestVitals.bpStatus }}</span>
        </div>
        <div class="p-space-md rounded-xl bg-surface-container-lowest border border-[#E2E8F0] shadow-sm">
          <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase">Resting Heart Rate</span>
          <div class="font-headline-1 text-headline-1 text-on-surface font-bold mt-1">{{ latestVitals.hr }} <span class="text-xs font-normal text-secondary">bpm</span></div>
          <span class="text-xs text-primary font-medium">{{ latestVitals.hrStatus }}</span>
        </div>
        <div class="p-space-md rounded-xl bg-surface-container-lowest border border-[#E2E8F0] shadow-sm">
          <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase">Oxygen Saturation</span>
          <div class="font-headline-1 text-headline-1 text-on-surface font-bold mt-1">{{ latestVitals.spo2 }} <span class="text-xs font-normal text-secondary">SpO2</span></div>
          <span class="text-xs text-primary font-medium">{{ latestVitals.spo2Status }}</span>
        </div>
        <div class="p-space-md rounded-xl bg-surface-container-lowest border border-[#E2E8F0] shadow-sm">
          <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase">Active Prescriptions</span>
          <div class="font-headline-1 text-headline-1 text-on-surface font-bold mt-1">{{ latestVitals.medsCount }} <span class="text-xs font-normal text-secondary">meds</span></div>
          <span class="text-xs text-secondary font-medium">{{ latestVitals.medsList }}</span>
        </div>
      </div>
    </div>
  `
})
export class PatientDashboardComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);
  appointments: Appointment[] = [];

  latestVitals = {
    bp: '--/--',
    bpStatus: 'No Telemetry Recorded',
    hr: '--',
    hrStatus: 'Awaiting Vitals',
    spo2: '--%',
    spo2Status: 'Awaiting Telemetry',
    medsCount: 0,
    medsList: 'None Recorded'
  };

  get patientName(): string {
    const user = this.authService.currentUser();
    return user ? user.fullName : 'Patient';
  }

  get upcomingAppointment(): Appointment | null {
    if (!this.appointments || this.appointments.length === 0) return null;
    return this.appointments.find(a => a.status === 'CONFIRMED' || a.status === 'SCHEDULED' || a.status === 'IN_PROGRESS') || this.appointments[0];
  }

  ngOnInit(): void {
    this.appointmentService.getAppointments().subscribe({
      next: (data) => (this.appointments = data),
      error: () => {}
    });
  }
}
