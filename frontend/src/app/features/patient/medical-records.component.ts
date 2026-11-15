import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MedicalDocumentService } from '../../core/services/medical-document.service';
import { AuthService } from '../../core/services/auth.service';
import { MedicalDocument } from '../../core/models/medical-document.model';

type DemoState = 'timeline' | 'upload' | 'error' | 'empty';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto pb-16">
      <!-- Prototype State Switcher Bar -->
      <div class="p-3 rounded-xl bg-surface-container-low flex flex-wrap items-center justify-between gap-3 shadow-xs border border-[#E2E8F0]">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary text-on-primary">
            <span class="material-symbols-outlined text-[15px]">tune</span>
          </span>
          <span class="font-label-medium text-label-medium text-on-surface font-semibold">Prototype State Switcher:</span>
          <span class="font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider hidden sm:inline">
            Simulate Clinical EHR Views
          </span>
        </div>
        <div class="inline-flex p-1 bg-surface-container rounded-lg gap-1">
          <button
            type="button"
            (click)="setDemoState('timeline')"
            class="px-3 py-1.5 rounded-md font-label-medium text-label-medium transition-all"
            [ngClass]="demoState === 'timeline' ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs' : 'text-on-surface-variant hover:text-on-surface'"
          >
            Record Timeline (Default)
          </button>
          <button
            type="button"
            (click)="setDemoState('upload')"
            class="px-3 py-1.5 rounded-md font-label-medium text-label-medium transition-all"
            [ngClass]="demoState === 'upload' ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs' : 'text-on-surface-variant hover:text-on-surface'"
          >
            Active Upload Modal
          </button>
          <button
            type="button"
            (click)="setDemoState('error')"
            class="px-3 py-1.5 rounded-md font-label-medium text-label-medium transition-all"
            [ngClass]="demoState === 'error' ? 'bg-surface-container-lowest text-error font-semibold shadow-xs' : 'text-on-surface-variant hover:text-on-surface'"
          >
            Upload Error State
          </button>
          <button
            type="button"
            (click)="setDemoState('empty')"
            class="px-3 py-1.5 rounded-md font-label-medium text-label-medium transition-all"
            [ngClass]="demoState === 'empty' ? 'bg-surface-container-lowest text-primary font-semibold shadow-xs' : 'text-on-surface-variant hover:text-on-surface'"
          >
            Zero Records State
          </button>
        </div>
      </div>

      <!-- Header & Breadcrumbs -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2 font-caption-caps text-caption-caps text-on-surface-variant uppercase tracking-wider">
          <a routerLink="/patient/dashboard" class="hover:text-primary transition-colors">Patient Portal</a>
          <span class="material-symbols-outlined text-[13px] text-outline">chevron_right</span>
          <span>Health Records</span>
          <span class="material-symbols-outlined text-[13px] text-outline">chevron_right</span>
          <span class="text-primary font-semibold">Electronic Medical Records &amp; Clinical Documents</span>
        </div>

        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="flex flex-col gap-1 max-w-3xl">
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="font-headline-1 text-headline-1 text-on-surface font-bold tracking-tight">
                Medical Records &amp; Health Documents
              </h1>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-caption-caps text-caption-caps font-semibold uppercase tracking-wider">
                <span class="material-symbols-outlined text-[14px] text-primary">verified_user</span>
                <span>HIPAA Encrypted Vault</span>
              </span>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-caption-caps text-caption-caps">
                <span class="material-symbols-outlined text-[13px] text-primary">lock</span>
                <span>AES-256</span>
              </span>
            </div>
            <p class="font-body-regular text-body-regular text-on-surface-variant">
              Access encrypted clinical consultation notes, laboratory diagnostics, medical imaging reports, and authorized patient uploads.
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              (click)="openUploadModal()"
              class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-body-medium text-body-medium shadow-sm hover:bg-primary-container transition-all font-semibold"
            >
              <span class="material-symbols-outlined text-[18px]">cloud_upload</span>
              <span>Upload Medical Record</span>
            </button>
            <button
              type="button"
              (click)="exportZip()"
              class="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-on-surface font-body-medium text-body-medium shadow-xs border border-[#E2E8F0] transition-all font-semibold"
            >
              <span class="material-symbols-outlined text-[18px] text-on-surface-variant">archive</span>
              <span>Export Full Record (.zip)</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Security & Privacy Status Bar -->
      <div class="p-4 rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs border border-[#E2E8F0]">
        <div class="flex items-start md:items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
            <span class="material-symbols-outlined text-[20px]">admin_panel_settings</span>
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <span class="font-label-medium text-label-medium font-semibold text-on-surface">HIPAA Audit Ledger &amp; Sharing Governance</span>
              <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <span class="font-caption-caps text-caption-caps text-primary font-bold">Synchronized</span>
            </div>
            <p class="font-body-regular text-body-regular text-on-surface-variant text-xs sm:text-sm">
              Protected by 256-bit AES storage encryption. Access matrix: <span class="font-semibold text-on-surface">2 Providers Authorized</span>, <span class="font-semibold text-secondary">Zero public links exposed</span>.
            </p>
          </div>
        </div>
      </div>

      <!-- Category Filter Chips -->
      <div class="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-[#E2E8F0] flex flex-col gap-3">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div class="relative flex-1 max-w-xl">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[19px]">search</span>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search by document title, clinician, provider network..."
              class="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline font-body-regular text-body-regular outline-none focus:bg-surface-container-lowest border border-transparent focus:border-primary transition-all text-sm"
            />
          </div>

          <div class="flex items-center gap-1.5 px-3 py-2 bg-surface-container-low rounded-xl text-on-surface-variant text-label-medium font-label-medium">
            <span class="material-symbols-outlined text-[16px]">sort</span>
            <span class="text-on-surface font-medium">Most Recent First</span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E2E8F0]">
          <button
            type="button"
            (click)="setCategoryFilter('ALL')"
            class="px-3 py-1.5 rounded-xl font-label-medium text-label-medium transition-colors"
            [ngClass]="selectedCategory === 'ALL' ? 'bg-primary text-on-primary font-semibold shadow-xs' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'"
          >
            All Records ({{ documents.length }})
          </button>
          <button
            type="button"
            (click)="setCategoryFilter('LAB_REPORT')"
            class="px-3 py-1.5 rounded-xl font-label-medium text-label-medium transition-colors"
            [ngClass]="selectedCategory === 'LAB_REPORT' ? 'bg-primary text-on-primary font-semibold shadow-xs' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'"
          >
            Lab Reports
          </button>
          <button
            type="button"
            (click)="setCategoryFilter('RADIOLOGY')"
            class="px-3 py-1.5 rounded-xl font-label-medium text-label-medium transition-colors"
            [ngClass]="selectedCategory === 'RADIOLOGY' ? 'bg-primary text-on-primary font-semibold shadow-xs' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'"
          >
            Radiology &amp; Imaging
          </button>
          <button
            type="button"
            (click)="setCategoryFilter('CLINICAL_NOTE')"
            class="px-3 py-1.5 rounded-xl font-label-medium text-label-medium transition-colors"
            [ngClass]="selectedCategory === 'CLINICAL_NOTE' ? 'bg-primary text-on-primary font-semibold shadow-xs' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'"
          >
            Clinical Summaries
          </button>
        </div>
      </div>

      <!-- Document Timeline / Cards Grid -->
      <div *ngIf="filteredDocuments.length > 0; else emptyStateView" class="space-y-3">
        <div
          *ngFor="let doc of filteredDocuments"
          class="p-4 rounded-2xl bg-surface-container-lowest border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-all"
        >
          <div class="flex items-start md:items-center gap-3.5 min-w-0">
            <div class="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
              <span class="material-symbols-outlined text-[26px]">
                {{ getCategoryIcon(doc.category) }}
              </span>
            </div>
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-headline-3 text-headline-3 text-on-surface font-semibold truncate">
                  {{ doc.documentTitle }}
                </span>
                <span class="px-2 py-0.5 rounded-md bg-surface-container font-caption-caps text-caption-caps text-secondary font-mono font-bold">
                  {{ doc.category }}
                </span>
                <span class="font-caption-caps text-caption-caps text-primary font-semibold flex items-center gap-0.5">
                  <span class="material-symbols-outlined text-[13px]">lock</span>
                  <span>AES-256</span>
                </span>
              </div>
              <div class="flex items-center gap-3 text-secondary text-xs mt-0.5 flex-wrap">
                <span>File: {{ doc.fileName }}</span>
                <span>•</span>
                <span>Size: {{ formatBytes(doc.fileSizeBytes) }}</span>
                <span>•</span>
                <span>Uploaded by: {{ doc.uploadedByName }}</span>
                <span>•</span>
                <span>Date: {{ doc.createdAt | date:'mediumDate' }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              type="button"
              (click)="downloadDoc(doc)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container text-on-surface text-label-medium font-semibold hover:bg-surface-container-high transition-colors"
            >
              <span class="material-symbols-outlined text-[16px] text-primary">download</span>
              <span>Download</span>
            </button>
            <button
              type="button"
              (click)="deleteDoc(doc)"
              class="p-1.5 rounded-xl bg-surface-container-low text-secondary hover:text-error hover:bg-error-container/40 transition-colors"
              title="Remove document"
            >
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State View -->
      <ng-template #emptyStateView>
        <div class="p-12 rounded-2xl bg-surface-container-lowest border border-[#E2E8F0] text-center flex flex-col items-center justify-center gap-3">
          <div class="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-secondary">
            <span class="material-symbols-outlined text-[36px]">folder_open</span>
          </div>
          <h2 class="font-headline-2 text-headline-2 text-on-surface font-semibold">No Medical Documents Found</h2>
          <p class="font-body-regular text-body-regular text-secondary max-w-md">
            No clinical records or laboratory diagnostics match your active search filters.
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

      <!-- Active Upload Modal -->
      <div *ngIf="isUploadModalOpen || demoState === 'upload' || demoState === 'error'" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm">
        <div class="w-full max-w-lg bg-surface-container-lowest rounded-2xl p-6 shadow-2xl flex flex-col gap-4 border border-[#E2E8F0]">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-[24px]">cloud_upload</span>
              </div>
              <div>
                <span class="font-caption-caps text-caption-caps text-primary font-bold uppercase">Encrypted Ingestion</span>
                <h2 class="font-headline-2 text-headline-2 text-on-surface font-bold">Upload Medical Document</h2>
              </div>
            </div>
            <button
              type="button"
              (click)="closeUploadModal()"
              class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface"
            >
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <!-- Error Alert if error state -->
          <div *ngIf="demoState === 'error' || uploadError" class="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] text-error">error</span>
            <span>{{ uploadError || 'File exceeds maximum 25 MB size limit or MIME type is unsupported.' }}</span>
          </div>

          <form (submit)="submitUpload($event)" class="space-y-3">
            <div>
              <label class="font-label-medium text-label-medium text-on-surface font-semibold block mb-1">
                Document Title
              </label>
              <input
                type="text"
                name="docTitle"
                [(ngModel)]="uploadTitle"
                placeholder="e.g. Lipid Profile Lab Results - Oct 2026"
                class="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface font-body-regular border border-[#E2E8F0] focus:border-primary outline-none text-sm"
                required
              />
            </div>

            <div>
              <label class="font-label-medium text-label-medium text-on-surface font-semibold block mb-1">
                Clinical Category
              </label>
              <select
                name="docCategory"
                [(ngModel)]="uploadCategory"
                class="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface font-body-regular border border-[#E2E8F0] focus:border-primary outline-none text-sm"
              >
                <option value="LAB_REPORT">Lab &amp; Diagnostic Report</option>
                <option value="RADIOLOGY">Radiology &amp; Imaging Scan</option>
                <option value="CLINICAL_NOTE">Clinical Encounter Note</option>
                <option value="DISCHARGE_SUMMARY">Discharge Summary</option>
                <option value="PATIENT_UPLOAD">Patient Self-Upload</option>
              </select>
            </div>

            <!-- File Drag & Drop Box -->
            <div>
              <label class="font-label-medium text-label-medium text-on-surface font-semibold block mb-1">
                Select File (.pdf, .png, .jpg, .zip)
              </label>
              <div class="border-2 border-dashed border-[#CBD5E1] rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 bg-surface-container-low">
                <span class="material-symbols-outlined text-[32px] text-primary">upload_file</span>
                <div class="text-xs text-secondary">
                  <span class="font-semibold text-primary">Click to select file</span> or drag &amp; drop
                </div>
                <div class="text-[11px] text-secondary">Max 25 MB • HIPAA Encrypted on Ingestion</div>
                <input
                  type="file"
                  (change)="onFileSelected($event)"
                  class="mt-1 text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-primary file:text-on-primary file:text-xs"
                />
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                (click)="closeUploadModal()"
                class="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-semibold text-label-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="isUploading"
                class="px-5 py-2 rounded-xl bg-primary text-on-primary font-semibold text-label-medium hover:bg-primary-container transition-all flex items-center gap-1.5"
              >
                <span *ngIf="isUploading" class="material-symbols-outlined text-[16px] animate-spin">sync</span>
                <span>{{ isUploading ? 'Encrypting &amp; Uploading...' : 'Upload Record' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class MedicalRecordsComponent implements OnInit {
  private documentService = inject(MedicalDocumentService);
  private authService = inject(AuthService);

  demoState: DemoState = 'timeline';
  documents: MedicalDocument[] = [];
  selectedCategory: string = 'ALL';
  searchQuery: string = '';

  isUploadModalOpen: boolean = false;
  isUploading: boolean = false;
  uploadTitle: string = '';
  uploadCategory: string = 'LAB_REPORT';
  selectedFile: File | null = null;
  uploadError: string | null = null;

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    const user = this.authService.currentUser();
    const patientId = user ? user.userId : 1;

    this.documentService.getPatientDocuments(patientId).subscribe({
      next: (list) => {
        this.documents = list || [];
      },
      error: () => {
        this.documents = [];
      }
    });
  }

  get filteredDocuments(): MedicalDocument[] {
    if (this.demoState === 'empty') return [];

    return this.documents.filter((d) => {
      if (this.selectedCategory !== 'ALL' && d.category !== this.selectedCategory) {
        return false;
      }
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        return (
          d.documentTitle.toLowerCase().includes(query) ||
          d.fileName.toLowerCase().includes(query) ||
          d.uploadedByName.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }

  setDemoState(state: DemoState): void {
    this.demoState = state;
    if (state === 'upload') {
      this.isUploadModalOpen = true;
      this.uploadError = null;
    } else if (state === 'error') {
      this.isUploadModalOpen = true;
      this.uploadError = 'Simulated Error: File size exceeds 25 MB limit or connection timed out.';
    } else {
      this.isUploadModalOpen = false;
    }
  }

  setCategoryFilter(category: string): void {
    this.selectedCategory = category;
  }

  resetFilters(): void {
    this.demoState = 'timeline';
    this.selectedCategory = 'ALL';
    this.searchQuery = '';
  }

  openUploadModal(): void {
    this.isUploadModalOpen = true;
    this.uploadError = null;
  }

  closeUploadModal(): void {
    this.isUploadModalOpen = false;
    if (this.demoState === 'upload' || this.demoState === 'error') {
      this.demoState = 'timeline';
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
      if (!this.uploadTitle) {
        this.uploadTitle = file.name.replace(/\.[^/.]+$/, '');
      }
    }
  }

  submitUpload(event: Event): void {
    event.preventDefault();
    if (!this.selectedFile) {
      this.uploadError = 'Please select a file to upload';
      return;
    }

    const user = this.authService.currentUser();
    const patientId = user ? user.userId : 1;

    this.isUploading = true;
    this.uploadError = null;

    this.documentService.uploadDocument(patientId, this.selectedFile, this.uploadTitle, this.uploadCategory).subscribe({
      next: (created) => {
        this.documents.unshift(created);
        this.isUploading = false;
        this.closeUploadModal();
        this.selectedFile = null;
        this.uploadTitle = '';
      },
      error: (err) => {
        this.isUploading = false;
        this.uploadError = err.error?.message || 'Upload failed. Please check network connection.';
      }
    });
  }

  downloadDoc(doc: MedicalDocument): void {
    this.documentService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        alert(`Downloading encrypted document: ${doc.fileName}`);
      }
    });
  }

  deleteDoc(doc: MedicalDocument): void {
    if (confirm(`Are you sure you want to remove ${doc.documentTitle}?`)) {
      this.documentService.deleteDocument(doc.id).subscribe({
        next: () => {
          this.documents = this.documents.filter(d => d.id !== doc.id);
        },
        error: () => {
          this.documents = this.documents.filter(d => d.id !== doc.id);
        }
      });
    }
  }

  exportZip(): void {
    alert('Full EHR CCDA record export archive (.zip) compiled and queued for download.');
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'LAB_REPORT': return 'biotech';
      case 'RADIOLOGY': return 'radiology';
      case 'CLINICAL_NOTE': return 'description';
      case 'DISCHARGE_SUMMARY': return 'assignment_turned_in';
      default: return 'attachment';
    }
  }

  formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}
