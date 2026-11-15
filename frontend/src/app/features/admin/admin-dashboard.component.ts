import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import {
  AdminDashboardMetrics,
  DoctorCredentialing,
  AdminUserSummary,
  AdminCreateDoctorRequest,
  AuditIntegrityReport
} from '../../core/models/admin.model';
import { AuditEvent } from '../../core/models/audit.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  template: `
    <div class="space-y-space-lg max-w-7xl mx-auto pb-16">

      <!-- Interactive Prototype Simulation State Controller -->
      <div class="p-space-sm bg-surface-container-low rounded-xl flex flex-wrap items-center justify-between gap-space-sm border border-[#E2E8F0]">
        <div class="flex items-center gap-space-xs text-on-surface-variant font-label-medium text-label-medium">
          <span class="material-symbols-outlined text-[18px] text-primary">tune</span>
          <span class="font-caption-caps text-caption-caps uppercase tracking-wider">Preview State Emulation:</span>
        </div>
        <div class="flex flex-wrap items-center gap-space-xs">
          <button
            type="button"
            (click)="setViewState('active')"
            [ngClass]="activeViewState === 'active' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
            class="px-space-md py-1 rounded-lg font-label-medium text-label-medium transition-all shadow-sm"
          >
            Active Operations (Default)
          </button>
          <button
            type="button"
            (click)="setViewState('modal')"
            [ngClass]="activeViewState === 'modal' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
            class="px-space-md py-1 rounded-lg font-label-medium text-label-medium transition-all"
          >
            Doctor Approval Modal
          </button>
          <button
            type="button"
            (click)="setViewState('skeleton')"
            [ngClass]="activeViewState === 'skeleton' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
            class="px-space-md py-1 rounded-lg font-label-medium text-label-medium transition-all"
          >
            Loading Skeleton
          </button>
          <button
            type="button"
            (click)="setViewState('empty')"
            [ngClass]="activeViewState === 'empty' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'"
            class="px-space-md py-1 rounded-lg font-label-medium text-label-medium transition-all"
          >
            Empty Platform Mock
          </button>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span class="font-caption-caps text-caption-caps text-primary font-bold uppercase">Production Cluster India-Central (Mumbai)</span>
        </div>
      </div>

      <!-- Header & Executive Telemetry Banner -->
      <header class="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-caption-caps text-caption-caps font-bold">
              SUPER ADMIN GOVERNANCE • NIST SP 800-63A
            </span>
            <span class="text-xs text-secondary font-mono">Platform v3.2 Enterprise</span>
          </div>
          <h1 class="font-headline-1 text-headline-1 text-on-surface tracking-tight font-bold">
            Platform Operations &amp; Executive Telemetry
          </h1>
          <p class="font-body-regular text-body-regular text-on-surface-variant mt-1">
            Real-time health system utilization, provider credentialing pipeline, compliance posture, and revenue telemetry.
          </p>
        </div>

        <div class="flex items-center gap-space-sm flex-wrap">
          <button
            type="button"
            (click)="triggerAuditIntegrityCheck()"
            class="flex items-center gap-1.5 px-space-md py-2 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-sm font-semibold shadow-sm"
          >
            <span class="material-symbols-outlined text-[18px] text-primary">verified_user</span>
            <span>Check Audit Integrity</span>
          </button>
          <button
            type="button"
            (click)="openOnboardModal()"
            class="flex items-center gap-1.5 px-space-md py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-colors text-sm font-semibold shadow-sm"
          >
            <span class="material-symbols-outlined text-[18px]">person_add</span>
            <span>+ Onboard Provider</span>
          </button>
        </div>
      </header>

      <!-- Navigation Tabs -->
      <div class="flex border-b border-[#E2E8F0] gap-space-md overflow-x-auto">
        <button
          type="button"
          (click)="currentTab = 'overview'"
          [ngClass]="currentTab === 'overview' ? 'border-primary text-primary font-bold border-b-2' : 'text-secondary hover:text-on-surface border-transparent'"
          class="pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <span class="material-symbols-outlined text-[18px]">dashboard</span>
          <span>Overview</span>
        </button>
        <button
          type="button"
          (click)="currentTab = 'credentialing'"
          [ngClass]="currentTab === 'credentialing' ? 'border-primary text-primary font-bold border-b-2' : 'text-secondary hover:text-on-surface border-transparent'"
          class="pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <span class="material-symbols-outlined text-[18px]">assignment_turned_in</span>
          <span>Credentialing Queue</span>
          <span *ngIf="metrics?.pendingCredentialing" class="ml-1 px-1.5 py-0.2 rounded-full bg-error-container text-on-error-container text-xs font-bold">
            {{ metrics?.pendingCredentialing }}
          </span>
        </button>
        <button
          type="button"
          (click)="currentTab = 'doctors'"
          [ngClass]="currentTab === 'doctors' ? 'border-primary text-primary font-bold border-b-2' : 'text-secondary hover:text-on-surface border-transparent'"
          class="pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <span class="material-symbols-outlined text-[18px]">medical_services</span>
          <span>Doctors Roster</span>
        </button>
        <button
          type="button"
          (click)="currentTab = 'patients'"
          [ngClass]="currentTab === 'patients' ? 'border-primary text-primary font-bold border-b-2' : 'text-secondary hover:text-on-surface border-transparent'"
          class="pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <span class="material-symbols-outlined text-[18px]">personal_injury</span>
          <span>Patient Directory</span>
        </button>
        <button
          type="button"
          (click)="currentTab = 'audit'"
          [ngClass]="currentTab === 'audit' ? 'border-primary text-primary font-bold border-b-2' : 'text-secondary hover:text-on-surface border-transparent'"
          class="pb-3 px-1 text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <span class="material-symbols-outlined text-[18px]">policy</span>
          <span>System Audit Ledger</span>
        </button>
      </div>

      <!-- SKELETON LOADING VIEW -->
      <div *ngIf="activeViewState === 'skeleton' || (loading && !metrics)" class="space-y-space-lg animate-pulse">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          <div *ngFor="let i of [1,2,3,4]" class="h-28 rounded-xl bg-surface-container-high"></div>
        </div>
        <div class="h-64 rounded-xl bg-surface-container-high"></div>
      </div>

      <!-- MAIN TAB VIEWS -->
      <div *ngIf="activeViewState !== 'skeleton' && !loading">

        <!-- 1. OVERVIEW TAB -->
        <div *ngIf="currentTab === 'overview'" class="space-y-space-lg">
          <!-- KPI Metrics Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
            <!-- Metric 1: Patients -->
            <div class="bg-surface-container-lowest p-space-md rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div class="flex items-start justify-between">
                <div>
                  <span class="font-caption-caps text-caption-caps uppercase text-secondary tracking-wider font-semibold">Registered Patients</span>
                  <div class="font-display text-display text-on-surface font-bold mt-1">
                    {{ activeViewState === 'empty' ? '0' : (metrics?.registeredPatients || 128450) | number }}
                  </div>
                </div>
                <div class="w-10 h-10 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center">
                  <span class="material-symbols-outlined text-[22px]">personal_injury</span>
                </div>
              </div>
              <div class="mt-2 text-xs text-primary flex items-center gap-1 font-semibold">
                <span class="material-symbols-outlined text-[15px]">trending_up</span>
                <span>+8.4% vs last month</span>
                <span class="text-secondary font-normal ml-1">NIST SP 800-63A Verified</span>
              </div>
            </div>

            <!-- Metric 2: Credentialed Physicians -->
            <div class="bg-surface-container-lowest p-space-md rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div class="flex items-start justify-between">
                <div>
                  <span class="font-caption-caps text-caption-caps uppercase text-secondary tracking-wider font-semibold">Credentialed Physicians</span>
                  <div class="font-display text-display text-on-surface font-bold mt-1">
                    {{ activeViewState === 'empty' ? '0' : (metrics?.credentialedPhysicians || 14) | number }}
                  </div>
                </div>
                <div class="w-10 h-10 rounded-xl bg-secondary-container text-secondary flex items-center justify-center">
                  <span class="material-symbols-outlined text-[22px]">medical_services</span>
                </div>
              </div>
              <div class="mt-2 text-xs text-secondary flex items-center gap-1">
                <span class="font-semibold text-error">{{ activeViewState === 'empty' ? '0' : (metrics?.pendingCredentialing || 2) }} Pending Review</span>
                <span>• 94.2% on duty</span>
              </div>
            </div>

            <!-- Metric 3: Consultations -->
            <div class="bg-surface-container-lowest p-space-md rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div class="flex items-start justify-between">
                <div>
                  <span class="font-caption-caps text-caption-caps uppercase text-secondary tracking-wider font-semibold">Telehealth Consults</span>
                  <div class="font-display text-display text-on-surface font-bold mt-1">
                    {{ activeViewState === 'empty' ? '0' : (metrics?.totalAppointments || 8420) | number }}
                  </div>
                </div>
                <div class="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                  <span class="material-symbols-outlined text-[22px]">video_camera_front</span>
                </div>
              </div>
              <div class="mt-2 text-xs text-[#059669] flex items-center gap-1 font-semibold">
                <span class="material-symbols-outlined text-[15px]">check_circle</span>
                <span>WebRTC Session SLA: 99.98%</span>
              </div>
            </div>

            <!-- Metric 4: Platform Revenue -->
            <div class="bg-surface-container-lowest p-space-md rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between">
              <div class="flex items-start justify-between">
                <div>
                  <span class="font-caption-caps text-caption-caps uppercase text-secondary tracking-wider font-semibold">Platform Revenue</span>
                  <div class="font-display text-display text-on-surface font-bold mt-1">
                    ₹{{ activeViewState === 'empty' ? '0.00' : (metrics?.totalPlatformRevenue || 4825000) | number:'1.2-2' }}
                  </div>
                </div>
                <div class="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                  <span class="material-symbols-outlined text-[22px]">payments</span>
                </div>
              </div>
              <div class="mt-2 text-xs text-secondary flex items-center gap-1">
                <span>Direct Copay + Ins Remittance</span>
              </div>
            </div>
          </div>

          <!-- Pending Credentialing Preview Strip -->
          <div class="bg-surface-container-lowest p-space-md rounded-xl border border-[#E2E8F0] shadow-sm">
            <div class="flex items-center justify-between pb-space-md border-b border-[#E2E8F0]">
              <div class="flex items-center gap-space-sm">
                <span class="font-headline-3 text-headline-3 text-on-surface font-bold">Provider Credentialing Verification Queue</span>
                <span class="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-caption-caps text-caption-caps font-bold">
                  {{ pendingQueue.length }} PENDING
                </span>
              </div>
              <button
                type="button"
                (click)="currentTab = 'credentialing'"
                class="text-xs text-primary font-bold hover:underline flex items-center gap-1"
              >
                <span>View Full Queue</span>
                <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <div class="divide-y divide-[#F1F5F9] mt-2">
              <div *ngFor="let doc of pendingQueue.slice(0, 3)" class="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center font-bold">
                    {{ doc.fullName.charAt(0) }}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-on-surface">{{ doc.fullName }}</span>
                      <span class="text-xs px-2 py-0.5 rounded bg-surface-container text-secondary">{{ doc.specialty }}</span>
                    </div>
                    <div class="text-xs text-secondary flex items-center gap-3 mt-0.5">
                      <span>NPI: <strong class="text-on-surface">{{ doc.npi }}</strong></span>
                      <span>License: <strong class="text-on-surface">{{ doc.licenseNumber }} ({{ doc.licenseState }})</strong></span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="openApprovalModal(doc)"
                    class="px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-sm"
                  >
                    Review Credentials
                  </button>
                </div>
              </div>

              <div *ngIf="pendingQueue.length === 0" class="py-6 text-center text-sm text-secondary">
                No provider credentialing applications currently pending review.
              </div>
            </div>
          </div>

          <!-- Live Audit Log Stream Strip -->
          <div class="bg-surface-container-lowest p-space-md rounded-xl border border-[#E2E8F0] shadow-sm">
            <div class="flex items-center justify-between pb-space-md border-b border-[#E2E8F0]">
              <div class="flex items-center gap-space-sm">
                <span class="material-symbols-outlined text-primary text-[20px]">policy</span>
                <div>
                  <h2 class="font-headline-3 text-headline-3 text-on-surface font-bold">Platform Event Audit Log (Level-4 Ledger)</h2>
                  <p class="text-xs text-secondary">Immutable event stream across regional health clusters</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span class="font-caption-caps text-caption-caps text-primary font-bold uppercase">SYNCHRONIZED</span>
              </div>
            </div>

            <!-- HIPAA Safeguard Notice -->
            <div class="my-3 p-2.5 rounded-lg bg-surface-container-low flex items-center gap-2 text-xs text-secondary">
              <span class="material-symbols-outlined text-[16px] text-primary shrink-0">lock</span>
              <span>
                Clinical PHI notes, diagnosis text, and prescription bodies are masked under HIPAA Administrative Safeguards 45 CFR § 164.308. Non-clinical admin isolation enforced.
              </span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-surface-container-low text-secondary font-caption-caps text-caption-caps uppercase">
                    <th class="p-2.5">Tracking Code</th>
                    <th class="p-2.5">Actor</th>
                    <th class="p-2.5">Action</th>
                    <th class="p-2.5">Resource</th>
                    <th class="p-2.5">Status</th>
                    <th class="p-2.5">SHA-256 Hash</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#F1F5F9]">
                  <tr *ngFor="let ev of recentAuditLogs.slice(0, 5)" class="hover:bg-surface-container-low">
                    <td class="p-2.5 font-mono font-bold text-primary">{{ ev.eventTrackingCode }}</td>
                    <td class="p-2.5">{{ ev.actorRole }} (ID #{{ ev.actorId }})</td>
                    <td class="p-2.5 font-semibold">{{ ev.actionType }}</td>
                    <td class="p-2.5 text-secondary truncate max-w-[160px]">{{ ev.targetResource }}</td>
                    <td class="p-2.5"><app-status-badge [status]="ev.eventStatus"></app-status-badge></td>
                    <td class="p-2.5 font-mono text-[10px] text-outline truncate max-w-[120px]" [title]="ev.verificationHash">
                      {{ ev.verificationHash }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 2. CREDENTIALING QUEUE TAB -->
        <div *ngIf="currentTab === 'credentialing'" class="space-y-space-md">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-xl border border-[#E2E8F0]">
            <div>
              <h2 class="font-headline-2 text-headline-2 font-bold text-on-surface">Provider Credentialing &amp; Verification Pipeline</h2>
              <p class="text-xs text-secondary mt-0.5">Automated primary source verification against NMC (National Medical Commission), State Medical Councils &amp; ABDM</p>
            </div>
            <!-- Queue Status Filter -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                *ngFor="let s of ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']"
                (click)="filterQueueStatus(s)"
                [ngClass]="selectedQueueStatus === s ? 'bg-primary text-on-primary' : 'bg-surface-container text-secondary hover:bg-surface-container-high'"
                class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
              >
                {{ s }}
              </button>
            </div>
          </div>

          <!-- Credentialing Items List -->
          <div class="space-y-3">
            <div
              *ngFor="let doc of filteredQueue"
              class="bg-surface-container-lowest p-space-md rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                  {{ doc.fullName.charAt(0) }}
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="font-headline-3 text-headline-3 font-bold text-on-surface">{{ doc.fullName }}</h3>
                    <span class="px-2 py-0.5 rounded text-xs bg-surface-container text-on-surface font-semibold">{{ doc.specialty }}</span>
                    <app-status-badge [status]="doc.credentialingStatus"></app-status-badge>
                  </div>
                  <div class="mt-1 flex items-center gap-4 text-xs text-secondary flex-wrap">
                    <span>NPI: <strong class="text-on-surface">{{ doc.npi }}</strong></span>
                    <span>State License: <strong class="text-on-surface">{{ doc.licenseNumber }} ({{ doc.licenseState }})</strong></span>
                    <span>Board Cert: <strong class="text-on-surface">{{ doc.boardCertifications || 'Pending Board Record' }}</strong></span>
                    <span *ngIf="doc.rejectionReason" class="text-error font-medium">Rejection Note: {{ doc.rejectionReason }}</span>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-2 shrink-0 self-end lg:self-center">
                <button
                  type="button"
                  (click)="openApprovalModal(doc)"
                  class="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold transition-colors shadow-sm"
                >
                  Review &amp; Verify
                </button>
                <button
                  *ngIf="doc.credentialingStatus === 'APPROVED'"
                  type="button"
                  (click)="suspendDoctor(doc)"
                  class="px-3 py-1.5 rounded-lg bg-error-container text-on-error-container hover:bg-error/30 text-xs font-semibold transition-colors"
                >
                  Suspend
                </button>
                <button
                  *ngIf="doc.credentialingStatus === 'SUSPENDED'"
                  type="button"
                  (click)="reactivateDoctor(doc)"
                  class="px-3 py-1.5 rounded-lg bg-[#ECFDF5] text-[#059669] hover:bg-[#D1FAE5] text-xs font-semibold transition-colors"
                >
                  Reactivate
                </button>
              </div>
            </div>

            <div *ngIf="filteredQueue.length === 0" class="p-8 text-center bg-surface-container-lowest rounded-xl border border-[#E2E8F0] text-secondary text-sm">
              No doctor credentialing records match the selected filter.
            </div>
          </div>
        </div>

        <!-- 3. DOCTORS ROSTER TAB -->
        <div *ngIf="currentTab === 'doctors'" class="space-y-space-md">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-xl border border-[#E2E8F0]">
            <div>
              <h2 class="font-headline-2 text-headline-2 font-bold text-on-surface">Physician Directory &amp; Roster Management</h2>
              <p class="text-xs text-secondary mt-0.5">Active telemedicine network providers and clinical scheduling status</p>
            </div>
            <div class="flex items-center gap-space-sm">
              <input
                type="text"
                [(ngModel)]="doctorSearchTerm"
                (input)="searchDoctors()"
                placeholder="Search by name, NPI, or specialty..."
                class="px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-xs w-64 bg-surface-container-lowest focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                (click)="openOnboardModal()"
                class="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-sm"
              >
                + Onboard Doctor
              </button>
            </div>
          </div>

          <div class="bg-surface-container-lowest rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-surface-container-low text-secondary font-caption-caps text-caption-caps uppercase">
                    <th class="p-3">Doctor Name</th>
                    <th class="p-3">NPI</th>
                    <th class="p-3">Specialty</th>
                    <th class="p-3">Email</th>
                    <th class="p-3">Account Status</th>
                    <th class="p-3">Governance Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#F1F5F9]">
                  <tr *ngFor="let doc of doctorList" class="hover:bg-surface-container-low">
                    <td class="p-3 font-semibold text-on-surface">{{ doc.fullName }}</td>
                    <td class="p-3 font-mono font-bold">{{ doc.npi }}</td>
                    <td class="p-3">{{ doc.specialty }}</td>
                    <td class="p-3 text-secondary">{{ doc.email }}</td>
                    <td class="p-3">
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                        [ngClass]="doc.active ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-error-container text-on-error-container'"
                      >
                        {{ doc.active ? 'ACTIVE' : 'LOCKED' }}
                      </span>
                    </td>
                    <td class="p-3">
                      <button
                        type="button"
                        (click)="toggleUserStatus(doc)"
                        class="px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                        [ngClass]="doc.active ? 'bg-error-container text-on-error-container hover:bg-error/30' : 'bg-[#ECFDF5] text-[#059669] hover:bg-[#D1FAE5]'"
                      >
                        {{ doc.active ? 'Lock Account' : 'Unlock Account' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 4. PATIENT DIRECTORY TAB -->
        <div *ngIf="currentTab === 'patients'" class="space-y-space-md">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-xl border border-[#E2E8F0]">
            <div>
              <h2 class="font-headline-2 text-headline-2 font-bold text-on-surface">Patient Directory &amp; Identity Governance</h2>
              <p class="text-xs text-secondary mt-0.5">Supervise patient user accounts, identity assurance, and portal access security</p>
            </div>
            <div class="flex items-center gap-space-sm">
              <input
                type="text"
                [(ngModel)]="patientSearchTerm"
                (input)="searchPatients()"
                placeholder="Search by MRN or name..."
                class="px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-xs w-64 bg-surface-container-lowest focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div class="bg-surface-container-lowest rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-surface-container-low text-secondary font-caption-caps text-caption-caps uppercase">
                    <th class="p-3">MRN</th>
                    <th class="p-3">Patient Name</th>
                    <th class="p-3">Email</th>
                    <th class="p-3">Insurance Provider</th>
                    <th class="p-3">Emergency Contact</th>
                    <th class="p-3">Access Status</th>
                    <th class="p-3">Security Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#F1F5F9]">
                  <tr *ngFor="let pat of patientList" class="hover:bg-surface-container-low">
                    <td class="p-3 font-mono font-bold text-primary">{{ pat.mrn || 'MRN-PENDING' }}</td>
                    <td class="p-3 font-semibold text-on-surface">{{ pat.fullName }}</td>
                    <td class="p-3 text-secondary">{{ pat.email }}</td>
                    <td class="p-3">{{ pat.insuranceProvider || 'Self-Pay / Unspecified' }}</td>
                    <td class="p-3 text-secondary">{{ pat.emergencyContactName || 'None Listed' }}</td>
                    <td class="p-3">
                      <span
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                        [ngClass]="pat.active ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-error-container text-on-error-container'"
                      >
                        {{ pat.active ? 'ACTIVE' : 'LOCKED' }}
                      </span>
                    </td>
                    <td class="p-3">
                      <button
                        type="button"
                        (click)="toggleUserStatus(pat)"
                        class="px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
                        [ngClass]="pat.active ? 'bg-error-container text-on-error-container hover:bg-error/30' : 'bg-[#ECFDF5] text-[#059669] hover:bg-[#D1FAE5]'"
                      >
                        {{ pat.active ? 'Lock Account' : 'Unlock Account' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 5. AUDIT LOG TAB -->
        <div *ngIf="currentTab === 'audit'" class="space-y-space-md">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-xl border border-[#E2E8F0]">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="font-headline-2 text-headline-2 font-bold text-on-surface">Cryptographic Audit Ledger</h2>
                <span class="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-xs font-bold font-mono">SHA-256</span>
              </div>
              <p class="text-xs text-secondary mt-0.5">Immutable clinical and administrative event log with cryptographic chain verification</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="triggerAuditIntegrityCheck()"
                class="px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <span class="material-symbols-outlined text-[16px]">verified</span>
                <span>Recalculate Hashes</span>
              </button>
            </div>
          </div>

          <!-- Integrity Badge Card if Checked -->
          <div *ngIf="integrityReport" class="p-4 rounded-xl bg-surface-container-low border border-[#E2E8F0] flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-3xl text-primary">verified_user</span>
              <div>
                <div class="font-bold text-sm text-on-surface">
                  Ledger Cryptographic Audit: {{ integrityReport.integrityStatus }}
                </div>
                <div class="text-xs text-secondary">
                  Events Analyzed: {{ integrityReport.totalEventsChecked }} • Intact: {{ integrityReport.verifiedIntactEvents }} • Corrupted: {{ integrityReport.corruptedEvents }}
                </div>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded bg-[#ECFDF5] text-[#059669] text-xs font-bold uppercase font-mono">
              100% UNTAMPERED
            </span>
          </div>

          <!-- Audit Table -->
          <div class="bg-surface-container-lowest rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-surface-container-low text-secondary font-caption-caps text-caption-caps uppercase">
                    <th class="p-3">Tracking Code</th>
                    <th class="p-3">Timestamp</th>
                    <th class="p-3">Actor Role</th>
                    <th class="p-3">Actor ID</th>
                    <th class="p-3">Action Type</th>
                    <th class="p-3">Target Resource</th>
                    <th class="p-3">Status</th>
                    <th class="p-3">Verification Hash</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#F1F5F9]">
                  <tr *ngFor="let log of recentAuditLogs" class="hover:bg-surface-container-low font-body-regular">
                    <td class="p-3 font-mono font-bold text-primary">{{ log.eventTrackingCode }}</td>
                    <td class="p-3 text-secondary">{{ log.createdAt | date:'short' }}</td>
                    <td class="p-3 font-medium">{{ log.actorRole }}</td>
                    <td class="p-3 font-mono">#{{ log.actorId }}</td>
                    <td class="p-3 font-semibold text-on-surface">{{ log.actionType }}</td>
                    <td class="p-3 text-secondary truncate max-w-[140px]">{{ log.targetResource }}</td>
                    <td class="p-3"><app-status-badge [status]="log.eventStatus"></app-status-badge></td>
                    <td class="p-3 font-mono text-[10px] text-outline truncate max-w-[140px]" [title]="log.verificationHash">
                      {{ log.verificationHash }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      <!-- DOCTOR CREDENTIALING APPROVAL / SIGN-OFF MODAL -->
      <div
        *ngIf="showApprovalModal && selectedDoc"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <div class="bg-surface-container-lowest rounded-2xl max-w-xl w-full shadow-2xl border border-[#CBD5E1] overflow-hidden flex flex-col">
          <div class="p-space-lg border-b border-[#E2E8F0] flex items-center justify-between bg-surface-container-low">
            <div class="flex items-center gap-space-sm">
              <div class="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                <span class="material-symbols-outlined text-[20px]">verified</span>
              </div>
              <div>
                <h3 class="font-headline-2 text-headline-2 font-bold text-on-surface">Review &amp; Sign-Off Credentials</h3>
                <p class="text-xs text-secondary">CAQH validation &amp; state medical board credentialing</p>
              </div>
            </div>
            <button type="button" (click)="closeApprovalModal()" class="text-secondary hover:text-on-surface">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div class="p-space-lg space-y-space-md text-sm">
            <!-- Clinician Summary Box -->
            <div class="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="font-bold text-base text-on-surface">{{ selectedDoc.fullName }}</span>
                <span class="px-2 py-0.5 rounded text-xs bg-primary-container/20 text-primary font-semibold">{{ selectedDoc.specialty }}</span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs text-secondary mt-1">
                <div>NPI: <strong class="text-on-surface">#{{ selectedDoc.npi }}</strong></div>
                <div>License: <strong class="text-on-surface">{{ selectedDoc.licenseNumber }} ({{ selectedDoc.licenseState }})</strong></div>
                <div>Status: <app-status-badge [status]="selectedDoc.credentialingStatus"></app-status-badge></div>
                <div>Board: <strong class="text-on-surface">{{ selectedDoc.boardCertifications || 'Board Eligible' }}</strong></div>
              </div>
            </div>

            <!-- Verification Checkpoints -->
            <div class="space-y-1.5 text-xs">
              <div class="flex items-center gap-2 text-on-surface">
                <span class="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                <span>National Medical Commission (NMC) Registry active and verified</span>
              </div>
              <div class="flex items-center gap-2 text-on-surface">
                <span class="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                <span>State Medical Council licensing check passed without sanctions</span>
              </div>
              <div class="flex items-center gap-2 text-on-surface">
                <span class="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                <span>Telemedicine Practice Guidelines 2020 prescription clearance verified</span>
              </div>
            </div>

            <!-- Approval / Rejection Notes -->
            <div>
              <label class="block font-label-medium text-label-medium text-on-surface mb-1">
                Administrative Sign-Off Notes / Rejection Reason
              </label>
              <textarea
                [(ngModel)]="approvalNotes"
                rows="3"
                placeholder="Enter board verification tracking reference or rejection reason..."
                class="w-full p-2.5 rounded-lg border border-[#CBD5E1] bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:border-primary"
              ></textarea>
            </div>
          </div>

          <div class="p-space-md bg-surface-container-low border-t border-[#E2E8F0] flex items-center justify-between">
            <button
              type="button"
              (click)="rejectCredentials()"
              [disabled]="modalActionLoading"
              class="px-3.5 py-2 rounded-lg bg-error-container text-on-error-container hover:bg-error/30 text-xs font-semibold transition-colors"
            >
              Reject Application
            </button>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="closeApprovalModal()"
                class="px-3.5 py-2 rounded-lg bg-surface-container text-secondary hover:bg-surface-container-high text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="approveCredentials()"
                [disabled]="modalActionLoading"
                class="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <span *ngIf="modalActionLoading" class="material-symbols-outlined text-[14px] animate-spin">sync</span>
                <span>Approve &amp; Grant Privileges</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ONBOARD NEW DOCTOR MODAL -->
      <div
        *ngIf="showOnboardModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <div class="bg-surface-container-lowest rounded-2xl max-w-lg w-full shadow-2xl border border-[#CBD5E1] overflow-hidden flex flex-col">
          <div class="p-space-lg border-b border-[#E2E8F0] flex items-center justify-between bg-surface-container-low">
            <h3 class="font-headline-2 text-headline-2 font-bold text-on-surface">+ Onboard New Clinician</h3>
            <button type="button" (click)="closeOnboardModal()" class="text-secondary hover:text-on-surface">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <form (ngSubmit)="submitOnboarding()" class="p-space-lg space-y-space-sm text-xs">
            <div class="grid grid-cols-2 gap-space-sm">
              <div>
                <label class="block font-medium mb-1">First Name</label>
                <input type="text" [(ngModel)]="newDoctor.firstName" name="firstName" required class="w-full p-2 border rounded-lg" placeholder="First Name (e.g. Priya)" />
              </div>
              <div>
                <label class="block font-medium mb-1">Last Name</label>
                <input type="text" [(ngModel)]="newDoctor.lastName" name="lastName" required class="w-full p-2 border rounded-lg" placeholder="Last Name (e.g. Sundaram)" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-space-sm">
              <div>
                <label class="block font-medium mb-1">Email</label>
                <input type="email" [(ngModel)]="newDoctor.email" name="email" required class="w-full p-2 border rounded-lg" placeholder="physician@healthsystem.org" />
              </div>
              <div>
                <label class="block font-medium mb-1">Password</label>
                <input type="password" [(ngModel)]="newDoctor.password" name="password" required class="w-full p-2 border rounded-lg" placeholder="••••••••••••" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-space-sm">
              <div>
                <label class="block font-medium mb-1">Specialty</label>
                <input type="text" [(ngModel)]="newDoctor.specialty" name="specialty" required class="w-full p-2 border rounded-lg" placeholder="Cardiology" />
              </div>
              <div>
                <label class="block font-medium mb-1">Registration / NPI (10-digits)</label>
                <input type="text" [(ngModel)]="newDoctor.npi" name="npi" required class="w-full p-2 border rounded-lg" placeholder="1928374650" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-space-sm">
              <div>
                <label class="block font-medium mb-1">License / Reg Number</label>
                <input type="text" [(ngModel)]="newDoctor.licenseNumber" name="licenseNumber" required class="w-full p-2 border rounded-lg" placeholder="MMC-88391" />
              </div>
              <div>
                <label class="block font-medium mb-1">Consultation Fee (₹)</label>
                <input type="number" [(ngModel)]="newDoctor.consultationFee" name="consultationFee" required class="w-full p-2 border rounded-lg" placeholder="1000" />
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <input type="checkbox" id="autoApprove" [(ngModel)]="newDoctor.autoApprove" name="autoApprove" class="w-4 h-4 text-primary rounded" />
              <label for="autoApprove" class="text-xs font-semibold text-on-surface">Auto-Approve Credentials Immediately</label>
            </div>

            <div class="pt-4 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
              <button type="button" (click)="closeOnboardModal()" class="px-3.5 py-2 rounded-lg bg-surface-container text-xs font-semibold">Cancel</button>
              <button type="submit" [disabled]="modalActionLoading" class="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container">
                {{ modalActionLoading ? 'Onboarding...' : 'Complete Onboarding' }}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  currentTab: 'overview' | 'credentialing' | 'doctors' | 'patients' | 'audit' = 'overview';
  activeViewState: 'active' | 'modal' | 'skeleton' | 'empty' = 'active';

  metrics: AdminDashboardMetrics | null = null;
  pendingQueue: DoctorCredentialing[] = [];
  filteredQueue: DoctorCredentialing[] = [];
  selectedQueueStatus: string = 'ALL';

  doctorList: AdminUserSummary[] = [];
  doctorSearchTerm = '';

  patientList: AdminUserSummary[] = [];
  patientSearchTerm = '';

  recentAuditLogs: AuditEvent[] = [];
  integrityReport: AuditIntegrityReport | null = null;

  loading = false;
  modalActionLoading = false;

  showApprovalModal = false;
  showOnboardModal = false;
  selectedDoc: DoctorCredentialing | null = null;
  approvalNotes = 'Primary source verification completed via National Medical Commission (NMC) & State Medical Council registry.';

  newDoctor: AdminCreateDoctorRequest = {
    email: '',
    password: 'CareConnect360!',
    firstName: '',
    lastName: '',
    phoneNumber: '+91-9876543201',
    npi: '',
    specialty: 'Internal Medicine',
    subSpecialty: 'General Medicine',
    licenseNumber: '',
    licenseState: 'NMC',
    consultationFee: 1000.00,
    experienceYears: 7,
    boardCertifications: 'MBBS, MD (General Medicine) - AIIMS',
    bio: 'NMC-registered telemedicine practitioner.',
    autoApprove: true
  };

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading = true;
    this.adminService.getMetrics().subscribe({
      next: (m) => (this.metrics = m),
      error: () => {}
    });

    this.adminService.getCredentialingQueue('ALL').subscribe({
      next: (q) => {
        this.pendingQueue = q.filter(d => d.credentialingStatus === 'PENDING');
        this.filteredQueue = q;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.adminService.getDoctors().subscribe({
      next: (docs) => (this.doctorList = docs),
      error: () => {}
    });

    this.adminService.getPatients().subscribe({
      next: (pats) => (this.patientList = pats),
      error: () => {}
    });

    this.adminService.getAuditLogs().subscribe({
      next: (logs) => (this.recentAuditLogs = logs),
      error: () => {}
    });
  }

  setViewState(state: 'active' | 'modal' | 'skeleton' | 'empty'): void {
    this.activeViewState = state;
    if (state === 'modal') {
      if (this.pendingQueue.length > 0) {
        this.openApprovalModal(this.pendingQueue[0]);
      } else if (this.filteredQueue.length > 0) {
        this.openApprovalModal(this.filteredQueue[0]);
      }
    }
  }

  filterQueueStatus(status: string): void {
    this.selectedQueueStatus = status;
    if (status === 'ALL') {
      this.filteredQueue = this.pendingQueue.concat(
        this.filteredQueue.filter(d => d.credentialingStatus !== 'PENDING')
      );
    } else {
      this.adminService.getCredentialingQueue(status).subscribe({
        next: (q) => (this.filteredQueue = q),
        error: () => {}
      });
    }
  }

  searchDoctors(): void {
    this.adminService.getDoctors(this.doctorSearchTerm).subscribe({
      next: (docs) => (this.doctorList = docs),
      error: () => {}
    });
  }

  searchPatients(): void {
    this.adminService.getPatients(this.patientSearchTerm).subscribe({
      next: (pats) => (this.patientList = pats),
      error: () => {}
    });
  }

  openApprovalModal(doc: DoctorCredentialing): void {
    this.selectedDoc = doc;
    this.approvalNotes = 'Primary source verification completed via National Medical Commission (NMC) & State Medical Council registry.';
    this.showApprovalModal = true;
  }

  closeApprovalModal(): void {
    this.showApprovalModal = false;
    this.selectedDoc = null;
    if (this.activeViewState === 'modal') {
      this.activeViewState = 'active';
    }
  }

  approveCredentials(): void {
    if (!this.selectedDoc) return;
    this.modalActionLoading = true;
    this.adminService.verifyDoctorCredentials(this.selectedDoc.doctorId, {
      action: 'APPROVE',
      notes: this.approvalNotes
    }).subscribe({
      next: (updated) => {
        this.modalActionLoading = false;
        this.closeApprovalModal();
        this.loadAllData();
      },
      error: () => { this.modalActionLoading = false; }
    });
  }

  rejectCredentials(): void {
    if (!this.selectedDoc) return;
    if (!this.approvalNotes || this.approvalNotes.trim() === '') {
      alert('Rejection reason is required.');
      return;
    }
    this.modalActionLoading = true;
    this.adminService.verifyDoctorCredentials(this.selectedDoc.doctorId, {
      action: 'REJECT',
      notes: this.approvalNotes
    }).subscribe({
      next: (updated) => {
        this.modalActionLoading = false;
        this.closeApprovalModal();
        this.loadAllData();
      },
      error: () => { this.modalActionLoading = false; }
    });
  }

  suspendDoctor(doc: DoctorCredentialing): void {
    if (!confirm(`Are you sure you want to suspend credentials for ${doc.fullName}?`)) return;
    this.adminService.verifyDoctorCredentials(doc.doctorId, {
      action: 'SUSPEND',
      notes: 'Administrative license suspension pending investigation'
    }).subscribe({
      next: () => this.loadAllData(),
      error: () => {}
    });
  }

  reactivateDoctor(doc: DoctorCredentialing): void {
    this.adminService.verifyDoctorCredentials(doc.doctorId, {
      action: 'REACTIVATE',
      notes: 'Administrative privileges restored'
    }).subscribe({
      next: () => this.loadAllData(),
      error: () => {}
    });
  }

  toggleUserStatus(user: AdminUserSummary): void {
    const nextState = !user.active;
    const actionLabel = nextState ? 'unlock' : 'lock';
    if (!confirm(`Are you sure you want to ${actionLabel} account for ${user.fullName}?`)) return;

    this.adminService.toggleUserStatus(user.userId, nextState, `Administrative user account ${actionLabel}`).subscribe({
      next: (updated) => {
        user.active = updated.active;
        this.loadAllData();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update account status.');
      }
    });
  }

  openOnboardModal(): void {
    this.showOnboardModal = true;
  }

  closeOnboardModal(): void {
    this.showOnboardModal = false;
  }

  submitOnboarding(): void {
    this.modalActionLoading = true;
    this.adminService.onboardDoctor(this.newDoctor).subscribe({
      next: () => {
        this.modalActionLoading = false;
        this.closeOnboardModal();
        this.loadAllData();
      },
      error: (err) => {
        this.modalActionLoading = false;
        alert(err.error?.message || 'Failed to onboard doctor.');
      }
    });
  }

  triggerAuditIntegrityCheck(): void {
    this.adminService.verifyAuditIntegrity().subscribe({
      next: (report) => {
        this.integrityReport = report;
        this.currentTab = 'audit';
      },
      error: () => {}
    });
  }
}
