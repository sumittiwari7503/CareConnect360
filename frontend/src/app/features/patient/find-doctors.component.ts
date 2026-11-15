import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../core/services/doctor.service';
import { Doctor } from '../../core/models/doctor.model';

@Component({
  selector: 'app-find-doctors',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto pb-12">
      <!-- Interactive View State Controller -->
      <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface-container-low p-3 shadow-sm border border-[#E2E8F0]">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px] text-primary">tune</span>
          <span class="font-caption-caps text-caption-caps font-semibold uppercase tracking-wider text-on-surface-variant">View Mode Switcher:</span>
        </div>
        <div class="inline-flex rounded-lg bg-surface-container p-1 text-on-surface-variant">
          <button
            type="button"
            (click)="setViewMode('active')"
            [ngClass]="viewMode === 'active' ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface'"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-label-medium text-label-medium transition-all"
          >
            <span class="h-2 w-2 rounded-full" [ngClass]="viewMode === 'active' ? 'bg-primary' : 'bg-outline'"></span>
            Active Providers ({{ doctors.length }})
          </button>
          <button
            type="button"
            (click)="setViewMode('empty')"
            [ngClass]="viewMode === 'empty' ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface'"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-label-medium text-label-medium transition-all"
          >
            <span class="h-2 w-2 rounded-full" [ngClass]="viewMode === 'empty' ? 'bg-primary' : 'bg-outline'"></span>
            Empty State Preview (0 Found)
          </button>
        </div>
      </div>

      <!-- Header & Urgent Care Banner -->
      <header class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <nav class="flex items-center gap-2 font-label-regular text-label-regular text-on-surface-variant">
            <a routerLink="/patient/dashboard" class="hover:text-primary transition-colors">Patient Portal</a>
            <span class="material-symbols-outlined text-[14px]">chevron_right</span>
            <span class="font-label-medium text-label-medium text-on-surface font-semibold">Doctor Directory</span>
          </nav>

          <!-- Urgent Triage Chip -->
          <div class="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-3.5 py-1.5 shadow-sm border border-[#E2E8F0]">
            <span class="relative flex h-2.5 w-2.5">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
            </span>
            <span class="font-caption-caps text-caption-caps font-semibold uppercase tracking-wider text-on-surface">Urgent Triage:</span>
            <span class="font-label-regular text-label-regular text-primary font-medium">Wait time ~4 mins</span>
            <span class="material-symbols-outlined text-[16px] text-primary">arrow_forward</span>
          </div>
        </div>

        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 class="font-display text-display text-on-surface tracking-tight font-bold">Find & Book Doctors</h1>
            <p class="mt-1 font-body-regular text-body-regular text-on-surface-variant max-w-2xl">
              Search accredited medical specialists, filter by consultation mode and insurance coverage, and reserve immediate telehealth or in-clinic visits.
            </p>
          </div>
          <div class="flex items-center gap-2 self-start md:self-end">
            <span class="inline-flex items-center gap-1.5 rounded-md bg-surface-container-high px-2.5 py-1 font-caption-caps text-caption-caps font-semibold uppercase tracking-wider text-on-surface-variant">
              <span class="material-symbols-outlined text-[14px] text-primary">verified</span> Verified Credentials
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-md bg-surface-container-high px-2.5 py-1 font-caption-caps text-caption-caps font-semibold uppercase tracking-wider text-on-surface-variant">
              <span class="material-symbols-outlined text-[14px] text-primary">schedule</span> Real-Time Sync
            </span>
          </div>
        </div>
      </header>

      <!-- Comprehensive Search & Filter Controls -->
      <section class="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm border border-[#E2E8F0]">
        <!-- Primary Search Bar -->
        <div class="flex flex-col lg:flex-row items-stretch gap-3">
          <div class="relative flex-1">
            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
            <input
              type="text"
              [(ngModel)]="searchKeyword"
              (keyup.enter)="applyFilters()"
              class="w-full h-12 pl-12 pr-10 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline font-body-regular text-body-regular outline-none focus:bg-surface-container-lowest transition-all border border-[#E2E8F0]"
              placeholder="Search doctor name, medical condition, or clinical specialty..."
            />
            <button
              *ngIf="searchKeyword"
              type="button"
              (click)="clearSearchKeyword()"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-outline hover:text-on-surface transition-colors"
              title="Clear search"
            >
              <span class="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          </div>

          <div class="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <div class="relative min-w-[170px] flex-1 sm:flex-none">
              <select
                [(ngModel)]="selectedInsurance"
                class="w-full h-12 px-3.5 pr-8 rounded-lg bg-surface-container-low text-on-surface font-body-medium text-body-medium appearance-none outline-none focus:bg-surface-container-lowest transition-all border border-[#E2E8F0] cursor-pointer"
              >
                <option value="ALL">All Insurance Providers</option>
                <option value="Star Health">Star Health & Allied Insurance</option>
                <option value="HDFC ERGO">HDFC ERGO Health Insurance</option>
                <option value="Care Health">Care Health Insurance</option>
                <option value="Niva Bupa">Niva Bupa Health Insurance</option>
                <option value="ICICI Lombard">ICICI Lombard Health Shield</option>
                <option value="PMJAY">Ayushman Bharat PM-JAY</option>
                <option value="Self-Pay">Self-Pay / Cash (Direct Pay)</option>
              </select>
              <span class="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">expand_more</span>
            </div>

            <button
              type="button"
              (click)="applyFilters()"
              class="h-12 px-6 rounded-lg bg-primary-container text-on-primary font-headline-3 text-headline-3 font-semibold hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-2 shrink-0 shadow-sm"
            >
              <span class="material-symbols-outlined text-[20px]">search</span>
              Find Care
            </button>
          </div>
        </div>

        <!-- Filter Category Pills & Controls -->
        <div class="flex flex-col gap-3 pt-2">
          <!-- Specialty Quick Pills -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1">
            <span class="font-caption-caps text-caption-caps font-semibold uppercase tracking-wider text-outline shrink-0">Specialties:</span>
            <button
              *ngFor="let spec of specialties"
              type="button"
              (click)="selectSpecialty(spec)"
              [ngClass]="selectedSpecialty === spec ? 'bg-primary-container text-on-primary font-semibold shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'"
              class="px-3.5 py-1.5 rounded-full font-label-medium text-label-medium shrink-0 transition-colors"
            >
              {{ spec === 'ALL' ? 'All Specialties' : spec }}
            </button>
          </div>

          <!-- Secondary Filter Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <!-- Consultation Mode -->
            <div class="flex flex-col gap-1">
              <label class="font-caption-caps text-caption-caps uppercase tracking-wider text-on-surface-variant font-semibold">Consultation Mode</label>
              <div class="inline-flex rounded-lg bg-surface-container-low p-1 text-on-surface-variant border border-[#E2E8F0]">
                <button
                  type="button"
                  (click)="selectedMode = 'ALL'"
                  [ngClass]="selectedMode === 'ALL' ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'"
                  class="flex-1 py-1 rounded-md font-caption-caps text-caption-caps text-center transition-all"
                >
                  All
                </button>
                <button
                  type="button"
                  (click)="selectedMode = 'VIDEO'"
                  [ngClass]="selectedMode === 'VIDEO' ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'"
                  class="flex-1 py-1 rounded-md font-caption-caps text-caption-caps text-center transition-all"
                >
                  Telehealth
                </button>
                <button
                  type="button"
                  (click)="selectedMode = 'IN_PERSON'"
                  [ngClass]="selectedMode === 'IN_PERSON' ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'"
                  class="flex-1 py-1 rounded-md font-caption-caps text-caption-caps text-center transition-all"
                >
                  In-Clinic
                </button>
              </div>
            </div>

            <!-- Consultation Fee Range -->
            <div class="flex flex-col gap-1">
              <label class="font-caption-caps text-caption-caps uppercase tracking-wider text-on-surface-variant font-semibold">Max Consultation Fee</label>
              <div class="relative">
                <select
                  [(ngModel)]="selectedMaxFee"
                  (change)="applyFilters()"
                  class="w-full h-9 px-3 pr-8 rounded-lg bg-surface-container-low text-on-surface font-label-medium text-label-medium appearance-none outline-none border border-[#E2E8F0] cursor-pointer"
                >
                  <option [ngValue]="null">All Fee Ranges</option>
                  <option [ngValue]="1000">Under ₹1,000</option>
                  <option [ngValue]="1500">Under ₹1,500</option>
                  <option [ngValue]="2500">Under ₹2,500</option>
                </select>
                <span class="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-outline text-[16px]">expand_more</span>
              </div>
            </div>

            <!-- Minimum Rating -->
            <div class="flex flex-col gap-1">
              <label class="font-caption-caps text-caption-caps uppercase tracking-wider text-on-surface-variant font-semibold">Minimum Rating</label>
              <div class="relative">
                <select
                  [(ngModel)]="selectedMinRating"
                  (change)="applyFilters()"
                  class="w-full h-9 px-3 pr-8 rounded-lg bg-surface-container-low text-on-surface font-label-medium text-label-medium appearance-none outline-none border border-[#E2E8F0] cursor-pointer"
                >
                  <option [ngValue]="null">Any Rating</option>
                  <option [ngValue]="4.5">4.5+ Stars</option>
                  <option [ngValue]="4.8">4.8+ Stars</option>
                </select>
                <span class="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-outline text-[16px]">expand_more</span>
              </div>
            </div>

            <!-- Sort By -->
            <div class="flex flex-col gap-1">
              <label class="font-caption-caps text-caption-caps uppercase tracking-wider text-on-surface-variant font-semibold">Sort Order</label>
              <div class="relative">
                <select
                  [(ngModel)]="sortBy"
                  (change)="applySort()"
                  class="w-full h-9 px-3 pr-8 rounded-lg bg-surface-container-low text-on-surface font-label-medium text-label-medium appearance-none outline-none border border-[#E2E8F0] cursor-pointer"
                >
                  <option value="rating">Highest Rated</option>
                  <option value="experience">Years of Experience</option>
                  <option value="fee_asc">Fee: Low to High</option>
                  <option value="fee_desc">Fee: High to Low</option>
                </select>
                <span class="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-outline text-[16px]">expand_more</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Results Indicator Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-body-medium text-body-medium text-on-surface font-semibold">
            Showing {{ filteredDoctors.length }}
          </span>
          <span class="font-body-regular text-body-regular text-on-surface-variant">licensed medical specialists</span>
          <span *ngIf="selectedSpecialty !== 'ALL'" class="inline-flex items-center gap-1 rounded-md bg-surface-container-high px-2 py-0.5 font-caption-caps text-caption-caps text-on-surface-variant">
            {{ selectedSpecialty }}
            <button (click)="selectSpecialty('ALL')" class="hover:text-error transition-colors" title="Clear filter">
              <span class="material-symbols-outlined text-[13px]">close</span>
            </button>
          </span>
          <button *ngIf="selectedSpecialty !== 'ALL' || searchKeyword || selectedMaxFee !== null || selectedMinRating !== null" (click)="resetAllFilters()" class="font-caption-caps text-caption-caps text-primary hover:underline ml-1">
            Reset all filters
          </button>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div *ngIf="isLoading" class="p-12 text-center bg-surface-container-lowest rounded-xl shadow-sm border border-[#E2E8F0]">
        <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p class="font-body-medium text-body-medium text-on-surface-variant">Searching accredited clinical specialists...</p>
      </div>

      <!-- Doctor Directory Cards Grid (Active Results) -->
      <div *ngIf="!isLoading && viewMode === 'active' && filteredDoctors.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <article
          *ngFor="let doctor of filteredDoctors"
          class="flex flex-col justify-between rounded-xl bg-surface-container-lowest p-6 shadow-sm hover:shadow-md transition-shadow border border-[#E2E8F0]"
        >
          <div class="flex flex-col gap-4">
            <!-- Header / Identity -->
            <div class="flex items-start gap-4">
              <div class="relative shrink-0">
                <div class="h-16 w-16 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-xl shadow-sm">
                  {{ getInitials(doctor.fullName) }}
                </div>
                <span class="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm" title="Verified Board Certified">
                  <span class="material-symbols-outlined text-[13px]">verified</span>
                </span>
              </div>

              <div class="flex flex-col min-w-0">
                <div class="flex items-center gap-2">
                  <h2 class="font-headline-3 text-headline-3 text-on-surface font-semibold truncate">{{ doctor.fullName }}</h2>
                  <span *ngIf="doctor.isSynthetic" class="inline-flex items-center gap-1 rounded bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 font-caption-caps text-caption-caps font-bold shrink-0">
                    <span class="material-symbols-outlined text-[13px]">science</span>
                    SIMULATED DEMO PROFILE
                  </span>
                </div>
                <span class="font-caption-caps text-caption-caps font-semibold text-primary truncate">{{ doctor.specialty }}</span>
                <div class="mt-1 flex items-center gap-2 text-on-surface-variant">
                  <span class="flex items-center gap-0.5 font-label-medium text-label-medium text-amber-700">
                    <span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">star</span>
                    {{ doctor.averageRating || 4.9 }}
                  </span>
                  <span class="font-caption-caps text-caption-caps text-outline">({{ doctor.totalReviews || 184 }} reviews)</span>
                  <span class="h-1 w-1 rounded-full bg-outline"></span>
                  <span class="font-caption-caps text-caption-caps">{{ doctor.experienceYears || 12 }} Yrs Exp</span>
                </div>
              </div>
            </div>

            <!-- Credentials & Affiliation -->
            <div class="rounded-lg bg-surface-container-low p-3 flex flex-col gap-1.5 border border-[#E2E8F0]/60">
              <div *ngIf="doctor.isSynthetic" class="flex items-center gap-1.5 font-label-regular text-xs text-amber-800 font-semibold bg-amber-50 p-1.5 rounded border border-amber-200">
                <span class="material-symbols-outlined text-[14px]">warning</span>
                <span>Demo Provider Persona — Internal testing profile.</span>
              </div>
              <div class="flex items-center gap-2 font-label-regular text-label-regular text-on-surface">
                <span class="material-symbols-outlined text-[16px] text-primary">school</span>
                <span class="truncate">{{ doctor.subSpecialty || 'Clinical Board Specialist' }}</span>
              </div>
              <div class="flex items-center gap-2 font-label-regular text-label-regular text-on-surface-variant">
                <span class="material-symbols-outlined text-[16px] text-outline">verified_user</span>
                <span class="truncate">NPI: {{ doctor.npi }} • Lic: {{ doctor.licenseNumber }}</span>
              </div>
              <div class="flex items-center gap-2 font-label-regular text-label-regular text-on-surface-variant">
                <span class="material-symbols-outlined text-[16px] text-outline">translate</span>
                <span class="truncate">English, Spanish</span>
              </div>
            </div>

            <!-- Fee and Mode indicator -->
            <div class="flex items-center justify-between font-label-medium text-label-medium">
              <div class="flex items-center gap-1.5">
                <span class="inline-flex items-center gap-1 rounded bg-surface-container px-2 py-0.5 font-caption-caps text-caption-caps text-on-surface">
                  <span class="material-symbols-outlined text-[12px] text-primary">videocam</span> Video & Clinic
                </span>
              </div>
              <div class="text-right">
                <span class="font-headline-3 text-headline-3 text-on-surface font-semibold">₹{{ doctor.consultationFee | number }}</span>
                <span class="font-caption-caps text-caption-caps text-on-surface-variant block">Co-pay: ₹{{ (doctor.consultationFee * 0.20) | number:'1.0-0' }} (In-Network)</span>
              </div>
            </div>

            <!-- Quick Slot Pills -->
            <div class="flex flex-col gap-1.5 pt-1">
              <span class="font-caption-caps text-caption-caps uppercase tracking-wider text-outline font-semibold">Available Slots:</span>
              <div class="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  (click)="quickBook(doctor, '09:00')"
                  class="px-2.5 py-1.5 rounded-md font-label-medium text-label-medium bg-surface-container text-on-surface hover:bg-primary-container hover:text-on-primary transition-colors border border-[#E2E8F0]"
                >
                  9:00 AM
                </button>
                <button
                  type="button"
                  (click)="quickBook(doctor, '10:30')"
                  class="px-2.5 py-1.5 rounded-md font-label-medium text-label-medium bg-surface-container text-on-surface hover:bg-primary-container hover:text-on-primary transition-colors border border-[#E2E8F0]"
                >
                  10:30 AM
                </button>
                <button
                  type="button"
                  (click)="quickBook(doctor, '14:00')"
                  class="px-2.5 py-1.5 rounded-md font-label-medium text-label-medium bg-surface-container text-on-surface hover:bg-primary-container hover:text-on-primary transition-colors border border-[#E2E8F0]"
                >
                  2:00 PM
                </button>
                <a [routerLink]="['/patient/book', doctor.id]" class="px-2 py-1.5 rounded-md font-caption-caps text-caption-caps text-primary hover:bg-surface-container transition-colors inline-flex items-center">
                  +more
                </a>
              </div>
            </div>
          </div>

          <!-- Action CTAs -->
          <div class="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center gap-2">
            <a
              [routerLink]="['/doctors', doctor.id]"
              class="flex-1 h-10 rounded-lg bg-surface-container text-on-surface font-label-medium text-label-medium font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center"
            >
              Profile
            </a>
            <a
              [routerLink]="['/patient/book', doctor.id]"
              class="flex-[2] h-10 rounded-lg bg-primary text-on-primary font-label-medium text-label-medium font-semibold hover:bg-primary-container transition-colors inline-flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span class="material-symbols-outlined text-[16px]">calendar_today</span>
              Book Visit
            </a>
          </div>
        </article>
      </div>

      <!-- Empty State View -->
      <div *ngIf="!isLoading && (viewMode === 'empty' || filteredDoctors.length === 0)" class="p-12 text-center bg-surface-container-lowest rounded-xl shadow-sm border border-[#E2E8F0] space-y-4">
        <div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto text-outline">
          <span class="material-symbols-outlined text-[32px]">person_off</span>
        </div>
        <div>
          <h2 class="font-headline-2 text-headline-2 text-on-surface font-semibold">No medical specialists match your criteria</h2>
          <p class="font-body-regular text-body-regular text-on-surface-variant max-w-md mx-auto mt-1">
            Try broadening your search keyword, selecting "All Specialties", or clearing insurance and fee constraints.
          </p>
        </div>
        <button
          type="button"
          (click)="resetAllFilters()"
          class="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-label-medium text-label-medium font-semibold shadow-sm hover:bg-primary-container transition-all inline-flex items-center gap-2"
        >
          <span class="material-symbols-outlined text-[18px]">restart_alt</span>
          Reset All Filters
        </button>
      </div>
    </div>
  `
})
export class FindDoctorsComponent implements OnInit {
  private doctorService = inject(DoctorService);
  private router = inject(Router);

  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  isLoading = true;
  viewMode: 'active' | 'empty' = 'active';

  specialties: string[] = ['ALL', 'Cardiology', 'Dermatology', 'Endocrinology', 'Family Medicine', 'Pediatrics', 'Psychiatry'];
  selectedSpecialty: string = 'ALL';
  searchKeyword: string = '';
  selectedInsurance: string = 'ALL';
  selectedMode: 'ALL' | 'VIDEO' | 'IN_PERSON' = 'ALL';
  selectedMaxFee: number | null = null;
  selectedMinRating: number | null = null;
  sortBy: string = 'rating';

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.isLoading = true;
    this.doctorService.getDoctors().subscribe({
      next: (data) => {
        this.doctors = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  selectSpecialty(spec: string): void {
    this.selectedSpecialty = spec;
    this.applyFilters();
  }

  clearSearchKeyword(): void {
    this.searchKeyword = '';
    this.applyFilters();
  }

  resetAllFilters(): void {
    this.selectedSpecialty = 'ALL';
    this.searchKeyword = '';
    this.selectedInsurance = 'ALL';
    this.selectedMode = 'ALL';
    this.selectedMaxFee = null;
    this.selectedMinRating = null;
    this.sortBy = 'rating';
    this.viewMode = 'active';
    this.applyFilters();
  }

  setViewMode(mode: 'active' | 'empty'): void {
    this.viewMode = mode;
  }

  applyFilters(): void {
    let list = [...this.doctors];

    if (this.selectedSpecialty !== 'ALL') {
      list = list.filter((d) => d.specialty?.toLowerCase().includes(this.selectedSpecialty.toLowerCase()));
    }

    if (this.searchKeyword.trim()) {
      const q = this.searchKeyword.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.fullName.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          (d.subSpecialty && d.subSpecialty.toLowerCase().includes(q))
      );
    }

    if (this.selectedMaxFee !== null) {
      list = list.filter((d) => d.consultationFee <= this.selectedMaxFee!);
    }

    if (this.selectedMinRating !== null) {
      list = list.filter((d) => (d.averageRating || 5.0) >= this.selectedMinRating!);
    }

    this.filteredDoctors = list;
    this.applySort();
  }

  applySort(): void {
    if (this.sortBy === 'rating') {
      this.filteredDoctors.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (this.sortBy === 'experience') {
      this.filteredDoctors.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0));
    } else if (this.sortBy === 'fee_asc') {
      this.filteredDoctors.sort((a, b) => a.consultationFee - b.consultationFee);
    } else if (this.sortBy === 'fee_desc') {
      this.filteredDoctors.sort((a, b) => b.consultationFee - a.consultationFee);
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

  quickBook(doctor: Doctor, time: string): void {
    this.router.navigate(['/patient/book', doctor.id], { queryParams: { preferredTime: time } });
  }
}
