import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { INDIAN_STATES_AND_UTS, COUNTRY_CALLING_CODES, IndianState } from '../../core/constants/indian-states';
import { isValidIndianMobile, isValidIndianPinCode } from '../../core/utils/indian-formatters';

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="bg-surface font-body-regular text-body-regular text-on-surface min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6">
      <main class="w-full flex items-center justify-center px-4 md:px-8">
        <div class="flex flex-col w-full items-center justify-center">
          <!-- Container with subtle ambient backdrop -->
          <div class="w-full max-w-2xl flex flex-col gap-6 relative">
            <!-- Decorative ambient gradient blur glow -->
            <div class="absolute -top-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
            <div class="absolute -bottom-10 -right-10 w-72 h-72 bg-secondary-container/30 rounded-full blur-3xl pointer-events-none -z-10"></div>

            <!-- Live Demo State Toggle Ribbon -->
            <div class="bg-surface-container-lowest shadow-sm rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-2 border border-slate-200/60">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-primary" style="font-variation-settings: 'FILL' 1;">tune</span>
                <span class="font-label-medium text-xs font-semibold text-on-surface">Interactive Preview States:</span>
              </div>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  (click)="setFormState('default')"
                  [class]="activeState === 'default' ? 'px-3 py-1 rounded-lg text-xs font-semibold transition-all bg-primary text-on-primary' : 'px-3 py-1 rounded-lg text-xs font-semibold transition-all bg-surface-container text-on-surface-variant hover:text-on-surface'"
                >
                  Clean State
                </button>
                <button
                  type="button"
                  (click)="setFormState('error')"
                  [class]="activeState === 'error' ? 'px-3 py-1 rounded-lg text-xs font-semibold transition-all bg-primary text-on-primary' : 'px-3 py-1 rounded-lg text-xs font-semibold transition-all bg-surface-container text-on-surface-variant hover:text-on-surface'"
                >
                  Validation Error State
                </button>
                <button
                  type="button"
                  (click)="setFormState('success')"
                  [class]="activeState === 'success' ? 'px-3 py-1 rounded-lg text-xs font-semibold transition-all bg-primary text-on-primary' : 'px-3 py-1 rounded-lg text-xs font-semibold transition-all bg-surface-container text-on-surface-variant hover:text-on-surface'"
                >
                  Verified / Success
                </button>
              </div>
            </div>

            <!-- Alert / Banner Slot for Success / Error Alert -->
            <div *ngIf="alertBanner" class="transition-all duration-300">
              <div
                [class]="alertType === 'success'
                  ? 'rounded-xl p-4 flex items-start gap-3 shadow-sm bg-primary/10 border border-primary/20 text-primary'
                  : 'rounded-xl p-4 flex items-start gap-3 shadow-sm bg-error-container border border-error/20 text-on-error-container'"
              >
                <span class="material-symbols-outlined text-[20px] shrink-0">
                  {{ alertType === 'success' ? 'check_circle' : 'error' }}
                </span>
                <div class="flex flex-col gap-0.5 text-sm">
                  <span class="font-semibold">{{ alertTitle }}</span>
                  <span class="opacity-90">{{ alertMessage }}</span>
                </div>
              </div>
            </div>

            <!-- Main Registration Card -->
            <div class="bg-surface-container-lowest rounded-xl shadow-md p-6 md:p-10 flex flex-col gap-6 border border-slate-200/70">
              <!-- Header Section -->
              <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                  <span class="text-xs uppercase tracking-wider text-primary font-bold">New Patient Enrollment • India</span>
                  <span class="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px] text-primary">verified</span> DISHA / ABDM Architecture
                  </span>
                </div>
                <h1 class="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">Create your Patient Account</h1>
                <p class="text-sm text-on-surface-variant leading-relaxed">
                  Connect with NMC-registered healthcare practitioners across India, receive digital prescriptions, and consult via encrypted telehealth from any device.
                </p>
              </div>

              <!-- Provider Guidance Notice -->
              <div class="bg-surface-container-low rounded-xl p-4 flex items-start gap-3 border border-slate-200/50">
                <div class="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 text-primary">
                  <span class="material-symbols-outlined text-[20px]">medical_services</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <p class="text-xs font-semibold text-on-surface">Are you a registered medical practitioner (RMP) or hospital administrator?</p>
                  <p class="text-xs text-on-surface-variant">
                    Medical practitioners are onboarded through medical councils and hospital network administration.
                    <a routerLink="/sign-in" class="text-primary font-medium hover:underline inline-flex items-center gap-0.5 ml-1">
                      Sign in here <span class="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </a>
                  </p>
                </div>
              </div>

              <!-- Registration Form -->
              <form (ngSubmit)="handleFormSubmit()" class="flex flex-col gap-5">
                <!-- 1. Full Legal Name -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-semibold text-on-surface flex items-center gap-1">
                      Full Legal Name <span class="text-error">*</span>
                    </label>
                    <span class="text-xs text-on-surface-variant text-right">As on Aadhaar / Government ID</span>
                  </div>
                  <div class="relative flex items-center">
                    <span class="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">badge</span>
                    <input
                      type="text"
                      [(ngModel)]="fullName"
                      name="fullName"
                      (ngModelChange)="validateFullName()"
                      required
                      placeholder="e.g. Ananya Sharma"
                      class="w-full bg-surface-container-lowest text-on-surface text-sm rounded-xl pl-11 pr-11 py-2.5 outline-none border transition-all shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                      [class.border-error]="nameError"
                      [class.border-slate-300]="!nameError"
                    />
                    <div class="absolute right-3 flex items-center">
                      <span
                        *ngIf="fullName.trim().length >= 3 && !nameError"
                        class="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-primary"
                      >
                        <span class="material-symbols-outlined text-[16px] font-bold">check</span>
                      </span>
                      <span
                        *ngIf="nameError"
                        class="w-6 h-6 rounded-full bg-error-container flex items-center justify-center text-error"
                      >
                        <span class="material-symbols-outlined text-[16px]">close</span>
                      </span>
                    </div>
                  </div>
                  <p class="text-xs" [class.text-error]="nameError" [class.text-on-surface-variant]="!nameError">
                    {{ nameFeedback || 'Validated against clinical EHR registration criteria' }}
                  </p>
                </div>

                <!-- 2. Email Address -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-semibold text-on-surface flex items-center gap-1">
                      Email Address <span class="text-error">*</span>
                    </label>
                    <span *ngIf="isEmailValid" class="text-xs text-primary font-medium flex items-center gap-1">
                      <span class="material-symbols-outlined text-[14px]">check_circle</span> Email valid
                    </span>
                  </div>
                  <div class="relative flex items-center">
                    <span class="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">mail</span>
                    <input
                      type="email"
                      [(ngModel)]="email"
                      name="email"
                      (ngModelChange)="validateEmail()"
                      required
                      placeholder="name@example.in"
                      class="w-full bg-surface-container-lowest text-on-surface text-sm rounded-xl pl-11 pr-11 py-2.5 outline-none border transition-all shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                      [class.border-error]="emailError"
                      [class.border-slate-300]="!emailError"
                    />
                    <div class="absolute right-3 flex items-center">
                      <span *ngIf="isEmailValid" class="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined text-[16px] font-bold">check</span>
                      </span>
                      <span *ngIf="emailError" class="w-6 h-6 rounded-full bg-error-container flex items-center justify-center text-error">
                        <span class="material-symbols-outlined text-[16px]">close</span>
                      </span>
                    </div>
                  </div>
                  <p class="text-xs" [class.text-error]="emailError" [class.text-on-surface-variant]="!emailError">
                    {{ emailFeedback || 'Primary contact for consultation links and encounter summaries' }}
                  </p>
                </div>

                <!-- 3. Indian Phone Number with Country Selector -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-semibold text-on-surface flex items-center gap-1">
                      Mobile Number <span class="text-error">*</span>
                    </label>
                    <span class="text-xs text-on-surface-variant">Indian 10-Digit Mobile (SMS &amp; OTP)</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <!-- Country Selector -->
                    <div class="relative">
                      <select
                        [(ngModel)]="selectedCountryCode"
                        name="countryCode"
                        class="h-10 pl-2.5 pr-7 bg-surface-container-low rounded-xl text-xs font-bold text-on-surface border border-slate-200 outline-none appearance-none cursor-pointer"
                      >
                        <option *ngFor="let c of countryCodes" [value]="c.code">
                          {{ c.flag }} {{ c.code }}
                        </option>
                      </select>
                      <span class="material-symbols-outlined pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">expand_more</span>
                    </div>

                    <div class="relative flex-1 flex items-center">
                      <span class="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">smartphone</span>
                      <input
                        type="tel"
                        [(ngModel)]="phone"
                        name="phone"
                        (ngModelChange)="validatePhone()"
                        placeholder="98765 43210"
                        maxlength="15"
                        class="w-full bg-surface-container-lowest text-on-surface text-sm rounded-xl pl-11 pr-11 py-2.5 outline-none border transition-all shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                        [class.border-error]="phoneError"
                        [class.border-slate-300]="!phoneError"
                      />
                      <div class="absolute right-3 flex items-center">
                        <span *ngIf="isPhoneValid" class="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-primary">
                          <span class="material-symbols-outlined text-[16px] font-bold">check</span>
                        </span>
                        <span *ngIf="phoneError" class="w-6 h-6 rounded-full bg-error-container flex items-center justify-center text-error">
                          <span class="material-symbols-outlined text-[16px]">close</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <p class="text-xs" [class.text-error]="phoneError" [class.text-on-surface-variant]="!phoneError">
                    {{ phoneFeedback || 'Valid 10-digit Indian mobile number (e.g. 98765 43210)' }}
                  </p>
                </div>

                <!-- 4. Indian Address Section -->
                <div class="rounded-xl p-4 bg-surface-container-low border border-slate-200/60 flex flex-col gap-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs uppercase tracking-wider text-primary font-bold flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px]">home_pin</span> Residential Address in India
                    </span>
                    <span class="text-[11px] text-on-surface-variant">Required for e-Prescription Fulfillment</span>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <!-- House / Flat No -->
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium text-on-surface">House / Flat / Building No.</label>
                      <input
                        type="text"
                        [(ngModel)]="houseFlatNumber"
                        name="houseFlatNumber"
                        placeholder="e.g. Flat 402, Royal Palms"
                        class="h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-xs border border-slate-200 outline-none focus:border-primary"
                      />
                    </div>

                    <!-- Street / Locality -->
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium text-on-surface">Street / Locality / Sector</label>
                      <input
                        type="text"
                        [(ngModel)]="streetLocality"
                        name="streetLocality"
                        placeholder="e.g. 100ft Road, Indiranagar"
                        class="h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-xs border border-slate-200 outline-none focus:border-primary"
                      />
                    </div>

                    <!-- Landmark -->
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium text-on-surface">Landmark (Optional)</label>
                      <input
                        type="text"
                        [(ngModel)]="landmark"
                        name="landmark"
                        placeholder="e.g. Near Metro Station"
                        class="h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-xs border border-slate-200 outline-none focus:border-primary"
                      />
                    </div>

                    <!-- City / Town -->
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium text-on-surface">City / Town <span class="text-error">*</span></label>
                      <input
                        type="text"
                        [(ngModel)]="city"
                        name="city"
                        placeholder="e.g. Bengaluru"
                        class="h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-xs border border-slate-200 outline-none focus:border-primary"
                      />
                    </div>

                    <!-- District -->
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium text-on-surface">District</label>
                      <input
                        type="text"
                        [(ngModel)]="district"
                        name="district"
                        placeholder="e.g. Bengaluru Urban"
                        class="h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-xs border border-slate-200 outline-none focus:border-primary"
                      />
                    </div>

                    <!-- State / UT Dropdown -->
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium text-on-surface">State / Union Territory <span class="text-error">*</span></label>
                      <select
                        [(ngModel)]="stateUt"
                        name="stateUt"
                        class="h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-xs border border-slate-200 outline-none focus:border-primary cursor-pointer"
                      >
                        <option value="">Select State / UT</option>
                        <option *ngFor="let s of indianStates" [value]="s.name">
                          {{ s.name }} ({{ s.type }})
                        </option>
                      </select>
                    </div>

                    <!-- PIN Code -->
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium text-on-surface">PIN Code (6 Digits) <span class="text-error">*</span></label>
                      <input
                        type="text"
                        [(ngModel)]="pinCode"
                        name="pinCode"
                        (ngModelChange)="validatePinCode()"
                        placeholder="e.g. 560038"
                        maxlength="6"
                        class="h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-xs border outline-none focus:border-primary font-mono"
                        [class.border-error]="pinError"
                        [class.border-slate-200]="!pinError"
                      />
                    </div>

                    <!-- Country Fixed -->
                    <div class="flex flex-col gap-1">
                      <label class="text-xs font-medium text-on-surface">Country</label>
                      <div class="h-9 px-3 rounded-lg bg-surface-container-lowest text-on-surface text-xs border border-slate-200 flex items-center justify-between">
                        <span>India (🇮🇳)</span>
                        <span class="text-xs text-primary font-semibold">Default</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 5. Password with Strength Meter -->
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-semibold text-on-surface flex items-center gap-1">
                      Create Secure Password <span class="text-error">*</span>
                    </label>
                    <span class="text-xs font-bold text-primary">
                      {{ strengthLabel }}
                    </span>
                  </div>
                  <div class="relative flex items-center">
                    <span class="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">lock</span>
                    <input
                      [type]="showPassword ? 'text' : 'password'"
                      [(ngModel)]="password"
                      name="password"
                      (ngModelChange)="checkPasswordStrength()"
                      required
                      placeholder="Enter strong password"
                      class="w-full bg-surface-container-lowest text-on-surface text-sm rounded-xl pl-11 pr-11 py-2.5 outline-none border border-slate-300 font-mono transition-all shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      (click)="showPassword = !showPassword"
                      class="absolute right-3 text-on-surface-variant hover:text-on-surface p-1 transition-colors"
                    >
                      <span class="material-symbols-outlined text-[20px]">
                        {{ showPassword ? 'visibility_off' : 'visibility' }}
                      </span>
                    </button>
                  </div>

                  <!-- Dynamic Multi-segment Progress Bar -->
                  <div class="w-full bg-surface-container rounded-full h-1.5 flex gap-1 overflow-hidden">
                    <div [class]="strengthScore >= 1 ? 'h-full flex-1 rounded-full transition-all duration-300 bg-primary' : 'h-full flex-1 rounded-full bg-slate-200'"></div>
                    <div [class]="strengthScore >= 2 ? 'h-full flex-1 rounded-full transition-all duration-300 bg-primary' : 'h-full flex-1 rounded-full bg-slate-200'"></div>
                    <div [class]="strengthScore >= 3 ? 'h-full flex-1 rounded-full transition-all duration-300 bg-primary' : 'h-full flex-1 rounded-full bg-slate-200'"></div>
                    <div [class]="strengthScore >= 4 ? 'h-full flex-1 rounded-full transition-all duration-300 bg-primary' : 'h-full flex-1 rounded-full bg-slate-200'"></div>
                  </div>

                  <!-- Live Rule Pills -->
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div class="flex items-center gap-1" [class.text-primary]="ruleLength" [class.text-slate-400]="!ruleLength">
                      <span class="material-symbols-outlined text-[15px] font-bold">{{ ruleLength ? 'check_circle' : 'radio_button_unchecked' }}</span>
                      8+ Chars
                    </div>
                    <div class="flex items-center gap-1" [class.text-primary]="ruleCase" [class.text-slate-400]="!ruleCase">
                      <span class="material-symbols-outlined text-[15px] font-bold">{{ ruleCase ? 'check_circle' : 'radio_button_unchecked' }}</span>
                      Upper &amp; lower
                    </div>
                    <div class="flex items-center gap-1" [class.text-primary]="ruleNum" [class.text-slate-400]="!ruleNum">
                      <span class="material-symbols-outlined text-[15px] font-bold">{{ ruleNum ? 'check_circle' : 'radio_button_unchecked' }}</span>
                      1+ Number
                    </div>
                    <div class="flex items-center gap-1" [class.text-primary]="ruleSpecial" [class.text-slate-400]="!ruleSpecial">
                      <span class="material-symbols-outlined text-[15px] font-bold">{{ ruleSpecial ? 'check_circle' : 'radio_button_unchecked' }}</span>
                      Special char
                    </div>
                  </div>
                </div>

                <!-- 6. Confirm Password -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-semibold text-on-surface flex items-center gap-1">
                      Confirm Password <span class="text-error">*</span>
                    </label>
                    <span *ngIf="password && confirmPassword && password === confirmPassword" class="text-xs text-primary font-medium flex items-center gap-1">
                      <span class="material-symbols-outlined text-[14px]">check</span> Passwords match
                    </span>
                  </div>
                  <div class="relative flex items-center">
                    <span class="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">lock_reset</span>
                    <input
                      [type]="showConfirmPassword ? 'text' : 'password'"
                      [(ngModel)]="confirmPassword"
                      name="confirmPassword"
                      (ngModelChange)="validateConfirmPassword()"
                      required
                      placeholder="Re-enter your password"
                      class="w-full bg-surface-container-lowest text-on-surface text-sm rounded-xl pl-11 pr-11 py-2.5 outline-none border font-mono transition-all shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                      [class.border-error]="confirmError"
                      [class.border-slate-300]="!confirmError"
                    />
                    <button
                      type="button"
                      (click)="showConfirmPassword = !showConfirmPassword"
                      class="absolute right-3 text-on-surface-variant hover:text-on-surface p-1 transition-colors"
                    >
                      <span class="material-symbols-outlined text-[20px]">
                        {{ showConfirmPassword ? 'visibility_off' : 'visibility' }}
                      </span>
                    </button>
                  </div>
                  <p *ngIf="confirmError" class="text-xs text-error flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">error</span> Passwords do not match
                  </p>
                </div>

                <!-- Consent & Compliance Section -->
                <div class="bg-surface-container-low rounded-xl p-4 flex flex-col gap-3 border border-slate-200/50">
                  <span class="text-xs uppercase tracking-wider text-secondary font-bold">Consent &amp; Communication Preferences</span>
                  <label class="flex items-start gap-3 cursor-pointer group text-xs text-on-surface leading-normal">
                    <input
                      type="checkbox"
                      [(ngModel)]="consentTerms"
                      name="consentTerms"
                      required
                      class="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                    />
                    <span>
                      I agree to the <a href="#" class="text-primary font-medium hover:underline">CareConnect360 Terms of Service</a> and consent to Telemedicine Consultations governed by the <a href="#" class="text-primary font-medium hover:underline">Telemedicine Practice Guidelines 2020</a> and DISHA / Digital Personal Data Protection Act framework.
                    </span>
                  </label>
                  <label class="flex items-start gap-3 cursor-pointer group text-xs text-on-surface leading-normal">
                    <input
                      type="checkbox"
                      [(ngModel)]="consentSms"
                      name="consentSms"
                      class="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                    />
                    <span>
                      Allow SMS &amp; WhatsApp alerts for upcoming consultation links, appointment reminders, and digital prescription notifications.
                    </span>
                  </label>
                </div>

                <!-- Submit Button -->
                <button
                  type="submit"
                  [disabled]="loading"
                  class="w-full bg-primary hover:bg-[#115E59] active:bg-[#0D9488] text-on-primary py-3 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                >
                  <span *ngIf="loading" class="material-symbols-outlined text-[20px] animate-spin">sync</span>
                  <span>{{ loading ? 'Creating Secure Account...' : 'Create Patient Account' }}</span>
                  <span *ngIf="!loading" class="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>
              </form>

              <!-- Trust Bar / Matrix -->
              <div class="pt-2 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-on-surface-variant text-xs">
                <div class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px] text-primary">verified</span>
                  <span>Telemedicine Practice Guidelines 2020</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px] text-primary">security</span>
                  <span>AES-256 Telemetry Encryption</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="material-symbols-outlined text-[16px] text-primary">health_and_safety</span>
                  <span>ABDM &amp; DISHA Architecture</span>
                </div>
              </div>

              <!-- Sign In Redirection -->
              <div class="text-center pt-2">
                <p class="text-sm text-on-surface-variant">
                  Already have a CareConnect360 account?
                  <a routerLink="/sign-in" class="text-primary hover:underline font-semibold ml-1">Sign In</a>
                </p>
              </div>
            </div>

            <!-- Telehealth Support Footer Quick Links -->
            <div class="flex flex-wrap items-center justify-between text-on-surface-variant text-xs px-2 gap-2">
              <div class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px] text-primary">emergency</span>
                <span>Medical emergency? Call <strong>112</strong> (Ambulance: <strong>108 / 102</strong>) immediately.</span>
              </div>
              <div class="flex items-center gap-3">
                <a class="hover:text-primary transition-colors" href="#">Emergency Protocol</a>
                <span>•</span>
                <a class="hover:text-primary transition-colors" href="#">NMC Regulations</a>
                <span>•</span>
                <a class="hover:text-primary transition-colors" href="#">Support &amp; Helpdesk</a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class PatientRegistrationComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Constants
  indianStates: IndianState[] = INDIAN_STATES_AND_UTS;
  countryCodes = COUNTRY_CALLING_CODES;

  // Form Model
  fullName = '';
  email = '';
  selectedCountryCode = '+91';
  phone = '';
  houseFlatNumber = '';
  streetLocality = '';
  landmark = '';
  city = '';
  district = '';
  stateUt = '';
  pinCode = '';
  country = 'India';
  password = '';
  confirmPassword = '';
  consentTerms = false;
  consentSms = false;

  // UI state
  activeState: 'default' | 'error' | 'success' = 'default';
  showPassword = false;
  showConfirmPassword = false;
  loading = false;

  // Validation state
  nameError = false;
  nameFeedback = 'Validated against clinical EHR registration criteria';
  emailError = false;
  isEmailValid = false;
  emailFeedback = 'Primary contact for consultation links and encounter summaries';
  phoneError = false;
  isPhoneValid = false;
  phoneFeedback = 'Valid 10-digit Indian mobile number (e.g. 98765 43210)';
  pinError = false;
  confirmError = false;

  // Strength rules
  ruleLength = false;
  ruleCase = false;
  ruleNum = false;
  ruleSpecial = false;
  strengthScore = 0;
  strengthLabel = 'None';

  // Alert banner
  alertBanner = false;
  alertType: 'success' | 'error' = 'success';
  alertTitle = '';
  alertMessage = '';

  constructor() {
    this.checkPasswordStrength();
  }

  setFormState(state: 'default' | 'error' | 'success'): void {
    this.activeState = state;
    if (state === 'default') {
      this.fullName = '';
      this.email = '';
      this.phone = '';
      this.houseFlatNumber = '';
      this.streetLocality = '';
      this.landmark = '';
      this.city = '';
      this.district = '';
      this.stateUt = '';
      this.pinCode = '';
      this.password = '';
      this.confirmPassword = '';
      this.consentTerms = false;
      this.consentSms = false;
      this.nameError = false;
      this.emailError = false;
      this.isEmailValid = false;
      this.phoneError = false;
      this.isPhoneValid = false;
      this.pinError = false;
      this.confirmError = false;
      this.alertBanner = false;
      this.checkPasswordStrength();
    } else if (state === 'error') {
      this.fullName = 'E';
      this.email = 'invalid-email-format';
      this.phone = '1234';
      this.city = '';
      this.stateUt = '';
      this.pinCode = '999';
      this.password = 'weak';
      this.confirmPassword = 'different';
      this.nameError = true;
      this.nameFeedback = 'Please enter your complete legal name';
      this.emailError = true;
      this.isEmailValid = false;
      this.emailFeedback = 'Please enter a valid RFC-822 email address';
      this.phoneError = true;
      this.isPhoneValid = false;
      this.phoneFeedback = 'Please enter a valid 10-digit Indian mobile number';
      this.pinError = true;
      this.confirmError = true;
      this.alertBanner = true;
      this.alertType = 'error';
      this.alertTitle = 'Form Validation Incomplete';
      this.alertMessage = 'Please correct the highlighted fields before proceeding with patient registration.';
      this.checkPasswordStrength();
    } else if (state === 'success') {
      this.fullName = 'Ananya Sharma';
      this.email = 'ananya.sharma@example.in';
      this.selectedCountryCode = '+91';
      this.phone = '9876543210';
      this.houseFlatNumber = 'Flat 402, Green Glen Layout';
      this.streetLocality = 'Outer Ring Road, Bellandur';
      this.landmark = 'Near Ecospace Tech Park';
      this.city = 'Bengaluru';
      this.district = 'Bengaluru Urban';
      this.stateUt = 'Karnataka';
      this.pinCode = '560103';
      this.password = 'MedCare#2024$ecure';
      this.confirmPassword = 'MedCare#2024$ecure';
      this.consentTerms = true;
      this.consentSms = true;
      this.nameError = false;
      this.emailError = false;
      this.isEmailValid = true;
      this.phoneError = false;
      this.isPhoneValid = true;
      this.pinError = false;
      this.confirmError = false;
      this.alertBanner = true;
      this.alertType = 'success';
      this.alertTitle = 'Patient Profile Pre-Verified';
      this.alertMessage = 'Ready for immediate clinical tele-triage and virtual encounter scheduling.';
      this.checkPasswordStrength();
    }
  }

  validateFullName(): void {
    if (this.fullName.trim().length >= 3) {
      this.nameError = false;
      this.nameFeedback = 'Validated against clinical EHR registration criteria';
    } else {
      this.nameError = true;
      this.nameFeedback = 'Please enter your complete legal name';
    }
  }

  validateEmail(): void {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (re.test(this.email)) {
      this.emailError = false;
      this.isEmailValid = true;
      this.emailFeedback = 'Primary contact for consultation links and encounter summaries';
    } else {
      this.emailError = true;
      this.isEmailValid = false;
      this.emailFeedback = 'Please enter a valid RFC-822 email address';
    }
  }

  validatePhone(): void {
    if (this.selectedCountryCode === '+91') {
      if (isValidIndianMobile(this.phone)) {
        this.phoneError = false;
        this.isPhoneValid = true;
        this.phoneFeedback = 'Valid Indian mobile number';
      } else {
        this.phoneError = true;
        this.isPhoneValid = false;
        this.phoneFeedback = 'Enter valid 10-digit Indian mobile (starts with 6, 7, 8, 9)';
      }
    } else {
      this.phoneError = this.phone.trim().length < 6;
      this.isPhoneValid = !this.phoneError;
    }
  }

  validatePinCode(): void {
    if (!this.pinCode) {
      this.pinError = false;
      return;
    }
    this.pinError = !isValidIndianPinCode(this.pinCode);
  }

  checkPasswordStrength(): void {
    const val = this.password || '';
    this.ruleLength = val.length >= 8;
    this.ruleCase = /[a-z]/.test(val) && /[A-Z]/.test(val);
    this.ruleNum = /[0-9]/.test(val);
    this.ruleSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val);

    let score = 0;
    if (this.ruleLength) score++;
    if (this.ruleCase) score++;
    if (this.ruleNum) score++;
    if (this.ruleSpecial) score++;
    this.strengthScore = score;

    if (score <= 1) this.strengthLabel = 'Weak';
    else if (score <= 2) this.strengthLabel = 'Fair';
    else if (score <= 3) this.strengthLabel = 'Good';
    else this.strengthLabel = 'Strong';
  }

  validateConfirmPassword(): void {
    this.confirmError = this.password !== this.confirmPassword;
  }

  handleFormSubmit(): void {
    this.validateFullName();
    this.validateEmail();
    this.validatePhone();
    this.validateConfirmPassword();
    this.validatePinCode();

    if (this.nameError || this.emailError || this.phoneError || this.confirmError || this.pinError) {
      this.alertBanner = true;
      this.alertType = 'error';
      this.alertTitle = 'Validation Errors Detected';
      this.alertMessage = 'Please correct the highlighted fields before submitting.';
      return;
    }

    if (!this.consentTerms) {
      this.alertBanner = true;
      this.alertType = 'error';
      this.alertTitle = 'Consent Required';
      this.alertMessage = 'You must agree to the Terms of Service and Telemedicine Practice Guidelines consent to enroll.';
      return;
    }

    const parts = this.fullName.trim().split(' ');
    const firstName = parts[0] || 'Patient';
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : 'User';

    const normalizedPhone = this.selectedCountryCode + '-' + this.phone.trim().replace(/[\s\-]/g, '');

    this.loading = true;
    this.authService.register({
      email: this.email,
      password: this.password,
      firstName,
      lastName,
      phone: normalizedPhone
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.alertBanner = true;
        this.alertType = 'success';
        this.alertTitle = 'Enrollment Successful!';
        this.alertMessage = 'Your CareConnect360 account is active. Redirecting to sign in...';
        setTimeout(() => {
          this.router.navigate(['/sign-in']);
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.alertBanner = true;
        this.alertType = 'error';
        this.alertTitle = 'Enrollment Failed';
        this.alertMessage = err.error?.message || 'Unable to register patient account. Please try a different email.';
      }
    });
  }
}
