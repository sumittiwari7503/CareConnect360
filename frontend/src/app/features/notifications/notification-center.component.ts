import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { AppNotification } from '../../core/models/notification.model';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="bg-background min-h-screen pb-16">
      <main class="w-full px-4 md:px-8 py-6">
        <!-- Privacy & Encryption Ambient Notification Banner -->
        <div class="w-full mb-6">
          <div class="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-primary text-[22px]">lock</span>
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-base font-semibold text-on-surface">HIPAA Zero-Leakage Preview Active</span>
                  <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-xs uppercase font-semibold">Tier 4 Protected</span>
                </div>
                <p class="text-xs text-on-surface-variant">Sensitive clinical diagnoses and pharmaceutical compounds are masked from push &amp; email previews to uphold your confidential care boundaries.</p>
              </div>
            </div>
            <div class="flex items-center gap-2 self-start md:self-auto shrink-0">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-xs font-semibold text-on-surface-variant">
                <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                E2E Encrypted Feed
              </span>
            </div>
          </div>
        </div>

        <!-- Header & Executive Controls -->
        <header class="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="text-xs uppercase tracking-wider text-primary font-bold">Secure Telehealth &amp; Clinical Operations</span>
              <span class="text-slate-400">•</span>
              <span class="text-xs text-on-surface-variant uppercase">EHR Gateway Synced</span>
            </div>
            <h1 class="text-3xl md:text-4xl font-bold text-on-surface">Notification Center</h1>
            <p class="text-sm text-on-surface-variant max-w-2xl">
              Stay updated on your upcoming encounters, care team communications, and portal security without diagnostic compromise.
            </p>
            <div class="flex items-center gap-3 mt-2 flex-wrap">
              <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-container text-on-primary text-xs font-semibold">
                <span class="material-symbols-outlined text-[16px]">mark_email_unread</span>
                <span>{{ unreadCount }} Unread Notifications</span>
              </div>
              <div class="inline-flex items-center gap-1 text-on-surface-variant text-xs">
                <span class="material-symbols-outlined text-[16px] text-primary">verified_user</span>
                <span>Encrypted in transit &amp; at rest</span>
              </div>
            </div>
          </div>

          <!-- Quick Controls Action Group -->
          <div class="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              (click)="markAllAsRead()"
              [disabled]="loading || unreadCount === 0"
              class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors shadow-sm text-xs font-semibold border border-slate-200 disabled:opacity-50"
            >
              <span class="material-symbols-outlined text-[18px] text-primary">done_all</span>
              <span>Mark All as Read</span>
            </button>
            <button
              type="button"
              (click)="togglePreferences()"
              class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors shadow-sm text-xs font-semibold border border-slate-200"
            >
              <span class="material-symbols-outlined text-[18px] text-secondary">tune</span>
              <span>Preferences</span>
            </button>
            <button
              type="button"
              (click)="previewEmptyState = !previewEmptyState"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-primary hover:bg-primary/10 transition-colors text-xs font-semibold"
            >
              <span class="material-symbols-outlined text-[18px]">
                {{ previewEmptyState ? 'view_agenda' : 'visibility_off' }}
              </span>
              <span>{{ previewEmptyState ? 'Restore Feed View' : 'Preview Empty State' }}</span>
            </button>
          </div>
        </header>

        <!-- Notification Preferences Toast / Modal -->
        <div *ngIf="showPreferencesModal" class="mb-6 p-4 rounded-xl bg-surface-container-lowest border border-primary/30 shadow-md">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[20px]">tune</span>
              <h3 class="text-sm font-bold text-on-surface">Telehealth Communication Preferences</h3>
            </div>
            <button (click)="showPreferencesModal = false" class="text-on-surface-variant hover:text-on-surface">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <label class="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low cursor-pointer">
              <input type="checkbox" checked class="accent-primary" />
              <span>SMS Tele-visit Alerts</span>
            </label>
            <label class="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low cursor-pointer">
              <input type="checkbox" checked class="accent-primary" />
              <span>Prescription Refill Ready</span>
            </label>
            <label class="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low cursor-pointer">
              <input type="checkbox" checked class="accent-primary" />
              <span>Security Anomaly Pings</span>
            </label>
          </div>
        </div>

        <!-- Filter Rail, Category Tabs & Search Bar -->
        <section class="bg-surface-container-lowest rounded-xl p-4 shadow-sm mb-6 flex flex-col gap-4 border border-slate-200/70">
          <!-- Category Tabs -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              (click)="selectCategory('all')"
              [class]="selectedCategory === 'all'
                ? 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold transition-all shrink-0'
                : 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-all shrink-0'"
            >
              <span>All Notifications</span>
              <span class="px-1.5 py-0.5 rounded-md bg-white/20 text-xs">{{ notifications.length }}</span>
            </button>
            <button
              type="button"
              (click)="selectCategory('APPOINTMENT')"
              [class]="selectedCategory === 'APPOINTMENT'
                ? 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold transition-all shrink-0'
                : 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-all shrink-0'"
            >
              <span>Appointments &amp; Consultations</span>
              <span class="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold">{{ countByCategory('APPOINTMENT') }}</span>
            </button>
            <button
              type="button"
              (click)="selectCategory('PRESCRIPTION')"
              [class]="selectedCategory === 'PRESCRIPTION'
                ? 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold transition-all shrink-0'
                : 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-all shrink-0'"
            >
              <span>Prescriptions &amp; Pharmacy</span>
              <span class="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold">{{ countByCategory('PRESCRIPTION') }}</span>
            </button>
            <button
              type="button"
              (click)="selectCategory('RECORDS')"
              [class]="selectedCategory === 'RECORDS'
                ? 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold transition-all shrink-0'
                : 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-all shrink-0'"
            >
              <span>Clinical Records &amp; Labs</span>
              <span class="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold">{{ countByCategory('RECORDS') }}</span>
            </button>
            <button
              type="button"
              (click)="selectCategory('SECURITY')"
              [class]="selectedCategory === 'SECURITY'
                ? 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold transition-all shrink-0'
                : 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold transition-all shrink-0'"
            >
              <span>Security &amp; System</span>
              <span class="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold">{{ countByCategory('SECURITY') }}</span>
            </button>
          </div>

          <!-- Search & Clear Read Bar -->
          <div class="flex flex-col md:flex-row items-center justify-between gap-4 pt-1">
            <div class="relative w-full md:max-w-md">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">search</span>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search by care provider, appointment ID, or clinic keyword..."
                class="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-container-low text-xs text-on-surface placeholder:text-slate-400 focus:outline-none focus:bg-surface-container-lowest transition-colors border border-slate-200"
              />
            </div>
            <div class="flex items-center gap-2 w-full md:w-auto justify-end">
              <div class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs font-medium border border-slate-200">
                <span class="material-symbols-outlined text-[16px] text-on-surface-variant">calendar_month</span>
                <span>Active Encounters</span>
              </div>
              <button
                type="button"
                (click)="clearReadNotifications()"
                class="px-3 py-2 rounded-xl text-secondary hover:text-error hover:bg-error-container/20 transition-colors text-xs font-semibold inline-flex items-center gap-1"
              >
                <span class="material-symbols-outlined text-[16px]">clear_all</span>
                <span>Clear Read</span>
              </button>
            </div>
          </div>
        </section>

        <!-- Empty State View -->
        <section
          *ngIf="previewEmptyState || filteredNotifications.length === 0"
          class="bg-surface-container-lowest rounded-xl p-10 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center my-4"
        >
          <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span class="material-symbols-outlined text-primary text-[36px]" style="font-variation-settings: 'FILL' 1;">notifications_off</span>
          </div>
          <span class="text-xs uppercase text-primary tracking-widest font-bold mb-1">Status: Synced &amp; Idle</span>
          <h3 class="text-2xl font-bold text-on-surface mb-2">You're All Caught Up!</h3>
          <p class="text-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
            No unread or pending patient alerts. CareConnect360 will notify you promptly when your clinical providers file visit summaries, transmit e-prescriptions, or update teleconsultation schedules.
          </p>
          <div class="flex items-center gap-3 flex-wrap justify-center">
            <button
              type="button"
              (click)="previewEmptyState = false; selectCategory('all'); searchQuery = ''"
              class="px-4 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-sm transition-colors flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-[18px]">view_agenda</span>
              <span>Restore Feed View</span>
            </button>
            <button
              type="button"
              (click)="togglePreferences()"
              class="px-4 py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-[18px]">settings</span>
              <span>Adjust Preferences</span>
            </button>
          </div>
        </section>

        <!-- Notification Feed Container -->
        <main *ngIf="!previewEmptyState && filteredNotifications.length > 0" class="flex flex-col gap-4">
          <div *ngFor="let item of filteredNotifications" class="transition-all">
            <article
              [class]="!item.isRead
                ? 'bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col md:flex-row gap-4 items-start justify-between border-l-4 border-l-primary border-t border-r border-b border-slate-200'
                : 'bg-surface-container-lowest/80 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col md:flex-row gap-4 items-start justify-between border border-slate-200/60 opacity-85'"
            >
              <div class="flex gap-4 items-start w-full">
                <!-- Category Icon -->
                <div class="relative shrink-0">
                  <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined text-[24px]">
                      {{ getCategoryIcon(item.category) }}
                    </span>
                  </div>
                  <span
                    *ngIf="!item.isRead"
                    class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary ring-2 ring-white"
                  ></span>
                </div>

                <!-- Notification Content -->
                <div class="flex flex-col flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap mb-1">
                    <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-xs uppercase font-semibold">
                      {{ item.category }}
                    </span>
                    <span class="text-slate-400 text-xs">•</span>
                    <span class="text-xs text-primary font-semibold">{{ formatTimestamp(item.createdAt) }}</span>
                    <span *ngIf="item.referenceCode" class="text-slate-400 text-xs">•</span>
                    <span *ngIf="item.referenceCode" class="text-xs text-on-surface-variant font-mono">{{ item.referenceCode }}</span>
                  </div>

                  <h3 class="text-lg font-bold text-on-surface mb-1 flex items-center gap-2 flex-wrap">
                    <span>{{ item.title }}</span>
                    <span
                      *ngIf="item.badgeText"
                      [class]="item.badgeSeverity === 'urgent'
                        ? 'inline-flex items-center px-2 py-0.5 rounded bg-error-container text-on-error-container text-xs font-semibold'
                        : 'inline-flex items-center px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-xs font-semibold'"
                    >
                      {{ item.badgeText }}
                    </span>
                  </h3>

                  <p class="text-sm text-on-surface-variant mb-4 max-w-3xl leading-relaxed">
                    {{ item.message }}
                  </p>

                  <!-- Action Buttons -->
                  <div class="flex items-center gap-2 flex-wrap mt-auto">
                    <a
                      *ngIf="item.actionLink"
                      [routerLink]="item.actionLink"
                      class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors text-xs font-semibold shadow-sm"
                    >
                      <span class="material-symbols-outlined text-[16px]">open_in_new</span>
                      <span>{{ item.actionLabel || 'View Details' }}</span>
                    </a>
                    <button
                      *ngIf="!item.isRead"
                      type="button"
                      (click)="markSingleAsRead(item.id)"
                      class="px-3 py-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <span class="material-symbols-outlined text-[16px]">done</span>
                      <span>Mark as read</span>
                    </button>
                    <span *ngIf="item.isRead" class="text-xs text-slate-400 flex items-center gap-1">
                      <span class="material-symbols-outlined text-[14px]">check_circle</span> Read
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </main>
      </main>
    </div>
  `
})
export class NotificationCenterComponent implements OnInit {
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  notifications: AppNotification[] = [];
  selectedCategory: string = 'all';
  searchQuery: string = '';
  previewEmptyState = false;
  showPreferencesModal = false;
  loading = false;

  get unreadCount(): number {
    return this.notificationService.unreadCount();
  }

  get filteredNotifications(): AppNotification[] {
    let list = this.notifications;
    if (this.selectedCategory !== 'all') {
      list = list.filter((n) => n.category.toUpperCase() === this.selectedCategory.toUpperCase());
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter((n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.referenceCode && n.referenceCode.toLowerCase().includes(q))
      );
    }
    return list;
  }

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUnreadCount();
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications(this.selectedCategory).subscribe({
      next: (data) => {
        this.notifications = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe();
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  countByCategory(cat: string): number {
    return this.notifications.filter((n) => n.category.toUpperCase() === cat.toUpperCase()).length;
  }

  markSingleAsRead(id: number): void {
    this.notificationService.markAsRead(id).subscribe({
      next: (updated) => {
        const item = this.notifications.find((n) => n.id === id);
        if (item) {
          item.isRead = true;
          item.readAt = updated.readAt;
        }
      }
    });
  }

  markAllAsRead(): void {
    this.loading = true;
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach((n) => (n.isRead = true));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  clearReadNotifications(): void {
    this.notificationService.clearReadNotifications().subscribe({
      next: () => {
        this.notifications = this.notifications.filter((n) => !n.isRead);
      }
    });
  }

  togglePreferences(): void {
    this.showPreferencesModal = !this.showPreferencesModal;
  }

  getCategoryIcon(cat: string): string {
    switch (cat.toUpperCase()) {
      case 'APPOINTMENT':
        return 'videocam';
      case 'PRESCRIPTION':
        return 'medication';
      case 'RECORDS':
        return 'description';
      case 'SECURITY':
        return 'shield';
      default:
        return 'notifications';
    }
  }

  formatTimestamp(iso: string): string {
    if (!iso) return 'Just now';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  }
}
