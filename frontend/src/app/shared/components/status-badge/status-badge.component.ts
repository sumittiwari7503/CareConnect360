import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusType = 'CONFIRMED' | 'IN_PROGRESS' | 'PENDING' | 'CANCELLED' | 'COMPLETED';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-[11px] font-semibold uppercase tracking-wider border font-caption-caps"
      [ngClass]="badgeClass"
    >
      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="dotClass"></span>
      {{ label || status }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status: StatusType | string = 'PENDING';
  @Input() label?: string;

  get badgeClass(): string {
    switch (this.status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]';
      case 'IN_PROGRESS':
        return 'bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4]';
      case 'PENDING':
        return 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
      case 'CANCELLED':
        return 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]';
      case 'COMPLETED':
      default:
        return 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]';
    }
  }

  get dotClass(): string {
    switch (this.status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'bg-[#059669]';
      case 'IN_PROGRESS':
        return 'bg-[#0F766E] animate-pulse';
      case 'PENDING':
        return 'bg-[#D97706]';
      case 'CANCELLED':
        return 'bg-[#DC2626]';
      case 'COMPLETED':
      default:
        return 'bg-[#475569]';
    }
  }
}
