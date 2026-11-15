import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="h-16 w-full bg-surface-container-lowest/90 backdrop-blur-xl border-b border-[#E2E8F0] shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 fixed top-0 left-0 right-0 flex items-center justify-between px-gutter">
      <!-- Left: Brand Logo & Title -->
      <div class="flex items-center gap-space-lg">
        <a routerLink="/" class="flex items-center gap-space-sm">
          <div class="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary">
            <span class="material-symbols-outlined text-[20px]">health_and_safety</span>
          </div>
          <span class="font-headline-2 text-headline-2 text-primary font-bold tracking-tight">CareConnect<span class="text-on-surface">360</span></span>
        </a>

        <div class="hidden md:flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-surface-container-low text-secondary">
          <span class="material-symbols-outlined text-[15px] text-primary">verified_user</span>
          <span class="font-caption-caps text-caption-caps uppercase tracking-wider text-on-surface-variant">Telemedicine Practice Guidelines 2020 • DISHA / ABDM Architecture</span>
        </div>
      </div>

      <!-- Right: Search, Notifications & User Info -->
      <div class="flex items-center gap-space-md">
        <div class="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
          <span class="text-sm">🇮🇳</span>
          <span class="font-caption-caps text-caption-caps font-bold tracking-wider">India (IST • +91)</span>
        </div>
        <div *ngIf="isDemoAccount" class="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
          <span class="material-symbols-outlined text-[15px] text-amber-700">science</span>
          <span class="font-caption-caps text-caption-caps font-bold uppercase tracking-wider">DEMO TEST ACCOUNT</span>
        </div>

        <div class="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant">
          <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span class="font-caption-caps text-caption-caps font-semibold uppercase tracking-wider">Level-4 Audit Active</span>
        </div>

        <a routerLink="/notifications" class="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors inline-flex items-center justify-center cursor-pointer" aria-label="Notifications" title="Notification Center">
          <span class="material-symbols-outlined text-[20px]">notifications</span>
          <span *ngIf="notificationService.unreadCount() > 0" class="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-error text-on-error flex items-center justify-center font-caption-caps text-[9px] font-bold">
            {{ notificationService.unreadCount() }}
          </span>
        </a>

        <div class="h-6 w-px bg-surface-container-high"></div>

        <ng-container *ngIf="authService.currentUser() as user; else guestNav">
          <div class="flex items-center gap-3 pl-1">
            <div class="relative">
              <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs">
                {{ user.fullName.charAt(0) }}
              </div>
              <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-primary-fixed border border-surface-container-lowest"></span>
            </div>
            <div class="flex flex-col text-left">
              <span class="font-label-medium text-label-medium text-on-surface leading-tight font-semibold">{{ user.fullName }}</span>
              <span class="font-caption-caps text-caption-caps text-on-surface-variant leading-none uppercase">{{ user.role.replace('ROLE_', '') }}</span>
            </div>
            <button (click)="logout()" class="p-1 text-on-surface-variant hover:text-error transition-colors" title="Logout">
              <span class="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </ng-container>

        <ng-template #guestNav>
          <div class="flex items-center gap-2">
            <a routerLink="/auth/register" class="px-3 py-1.5 rounded-lg border border-primary text-primary font-label-medium text-xs font-semibold hover:bg-primary/10 transition-all">
              Register
            </a>
            <a routerLink="/auth/sign-in" class="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-medium text-xs font-semibold hover:bg-primary-container transition-all">
              Sign In
            </a>
          </div>
        </ng-template>
      </div>
    </header>
  `
})
export class HeaderComponent implements OnInit {
  public authService = inject(AuthService);
  public notificationService = inject(NotificationService);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.notificationService.getUnreadCount().subscribe();
    }
  }

  get isDemoAccount(): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    const email = user.email ? user.email.toLowerCase() : '';
    return email.endsWith('@example.com') || email.includes('demo') || email.includes('test');
  }

  logout(): void {
    this.authService.logout();
  }
}

