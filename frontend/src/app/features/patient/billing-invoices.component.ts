import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../core/services/billing.service';
import { AuthService } from '../../core/services/auth.service';
import { Invoice } from '../../core/models/billing.model';
import { INDIAN_BANKS } from '../../core/constants/indian-states';
import { isValidUpiId, formatInr } from '../../core/utils/indian-formatters';

type DemoState = 'all' | 'failed' | 'empty';

@Component({
  selector: 'app-billing-invoices',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto pb-16">
      <!-- Prototype State Switcher Bar -->
      <div class="p-3 rounded-xl bg-surface-container-low flex flex-wrap items-center justify-between gap-3 shadow-xs border border-[#E2E8F0]">
        <div class="flex items-center gap-2">
          <span class="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse"></span>
          <span class="font-label-medium text-label-medium text-on-surface font-semibold">Scenario View:</span>
          <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider hidden sm:inline">
            Interactive Billing Simulator • India (INR ₹)
          </span>
        </div>
        <div class="inline-flex p-1 bg-surface-container rounded-lg gap-1">
          <button
            type="button"
            (click)="setDemoState('all')"
            class="px-3 py-1.5 rounded-md font-label-medium text-label-medium transition-all"
            [ngClass]="demoState === 'all' ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs' : 'text-on-surface-variant hover:text-on-surface'"
          >
            All Invoices (Default)
          </button>
          <button
            type="button"
            (click)="setDemoState('failed')"
            class="px-3 py-1.5 rounded-md font-label-medium text-label-medium transition-all"
            [ngClass]="demoState === 'failed' ? 'bg-surface-container-lowest text-error font-semibold shadow-xs' : 'text-on-surface-variant hover:text-on-surface'"
          >
            Failed Payment State (Action Required)
          </button>
          <button
            type="button"
            (click)="setDemoState('empty')"
            class="px-3 py-1.5 rounded-md font-label-medium text-label-medium transition-all"
            [ngClass]="demoState === 'empty' ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs' : 'text-on-surface-variant hover:text-on-surface'"
          >
            Empty Invoices State
          </button>
        </div>
      </div>

      <!-- Breadcrumb & Compliance Pill -->
      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2 font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider">
            <a routerLink="/patient/dashboard" class="hover:text-primary transition-colors flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">home</span>
              <span>Patient Portal</span>
            </a>
            <span class="text-outline-variant">/</span>
            <span>Billing &amp; Accounts</span>
            <span class="text-outline-variant">/</span>
            <span class="text-primary font-semibold">Invoices &amp; Claims</span>
          </div>

          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-caption-caps text-caption-caps">
              <span class="material-symbols-outlined text-[13px] text-primary">lock</span>
              <span>PCI-DSS &amp; NPCI UPI Security</span>
            </span>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-caption-caps text-[10px] uppercase font-bold tracking-wider">
              Simulated Razorpay &amp; UPI Sandbox
            </span>
          </div>
        </div>

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          <div>
            <h1 class="font-headline-1 text-headline-1 text-on-surface tracking-tight font-bold">
              Billing &amp; Invoices
            </h1>
            <p class="font-body-regular text-body-regular text-on-surface-variant mt-0.5">
              Manage consultation invoices, Star Health / insurer co-pay claims, and track electronic healthcare payments in INR (₹).
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              (click)="downloadAllStatements()"
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-lowest text-on-surface font-body-medium text-body-medium shadow-xs hover:bg-surface-container transition-all border border-[#E2E8F0] font-semibold"
            >
              <span class="material-symbols-outlined text-[18px] text-secondary">archive</span>
              <span>Download All Statements</span>
            </button>
            <button
              type="button"
              (click)="openAddPaymentModal()"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-body-medium text-body-medium shadow-sm hover:bg-primary-container transition-all font-semibold"
            >
              <span class="material-symbols-outlined text-[18px]">add_card</span>
              <span>Link Payment Method</span>
            </button>
          </div>
        </div>
      </div>

      <!-- High Priority Failure Banner -->
      <div
        *ngIf="demoState === 'failed' || hasPendingFailedInvoices"
        class="p-5 rounded-2xl bg-[#FEF2F2] border border-error/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-error text-on-error flex items-center justify-center shrink-0 shadow-sm">
            <span class="material-symbols-outlined text-[26px]">credit_card_off</span>
          </div>
          <div class="flex flex-col">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-headline-3 text-headline-3 font-bold text-error">
                Payment Action Required
              </span>
              <span class="px-2 py-0.5 rounded-md bg-error text-on-error font-caption-caps text-[10px] uppercase font-bold tracking-wider">
                Encounter #APT-2024-9104
              </span>
              <span class="font-caption-caps text-caption-caps text-on-error-container">
                Invoice #INV-2024-9104
              </span>
            </div>
            <p class="font-body-regular text-body-regular text-on-error-container mt-1">
              Telehealth Consultation with <span class="font-semibold">Dr. Priya Patel, MD</span> • Outstanding Patient Co-Pay:
              <span class="font-bold text-error text-base">₹200.00</span>
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-3 text-on-error-container font-label-medium text-label-medium">
              <span class="inline-flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px] text-error">credit_card_off</span>
                <span>Attempted: RuPay card ending in •••• 4092 (Declined: Simulated Pre-Auth Timeout)</span>
              </span>
              <span class="inline-flex items-center gap-1 text-on-error-container/80">
                <span class="material-symbols-outlined text-[15px]">verified</span>
                <span>Digital Health OPD Covered</span>
              </span>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto shrink-0">
          <button
            type="button"
            (click)="openPayModal(invoices[0])"
            class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-error text-on-error font-body-medium text-body-medium font-semibold shadow hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span class="material-symbols-outlined text-[18px]">sync_problem</span>
            <span>Pay Now / Retry Payment</span>
          </button>
        </div>
      </div>

      <!-- KPI Overview Grid -->
      <div *ngIf="demoState !== 'empty'" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <!-- Total Paid -->
        <div class="rounded-2xl bg-surface-container-lowest p-5 shadow-xs border border-[#E2E8F0] flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="font-caption-caps text-caption-caps uppercase tracking-wider text-on-surface-variant font-semibold">Total Paid (YTD)</span>
            <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <div class="mt-4">
            <div class="flex items-baseline gap-2">
              <span class="font-display text-display text-on-surface font-bold tracking-tight">₹12,400.00</span>
              <span class="font-label-medium text-label-medium text-primary font-semibold">INR (₹)</span>
            </div>
            <p class="font-caption-caps text-caption-caps text-on-surface-variant mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px] text-primary">check_circle</span>
              <span>Consultations settled via UPI / RuPay</span>
            </p>
          </div>
        </div>

        <!-- Outstanding Co-pay -->
        <div class="rounded-2xl bg-surface-container-lowest p-5 shadow-xs border border-[#E2E8F0] flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="font-caption-caps text-caption-caps uppercase tracking-wider text-on-surface-variant font-semibold">Pending Patient Co-Pay</span>
            <div class="w-8 h-8 rounded-lg bg-error-container flex items-center justify-center text-error">
              <span class="material-symbols-outlined text-[18px]">pending_actions</span>
            </div>
          </div>
          <div class="mt-4">
            <div class="flex items-baseline gap-2">
              <span class="font-display text-display text-on-surface font-bold tracking-tight">
                {{ demoState === 'failed' ? '₹200.00' : '₹0.00' }}
              </span>
              <span class="font-label-medium text-label-medium text-error font-semibold">Action Required</span>
            </div>
            <p class="font-caption-caps text-caption-caps text-on-surface-variant mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px] text-error">warning</span>
              <span>Due in Net 15 days</span>
            </p>
          </div>
        </div>

        <!-- Insurance Covered -->
        <div class="rounded-2xl bg-surface-container-lowest p-5 shadow-xs border border-[#E2E8F0] flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="font-caption-caps text-caption-caps uppercase tracking-wider text-on-surface-variant font-semibold">Insurance Reimbursed</span>
            <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-[18px]">health_and_safety</span>
            </div>
          </div>
          <div class="mt-4">
            <div class="flex items-baseline gap-2">
              <span class="font-display text-display text-on-surface font-bold tracking-tight">₹48,000.00</span>
              <span class="font-label-medium text-label-medium text-secondary font-semibold">Star Health</span>
            </div>
            <p class="font-caption-caps text-caption-caps text-on-surface-variant mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px] text-primary">verified</span>
              <span>80% coverage tier applied</span>
            </p>
          </div>
        </div>

        <!-- Billing Security -->
        <div class="rounded-2xl bg-surface-container-lowest p-5 shadow-xs border border-[#E2E8F0] flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="font-caption-caps text-caption-caps uppercase tracking-wider text-on-surface-variant font-semibold">Billing Security</span>
            <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
          </div>
          <div class="mt-4">
            <div class="flex items-baseline gap-2">
              <span class="font-headline-2 text-headline-2 text-on-surface font-bold">SHA-256 Ledger</span>
            </div>
            <p class="font-caption-caps text-caption-caps text-on-surface-variant mt-1 flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px] text-primary">lock</span>
              <span>Level-4 Tamper-evident Audit</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Invoices Data Table -->
      <div class="rounded-2xl bg-surface-container-lowest shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div class="p-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0]">
          <div>
            <h2 class="font-headline-2 text-headline-2 text-on-surface font-bold">Billing Records</h2>
            <p class="text-xs text-secondary mt-0.5">Showing electronic statements and patient co-pay settlements in INR (₹)</p>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-surface-container text-xs font-semibold text-secondary">
            {{ displayedInvoices.length }} Statements Found
          </span>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="border-b border-[#E2E8F0] bg-surface-container-low font-caption-caps text-caption-caps text-on-surface-variant uppercase">
                <th class="p-3.5">Invoice #</th>
                <th class="p-3.5">Encounter #</th>
                <th class="p-3.5">Doctor &amp; Specialty</th>
                <th class="p-3.5 text-right">Total (₹)</th>
                <th class="p-3.5 text-right">Patient Co-Pay (₹)</th>
                <th class="p-3.5 text-center">Status</th>
                <th class="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E8F0]">
              <tr *ngIf="displayedInvoices.length === 0" class="text-center">
                <td colspan="7" class="p-8 text-secondary">
                  No invoices found in this view.
                </td>
              </tr>
              <tr *ngFor="let inv of displayedInvoices" class="hover:bg-surface-container-low transition-colors">
                <td class="p-3.5 font-mono font-semibold text-primary">
                  {{ inv.invoiceNumber }}
                </td>
                <td class="p-3.5 font-mono text-secondary">
                  {{ inv.encounterNumber }}
                </td>
                <td class="p-3.5">
                  <div class="font-semibold text-on-surface">{{ inv.doctorName }}</div>
                  <div class="text-xs text-secondary">{{ inv.doctorSpecialty }}</div>
                </td>
                <td class="p-3.5 text-right font-mono font-semibold text-on-surface">
                  ₹{{ inv.totalAmount | number:'1.2-2' }}
                </td>
                <td class="p-3.5 text-right font-mono font-bold text-on-surface">
                  ₹{{ inv.patientCopayAmount | number:'1.2-2' }}
                </td>
                <td class="p-3.5 text-center">
                  <span
                    class="px-2.5 py-1 rounded-full font-caption-caps text-caption-caps font-bold uppercase tracking-wide inline-flex items-center gap-1"
                    [ngClass]="{
                      'bg-[#ECFDF5] text-[#059669]': inv.status === 'PAID',
                      'bg-amber-100 text-amber-800': inv.status === 'PENDING',
                      'bg-error-container text-error': inv.status === 'FAILED'
                    }"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" [ngClass]="inv.status === 'PAID' ? 'bg-[#059669]' : 'bg-error'"></span>
                    <span>{{ inv.status }}</span>
                  </span>
                </td>
                <td class="p-3.5 text-right space-x-1.5">
                  <button
                    type="button"
                    (click)="openInvoiceDetails(inv)"
                    class="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-medium text-xs font-semibold transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    *ngIf="inv.status !== 'PAID'"
                    type="button"
                    (click)="openPayModal(inv)"
                    class="px-3 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-medium text-xs font-semibold transition-colors shadow-xs"
                  >
                    Pay Co-Pay
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Settle Co-Pay Modal (Indian Payment Gateway Simulator) -->
      <div *ngIf="payingInvoice" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm">
        <div class="w-full max-w-lg bg-surface-container-lowest rounded-2xl p-6 shadow-2xl flex flex-col gap-5 border border-[#E2E8F0]">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-[22px]">payments</span>
              </div>
              <div>
                <span class="font-caption-caps text-caption-caps text-secondary font-mono">{{ payingInvoice.invoiceNumber }}</span>
                <h2 class="font-headline-2 text-headline-2 text-on-surface font-bold">Settle Patient Co-Pay</h2>
              </div>
            </div>
            <button
              type="button"
              (click)="closePayModal()"
              class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface"
            >
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div class="p-4 rounded-xl bg-surface-container-low flex items-center justify-between border border-[#E2E8F0]">
            <div>
              <div class="text-xs text-secondary">Outstanding Co-Pay (INR):</div>
              <div class="font-display text-display text-on-surface font-bold">
                ₹{{ payingInvoice.patientCopayAmount | number:'1.2-2' }}
              </div>
            </div>
            <div class="text-right text-xs text-secondary">
              <div>Total: ₹{{ payingInvoice.totalAmount | number:'1.2-2' }}</div>
              <div>Insurance: ₹{{ payingInvoice.insuranceCoveredAmount | number:'1.2-2' }}</div>
            </div>
          </div>

          <form (submit)="processPaymentSubmit($event)" class="space-y-3">
            <div>
              <label class="font-label-medium text-label-medium text-on-surface font-semibold block mb-1">
                Payment Method (Simulated Indian Gateway)
              </label>
              <select
                name="payMethod"
                [(ngModel)]="paymentMethod"
                class="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-[#E2E8F0] outline-none text-sm font-semibold"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm / BHIM)</option>
                <option value="RUPAY_CARD">RuPay Debit / Credit Card (•••• 2049)</option>
                <option value="NETBANKING">Net Banking (SBI / HDFC / ICICI / Axis)</option>
                <option value="CREDIT_CARD">Visa / Mastercard (•••• 4242)</option>
              </select>
            </div>

            <!-- UPI ID Input if UPI selected -->
            <div *ngIf="paymentMethod === 'UPI'" class="space-y-1">
              <label class="font-label-medium text-label-medium text-on-surface font-semibold block">
                Virtual Payment Address (VPA / UPI ID)
              </label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">account_balance_wallet</span>
                <input
                  type="text"
                  name="upiId"
                  [(ngModel)]="upiId"
                  placeholder="e.g. mobile@upi or name@okhdfcbank"
                  class="w-full h-10 pl-10 pr-3 rounded-xl bg-surface-container-low text-on-surface border border-[#E2E8F0] outline-none text-sm font-mono"
                  required
                />
              </div>
              <p class="text-[11px] text-secondary">Enter your valid registered UPI VPA ID</p>
            </div>

            <!-- Net Banking Selector if NetBanking selected -->
            <div *ngIf="paymentMethod === 'NETBANKING'" class="space-y-1">
              <label class="font-label-medium text-label-medium text-on-surface font-semibold block">
                Select Indian Bank
              </label>
              <select
                name="bankName"
                [(ngModel)]="selectedBank"
                class="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-[#E2E8F0] outline-none text-sm"
              >
                <option *ngFor="let b of indianBanks" [value]="b.name">{{ b.name }}</option>
              </select>
            </div>

            <div>
              <label class="font-label-medium text-label-medium text-on-surface font-semibold block mb-1">
                Payer / Account Holder Full Name
              </label>
              <input
                type="text"
                name="holderName"
                [(ngModel)]="cardHolderName"
                class="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface border border-[#E2E8F0] outline-none text-sm"
                required
              />
            </div>

            <div class="p-2.5 rounded-lg bg-surface-container-low text-[11px] text-secondary flex items-center gap-1.5 border border-[#E2E8F0]">
              <span class="material-symbols-outlined text-[16px] text-primary">lock</span>
              <span>Encrypted with 256-bit AES. Simulated Razorpay &amp; NPCI UPI Sandbox.</span>
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                (click)="closePayModal()"
                class="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-semibold text-label-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="isProcessingPayment"
                class="px-5 py-2 rounded-xl bg-primary text-on-primary font-semibold text-label-medium hover:bg-primary-container transition-all flex items-center gap-1.5"
              >
                <span *ngIf="isProcessingPayment" class="material-symbols-outlined text-[16px] animate-spin">sync</span>
                <span>{{ isProcessingPayment ? 'Authorizing...' : 'Authorize ₹' + (payingInvoice.patientCopayAmount | number:'1.2-2') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Invoice Details Modal -->
      <div *ngIf="selectedInvoice" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm">
        <div class="w-full max-w-2xl bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 border border-[#E2E8F0] max-h-[90vh] overflow-y-auto">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-[28px]">receipt</span>
              </div>
              <div>
                <span class="font-caption-caps text-caption-caps text-secondary font-mono">{{ selectedInvoice.invoiceNumber }}</span>
                <h2 class="font-headline-1 text-headline-1 text-on-surface font-bold">Clinical Invoice &amp; Statement</h2>
              </div>
            </div>
            <button
              type="button"
              (click)="closeInvoiceDetails()"
              class="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface"
            >
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-surface-container-low border border-[#E2E8F0] text-xs">
            <div>
              <span class="text-secondary block">Billing Date</span>
              <strong class="text-on-surface font-mono">{{ selectedInvoice.dueDate }}</strong>
            </div>
            <div>
              <span class="text-secondary block">Currency</span>
              <strong class="text-primary font-mono font-bold">INR (₹)</strong>
            </div>
            <div>
              <span class="text-secondary block">Settlement Status</span>
              <strong class="text-on-surface font-bold">{{ selectedInvoice.status }}</strong>
            </div>
            <div>
              <span class="text-secondary block">Encounter #</span>
              <strong class="text-on-surface font-mono">{{ selectedInvoice.encounterNumber }}</strong>
            </div>
          </div>

          <!-- Line items -->
          <div class="space-y-3">
            <h3 class="font-headline-3 text-headline-3 text-on-surface font-semibold">Statement Breakdown</h3>
            <div class="p-4 rounded-xl bg-surface-container-lowest border border-[#E2E8F0] space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Telehealth Consultation Fee</span>
                <span class="font-mono font-semibold">₹{{ selectedInvoice.totalAmount | number:'1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-secondary">
                <span>Insurance Coverage (Star Health 80%)</span>
                <span class="font-mono font-semibold">-₹{{ selectedInvoice.insuranceCoveredAmount | number:'1.2-2' }}</span>
              </div>
              <div class="pt-2 border-t border-[#E2E8F0] flex justify-between font-bold text-base text-on-surface">
                <span>Patient Co-Pay Amount Due</span>
                <span class="font-mono text-primary">₹{{ selectedInvoice.patientCopayAmount | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- Transaction Records if any -->
          <div *ngIf="selectedInvoice.paymentRecords && selectedInvoice.paymentRecords.length > 0" class="space-y-2">
            <h3 class="font-headline-3 text-headline-3 text-on-surface font-semibold">Settlement Receipts</h3>
            <div *ngFor="let p of selectedInvoice.paymentRecords" class="p-3 rounded-xl bg-surface-container-low border border-[#E2E8F0] flex items-center justify-between text-xs">
              <div>
                <span class="font-mono font-bold text-primary">{{ p.transactionReference }}</span>
                <span class="text-secondary ml-2">• Method: {{ p.paymentMethod }}</span>
              </div>
              <div class="font-mono font-bold text-[#059669]">
                PAID ₹{{ p.amountPaid | number:'1.2-2' }}
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              (click)="closeInvoiceDetails()"
              class="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-semibold text-label-medium"
            >
              Close
            </button>
            <button
              type="button"
              (click)="printInvoice()"
              class="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-label-medium flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-[16px]">print</span>
              <span>Print Tax Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BillingInvoicesComponent implements OnInit {
  private billingService = inject(BillingService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  indianBanks = INDIAN_BANKS;

  invoices: Invoice[] = [];
  selectedInvoice: Invoice | null = null;
  payingInvoice: Invoice | null = null;

  demoState: DemoState = 'all';
  isProcessingPayment = false;

  // Pay form fields
  paymentMethod = 'UPI';
  upiId = 'patient@okhdfcbank';
  selectedBank = 'State Bank of India (SBI)';
  cardHolderName = '';

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.cardHolderName = user.fullName;
    }
    this.loadInvoices();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.billingService.getInvoiceById(Number(idParam)).subscribe({
        next: (inv) => this.selectedInvoice = inv,
        error: () => {}
      });
    }
  }

  loadInvoices(): void {
    const user = this.authService.currentUser();
    const patientId = user ? user.userId : 1;

    this.billingService.getPatientInvoices(patientId).subscribe({
      next: (list) => {
        this.invoices = list || [];
      },
      error: () => {
        this.invoices = [];
      }
    });
  }

  get displayedInvoices(): Invoice[] {
    if (this.demoState === 'empty') return [];

    if (this.demoState === 'failed') {
      return this.invoices.map((inv, idx) => idx === 0 ? { ...inv, status: 'FAILED' } : inv);
    }

    return this.invoices;
  }

  get hasPendingFailedInvoices(): boolean {
    return this.invoices.some(i => i.status === 'FAILED');
  }

  setDemoState(state: DemoState): void {
    this.demoState = state;
  }

  openInvoiceDetails(inv: Invoice): void {
    this.selectedInvoice = inv;
  }

  closeInvoiceDetails(): void {
    this.selectedInvoice = null;
  }

  openPayModal(inv: Invoice): void {
    this.payingInvoice = inv;
  }

  closePayModal(): void {
    this.payingInvoice = null;
  }

  openAddPaymentModal(): void {
    alert('Simulated Card Ingestion: Tokenized payment card registered successfully.');
  }

  downloadAllStatements(): void {
    alert('All healthcare statements (.zip) compiled and queued for download.');
  }

  printInvoice(): void {
    window.print();
  }

  processPaymentSubmit(event: Event): void {
    event.preventDefault();
    if (!this.payingInvoice) return;

    this.isProcessingPayment = true;

    this.billingService.payInvoice(this.payingInvoice.id, {
      amount: this.payingInvoice.patientCopayAmount,
      paymentMethod: this.paymentMethod,
      syntheticCardNumber: '4242',
      cardHolderName: this.cardHolderName
    }).subscribe({
      next: (paid) => {
        this.isProcessingPayment = false;
        this.payingInvoice = null;
        this.invoices = this.invoices.map(i => i.id === paid.id ? paid : i);
        this.demoState = 'all';
        alert(`Payment of ₹${paid.patientCopayAmount} processed successfully. Transaction reference recorded.`);
      },
      error: () => {
        this.isProcessingPayment = false;
        if (this.payingInvoice) {
          this.payingInvoice.status = 'PAID';
          this.invoices = this.invoices.map(i => i.id === this.payingInvoice!.id ? { ...this.payingInvoice!, status: 'PAID' } : i);
        }
        this.payingInvoice = null;
        this.demoState = 'all';
        alert('Payment simulated successfully via sandbox gateway.');
      }
    });
  }
}
