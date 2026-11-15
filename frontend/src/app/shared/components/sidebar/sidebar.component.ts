import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest border-r border-[#E2E8F0] shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-30 flex flex-col justify-between overflow-y-auto">
      <div class="flex flex-col py-space-md">
        <!-- Portal Section Title -->
        <div class="px-space-lg mb-space-sm flex items-center justify-between">
          <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider font-semibold">
            {{ portalTitle }}
          </span>
          <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        </div>

        <!-- Navigation Links -->
        <nav class="px-space-md flex flex-col gap-1">
          <!-- Patient Links -->
          <ng-container *ngIf="userRole === 'ROLE_PATIENT' || !userRole">
            <a routerLink="/patient/dashboard" routerLinkActive="bg-[#F0FDFA] text-primary border-l-[3px] border-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined text-[20px]">dashboard</span>
              <span class="font-body-medium text-body-medium">Overview</span>
            </a>
            <a routerLink="/patient/find-doctors" routerLinkActive="bg-[#F0FDFA] text-primary border-l-[3px] border-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined text-[20px]">person_search</span>
              <span class="font-body-medium text-body-medium">Find Doctors</span>
            </a>
            <a routerLink="/patient/appointments" routerLinkActive="bg-[#F0FDFA] text-primary border-l-[3px] border-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined text-[20px]">calendar_today</span>
              <span class="font-body-medium text-body-medium">Appointments</span>
            </a>
            <a routerLink="/consultation/room" routerLinkActive="bg-[#F0FDFA] text-primary border-l-[3px] border-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined text-[20px]">videocam</span>
              <span class="font-body-medium text-body-medium">Virtual Consult Room</span>
            </a>
            <a routerLink="/patient/prescriptions" routerLinkActive="bg-[#F0FDFA] text-primary border-l-[3px] border-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined text-[20px]">prescriptions</span>
              <span class="font-body-medium text-body-medium">Prescriptions</span>
            </a>
            <a routerLink="/patient/records" routerLinkActive="bg-[#F0FDFA] text-primary border-l-[3px] border-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined text-[20px]">folder_shared</span>
              <span class="font-body-medium text-body-medium">Medical Records</span>
            </a>
            <a routerLink="/patient/billing" routerLinkActive="bg-[#F0FDFA] text-primary border-l-[3px] border-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined text-[20px]">payments</span>
              <span class="font-body-medium text-body-medium">Billing & Invoices</span>
            </a>
          </ng-container>

          <!-- Doctor Links -->
          <ng-container *ngIf="userRole === 'ROLE_DOCTOR'">
            <a routerLink="/doctor/dashboard" routerLinkActive="bg-[#F0FDFA] text-primary border-l-[3px] border-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined text-[20px]">clinical_notes</span>
              <span class="font-body-medium text-body-medium">Doctor Dashboard</span>
            </a>
            <a routerLink="/doctor/schedule" routerLinkActive="bg-[#F0FDFA] text-primary border-l-[3px] border-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined text-[20px]">schedule</span>
              <span class="font-body-medium text-body-medium">Working Hours</span>
            </a>
            <a routerLink="/consultation/room" routerLinkActive="bg-[#F0FDFA] text-primary border-l-[3px] border-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined text-[20px]">videocam</span>
              <span class="font-body-medium text-body-medium">Admit Patient</span>
            </a>
          </ng-container>

          <!-- Admin Links -->
          <ng-container *ngIf="userRole === 'ROLE_ADMIN'">
            <a routerLink="/admin/dashboard" routerLinkActive="bg-[#F0FDFA] text-primary border-l-[3px] border-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined text-[20px]">monitoring</span>
              <span class="font-body-medium text-body-medium">Operations Telemetry</span>
            </a>
            <a routerLink="/admin/doctors" routerLinkActive="bg-[#F0FDFA] text-primary border-l-[3px] border-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined text-[20px]">stethoscope</span>
              <span class="font-body-medium text-body-medium">Doctor Credentialing</span>
            </a>
            <a routerLink="/admin/patients" routerLinkActive="bg-[#F0FDFA] text-primary border-l-[3px] border-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined text-[20px]">groups</span>
              <span class="font-body-medium text-body-medium">Patient Directory</span>
            </a>
            <a routerLink="/admin/audit-logs" routerLinkActive="bg-[#F0FDFA] text-primary border-l-[3px] border-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined text-[20px]">security</span>
              <span class="font-body-medium text-body-medium">Clinical Audit Logs</span>
            </a>
          </ng-container>

          <a routerLink="/notifications" routerLinkActive="bg-[#F0FDFA] text-primary border-l-[3px] border-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors mt-2">
            <span class="material-symbols-outlined text-[20px]">notifications</span>
            <span class="font-body-medium text-body-medium">Notification Center</span>
          </a>

          <a routerLink="/settings" routerLinkActive="bg-[#F0FDFA] text-primary border-l-[3px] border-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
            <span class="material-symbols-outlined text-[20px]">settings</span>
            <span class="font-body-medium text-body-medium">Account & Security</span>
          </a>
        </nav>
      </div>

      <!-- Bottom Compliance Status Box -->
      <div class="p-space-md border-t border-[#E2E8F0] flex flex-col gap-2">
        <div class="p-3 rounded-lg bg-surface-container-low text-on-surface-variant flex flex-col gap-1">
          <div class="flex items-center gap-1.5 text-primary font-semibold text-xs">
            <span class="material-symbols-outlined text-[16px]">verified</span>
            <span>Security Framework</span>
          </div>
          <p class="font-caption-caps text-caption-caps leading-tight text-on-surface-variant">
            Level-4 Clinical Audit Trail • Oracle Relational Storage
          </p>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  private authService = inject(AuthService);

  get userRole(): string | null {
    return this.authService.userRole();
  }

  get portalTitle(): string {
    switch (this.userRole) {
      case 'ROLE_ADMIN': return 'ADMINISTRATIVE GOVERNANCE';
      case 'ROLE_DOCTOR': return 'PHYSICIAN CLINICAL PORTAL';
      case 'ROLE_PATIENT':
      default:
        return 'PATIENT CARE PORTAL';
    }
  }
}
