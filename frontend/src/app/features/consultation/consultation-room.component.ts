import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../core/services/appointment.service';
import { AuthService } from '../../core/services/auth.service';
import { RoomSession, Appointment, ConsultationRecord } from '../../core/models/appointment.model';

type WebRtcState = 'active' | 'waiting' | 'permission' | 'reconnecting' | 'ended';
type SidebarTab = 'chat' | 'info';

interface ChatMessage {
  id: string;
  sender: string;
  senderRole: 'doctor' | 'patient' | 'system';
  time: string;
  text: string;
  attachment?: {
    name: string;
    size: string;
    type: string;
  };
}

@Component({
  selector: 'app-consultation-room',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="bg-background min-h-screen flex flex-col font-body-regular text-on-surface">
      <!-- Top Telehealth Header -->
      <header class="w-full z-40 bg-surface-container-lowest/95 backdrop-blur-md shadow-sm border-b border-[#E2E8F0]">
        <div class="h-16 w-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <!-- Left: Brand & Encounter Meta -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm">
                <span class="material-symbols-outlined text-[20px]">vital_signs</span>
              </div>
              <div class="flex flex-col">
                <span class="font-headline-3 text-headline-3 text-primary tracking-tight leading-none font-bold">
                  CareConnect<span class="text-secondary">360</span>
                </span>
                <span class="font-caption-caps text-caption-caps uppercase text-on-surface-variant tracking-wider leading-none mt-1">
                  Clinical Encounter #{{ appointment?.encounterNumber || 'ACTIVE' }}
                </span>
              </div>
            </div>

            <div class="hidden lg:block w-px h-6 bg-surface-container-highest"></div>

            <div class="hidden md:flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl">
              <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <div class="flex items-baseline gap-1">
                <span class="font-caption-caps text-caption-caps uppercase text-on-surface-variant">Patient:</span>
                <span class="font-headline-3 text-headline-3 text-on-surface text-[14px] font-semibold">
                  {{ patientName }}
                </span>
                <span *ngIf="appointment?.patientMrn" class="font-label-regular text-label-regular text-secondary">(MRN: {{ appointment?.patientMrn }})</span>
              </div>
            </div>
          </div>

          <!-- Right: Security Badges & Session Actions -->
          <div class="flex items-center gap-3">
            <div class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low text-primary">
              <span class="material-symbols-outlined text-[16px]">lock</span>
              <span class="font-caption-caps text-caption-caps uppercase tracking-wide font-semibold">
                WebRTC E2E Encrypted (AES-256)
              </span>
            </div>

            <div class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-high">
              <span class="material-symbols-outlined text-error text-[16px]" [ngClass]="{ 'animate-pulse': currentState === 'active' }">
                fiber_manual_record
              </span>
              <span class="font-headline-3 text-headline-3 text-on-surface text-[13px] tabular-nums font-mono font-bold">
                {{ formattedCallDuration }}
              </span>
            </div>

            <div class="hidden xl:flex items-center gap-2 text-on-surface-variant px-2.5 py-1">
              <span class="material-symbols-outlined text-primary text-[18px]">wifi_tethering</span>
              <div class="flex flex-col text-left">
                <span class="font-caption-caps text-caption-caps leading-none text-on-surface font-semibold">1440p HD</span>
                <span class="font-caption-caps text-caption-caps text-secondary leading-none mt-0.5">24ms · 0% loss</span>
              </div>
            </div>

            <a
              [routerLink]="currentUserRole === 'ROLE_DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard'"
              class="px-3 py-1.5 rounded-lg bg-surface-container text-secondary hover:text-on-surface text-label-medium font-label-medium flex items-center gap-1"
            >
              <span class="material-symbols-outlined text-[18px]">close</span>
              <span class="hidden sm:inline">Exit</span>
            </a>
          </div>
        </div>
      </header>

      <!-- Device Permission Alert Banner -->
      @if (mediaErrorMessage) {
        <div class="w-full bg-[#FEF2F2] text-[#991B1B] px-4 py-2.5 flex items-center justify-between border-b border-[#FCA5A5] text-[13px] font-medium">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[20px] text-[#DC2626]">videocam_off</span>
            <span>{{ mediaErrorMessage }}</span>
          </div>
          <button type="button" (click)="mediaErrorMessage = null" class="text-[#991B1B] hover:text-[#DC2626] font-bold">
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      }

      <!-- Interactive View Switcher Bar (Simulation & Verification Dock) -->
      <div class="w-full bg-surface-container-high px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0]">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-caption-caps text-caption-caps uppercase tracking-wider text-secondary flex items-center gap-1 font-semibold">
            <span class="w-2 h-2 rounded-full bg-primary animate-ping"></span>
            WebRTC Connection State:
          </span>
          <div class="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              type="button"
              (click)="switchState('active')"
              class="px-3 py-1 rounded-full font-label-medium text-label-medium transition-all"
              [ngClass]="currentState === 'active' ? 'bg-primary text-on-primary shadow-sm font-semibold' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'"
            >
              Active Video Call
            </button>
            <button
              type="button"
              (click)="switchState('waiting')"
              class="px-3 py-1 rounded-full font-label-medium text-label-medium transition-all"
              [ngClass]="currentState === 'waiting' ? 'bg-primary text-on-primary shadow-sm font-semibold' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'"
            >
              Waiting Room State
            </button>
            <button
              type="button"
              (click)="switchState('permission')"
              class="px-3 py-1 rounded-full font-label-medium text-label-medium transition-all"
              [ngClass]="currentState === 'permission' ? 'bg-primary text-on-primary shadow-sm font-semibold' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'"
            >
              Camera Permission Denied
            </button>
            <button
              type="button"
              (click)="switchState('reconnecting')"
              class="px-3 py-1 rounded-full font-label-medium text-label-medium transition-all"
              [ngClass]="currentState === 'reconnecting' ? 'bg-primary text-on-primary shadow-sm font-semibold' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'"
            >
              Disconnected / Reconnecting
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="font-caption-caps text-caption-caps uppercase text-secondary">Latency:</span>
          <div class="flex items-center gap-1 text-primary">
            <span class="inline-block w-1 h-2.5 bg-primary rounded-xs"></span>
            <span class="inline-block w-1 h-3.5 bg-primary rounded-xs"></span>
            <span class="inline-block w-1 h-4.5 bg-primary rounded-xs"></span>
            <span class="inline-block w-1 h-5 bg-primary rounded-xs"></span>
            <span class="font-label-medium text-label-medium ml-1 text-on-surface font-semibold">24ms · 60 FPS</span>
          </div>
        </div>
      </div>

      <!-- Telehealth Context Sub-Bar -->
      <div class="w-full bg-surface-container-lowest px-4 sm:px-6 py-2.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E2E8F0]">
        <div class="flex items-center gap-3 min-w-0">
          <div class="relative shrink-0">
            <div class="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-headline-3 text-headline-3 font-bold">
              MS
            </div>
            <span class="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center ring-2 ring-surface-container-lowest">
              <span class="material-symbols-outlined text-[10px] text-on-primary">check</span>
            </span>
          </div>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="font-headline-2 text-headline-2 text-on-surface truncate font-semibold">
                {{ doctorName }}
              </h1>
              <span class="px-2 py-0.5 rounded-full bg-surface-container-low text-primary font-caption-caps text-caption-caps uppercase tracking-wide font-semibold">
                Interventional Cardiology
              </span>
              <span class="font-label-regular text-label-regular text-secondary truncate">
                St. Jude Memorial Health Network
              </span>
            </div>
            <div class="flex items-center gap-3 text-secondary font-label-regular text-label-regular mt-0.5">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[15px] text-primary">verified_user</span>
                <span>Room CC-9021</span>
              </span>
              <span class="hidden sm:inline">·</span>
              <span class="hidden sm:flex items-center gap-1 text-secondary">
                <span>Patient: {{ patientName }} (MRN #849204)</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Live Telehealth Metas -->
        <div class="flex items-center gap-2 shrink-0 flex-wrap">
          <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low text-primary">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span class="font-caption-caps text-caption-caps tracking-wider uppercase font-semibold">Active Encounter</span>
          </div>

          <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low text-on-surface">
            <span class="material-symbols-outlined text-[16px] text-secondary">timer</span>
            <span class="font-headline-3 text-headline-3 text-[14px] font-mono tabular-nums font-bold">
              {{ formattedCallDuration }}
            </span>
            <span class="font-caption-caps text-caption-caps text-secondary hidden lg:inline">/ 50m slot</span>
          </div>

          <button
            type="button"
            (click)="toggleSidebarTab('info')"
            class="px-3 py-1 rounded-lg bg-surface-container text-on-surface font-label-medium text-label-medium hover:bg-surface-container-high transition-colors flex items-center gap-1"
          >
            <span class="material-symbols-outlined text-[16px] text-primary">clinical_notes</span>
            <span class="hidden sm:inline">Quick Vitals</span>
          </button>
        </div>
      </div>

      <!-- Main Viewport: Multi-pane Consultation Space -->
      <div class="w-full flex-1 flex flex-col lg:flex-row relative overflow-hidden bg-inverse-surface">
        <!-- Center Video Stage Section -->
        <div class="flex-1 relative flex flex-col items-center justify-between p-2 sm:p-4 min-h-[560px] lg:min-h-[calc(100vh-180px)]">
          <!-- Video Stage Canvas / Container -->
          <div class="relative w-full flex-1 rounded-xl overflow-hidden bg-black flex items-center justify-center shadow-xl">
            <!-- STATE 1: ACTIVE VIDEO CALL FEED -->
            <div *ngIf="currentState === 'active'" class="absolute inset-0 w-full h-full flex flex-col justify-between">
              <!-- Doctor Video Stream Mockup with Photo -->
              <div class="absolute inset-0 w-full h-full overflow-hidden">
                <img
                  class="w-full h-full object-cover object-top opacity-95 scale-100 transition-transform duration-700"
                  alt="Attending Clinician Telehealth Feed"
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1400&q=80"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none"></div>
              </div>

              <!-- Top HUD Overlay -->
              <div class="relative z-10 p-4 flex items-start justify-between w-full pointer-events-none">
                <!-- Doctor Details Badge & Audio Equalizer Indicator -->
                <div class="flex items-center gap-3 bg-inverse-surface/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-md pointer-events-auto">
                  <div class="flex items-center gap-2 text-on-primary">
                    <span class="material-symbols-outlined text-[18px] text-primary-fixed">ecg_heart</span>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="font-headline-3 text-headline-3 text-on-primary text-[14px] font-semibold">
                          {{ doctorName }}
                        </span>
                        <span class="font-caption-caps text-caption-caps px-1.5 py-0.5 rounded bg-primary text-on-primary font-bold">
                          Host
                        </span>
                      </div>
                      <span class="font-caption-caps text-caption-caps text-surface-container-high block">
                        St. Jude Cardiology Core · 1080p WebRTC
                      </span>
                    </div>
                  </div>
                  <div class="h-6 w-px bg-outline-variant/30 mx-1"></div>
                  <!-- Simulated Audio Equalizer Bars -->
                  <div class="flex items-end gap-0.5 h-4 w-5 pb-0.5">
                    <span class="w-1 bg-primary-fixed rounded-full animate-pulse h-2"></span>
                    <span class="w-1 bg-primary-fixed rounded-full animate-pulse h-4" style="animation-delay: 150ms;"></span>
                    <span class="w-1 bg-primary-fixed rounded-full animate-pulse h-3" style="animation-delay: 300ms;"></span>
                    <span class="w-1 bg-primary-fixed rounded-full animate-pulse h-1" style="animation-delay: 450ms;"></span>
                  </div>
                </div>

                <!-- Patient Real-Time Biometric HUD Overlay -->
                <div class="pointer-events-auto hidden sm:flex flex-col gap-1.5 bg-inverse-surface/85 backdrop-blur-md px-4 py-2 rounded-xl text-on-primary shadow-lg">
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex items-center gap-1.5 text-primary-fixed">
                      <span class="material-symbols-outlined text-[16px]">sensors</span>
                      <span class="font-caption-caps text-caption-caps uppercase tracking-wider text-surface-container-high font-semibold">
                        Live Telemetry (Withings Hub)
                      </span>
                    </div>
                    <span class="w-2 h-2 rounded-full bg-primary-fixed animate-ping"></span>
                  </div>
                  <div class="flex items-center gap-4 pt-1">
                    <div>
                      <span class="font-caption-caps text-caption-caps text-outline-variant block">Heart Rate</span>
                      <div class="flex items-baseline gap-1">
                        <span class="font-headline-2 text-headline-2 text-on-primary font-bold">72</span>
                        <span class="font-label-regular text-label-regular text-surface-container-highest">bpm</span>
                      </div>
                    </div>
                    <div class="h-6 w-px bg-outline-variant/30"></div>
                    <div>
                      <span class="font-caption-caps text-caption-caps text-outline-variant block">Blood Pressure</span>
                      <div class="flex items-baseline gap-1">
                        <span class="font-headline-2 text-headline-2 text-on-primary font-bold">118/76</span>
                        <span class="font-label-regular text-label-regular text-surface-container-highest">mmHg</span>
                      </div>
                    </div>
                    <div class="h-6 w-px bg-outline-variant/30"></div>
                    <div>
                      <span class="font-caption-caps text-caption-caps text-outline-variant block">SpO2</span>
                      <div class="flex items-baseline gap-1">
                        <span class="font-headline-2 text-headline-2 text-on-primary font-bold">99%</span>
                        <span class="font-label-regular text-label-regular text-surface-container-highest">ambient</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bottom In-Stream Indicators -->
              <div class="relative z-10 p-4 flex items-end justify-between w-full pointer-events-none">
                <div class="flex items-center gap-2 pointer-events-auto">
                  <div class="flex items-center gap-1.5 bg-inverse-surface/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-on-primary font-caption-caps text-caption-caps font-semibold">
                    <span class="material-symbols-outlined text-[14px] text-primary-fixed">lock</span>
                    <span>Encrypted TLS 1.3 · AES-256</span>
                  </div>
                  <div class="hidden md:flex items-center gap-1.5 bg-inverse-surface/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-on-primary font-caption-caps text-caption-caps font-semibold">
                    <span class="material-symbols-outlined text-[14px] text-primary-fixed">wifi</span>
                    <span>Bitrate: 3,420 kbps</span>
                  </div>
                </div>

                <button
                  type="button"
                  (click)="toggleScreenShareModal()"
                  class="pointer-events-auto flex items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md text-on-surface px-3.5 py-1.5 rounded-lg shadow hover:bg-surface-container-lowest transition-colors font-label-medium text-label-medium font-semibold"
                >
                  <span class="material-symbols-outlined text-[18px] text-primary">screen_share</span>
                  <span>Present Records to Patient</span>
                </button>
              </div>

              <!-- Picture-in-Picture: Self View Window -->
              <div class="absolute top-16 right-4 sm:top-20 sm:right-6 w-40 sm:w-56 aspect-[4/3] rounded-xl overflow-hidden shadow-2xl bg-surface-container-highest z-20 group transition-transform hover:scale-105">
                <div *ngIf="isCameraOn; else cameraOffTile" class="w-full h-full relative">
                  <img
                    class="w-full h-full object-cover"
                    alt="Patient Self View"
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none"></div>
                </div>
                <ng-template #cameraOffTile>
                  <div class="w-full h-full bg-[#1E293B] flex flex-col items-center justify-center text-white/70 space-y-1">
                    <span class="material-symbols-outlined text-2xl text-secondary">videocam_off</span>
                    <span class="text-[10px] uppercase font-semibold">Camera Off</span>
                  </div>
                </ng-template>

                <!-- PiP Overlay Details -->
                <div class="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-on-primary">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary" [ngClass]="{ 'animate-pulse': isCameraOn }"></span>
                  <span class="font-caption-caps text-caption-caps text-[10px] font-semibold">Self View</span>
                </div>
                <div class="absolute bottom-2 left-2 right-2 flex items-center justify-between text-on-primary">
                  <span class="font-label-medium text-label-medium text-[11px] truncate font-semibold">
                    {{ patientName }} (You)
                  </span>
                  <span class="material-symbols-outlined text-[14px]" [ngClass]="isMicOn ? 'text-primary-fixed' : 'text-error'">
                    {{ isMicOn ? 'mic' : 'mic_off' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- STATE 2: WAITING ROOM STATE -->
            <div *ngIf="currentState === 'waiting'" class="absolute inset-0 w-full h-full bg-surface-container-lowest flex flex-col items-center justify-center p-8 text-center z-20">
              <div class="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mb-4">
                <span class="material-symbols-outlined text-[40px] text-primary animate-spin">progress_activity</span>
              </div>
              <span class="px-4 py-1 rounded-full bg-surface-container-low text-primary font-caption-caps text-caption-caps uppercase tracking-wider mb-2 font-semibold">
                Triage Completed · Queue Position: #1
              </span>
              <h2 class="font-headline-1 text-headline-1 text-on-surface max-w-lg mb-2 font-bold">
                {{ doctorName }} will admit you to the consultation room shortly
              </h2>
              <p class="font-body-regular text-body-regular text-secondary max-w-md mb-6">
                Your camera, microphone, and secure network encryption were checked and verified. Please remain on this screen.
              </p>
              <div class="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-surface-container-low max-w-md w-full text-left border border-[#E2E8F0]">
                <div class="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                  <span class="material-symbols-outlined text-[20px]">check_circle</span>
                </div>
                <div>
                  <div class="font-headline-3 text-headline-3 text-[14px] text-on-surface font-semibold">
                    Equipment Diagnostic Passed
                  </div>
                  <div class="font-label-regular text-label-regular text-secondary">
                    Logitech HD Pro · Built-in Mic (Echo Cancelled)
                  </div>
                </div>
              </div>
              <button
                type="button"
                (click)="switchState('active')"
                class="mt-6 px-6 py-2.5 rounded-xl bg-primary text-on-primary font-headline-3 text-headline-3 text-[14px] shadow hover:bg-primary-container transition-colors"
              >
                Admit into Call Now (Demo)
              </button>
            </div>

            <!-- STATE 3: CAMERA PERMISSION DENIED -->
            <div *ngIf="currentState === 'permission'" class="absolute inset-0 w-full h-full bg-surface-container-lowest flex flex-col items-center justify-center p-8 text-center z-20">
              <div class="w-20 h-20 rounded-full bg-error-container text-on-error-container flex items-center justify-center mb-4">
                <span class="material-symbols-outlined text-[40px]">videocam_off</span>
              </div>
              <span class="px-4 py-1 rounded-full bg-error-container text-error font-caption-caps text-caption-caps uppercase tracking-wider mb-2 font-semibold">
                Hardware Access Blocked
              </span>
              <h2 class="font-headline-1 text-headline-1 text-on-surface max-w-lg mb-2 font-bold">
                Browser blocked camera or microphone access
              </h2>
              <p class="font-body-regular text-body-regular text-secondary max-w-md mb-6">
                CareConnect360 requires camera permission to transmit encrypted video to {{ doctorName }}. Click the lock or camera icon in your browser URL address bar to grant permissions.
              </p>
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  (click)="switchState('active')"
                  class="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-headline-3 text-headline-3 text-[14px] shadow hover:bg-primary-container transition-colors"
                >
                  Retry Camera Connection
                </button>
                <button
                  type="button"
                  (click)="switchState('active')"
                  class="px-4 py-2.5 rounded-lg bg-surface-container text-on-surface font-headline-3 text-headline-3 text-[14px] hover:bg-surface-container-high transition-colors"
                >
                  Continue Audio-Only
                </button>
              </div>
            </div>

            <!-- STATE 4: DISCONNECTED / RECONNECTING STATE -->
            <div *ngIf="currentState === 'reconnecting'" class="absolute inset-0 w-full h-full bg-inverse-surface/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-20 text-on-primary">
              <div class="w-20 h-20 rounded-full bg-surface-variant/20 flex items-center justify-center mb-4">
                <span class="material-symbols-outlined text-[40px] text-primary-fixed-dim animate-spin">sync</span>
              </div>
              <span class="px-4 py-1 rounded-full bg-surface-variant/30 text-primary-fixed font-caption-caps text-caption-caps uppercase tracking-wider mb-2 font-semibold">
                Network Interruption Detected
              </span>
              <h2 class="font-headline-1 text-headline-1 text-on-primary max-w-lg mb-2 font-bold">
                Re-establishing Encrypted WebRTC Peer Stream
              </h2>
              <p class="font-body-regular text-body-regular text-surface-container-high max-w-md mb-6">
                Attempting reconnect (Attempt 2 of 4) via backup gateway US-EAST-04. Audio will restore automatically once signal stabilizes.
              </p>
              <div class="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  (click)="switchState('active')"
                  class="px-6 py-2.5 rounded-lg bg-primary-fixed text-on-primary-fixed font-headline-3 text-headline-3 text-[14px] shadow hover:bg-primary-fixed-dim transition-colors font-semibold"
                >
                  Force Stream Refresh
                </button>
                <a
                  href="tel:+18005553920"
                  class="px-4 py-2.5 rounded-lg bg-surface-container-highest/20 text-on-primary font-headline-3 text-headline-3 text-[14px] hover:bg-surface-container-highest/40 transition-colors flex items-center gap-1.5"
                >
                  <span class="material-symbols-outlined text-[18px]">phone_in_talk</span>
                  <span>Switch to Telehealth Phone Bridge</span>
                </a>
              </div>
            </div>

            <!-- STATE 5: ENDED STATE -->
            <div *ngIf="currentState === 'ended'" class="absolute inset-0 w-full h-full bg-surface-container-lowest flex flex-col items-center justify-center p-8 text-center z-20">
              <div class="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center mb-4 text-primary">
                <span class="material-symbols-outlined text-[40px]">task_alt</span>
              </div>
              <span class="px-4 py-1 rounded-full bg-surface-container-low text-primary font-caption-caps text-caption-caps uppercase tracking-wider mb-2 font-semibold">
                Encounter Completed
              </span>
              <h2 class="font-headline-1 text-headline-1 text-on-surface max-w-lg mb-2 font-bold">
                Consultation Concluded
              </h2>
              <p class="font-body-regular text-body-regular text-secondary max-w-md mb-6">
                Your clinical session with {{ doctorName }} has finished. The after-visit clinical summary and care plan are ready for review.
              </p>
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  (click)="openSummaryModal()"
                  class="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-headline-3 text-headline-3 text-[14px] shadow hover:bg-primary-container transition-colors"
                >
                  View After-Visit Summary (AVS)
                </button>
                <a
                  [routerLink]="currentUserRole === 'ROLE_DOCTOR' ? '/doctor/dashboard' : '/patient/appointments'"
                  class="px-4 py-2.5 rounded-lg bg-surface-container text-on-surface font-headline-3 text-headline-3 text-[14px] hover:bg-surface-container-high transition-colors"
                >
                  Return to Dashboard
                </a>
              </div>
            </div>
          </div>

          <!-- FLOATING CALL CONTROL TOOLBAR -->
          <div class="w-full flex justify-center py-3 relative z-30">
            <div class="flex items-center gap-2 sm:gap-3 bg-surface-container-lowest shadow-2xl px-4 py-2 sm:py-2.5 rounded-2xl border border-[#E2E8F0]">
              <!-- Mic Toggle -->
              <button
                type="button"
                (click)="toggleMic()"
                class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all"
                [ngClass]="isMicOn ? 'bg-surface-container text-on-surface hover:bg-surface-container-high' : 'bg-error-container text-error hover:opacity-90'"
                [title]="isMicOn ? 'Mute Microphone' : 'Unmute Microphone'"
              >
                <span class="material-symbols-outlined text-[22px]">
                  {{ isMicOn ? 'mic' : 'mic_off' }}
                </span>
              </button>

              <!-- Camera Toggle -->
              <button
                type="button"
                (click)="toggleCamera()"
                class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all"
                [ngClass]="isCameraOn ? 'bg-surface-container text-on-surface hover:bg-surface-container-high' : 'bg-error-container text-error hover:opacity-90'"
                [title]="isCameraOn ? 'Stop Camera' : 'Start Camera'"
              >
                <span class="material-symbols-outlined text-[22px]">
                  {{ isCameraOn ? 'videocam' : 'videocam_off' }}
                </span>
              </button>

              <div class="h-8 w-px bg-surface-container-highest mx-0.5 sm:mx-1"></div>

              <!-- Speaker Toggle -->
              <button
                type="button"
                (click)="toggleSpeaker()"
                class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all bg-surface-container text-on-surface hover:bg-surface-container-high"
                title="Speaker Output"
              >
                <span class="material-symbols-outlined text-[22px]">volume_up</span>
              </button>

              <!-- Screen Share Button -->
              <button
                type="button"
                (click)="toggleScreenShareModal()"
                class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all bg-surface-container text-on-surface hover:bg-surface-container-high"
                title="Share Screen / Records"
              >
                <span class="material-symbols-outlined text-[22px]">screen_share</span>
              </button>

              <!-- In-Call Chat Drawer Toggle -->
              <button
                type="button"
                (click)="toggleSidebar()"
                class="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all"
                [ngClass]="isSidebarOpen && activeSidebarTab === 'chat' ? 'bg-primary text-on-primary' : 'bg-primary-fixed text-on-primary-fixed shadow-sm'"
                title="Clinical Chat"
              >
                <span class="material-symbols-outlined text-[22px]">chat</span>
                <span
                  *ngIf="unreadChatCount > 0"
                  class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-on-error font-caption-caps text-caption-caps flex items-center justify-center text-[10px] font-bold"
                >
                  {{ unreadChatCount }}
                </span>
              </button>

              <!-- EHR Chart & Notes Quick Trigger -->
              <button
                type="button"
                (click)="toggleSidebarTab('info')"
                class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all hidden sm:flex"
                [ngClass]="isSidebarOpen && activeSidebarTab === 'info' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'"
                title="Shared Records & Vitals"
              >
                <span class="material-symbols-outlined text-[22px]">folder_shared</span>
              </button>

              <div class="h-8 w-px bg-surface-container-highest mx-0.5 sm:mx-1"></div>

              <!-- End Call Destructive Action -->
              <button
                type="button"
                (click)="openEndCallModal()"
                class="px-3 sm:px-4 h-11 sm:h-12 rounded-xl bg-error text-on-error font-headline-3 text-headline-3 text-[14px] flex items-center gap-1.5 hover:bg-red-700 transition-colors shadow-md font-semibold"
                title="Leave Encounter"
              >
                <span class="material-symbols-outlined text-[20px]">call_end</span>
                <span class="hidden sm:inline">End Consultation</span>
              </button>
            </div>
          </div>
        </div>

        <!-- COLLAPSIBLE RIGHT SIDE DRAWER (Chat & Clinical Quick-Info) -->
        <aside
          *ngIf="isSidebarOpen"
          class="w-full lg:w-96 bg-surface-container-lowest flex flex-col shrink-0 transition-all duration-300 shadow-xl lg:h-[calc(100vh-180px)] border-l border-[#E2E8F0] overflow-hidden"
        >
          <!-- Drawer Tabs -->
          <div class="p-2 bg-surface-container-low flex items-center justify-between border-b border-[#E2E8F0]">
            <div class="flex items-center gap-1 bg-surface-container p-1 rounded-xl w-full">
              <button
                type="button"
                (click)="switchSidebarTab('chat')"
                class="flex-1 py-1.5 px-3 rounded-lg font-headline-3 text-headline-3 text-[13px] transition-all flex items-center justify-center gap-1.5"
                [ngClass]="activeSidebarTab === 'chat' ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold' : 'text-secondary hover:text-on-surface'"
              >
                <span class="material-symbols-outlined text-[16px] text-primary">forum</span>
                <span>Clinical Chat</span>
              </button>
              <button
                type="button"
                (click)="switchSidebarTab('info')"
                class="flex-1 py-1.5 px-3 rounded-lg font-headline-3 text-headline-3 text-[13px] transition-all flex items-center justify-center gap-1.5"
                [ngClass]="activeSidebarTab === 'info' ? 'bg-surface-container-lowest text-on-surface shadow-sm font-semibold' : 'text-secondary hover:text-on-surface'"
              >
                <span class="material-symbols-outlined text-[16px]">overview</span>
                <span>Quick-Info & Vitals</span>
              </button>
            </div>
          </div>

          <!-- TAB PANEL 1: CLINICAL CHAT -->
          <div *ngIf="activeSidebarTab === 'chat'" class="flex-1 flex flex-col justify-between overflow-hidden">
            <!-- Messages Container -->
            <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <!-- System HIPAA Audit Notice -->
              <div class="p-3 rounded-xl bg-surface-container-low text-center border border-[#E2E8F0]">
                <div class="flex items-center justify-center gap-1 text-primary font-caption-caps text-caption-caps uppercase tracking-wider mb-0.5 font-semibold">
                  <span class="material-symbols-outlined text-[13px]">lock</span>
                  <span>HIPAA Audit Trail Active</span>
                </div>
                <p class="font-label-regular text-label-regular text-secondary">
                  Encrypted clinical consultation channel active. All shared messages and files are archived securely into the patient encounter record.
                </p>
              </div>

              <!-- Empty chat indicator if no messages yet -->
              <div *ngIf="chatMessages.length === 0" class="py-12 text-center text-secondary text-sm flex flex-col items-center justify-center gap-2">
                <span class="material-symbols-outlined text-[36px] text-primary">chat</span>
                <p class="font-semibold text-on-surface">Encrypted Consultation Channel Open</p>
                <p class="text-xs text-secondary max-w-xs">Send a secure message to consult with your provider during this visit.</p>
              </div>

              <!-- Message History Loop -->
              <div
                *ngFor="let msg of chatMessages"
                class="flex flex-col gap-1 max-w-[88%]"
                [ngClass]="msg.senderRole === 'patient' ? 'items-end self-end' : 'items-start'"
              >
                <div class="flex items-center gap-1.5">
                  <span *ngIf="msg.senderRole !== 'patient'" class="font-label-medium text-label-medium text-on-surface font-semibold">
                    {{ msg.sender }}
                  </span>
                  <span class="font-caption-caps text-caption-caps text-secondary">{{ msg.time }}</span>
                  <span *ngIf="msg.senderRole === 'patient'" class="font-label-medium text-label-medium text-primary font-semibold">
                    {{ msg.sender }}
                  </span>
                </div>

                <div
                  class="p-3 rounded-2xl font-body-regular text-body-regular shadow-xs"
                  [ngClass]="msg.senderRole === 'patient' ? 'rounded-tr-xs bg-primary text-on-primary' : 'rounded-tl-xs bg-surface-container-high text-on-surface'"
                >
                  <p>{{ msg.text }}</p>

                  <!-- Attachment Card if present -->
                  <div *ngIf="msg.attachment" class="mt-2 flex items-center gap-2 p-2 bg-surface-container-lowest rounded-xl shadow-xs border border-[#E2E8F0] text-on-surface">
                    <div class="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                      <span class="material-symbols-outlined text-[22px]">picture_as_pdf</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-headline-3 text-headline-3 text-[12px] truncate font-semibold">
                        {{ msg.attachment.name }}
                      </div>
                      <div class="font-caption-caps text-caption-caps text-secondary uppercase text-[10px]">
                        {{ msg.attachment.size }} · {{ msg.attachment.type }}
                      </div>
                    </div>
                    <button type="button" class="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-primary" title="Download">
                      <span class="material-symbols-outlined text-[16px]">download</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Chat Input Bar -->
            <div class="p-3 bg-surface-container-lowest border-t border-[#E2E8F0]">
              <form (submit)="sendMessage($event)" class="flex items-center gap-2">
                <button
                  type="button"
                  class="w-10 h-10 rounded-xl bg-surface-container text-secondary hover:text-primary hover:bg-surface-container-high flex items-center justify-center transition-colors"
                  title="Attach clinical reading"
                >
                  <span class="material-symbols-outlined text-[20px]">attach_file</span>
                </button>
                <input
                  type="text"
                  name="chatInput"
                  [(ngModel)]="newChatMessage"
                  placeholder="Type encrypted message..."
                  class="flex-1 h-10 px-3 rounded-xl bg-surface-container-low text-on-surface font-body-regular text-body-regular placeholder:text-secondary focus:outline-none focus:bg-surface-container-lowest border border-transparent focus:border-primary transition-all text-sm"
                />
                <button
                  type="submit"
                  class="w-10 h-10 rounded-xl bg-primary text-on-primary hover:bg-primary-container flex items-center justify-center transition-colors shadow-sm"
                >
                  <span class="material-symbols-outlined text-[20px]">send</span>
                </button>
              </form>
              <div class="flex items-center justify-between px-1 pt-1.5 text-[11px] text-secondary">
                <span class="flex items-center gap-1 font-caption-caps text-caption-caps">
                  <span class="material-symbols-outlined text-[12px] text-primary">verified</span>
                  EHR Audit Log Synced
                </span>
                <span class="font-caption-caps text-caption-caps">Press Enter to send</span>
              </div>
            </div>
          </div>

          <!-- TAB PANEL 2: ENCOUNTER QUICK-INFO & VITALS -->
          <div *ngIf="activeSidebarTab === 'info'" class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <!-- Patient Profile Summary -->
            <div class="p-4 rounded-2xl bg-surface-container-low flex flex-col gap-2 border border-[#E2E8F0]">
              <div class="flex items-center justify-between">
                <span class="font-caption-caps text-caption-caps uppercase text-secondary font-semibold">Active Patient Record</span>
                <span class="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-caption-caps text-caption-caps font-bold">
                  Active Care Plan
                </span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center font-headline-2 text-headline-2 text-primary font-bold">
                  {{ getInitials(patientName) }}
                </div>
                <div>
                  <div class="font-headline-3 text-headline-3 text-on-surface font-semibold">{{ patientName }}</div>
                  <div class="font-label-regular text-label-regular text-secondary">Telehealth Clinical Encounter</div>
                  <div class="font-caption-caps text-caption-caps text-primary font-semibold">MRN: {{ appointment?.patientMrn || 'On File' }} · Modality: {{ appointment?.modality || 'VIDEO' }}</div>
                </div>
              </div>
            </div>

            <!-- Real-Time Biometrics Card -->
            <div class="p-4 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-2 border border-[#E2E8F0]">
              <div class="flex items-center justify-between">
                <h3 class="font-headline-3 text-headline-3 text-on-surface flex items-center gap-1.5 font-semibold">
                  <span class="material-symbols-outlined text-[18px] text-primary">monitoring</span>
                  <span>Session Clinical Metrics</span>
                </h3>
                <span class="font-caption-caps text-caption-caps text-primary font-semibold">Active Session</span>
              </div>
              <div class="grid grid-cols-2 gap-2 pt-1">
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-[#E2E8F0]">
                  <span class="font-caption-caps text-caption-caps text-secondary block">Resting Heart Rate</span>
                  <div class="flex items-baseline gap-1 mt-0.5">
                    <span class="font-headline-1 text-headline-1 text-on-surface font-bold">--</span>
                    <span class="font-label-regular text-label-regular text-secondary">bpm</span>
                  </div>
                  <span class="font-caption-caps text-caption-caps text-primary font-semibold">In Encounter</span>
                </div>
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-[#E2E8F0]">
                  <span class="font-caption-caps text-caption-caps text-secondary block">Blood Pressure</span>
                  <div class="flex items-baseline gap-1 mt-0.5">
                    <span class="font-headline-1 text-headline-1 text-on-surface font-bold">--/--</span>
                    <span class="font-label-regular text-label-regular text-secondary">mmHg</span>
                  </div>
                  <span class="font-caption-caps text-caption-caps text-primary font-semibold">Awaiting Readout</span>
                </div>
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-[#E2E8F0]">
                  <span class="font-caption-caps text-caption-caps text-secondary block">SpO2</span>
                  <div class="flex items-baseline gap-1 mt-0.5">
                    <span class="font-headline-1 text-headline-1 text-on-surface font-bold">--%</span>
                    <span class="font-label-regular text-label-regular text-secondary">pulse ox</span>
                  </div>
                  <span class="font-caption-caps text-caption-caps text-primary font-semibold">In Session</span>
                </div>
                <div class="p-2.5 rounded-xl bg-surface-container-low border border-[#E2E8F0]">
                  <span class="font-caption-caps text-caption-caps text-secondary block">Encounter Modality</span>
                  <div class="flex items-baseline gap-1 mt-0.5">
                    <span class="font-headline-1 text-headline-1 text-on-surface font-bold">{{ appointment?.modality || 'VIDEO' }}</span>
                  </div>
                  <span class="font-caption-caps text-caption-caps text-secondary">Encrypted WebRTC</span>
                </div>
              </div>
            </div>

            <!-- Active Regimen -->
            <div class="p-4 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-2 border border-[#E2E8F0]">
              <h3 class="font-headline-3 text-headline-3 text-on-surface flex items-center gap-1.5 font-semibold">
                <span class="material-symbols-outlined text-[18px] text-primary">medication</span>
                <span>Active Clinical Orders</span>
              </h3>
              <div class="flex flex-col gap-1.5">
                <div class="p-2.5 rounded-lg bg-surface-container-low border border-[#E2E8F0] text-xs text-secondary">
                  <span>Encounter session active. Attending physician can prescribe medications and order diagnostic records during this visit.</span>
                </div>
              </div>
            </div>

            <!-- Conclude Consultation Quick Action -->
            <div class="p-4 rounded-2xl bg-primary-fixed/20 flex flex-col gap-2 border border-primary/10">
              <div class="font-headline-3 text-headline-3 text-on-surface text-[14px] font-semibold">After-Visit Summary Preview</div>
              <p class="font-label-regular text-label-regular text-secondary">
                Clinical encounter notes will be automatically summarized by {{ doctorName }} upon call completion.
              </p>
              <button
                type="button"
                (click)="openEndCallModal()"
                class="mt-1 py-2 px-4 rounded-xl bg-primary text-on-primary font-label-medium text-label-medium hover:bg-primary-container transition-colors text-center font-semibold"
              >
                Review Orders & Conclude
              </button>
            </div>
          </div>
        </aside>
      </div>

      <!-- MODAL 1: END CALL CONFIRMATION DIALOG -->
      <div *ngIf="isEndCallModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm">
        <div class="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 shadow-2xl flex flex-col gap-4 border border-[#E2E8F0]">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[26px]">call_end</span>
            </div>
            <div class="flex-1">
              <h2 class="font-headline-2 text-headline-2 text-on-surface font-bold">End Clinical Encounter?</h2>
              <p class="font-body-regular text-body-regular text-secondary mt-1">
                You have active time remaining in this scheduled window with {{ doctorName }}.
              </p>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-surface-container-low flex flex-col gap-1.5 border border-[#E2E8F0]">
            <div class="font-headline-3 text-headline-3 text-[13px] text-on-surface font-semibold">What happens next:</div>
            <ul class="font-label-regular text-label-regular text-secondary list-disc list-inside space-y-1">
              <li>Clinical encounter summary will be compiled into the EHR.</li>
              <li>Prescription refills discussed will be transmitted to patient's preferred pharmacy.</li>
              <li>After-Visit Summary (AVS) document will be available in your portal.</li>
            </ul>
          </div>

          <div class="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-2">
            <button
              type="button"
              (click)="closeEndCallModal()"
              class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-surface-container text-on-surface font-headline-3 text-headline-3 text-[14px] hover:bg-surface-container-high transition-colors font-semibold"
            >
              Return to Call
            </button>
            <button
              type="button"
              (click)="confirmEndCall()"
              class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-error text-on-error font-headline-3 text-headline-3 text-[14px] hover:bg-red-700 transition-colors shadow-sm font-semibold"
            >
              Leave & View Summary
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL 2: SCREEN SHARE PREVIEW DIALOG -->
      <div *ngIf="isScreenShareModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm">
        <div class="w-full max-w-lg bg-surface-container-lowest rounded-2xl p-6 shadow-2xl flex flex-col gap-4 border border-[#E2E8F0]">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[24px] text-primary">screen_share</span>
              <h2 class="font-headline-2 text-headline-2 text-on-surface font-bold">Share Clinical Records with Doctor</h2>
            </div>
            <button
              type="button"
              (click)="toggleScreenShareModal()"
              class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface"
            >
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <p class="font-body-regular text-body-regular text-secondary">
            Select a secure clinical document, third-party biometric dashboard, or browser tab to broadcast in real time to {{ doctorName }}'s workstation.
          </p>

          <div class="grid grid-cols-2 gap-4">
            <div
              (click)="selectScreenSource('entire')"
              class="p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-1.5"
              [ngClass]="selectedScreenSource === 'entire' ? 'border-primary bg-primary-fixed/20' : 'border-[#E2E8F0] bg-surface-container-low hover:bg-surface-container'"
            >
              <span class="material-symbols-outlined text-[32px] text-primary">monitor</span>
              <span class="font-headline-3 text-headline-3 text-[13px] text-on-surface font-semibold">Entire Screen</span>
              <span class="font-caption-caps text-caption-caps text-secondary">Full consultation display</span>
            </div>
            <div
              (click)="selectScreenSource('tab')"
              class="p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center text-center gap-1.5"
              [ngClass]="selectedScreenSource === 'tab' ? 'border-primary bg-primary-fixed/20' : 'border-[#E2E8F0] bg-surface-container-low hover:bg-surface-container'"
            >
              <span class="material-symbols-outlined text-[32px] text-primary">tab</span>
              <span class="font-headline-3 text-headline-3 text-[13px] text-on-surface font-semibold">Patient Portal Tab</span>
              <span class="font-caption-caps text-caption-caps text-secondary">Blood pressure logs</span>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              (click)="toggleScreenShareModal()"
              class="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-label-medium text-label-medium font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="startScreenShare()"
              class="px-5 py-2 rounded-xl bg-primary text-on-primary font-headline-3 text-headline-3 text-[14px] font-semibold"
            >
              Start Sharing Stream
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL 3: AFTER-VISIT SUMMARY PREVIEW (Post-Call View) -->
      <div *ngIf="isSummaryModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/75 backdrop-blur-md overflow-y-auto">
        <div class="w-full max-w-2xl bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 my-auto border border-[#E2E8F0]">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-[28px]">task_alt</span>
              </div>
              <div>
                <span class="font-caption-caps text-caption-caps uppercase text-primary font-bold">Encounter Concluded</span>
                <h2 class="font-headline-1 text-headline-1 text-on-surface font-bold">After-Visit Summary & Orders (AVS)</h2>
              </div>
            </div>
            <button
              type="button"
              (click)="closeSummaryModal()"
              class="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface"
            >
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div class="p-4 rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#E2E8F0]">
            <div>
              <div class="font-headline-3 text-headline-3 text-on-surface font-semibold">{{ patientName }} (MRN #{{ appointment?.patientMrn || 'N/A' }})</div>
              <div class="font-label-regular text-label-regular text-secondary">Provider: {{ doctorName }} · {{ appointment?.doctorSpecialty || 'Clinical Telehealth' }}</div>
            </div>
            <div class="text-right">
              <div class="font-label-medium text-label-medium text-primary font-bold">Session Duration: {{ formattedCallDuration }}</div>
              <div class="font-caption-caps text-caption-caps text-secondary font-mono">Signed via Digital EHR #{{ appointment?.encounterNumber || 'ENC-ACTIVE' }}</div>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div>
              <h3 class="font-headline-3 text-headline-3 text-on-surface mb-1 font-semibold">Physician Clinical Assessment</h3>
              <p class="font-body-regular text-body-regular text-on-surface-variant bg-surface-container-low p-3.5 rounded-xl border border-[#E2E8F0]">
                {{ consultationRecord?.doctorNotes || 'Consultation concluded. Attending physician will document and sign clinical encounter notes.' }}
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="p-3 rounded-xl bg-surface-container-low border border-[#E2E8F0]">
                <span class="font-caption-caps text-caption-caps text-secondary block font-semibold">Diagnosis Code (ICD-10)</span>
                <span class="font-headline-3 text-headline-3 text-on-surface font-mono font-bold">
                  {{ getFormattedDiagnosis() }}
                </span>
              </div>
              <div class="p-3 rounded-xl bg-surface-container-low border border-[#E2E8F0]">
                <span class="font-caption-caps text-caption-caps text-secondary block font-semibold">Prescriptions Refilled</span>
                <span class="font-headline-3 text-headline-3 text-on-surface font-bold">
                  {{ consultationRecord ? 'Documented via Clinical Order' : 'No prescriptions ordered during this session' }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <a
              [routerLink]="currentUserRole === 'ROLE_DOCTOR' ? '/doctor/dashboard' : '/patient/appointments'"
              class="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-headline-3 text-headline-3 text-[14px] shadow hover:bg-primary-container transition-colors font-semibold"
            >
              Return to Appointments
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ConsultationRoomComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private appointmentService = inject(AppointmentService);
  private authService = inject(AuthService);

  currentState: WebRtcState = 'active';
  activeSidebarTab: SidebarTab = 'chat';
  isSidebarOpen: boolean = true;

  // Media controls
  isMicOn: boolean = true;
  isCameraOn: boolean = true;
  isSpeakerOn: boolean = true;
  mediaErrorMessage: string | null = null;

  // Modals
  isEndCallModalOpen: boolean = false;
  isScreenShareModalOpen: boolean = false;
  isSummaryModalOpen: boolean = false;
  selectedScreenSource: 'entire' | 'tab' = 'entire';

  // Call metadata
  appointmentId: number | null = null;
  appointment: Appointment | null = null;
  consultationRecord: ConsultationRecord | null = null;
  roomSession: RoomSession | null = null;
  currentUserRole: string = 'ROLE_PATIENT';

  doctorName: string = 'Attending Physician';
  patientName: string = 'Patient';

  // Call timer
  callDurationSeconds: number = 0;
  private timerInterval: any = null;

  // Chat
  unreadChatCount: number = 0;
  newChatMessage: string = '';
  chatMessages: ChatMessage[] = [];

  get formattedCallDuration(): string {
    const mins = Math.floor(this.callDurationSeconds / 60);
    const secs = this.callDurationSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getInitials(name: string): string {
    if (!name) return 'PT';
    return name
      .replace(/^Dr\.\s*/i, '')
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.currentUserRole = user.role;
      if (this.currentUserRole === 'ROLE_DOCTOR') {
        this.doctorName = user.fullName.startsWith('Dr.') ? user.fullName : `Dr. ${user.fullName}, MD`;
        this.patientName = this.appointment?.patientName || 'Patient';
      } else if (this.currentUserRole === 'ROLE_PATIENT') {
        this.patientName = user.fullName;
        this.doctorName = this.appointment?.doctorName || 'Attending Physician';
      }
    }

    const idParam = this.route.snapshot.queryParamMap.get('appointmentId') || this.route.snapshot.queryParamMap.get('encounterId');
    if (idParam) {
      this.appointmentId = Number(idParam);
      this.loadAppointmentAndRoomToken(this.appointmentId);
    }

    this.startCallTimer();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private loadAppointmentAndRoomToken(id: number): void {
    this.appointmentService.getAppointmentById(id).subscribe({
      next: (app) => {
        this.appointment = app;
        if (app.doctorName) {
          this.doctorName = app.doctorName.startsWith('Dr.') ? app.doctorName : `Dr. ${app.doctorName}`;
        }
        if (app.patientName) {
          this.patientName = app.patientName;
        }
      },
      error: (err) => console.warn('Could not load appointment details:', err)
    });

    this.appointmentService.getRoomToken(id).subscribe({
      next: (session) => {
        this.roomSession = session;
        console.log('Obtained WebRTC room session token:', session.roomId);
      },
      error: (err) => {
        console.warn('Room token retrieval error (falling back to local session simulation):', err);
      }
    });
  }

  private startCallTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.currentState === 'active') {
        this.callDurationSeconds++;
      }
    }, 1000);
  }

  switchState(state: WebRtcState): void {
    this.currentState = state;
  }

  toggleMic(): void {
    this.isMicOn = !this.isMicOn;
    if (this.isMicOn) {
      this.requestMediaPermissions();
    }
  }

  toggleCamera(): void {
    this.isCameraOn = !this.isCameraOn;
    if (this.isCameraOn) {
      this.requestMediaPermissions();
    }
  }

  async requestMediaPermissions(): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: this.isMicOn, video: this.isCameraOn });
        stream.getTracks().forEach((track) => track.stop());
        this.mediaErrorMessage = null;
      } catch (err: any) {
        console.warn('Browser media permissions error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          this.mediaErrorMessage = 'Camera or microphone access permission was denied. Please grant permission in your browser address bar.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          this.mediaErrorMessage = 'No camera or microphone hardware device detected.';
        } else {
          this.mediaErrorMessage = 'Could not access audio/video hardware: ' + (err.message || 'Device error');
        }
      }
    }
  }

  toggleSpeaker(): void {
    this.isSpeakerOn = !this.isSpeakerOn;
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    if (this.isSidebarOpen && this.activeSidebarTab === 'chat') {
      this.unreadChatCount = 0;
    }
  }

  toggleSidebarTab(tab: SidebarTab): void {
    if (!this.isSidebarOpen) {
      this.isSidebarOpen = true;
    }
    this.activeSidebarTab = tab;
    if (tab === 'chat') {
      this.unreadChatCount = 0;
    }
  }

  switchSidebarTab(tab: SidebarTab): void {
    this.activeSidebarTab = tab;
    if (tab === 'chat') {
      this.unreadChatCount = 0;
    }
  }

  openEndCallModal(): void {
    this.isEndCallModalOpen = true;
  }

  closeEndCallModal(): void {
    this.isEndCallModalOpen = false;
  }

  confirmEndCall(): void {
    this.isEndCallModalOpen = false;
    this.currentState = 'ended';
    this.openSummaryModal();
  }

  toggleScreenShareModal(): void {
    this.isScreenShareModalOpen = !this.isScreenShareModalOpen;
  }

  selectScreenSource(source: 'entire' | 'tab'): void {
    this.selectedScreenSource = source;
  }

  startScreenShare(): void {
    this.isScreenShareModalOpen = false;
  }

  openSummaryModal(): void {
    this.isSummaryModalOpen = true;
    if (this.appointmentId) {
      this.appointmentService.getConsultationRecord(this.appointmentId).subscribe({
        next: (rec) => (this.consultationRecord = rec),
        error: () => {
          this.consultationRecord = null;
        }
      });
    }
  }

  closeSummaryModal(): void {
    this.isSummaryModalOpen = false;
  }

  getFormattedDiagnosis(): string {
    if (!this.consultationRecord?.diagnosisCode) {
      return 'Not documented / To be filed';
    }
    const code = this.consultationRecord.diagnosisCode;
    const desc = this.consultationRecord.diagnosisDescription;
    return desc ? `${code} (${desc})` : code;
  }

  sendMessage(event: Event): void {
    event.preventDefault();
    if (!this.newChatMessage.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: this.currentUserRole === 'ROLE_DOCTOR' ? this.doctorName : `${this.patientName} (You)`,
      senderRole: this.currentUserRole === 'ROLE_DOCTOR' ? 'doctor' : 'patient',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: this.newChatMessage.trim()
    };

    this.chatMessages.push(newMsg);
    this.newChatMessage = '';
  }
}
