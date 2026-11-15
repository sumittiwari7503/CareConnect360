import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../core/services/appointment.service';
import { DoctorService } from '../../core/services/doctor.service';
import { Appointment, RescheduleRequest } from '../../core/models/appointment.model';
import { TimeSlot } from '../../core/models/doctor.model';

@Component({
  selector: 'app-my-appointments',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto pb-16">
      <!-- Page Header & Action Bar -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2">
        <div class="flex flex-col gap-1.5">
          <nav class="flex items-center gap-1.5 font-label-medium text-label-medium text-on-surface-variant">
            <a routerLink="/patient/dashboard" class="hover:text-primary transition-colors">Patient Portal</a>
            <span class="material-symbols-outlined text-[14px]">chevron_right</span>
            <span class="text-primary font-semibold">My Appointments</span>
          </nav>
          <div class="flex items-center gap-3">
            <h1 class="font-display text-display text-on-surface tracking-tight font-bold">My Appointments</h1>
            <span class="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-caption-caps text-caption-caps font-bold uppercase tracking-wider">
              {{ upcomingCount }} Scheduled
            </span>
          </div>
          <p class="font-body-regular text-body-regular text-on-surface-variant max-w-2xl">
            Manage scheduled clinical consultations, access encrypted virtual exam rooms, view visit summaries, or make schedule changes.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 shrink-0">
          <a
            routerLink="/patient/find-doctors"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-body-medium text-body-medium font-semibold shadow-md transition-all"
          >
            <span class="material-symbols-outlined text-[20px]">add</span>
            Book New Appointment
          </a>
        </div>
      </div>

      <!-- Priority Telehealth Banner (for next upcoming visit) -->
      <div
        *ngIf="nextUpcomingAppointment"
        class="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary-container/10 to-surface-container-low border border-primary/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div class="flex items-start md:items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-md text-on-primary">
            <span class="material-symbols-outlined text-[28px]">videocam</span>
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <span class="flex h-2.5 w-2.5 relative">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <span class="font-caption-caps text-caption-caps font-bold tracking-wider text-primary uppercase">
                Next Scheduled Session • {{ nextUpcomingAppointment.scheduledTime | date:'dd/MM/yyyy' }}
              </span>
            </div>
            <h3 class="font-headline-2 text-headline-2 text-on-surface font-bold mt-0.5">
              {{ nextUpcomingAppointment.doctorName }} ({{ nextUpcomingAppointment.doctorSpecialty }})
            </h3>
            <span class="font-caption-caps text-caption-caps text-on-surface-variant mt-0.5">
              Encounter #{{ nextUpcomingAppointment.encounterNumber }} • Scheduled for {{ nextUpcomingAppointment.scheduledTime | date:'shortTime' }} IST
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <a
            routerLink="/consultation/room"
            class="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-body-medium text-body-medium font-semibold shadow-md inline-flex items-center gap-2 transition-all"
          >
            <span class="material-symbols-outlined text-[18px]">videocam</span>
            Enter Virtual Clinic Room
          </a>
        </div>
      </div>

      <!-- Tab Switcher Navigation -->
      <div class="flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
        <button
          type="button"
          (click)="activeTab = 'UPCOMING'"
          [ngClass]="activeTab === 'UPCOMING' ? 'bg-primary-container text-on-primary font-semibold shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-label-medium text-label-medium transition-all"
        >
          <span class="material-symbols-outlined text-[18px]">upcoming</span>
          <span>Upcoming Visits</span>
          <span class="px-2 py-0.5 rounded-full font-caption-caps text-caption-caps font-bold" [ngClass]="activeTab === 'UPCOMING' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'">
            {{ upcomingCount }}
          </span>
        </button>

        <button
          type="button"
          (click)="activeTab = 'COMPLETED'"
          [ngClass]="activeTab === 'COMPLETED' ? 'bg-primary-container text-on-primary font-semibold shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-label-medium text-label-medium transition-all"
        >
          <span class="material-symbols-outlined text-[18px]">check_circle</span>
          <span>Past & Completed</span>
          <span class="px-2 py-0.5 rounded-full font-caption-caps text-caption-caps font-bold" [ngClass]="activeTab === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'">
            {{ completedCount }}
          </span>
        </button>

        <button
          type="button"
          (click)="activeTab = 'CANCELLED'"
          [ngClass]="activeTab === 'CANCELLED' ? 'bg-primary-container text-on-primary font-semibold shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-label-medium text-label-medium transition-all"
        >
          <span class="material-symbols-outlined text-[18px]">cancel</span>
          <span>Cancelled</span>
          <span class="px-2 py-0.5 rounded-full font-caption-caps text-caption-caps font-bold" [ngClass]="activeTab === 'CANCELLED' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'">
            {{ cancelledCount }}
          </span>
        </button>

        <button
          type="button"
          (click)="activeTab = 'ALL'"
          [ngClass]="activeTab === 'ALL' ? 'bg-primary-container text-on-primary font-semibold shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-label-medium text-label-medium transition-all"
        >
          <span class="material-symbols-outlined text-[18px]">list</span>
          <span>All ({{ appointments.length }})</span>
        </button>
      </div>

      <!-- Search & Filters Strip -->
      <div class="p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-[#E2E8F0] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div class="relative w-full md:w-80">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            class="w-full h-10 pl-9 pr-8 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline font-body-regular text-body-regular outline-none border border-[#E2E8F0]"
            placeholder="Search doctor, specialty, code..."
          />
          <button *ngIf="searchQuery" (click)="searchQuery = ''" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-[14px]">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <div class="flex items-center gap-2 w-full md:w-auto justify-end">
          <select
            [(ngModel)]="modalityFilter"
            class="h-10 px-3 pr-8 rounded-lg bg-surface-container-low font-label-medium text-label-medium text-on-surface outline-none border border-[#E2E8F0] cursor-pointer"
          >
            <option value="ALL">All Modalities</option>
            <option value="VIDEO">Video Telehealth</option>
            <option value="IN_PERSON">In-Clinic Visits</option>
          </select>
        </div>
      </div>

      <!-- Success Notification Alert -->
      <div *ngIf="actionSuccessMessage" class="p-4 rounded-xl bg-[#F0FDFA] border border-primary/20 text-on-surface flex items-center justify-between">
        <div class="flex items-center gap-2 text-primary font-semibold text-sm">
          <span class="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{{ actionSuccessMessage }}</span>
        </div>
        <button (click)="actionSuccessMessage = null" class="text-outline hover:text-on-surface">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="p-12 text-center bg-surface-container-lowest rounded-xl shadow-sm border border-[#E2E8F0]">
        <div class="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p class="font-label-medium text-label-medium text-on-surface-variant">Loading your clinical appointments...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && filteredAppointments.length === 0" class="p-12 text-center bg-surface-container-lowest rounded-xl shadow-sm border border-[#E2E8F0] space-y-3">
        <div class="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mx-auto text-outline">
          <span class="material-symbols-outlined text-[28px]">event_busy</span>
        </div>
        <h3 class="font-headline-2 text-headline-2 text-on-surface font-semibold">No appointments found</h3>
        <p class="font-body-regular text-body-regular text-on-surface-variant max-w-sm mx-auto">
          You currently have no consultations listed in this tab. Explore our accredited physicians to schedule care.
        </p>
        <a
          routerLink="/patient/find-doctors"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-medium text-label-medium font-semibold shadow-sm hover:bg-primary-container transition-all"
        >
          <span class="material-symbols-outlined text-[18px]">search</span>
          Find a Doctor
        </a>
      </div>

      <!-- Desktop & Tablet Table View -->
      <div *ngIf="!isLoading && filteredAppointments.length > 0" class="hidden md:block rounded-xl bg-surface-container-lowest shadow-sm border border-[#E2E8F0] overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-low border-b border-[#E2E8F0] text-on-surface-variant font-caption-caps text-caption-caps uppercase tracking-wider font-semibold">
              <th class="py-3.5 px-6">Encounter / Doctor</th>
              <th class="py-3.5 px-6">Date & Window</th>
              <th class="py-3.5 px-6">Modality</th>
              <th class="py-3.5 px-6">Status</th>
              <th class="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E2E8F0] text-body-regular text-body-regular">
            <tr *ngFor="let apt of filteredAppointments" class="hover:bg-surface-container-low/40 transition-colors">
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {{ getInitials(apt.doctorName) }}
                  </div>
                  <div>
                    <span class="font-headline-3 text-headline-3 text-on-surface font-semibold block">{{ apt.doctorName }}</span>
                    <span class="text-xs text-on-surface-variant">{{ apt.doctorSpecialty }} • #{{ apt.encounterNumber }}</span>
                  </div>
                </div>
              </td>
              <td class="py-4 px-6">
                <div class="flex flex-col">
                  <span class="font-body-medium text-body-medium text-on-surface font-medium">{{ apt.scheduledTime | date:'dd/MM/yyyy' }}</span>
                  <span class="text-xs text-primary font-semibold">{{ apt.scheduledTime | date:'shortTime' }} IST ({{ apt.durationMinutes }}m)</span>
                </div>
              </td>
              <td class="py-4 px-6">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container text-on-surface text-xs font-medium">
                  <span class="material-symbols-outlined text-[14px] text-primary">
                    {{ apt.modality === 'VIDEO' ? 'videocam' : 'apartment' }}
                  </span>
                  <span>{{ apt.modality === 'VIDEO' ? 'Telehealth' : 'In-Clinic' }}</span>
                </span>
              </td>
              <td class="py-4 px-6">
                <span
                  class="px-2.5 py-1 rounded-full font-caption-caps text-[11px] font-bold uppercase tracking-wider inline-block"
                  [ngClass]="{
                    'bg-[#F0FDFA] text-primary border border-primary/20': apt.status === 'CONFIRMED' || apt.status === 'SCHEDULED',
                    'bg-surface-container text-secondary': apt.status === 'COMPLETED',
                    'bg-error-container text-error': apt.status === 'CANCELLED',
                    'bg-amber-100 text-amber-800': apt.status === 'RESCHEDULED'
                  }"
                >
                  {{ apt.status }}
                </span>
              </td>
              <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    (click)="openDetailsModal(apt)"
                    class="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
                    title="View Clinical Details"
                  >
                    <span class="material-symbols-outlined text-[18px]">info</span>
                  </button>

                  <a
                    *ngIf="apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED'"
                    routerLink="/consultation/room"
                    class="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all shadow-sm inline-flex items-center gap-1"
                  >
                    <span class="material-symbols-outlined text-[14px]">videocam</span>
                    Join
                  </a>

                  <button
                    *ngIf="apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED'"
                    type="button"
                    (click)="openRescheduleModal(apt)"
                    class="px-2.5 py-1.5 rounded-lg bg-surface-container text-on-surface text-xs font-medium hover:bg-surface-container-high transition-colors"
                  >
                    Reschedule
                  </button>

                  <button
                    *ngIf="apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED'"
                    type="button"
                    (click)="openCancelModal(apt)"
                    class="px-2.5 py-1.5 rounded-lg bg-surface-container-low text-error hover:bg-error-container text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards View -->
      <div *ngIf="!isLoading && filteredAppointments.length > 0" class="md:hidden flex flex-col gap-4">
        <div *ngFor="let apt of filteredAppointments" class="p-5 rounded-xl bg-surface-container-lowest shadow-sm border border-[#E2E8F0] flex flex-col gap-3">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {{ getInitials(apt.doctorName) }}
              </div>
              <div>
                <h4 class="font-headline-3 text-headline-3 text-on-surface font-semibold">{{ apt.doctorName }}</h4>
                <span class="text-xs text-on-surface-variant">{{ apt.doctorSpecialty }}</span>
              </div>
            </div>
            <span
              class="px-2.5 py-0.5 rounded-full font-caption-caps text-[10px] font-bold uppercase"
              [ngClass]="{
                'bg-[#F0FDFA] text-primary': apt.status === 'CONFIRMED' || apt.status === 'SCHEDULED',
                'bg-surface-container text-secondary': apt.status === 'COMPLETED',
                'bg-error-container text-error': apt.status === 'CANCELLED'
              }"
            >
              {{ apt.status }}
            </span>
          </div>

          <div class="p-3 rounded-lg bg-surface-container-low text-xs flex flex-col gap-1 text-on-surface-variant">
            <div>Date: <strong class="text-on-surface">{{ apt.scheduledTime | date:'dd/MM/yyyy' }}</strong></div>
            <div>Time: <strong class="text-primary">{{ apt.scheduledTime | date:'shortTime' }} IST</strong></div>
            <div>Encounter: <span class="font-mono text-on-surface">{{ apt.encounterNumber }}</span></div>
          </div>

          <div class="flex items-center gap-2 pt-2 border-t border-[#E2E8F0]">
            <a
              *ngIf="apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED'"
              routerLink="/consultation/room"
              class="flex-1 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold text-center"
            >
              Join Room
            </a>
            <button
              *ngIf="apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED'"
              type="button"
              (click)="openRescheduleModal(apt)"
              class="flex-1 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-medium text-center"
            >
              Reschedule
            </button>
            <button
              *ngIf="apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED'"
              type="button"
              (click)="openCancelModal(apt)"
              class="py-2 px-3 rounded-lg bg-surface-container-low text-error text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- ================= CANCEL MODAL DIALOG ================= -->
      <div *ngIf="showCancelModal && appointmentToCancel" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div class="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-xl border border-[#E2E8F0] space-y-4">
          <div class="flex items-center gap-3 text-error">
            <div class="w-10 h-10 rounded-full bg-error-container flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px] text-error">event_busy</span>
            </div>
            <div>
              <h3 class="font-headline-3 text-headline-3 font-bold text-on-surface">Cancel Appointment</h3>
              <p class="font-caption-caps text-caption-caps text-on-surface-variant">Encounter #{{ appointmentToCancel.encounterNumber }}</p>
            </div>
          </div>

          <p class="font-body-regular text-body-regular text-on-surface-variant leading-relaxed">
            Are you sure you want to cancel your visit with <strong>{{ appointmentToCancel.doctorName }}</strong> on
            <strong>{{ appointmentToCancel.scheduledTime | date:'mediumDate' }}</strong>? The reserved time slot will be returned to the open schedule.
          </p>

          <div class="flex flex-col gap-1.5">
            <label class="font-label-medium text-label-medium text-on-surface font-semibold">Reason for Cancellation (Optional)</label>
            <input
              type="text"
              [(ngModel)]="cancelReason"
              class="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-regular text-body-regular outline-none border border-[#E2E8F0]"
              placeholder="e.g. Schedule conflict, feeling better..."
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              [disabled]="isProcessingAction"
              (click)="closeCancelModal()"
              class="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-medium text-label-medium hover:bg-surface-container-high transition-colors"
            >
              Keep Visit
            </button>
            <button
              type="button"
              [disabled]="isProcessingAction"
              (click)="confirmCancellation()"
              class="px-5 py-2 rounded-lg bg-error text-on-error font-label-medium text-label-medium font-semibold hover:opacity-90 transition-opacity"
            >
              {{ isProcessingAction ? 'Cancelling...' : 'Confirm Cancellation' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ================= RESCHEDULE MODAL DIALOG ================= -->
      <div *ngIf="showRescheduleModal && appointmentToReschedule" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div class="w-full max-w-lg rounded-2xl bg-surface-container-lowest p-6 shadow-xl border border-[#E2E8F0] space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">calendar_sync</span>
              </div>
              <div>
                <h3 class="font-headline-3 text-headline-3 font-bold text-on-surface">Reschedule Visit</h3>
                <p class="font-caption-caps text-caption-caps text-on-surface-variant">{{ appointmentToReschedule.doctorName }}</p>
              </div>
            </div>
            <button (click)="closeRescheduleModal()" class="text-outline hover:text-on-surface">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div *ngIf="rescheduleConflictError" class="p-3 rounded-lg bg-error-container text-error text-xs font-semibold">
            {{ rescheduleConflictError }}
          </div>

          <!-- Date picker -->
          <div class="flex flex-col gap-1.5">
            <label class="font-label-medium text-label-medium text-on-surface font-semibold">Select New Date</label>
            <input
              type="date"
              [(ngModel)]="rescheduleDate"
              (change)="loadRescheduleSlots()"
              [min]="todayDateString"
              class="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-regular text-body-regular outline-none border border-[#E2E8F0] cursor-pointer"
            />
          </div>

          <!-- Slots -->
          <div class="flex flex-col gap-1.5">
            <label class="font-label-medium text-label-medium text-on-surface font-semibold">Choose Open Time Window</label>
            <div *ngIf="isLoadingRescheduleSlots" class="p-4 text-center text-xs text-on-surface-variant">
              Checking available openings...
            </div>
            <div *ngIf="!isLoadingRescheduleSlots && rescheduleSlots.length === 0" class="p-3 rounded bg-surface-container-low text-center text-xs text-on-surface-variant">
              No available slots on this day. Please pick another date.
            </div>
            <div *ngIf="!isLoadingRescheduleSlots && rescheduleSlots.length > 0" class="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              <button
                *ngFor="let slot of rescheduleSlots"
                type="button"
                [disabled]="!slot.available"
                (click)="selectedRescheduleSlot = slot"
                [ngClass]="{
                  'bg-primary text-on-primary font-bold shadow-sm': selectedRescheduleSlot?.startTime === slot.startTime,
                  'bg-surface-container-low text-on-surface hover:bg-surface-container': slot.available && selectedRescheduleSlot?.startTime !== slot.startTime,
                  'opacity-40 cursor-not-allowed bg-surface-container line-through': !slot.available
                }"
                class="p-2 rounded-lg text-center text-xs transition-all"
              >
                {{ slot.formattedTime }}
              </button>
            </div>
          </div>

          <!-- Reason -->
          <div class="flex flex-col gap-1.5">
            <label class="font-label-medium text-label-medium text-on-surface font-semibold">Reschedule Reason (Optional)</label>
            <input
              type="text"
              [(ngModel)]="rescheduleReason"
              class="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-regular text-body-regular outline-none border border-[#E2E8F0]"
              placeholder="e.g. Work conflict, moving to afternoon..."
            />
          </div>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              [disabled]="isProcessingAction"
              (click)="closeRescheduleModal()"
              class="px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-medium text-label-medium hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              [disabled]="!selectedRescheduleSlot || isProcessingAction"
              (click)="confirmReschedule()"
              [ngClass]="selectedRescheduleSlot ? 'bg-primary text-on-primary hover:bg-primary-container' : 'bg-surface-container text-outline cursor-not-allowed'"
              class="px-5 py-2 rounded-lg font-label-medium text-label-medium font-semibold shadow-sm transition-all"
            >
              {{ isProcessingAction ? 'Rescheduling...' : 'Confirm New Time' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ================= DETAILS MODAL DIALOG ================= -->
      <div *ngIf="showDetailsModal && selectedAppointmentDetails" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div class="w-full max-w-lg rounded-2xl bg-surface-container-lowest p-6 shadow-xl border border-[#E2E8F0] space-y-4">
          <div class="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <span class="font-caption-caps text-caption-caps text-primary font-mono font-bold uppercase">Clinical Encounter</span>
              <h3 class="font-headline-2 text-headline-2 text-on-surface font-bold">#{{ selectedAppointmentDetails.encounterNumber }}</h3>
            </div>
            <button (click)="closeDetailsModal()" class="text-outline hover:text-on-surface">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div class="space-y-3 font-body-medium text-body-medium">
            <div class="flex items-center justify-between">
              <span class="text-on-surface-variant">Attending Doctor:</span>
              <span class="font-semibold text-on-surface">{{ selectedAppointmentDetails.doctorName }} ({{ selectedAppointmentDetails.doctorSpecialty }})</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-on-surface-variant">Doctor NPI:</span>
              <span class="font-mono text-on-surface">{{ selectedAppointmentDetails.doctorNpi }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-on-surface-variant">Scheduled Window:</span>
              <span class="font-semibold text-primary">{{ selectedAppointmentDetails.scheduledTime | date:'medium' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-on-surface-variant">Consultation Modality:</span>
              <span class="font-semibold text-on-surface">{{ selectedAppointmentDetails.modality }} ({{ selectedAppointmentDetails.durationMinutes }}m)</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-on-surface-variant">Status:</span>
              <span class="font-bold text-primary">{{ selectedAppointmentDetails.status }}</span>
            </div>
            <div class="p-3 rounded-lg bg-surface-container-low border border-[#E2E8F0]">
              <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase font-semibold block mb-1">Chief Complaint:</span>
              <p class="font-body-regular text-body-regular text-on-surface leading-relaxed">
                {{ selectedAppointmentDetails.chiefComplaint || 'Routine medical telemetry consultation' }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-end pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              (click)="closeDetailsModal()"
              class="px-5 py-2 rounded-lg bg-primary text-on-primary font-label-medium text-label-medium font-semibold hover:bg-primary-container transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MyAppointmentsComponent implements OnInit {
  private appointmentService = inject(AppointmentService);
  private doctorService = inject(DoctorService);

  appointments: Appointment[] = [];
  isLoading = true;
  activeTab: 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'ALL' = 'UPCOMING';
  searchQuery = '';
  modalityFilter: 'ALL' | 'VIDEO' | 'IN_PERSON' = 'ALL';
  actionSuccessMessage: string | null = null;

  // Cancel dialog state
  showCancelModal = false;
  appointmentToCancel: Appointment | null = null;
  cancelReason = '';
  isProcessingAction = false;

  // Reschedule dialog state
  showRescheduleModal = false;
  appointmentToReschedule: Appointment | null = null;
  rescheduleDate = '';
  todayDateString = '';
  rescheduleSlots: TimeSlot[] = [];
  selectedRescheduleSlot: TimeSlot | null = null;
  isLoadingRescheduleSlots = false;
  rescheduleReason = '';
  rescheduleConflictError: string | null = null;

  // Details dialog state
  showDetailsModal = false;
  selectedAppointmentDetails: Appointment | null = null;

  ngOnInit(): void {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    this.todayDateString = this.formatDate(today);
    this.rescheduleDate = this.formatDate(tomorrow);

    this.loadAppointments();
  }

  formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  get upcomingCount(): number {
    return this.appointments.filter((a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED').length;
  }

  get completedCount(): number {
    return this.appointments.filter((a) => a.status === 'COMPLETED').length;
  }

  get cancelledCount(): number {
    return this.appointments.filter((a) => a.status === 'CANCELLED').length;
  }

  get nextUpcomingAppointment(): Appointment | null {
    const upcoming = this.appointments.filter((a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED');
    return upcoming.length > 0 ? upcoming[0] : null;
  }

  get filteredAppointments(): Appointment[] {
    let list = [...this.appointments];

    if (this.activeTab === 'UPCOMING') {
      list = list.filter((a) => a.status === 'SCHEDULED' || a.status === 'CONFIRMED');
    } else if (this.activeTab === 'COMPLETED') {
      list = list.filter((a) => a.status === 'COMPLETED');
    } else if (this.activeTab === 'CANCELLED') {
      list = list.filter((a) => a.status === 'CANCELLED');
    }

    if (this.modalityFilter !== 'ALL') {
      list = list.filter((a) => a.modality === this.modalityFilter);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.doctorName.toLowerCase().includes(q) ||
          a.doctorSpecialty.toLowerCase().includes(q) ||
          a.encounterNumber.toLowerCase().includes(q)
      );
    }

    return list;
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

  // Cancel Modal Handlers
  openCancelModal(apt: Appointment): void {
    this.appointmentToCancel = apt;
    this.cancelReason = '';
    this.showCancelModal = true;
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.appointmentToCancel = null;
    this.cancelReason = '';
  }

  confirmCancellation(): void {
    if (!this.appointmentToCancel) return;
    this.isProcessingAction = true;

    this.appointmentService.cancelAppointment(this.appointmentToCancel.id, this.cancelReason).subscribe({
      next: (cancelled) => {
        this.isProcessingAction = false;
        this.actionSuccessMessage = `Appointment #${cancelled.encounterNumber} has been successfully cancelled.`;
        this.closeCancelModal();
        this.loadAppointments();
      },
      error: (err) => {
        this.isProcessingAction = false;
        alert(err.error?.message || 'Failed to cancel appointment.');
      }
    });
  }

  // Reschedule Modal Handlers
  openRescheduleModal(apt: Appointment): void {
    this.appointmentToReschedule = apt;
    this.rescheduleReason = '';
    this.rescheduleConflictError = null;
    this.selectedRescheduleSlot = null;
    this.showRescheduleModal = true;
    this.loadRescheduleSlots();
  }

  closeRescheduleModal(): void {
    this.showRescheduleModal = false;
    this.appointmentToReschedule = null;
    this.selectedRescheduleSlot = null;
    this.rescheduleConflictError = null;
  }

  loadRescheduleSlots(): void {
    if (!this.appointmentToReschedule || !this.rescheduleDate) return;
    this.isLoadingRescheduleSlots = true;
    this.selectedRescheduleSlot = null;
    this.rescheduleConflictError = null;

    this.doctorService.getDoctorSlots(this.appointmentToReschedule.doctorId, this.rescheduleDate).subscribe({
      next: (slots) => {
        this.rescheduleSlots = slots;
        this.isLoadingRescheduleSlots = false;
        const first = slots.find((s) => s.available);
        if (first) {
          this.selectedRescheduleSlot = first;
        }
      },
      error: () => {
        this.isLoadingRescheduleSlots = false;
      }
    });
  }

  confirmReschedule(): void {
    if (!this.appointmentToReschedule || !this.selectedRescheduleSlot) return;
    this.isProcessingAction = true;
    this.rescheduleConflictError = null;

    const payload: RescheduleRequest = {
      newScheduledTime: this.selectedRescheduleSlot.startTime,
      reason: this.rescheduleReason
    };

    this.appointmentService.rescheduleAppointment(this.appointmentToReschedule.id, payload).subscribe({
      next: (rescheduled) => {
        this.isProcessingAction = false;
        this.actionSuccessMessage = `Appointment #${rescheduled.encounterNumber} successfully rescheduled to ${rescheduled.scheduledTime}.`;
        this.closeRescheduleModal();
        this.loadAppointments();
      },
      error: (err) => {
        this.isProcessingAction = false;
        if (err.status === 409) {
          this.rescheduleConflictError =
            err.error?.message || 'That slot was just booked by another patient. Please choose an alternate slot.';
          this.loadRescheduleSlots();
        } else {
          this.rescheduleConflictError = err.error?.message || 'Failed to reschedule appointment.';
        }
      }
    });
  }

  // Details Modal Handlers
  openDetailsModal(apt: Appointment): void {
    this.selectedAppointmentDetails = apt;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedAppointmentDetails = null;
  }
}
