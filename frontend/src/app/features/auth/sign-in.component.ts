import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-md mx-auto mt-12 p-space-xl bg-surface-container-lowest rounded-xl shadow-md border border-[#E2E8F0]">
      <div class="flex items-center gap-space-sm mb-space-md">
        <div class="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary">
          <span class="material-symbols-outlined text-[24px]">lock</span>
        </div>
        <div>
          <h2 class="font-headline-2 text-headline-2 text-on-surface font-bold">Secure Access</h2>
          <p class="font-caption-caps text-caption-caps text-on-surface-variant uppercase">CareConnect360 Telemedicine</p>
        </div>
      </div>

      <div *ngIf="errorMessage" class="mb-space-md p-space-sm rounded-lg bg-error-container text-on-error-container text-sm">
        {{ errorMessage }}
      </div>

      <form (ngSubmit)="onLogin()" class="space-y-space-md">
        <div>
          <label class="block font-label-medium text-label-medium text-on-surface mb-1">Email Address</label>
          <input
            type="email"
            [(ngModel)]="email"
            name="email"
            required
            class="w-full px-space-md py-2.5 rounded-lg border border-[#CBD5E1] bg-surface-container-lowest text-on-surface font-body-regular text-body-regular focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="aarav.sharma@example.com"
          />
        </div>

        <div>
          <label class="block font-label-medium text-label-medium text-on-surface mb-1">Password</label>
          <input
            type="password"
            [(ngModel)]="password"
            name="password"
            required
            class="w-full px-space-md py-2.5 rounded-lg border border-[#CBD5E1] bg-surface-container-lowest text-on-surface font-body-regular text-body-regular focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="••••••••••••"
          />
        </div>

        <button
          type="submit"
          [disabled]="loading"
          class="w-full py-2.5 px-space-md rounded-lg bg-primary text-on-primary font-label-medium text-label-medium font-semibold hover:bg-primary-container transition-all flex items-center justify-center gap-2"
        >
          <span *ngIf="loading" class="material-symbols-outlined text-[16px] animate-spin">sync</span>
          <span>{{ loading ? 'Authenticating...' : 'Sign In' }}</span>
        </button>
      </form>

      <div class="mt-space-lg p-space-sm rounded-lg bg-surface-container-low text-xs text-on-surface-variant flex flex-col gap-1">
        <span class="font-semibold text-primary">Demo Quick Credentials:</span>
        <span>• Patient: <code>aarav.sharma&#64;example.com</code></span>
        <span>• Doctor: <code>dr.priya.patel&#64;example.com</code></span>
        <span>• Admin: <code>priya.sundaram&#64;careconnect360.com</code></span>
        <span>• Password: <code>CareConnect360!</code></span>
      </div>
    </div>
  `
})
export class SignInComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = 'aarav.sharma@example.com';
  password = 'CareConnect360!';
  loading = false;
  errorMessage = '';

  onLogin(): void {
    this.loading = true;
    this.errorMessage = '';
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.role === 'ROLE_ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else if (res.role === 'ROLE_DOCTOR') {
          this.router.navigate(['/doctor/dashboard']);
        } else {
          this.router.navigate(['/patient/dashboard']);
        }
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Invalid credentials or server unavailable.';
      }
    });
  }
}
