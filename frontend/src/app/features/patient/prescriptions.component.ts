import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PrescriptionService } from '../../core/services/prescription.service';
import { AuthService } from '../../core/services/auth.service';
import { Prescription } from '../../core/models/prescription.model';

type DemoState = 'all' | 'renewal' | 'empty';

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto pb-16">
      <!-- Demo State Selector Bar (Interactive Prototype) -->
      <div class="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low px-4 py-2.5 rounded-xl border border-[#E2E8F0]">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[18px]">tune</span>
          <span class="font-label-medium text-label-medium text-on-surface font-semibold">Demo State Selector:</span>
          <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider hidden sm:inline">
            Interactive Prototype Switcher
          </span>
        </div>
        <div class="flex items-center gap-1.5 bg-surface-container-lowest p-1 rounded-lg shadow-xs border border-[#E2E8F0]">
          <button
            type="button"
            (click)="setDemoState('all')"
            class="px-3 py-1 rounded font-label-medium text-label-medium transition-all"
            [ngClass]="demoState === 'all' ? 'bg-primary text-on-primary font-semibold shadow-xs' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'"
          >
            Active Prescriptions ({{ prescriptions.length }})
          </button>
          <button
            type="button"
            (click)="setDemoState('renewal')"
            class="px-3 py-1 rounded font-label-medium text-label-medium transition-all"
            [ngClass]="demoState === 'renewal' ? 'bg-primary text-on-primary font-semibold shadow-xs' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'"
          >
            Renewal Required Only (1)
          </button>
          <button
            type="button"
            (click)="setDemoState('empty')"
            class="px-3 py-1 rounded font-label-medium text-label-medium transition-all"
            [ngClass]="demoState === 'empty' ? 'bg-primary text-on-primary font-semibold shadow-xs' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'"
          >
            Empty State Mock
          </button>
        </div>
      </div>

      <!-- Breadcrumbs and Header -->
      <div class="flex flex-col gap-2">
        <nav class="flex items-center gap-2 font-caption-caps text-caption-caps text-on-surface-variant tracking-wider uppercase">
          <a routerLink="/patient/dashboard" class="hover:text-primary transition-colors">Patient Portal</a>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <span class="text-on-surface font-semibold">Prescriptions &amp; Medications</span>
        </nav>

        <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div class="flex flex-col gap-1 max-w-3xl">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="font-headline-1 text-headline-1 text-on-surface tracking-tight font-bold">
                Prescriptions &amp; Medications
              </h1>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-label-medium text-label-medium font-semibold">
                <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                <span>{{ filteredPrescriptions.length }} Active Rx</span>
              </span>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container/60 text-error font-caption-caps text-caption-caps font-semibold">
                <span class="material-symbols-outlined text-[12px]">schedule</span>
                <span>1 Requires Renewal</span>
              </span>
            </div>
            <p class="font-body-regular text-body-regular text-on-surface-variant">
              Review active prescriptions, verified dosage schedules, refill authorizations, and synchronized digital pharmacy orders under certified telehealth standards.
            </p>
          </div>

          <!-- Quick Actions -->
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              (click)="printList()"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface shadow-xs hover:bg-surface-container transition-all font-body-medium text-body-medium font-semibold border border-[#E2E8F0]"
            >
              <span class="material-symbols-outlined text-[18px] text-primary">print</span>
              <span>Print Medication List (.pdf)</span>
            </button>
            <button
              type="button"
              (click)="requestGeneralRenewal()"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary shadow-xs hover:bg-primary-container transition-all font-body-medium text-body-medium font-semibold"
            >
              <span class="material-symbols-outlined text-[18px]">sync</span>
              <span>Request Refill Renewal</span>
            </button>
          </div>
        </div>

        <!-- Preferred Pharmacy Banner Pin -->
        <div class="mt-2 flex flex-col md:flex-row md:items-center justify-between p-4 bg-surface-container-lowest rounded-xl shadow-xs border border-[#E2E8F0] gap-4">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary shrink-0">
              <span class="material-symbols-outlined text-[24px]">local_pharmacy</span>
            </div>
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider font-semibold">Designated Fulfillment Pharmacy</span>
                <span class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-surface-container text-primary font-caption-caps text-[10px] font-bold">24-HR PICKUP</span>
              </div>
              <span class="font-headline-3 text-headline-3 text-on-surface font-semibold">{{ currentPharmacy }}</span>
              <span class="font-label-regular text-label-regular text-on-surface-variant">e-Prescriptions are securely routed to your verified local fulfillment pharmacy upon clinical issuance.</span>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-low text-primary font-label-medium text-label-medium">
              <span class="material-symbols-outlined text-[15px]">sensors</span>
              <span>e-Prescribing Gateway Linked</span>
            </span>
            <button (click)="changePharmacy()" class="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-medium text-label-medium">
              Change
            </button>
          </div>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-[#E2E8F0] flex flex-col gap-3">
        <div class="flex flex-col lg:flex-row gap-3 justify-between">
          <div class="relative flex-1">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search medication name, prescribing doctor, or Rx number..."
              class="w-full h-11 pl-10 pr-10 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline font-body-regular text-body-regular outline-none focus:bg-surface-container-lowest border border-transparent focus:border-primary transition-all text-sm"
            />
          </div>

          <div class="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <select
              [(ngModel)]="selectedSpecialty"
              class="h-11 px-3.5 pr-8 rounded-lg bg-surface-container-low text-on-surface font-body-regular text-body-regular outline-none cursor-pointer border border-transparent focus:border-primary text-sm"
            >
              <option value="ALL">All Specialties</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Internal Medicine">Internal Medicine</option>
              <option value="Dermatology">Dermatology</option>
            </select>

            <select
              [(ngModel)]="selectedSort"
              class="h-11 px-3.5 pr-8 rounded-lg bg-surface-container-low text-on-surface font-body-regular text-body-regular outline-none cursor-pointer border border-transparent focus:border-primary text-sm"
            >
              <option value="recent">Sort: Prescribed (Newest)</option>
              <option value="name">Sort: Medication Name (A-Z)</option>
            </select>
          </div>
        </div>

        <!-- Filter Chips Row -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E2E8F0]">
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              (click)="setStatusFilter('ALL')"
              class="px-3 py-1.5 rounded-lg font-label-medium text-label-medium transition-all"
              [ngClass]="selectedStatus === 'ALL' ? 'bg-primary text-on-primary font-semibold shadow-xs' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'"
            >
              All Rx ({{ prescriptions.length }})
            </button>
            <button
              type="button"
              (click)="setStatusFilter('ACTIVE')"
              class="px-3 py-1.5 rounded-lg font-label-medium text-label-medium transition-all"
              [ngClass]="selectedStatus === 'ACTIVE' ? 'bg-primary text-on-primary font-semibold shadow-xs' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'"
            >
              Active
            </button>
            <button
              type="button"
              (click)="setStatusFilter('DISPENSED')"
              class="px-3 py-1.5 rounded-lg font-label-medium text-label-medium transition-all"
              [ngClass]="selectedStatus === 'DISPENSED' ? 'bg-primary text-on-primary font-semibold shadow-xs' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'"
            >
              Dispensed
            </button>
          </div>

          <div class="flex items-center gap-2 font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider">
            <span class="material-symbols-outlined text-[14px] text-primary">verified</span>
            <span>Telemedicine Practice Guidelines 2020 Drug Lists Synced via Level-4 Auditing</span>
          </div>
        </div>
      </div>

      <!-- Prescription List Grid -->
      <div *ngIf="filteredPrescriptions.length > 0; else emptyStateView" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          *ngFor="let rx of filteredPrescriptions"
          class="p-5 rounded-2xl bg-surface-container-lowest border border-[#E2E8F0] shadow-xs flex flex-col justify-between gap-4 hover:border-primary/40 transition-all"
        >
          <!-- Card Header -->
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                <span class="material-symbols-outlined text-[24px]">medication</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-caption-caps text-caption-caps text-secondary font-mono">{{ rx.prescriptionNumber }}</span>
                  <span
                    class="px-2 py-0.5 rounded-full font-caption-caps text-caption-caps font-bold uppercase"
                    [ngClass]="rx.status === 'ACTIVE' ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-surface-container text-secondary'"
                  >
                    {{ rx.status }}
                  </span>
                </div>
                <h3 class="font-headline-2 text-headline-2 text-on-surface font-semibold">
                  {{ rx.items[0].medicationName || 'Clinical Prescription' }}
                </h3>
              </div>
            </div>

            <button
              type="button"
              (click)="openRxDetails(rx)"
              class="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-secondary hover:text-on-surface transition-colors"
              title="View full prescription"
            >
              <span class="material-symbols-outlined text-[20px]">open_in_new</span>
            </button>
          </div>

          <!-- Items Strip -->
          <div class="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1.5 text-sm">
            <div class="flex items-baseline justify-between">
              <span class="text-secondary font-label-regular text-label-regular">Dosage &amp; Frequency:</span>
              <span class="font-bold text-on-surface">{{ rx.items[0].dosage }} • {{ rx.items[0].frequency }}</span>
            </div>
            <div class="flex items-baseline justify-between">
              <span class="text-secondary font-label-regular text-label-regular">Supply Duration:</span>
              <span class="text-on-surface">{{ rx.items[0].durationDays }} Days ({{ rx.items[0].refillsAllowed }} refills remaining)</span>
            </div>
            <div class="flex items-baseline justify-between">
              <span class="text-secondary font-label-regular text-label-regular">Prescriber:</span>
              <span class="text-primary font-semibold">{{ rx.doctorName }} ({{ rx.doctorSpecialty }})</span>
            </div>
            <div *ngIf="rx.clinicalNotes" class="mt-1 pt-1.5 border-t border-[#E2E8F0] text-xs text-secondary italic">
              "{{ rx.clinicalNotes }}"
            </div>
          </div>

          <!-- Actions Footer -->
          <div class="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
            <span class="font-caption-caps text-caption-caps text-secondary">
              Issued: {{ rx.issueDate | date:'mediumDate' }}
            </span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="openRxDetails(rx)"
                class="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-label-medium font-label-medium font-semibold hover:bg-surface-container-high transition-colors"
              >
                View Details
              </button>
              <button
                type="button"
                (click)="requestRefill(rx)"
                class="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-label-medium font-label-medium font-semibold hover:bg-primary-container transition-colors"
              >
                Request Refill
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State View -->
      <ng-template #emptyStateView>
        <div class="p-12 rounded-2xl bg-surface-container-lowest border border-[#E2E8F0] text-center flex flex-col items-center justify-center gap-3">
          <div class="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-secondary">
            <span class="material-symbols-outlined text-[36px]">medication</span>
          </div>
          <h2 class="font-headline-2 text-headline-2 text-on-surface font-semibold">No Prescriptions Found</h2>
          <p class="font-body-regular text-body-regular text-secondary max-w-md">
            There are currently no active or pending prescription records matching your filter selection.
          </p>
          <button
            type="button"
            (click)="resetFilters()"
            class="mt-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-label-medium font-semibold"
          >
            Reset Filters
          </button>
        </div>
      </ng-template>

      <!-- Prescription Details Modal -->
      <div *ngIf="selectedRx" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm">
        <div class="w-full max-w-xl bg-surface-container-lowest rounded-2xl p-6 shadow-2xl flex flex-col gap-4 border border-[#E2E8F0]">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-[24px]">receipt_long</span>
              </div>
              <div>
                <span class="font-caption-caps text-caption-caps text-secondary font-mono">{{ selectedRx.prescriptionNumber }}</span>
                <h2 class="font-headline-2 text-headline-2 text-on-surface font-bold">Official Telehealth Rx Order</h2>
              </div>
            </div>
            <button
              type="button"
              (click)="closeRxDetails()"
              class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface"
            >
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <!-- Prescription Body -->
          <div class="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2.5 text-sm border border-[#E2E8F0]">
            <div class="flex justify-between">
              <span class="text-secondary">Patient:</span>
              <span class="font-semibold text-on-surface">{{ selectedRx.patientName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-secondary">Prescribing Clinician:</span>
              <span class="font-semibold text-primary">{{ selectedRx.doctorName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-secondary">Encounter:</span>
              <span class="font-mono text-on-surface">{{ selectedRx.encounterNumber }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-secondary">Fulfillment Pharmacy:</span>
              <span class="font-semibold text-on-surface">{{ selectedRx.pharmacyName }}</span>
            </div>
          </div>

          <!-- Medication Items -->
          <div class="space-y-2">
            <h3 class="font-headline-3 text-headline-3 text-on-surface font-semibold">Prescribed Medications</h3>
            <div *ngFor="let item of selectedRx.items" class="p-3 rounded-xl bg-surface-container-lowest border border-[#E2E8F0] space-y-1">
              <div class="flex justify-between font-bold text-on-surface">
                <span>{{ item.medicationName }}</span>
                <span>{{ item.dosage }}</span>
              </div>
              <div class="text-xs text-secondary">Schedule: {{ item.frequency }} • Duration: {{ item.durationDays }} Days</div>
              <div *ngIf="item.instructions" class="text-xs text-primary font-medium">Instructions: {{ item.instructions }}</div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              (click)="closeRxDetails()"
              class="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-semibold text-label-medium"
            >
              Close
            </button>
            <button
              type="button"
              (click)="printList()"
              class="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-label-medium flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-[16px]">print</span>
              <span>Print Rx Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PrescriptionsComponent implements OnInit {
  private prescriptionService = inject(PrescriptionService);
  private authService = inject(AuthService);

  demoState: DemoState = 'all';
  prescriptions: Prescription[] = [];
  selectedRx: Prescription | null = null;

  searchQuery: string = '';
  selectedSpecialty: string = 'ALL';
  selectedSort: string = 'recent';
  selectedStatus: string = 'ALL';

  ngOnInit(): void {
    this.loadPrescriptions();
  }

  get currentPharmacy(): string {
    return this.prescriptions.length > 0 ? this.prescriptions[0].pharmacyName : 'Designated Fulfillment Pharmacy (Retail / Home Delivery)';
  }

  changePharmacy(): void {
    alert('Fulfillment Pharmacy Preference: Select your preferred retail pharmacy or home delivery dispensary.');
  }

  loadPrescriptions(): void {
    const user = this.authService.currentUser();
    const patientId = user ? user.userId : 1;

    this.prescriptionService.getPatientPrescriptions(patientId).subscribe({
      next: (list) => {
        this.prescriptions = list || [];
      },
      error: () => {
        this.prescriptions = [];
      }
    });
  }

  get filteredPrescriptions(): Prescription[] {
    if (this.demoState === 'empty') return [];

    return this.prescriptions.filter((rx) => {
      if (this.demoState === 'renewal') {
        return rx.prescriptionNumber.includes('012') || rx.items.some(i => i.refillsAllowed === 0);
      }
      if (this.selectedStatus !== 'ALL' && rx.status !== this.selectedStatus) {
        return false;
      }
      if (this.selectedSpecialty !== 'ALL' && rx.doctorSpecialty !== this.selectedSpecialty) {
        return false;
      }
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        const matchesName = rx.items.some(i => i.medicationName.toLowerCase().includes(query));
        const matchesDoc = rx.doctorName.toLowerCase().includes(query);
        const matchesNum = rx.prescriptionNumber.toLowerCase().includes(query);
        return matchesName || matchesDoc || matchesNum;
      }
      return true;
    });
  }

  setDemoState(state: DemoState): void {
    this.demoState = state;
  }

  setStatusFilter(status: string): void {
    this.selectedStatus = status;
  }

  resetFilters(): void {
    this.demoState = 'all';
    this.searchQuery = '';
    this.selectedSpecialty = 'ALL';
    this.selectedStatus = 'ALL';
  }

  openRxDetails(rx: Prescription): void {
    this.selectedRx = rx;
  }

  closeRxDetails(): void {
    this.selectedRx = null;
  }

  requestRefill(rx: Prescription): void {
    alert(`Refill request submitted for ${rx.items[0]?.medicationName} to ${rx.doctorName}. Telehealth routing active.`);
  }

  requestGeneralRenewal(): void {
    alert('General refill renewal submitted for all pending prescriptions.');
  }

  printList(): void {
    window.print();
  }
}
