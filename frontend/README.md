# CareConnect360 Frontend (Angular 18 + Tailwind CSS)

**Project:** CareConnect360 (Project ID: P_013)  
**Framework:** Angular 18 (Standalone Components, Signals, Reactive Guards)  
**Styling Framework:** Tailwind CSS with Clinical Clarity Design Tokens  

---

## 1. Design System & Styling Architecture

The frontend adheres to `clinical_clarity/DESIGN.md`:
- **Primary Color:** Clinical Teal (`#005C55` / `#0F766E`)
- **Typography:** `Inter` font scale (`display`, `headline-1`, `body-regular`, `caption-caps`)
- **Icons:** Google Material Symbols Outlined
- **Responsive Layout:** Fixed 64px global header and 256px multi-role sidebar rail.

---

## 2. Getting Started Locally

### Prerequisites
- Node.js `v20+` or `v22+` (Installed: `v22.23.2`)
- npm `v10+` (Installed: `10.9.8`)

### Setup Commands
```bash
cd frontend
npm install
npm start
```
The application will launch at `http://localhost:4200/`.

---

## 3. Directory Layout

```text
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/        # authGuard, roleGuard
│   │   │   ├── interceptors/  # jwtInterceptor, errorInterceptor
│   │   │   ├── models/        # User, Patient, Doctor, Appointment, Prescription, Invoice, Audit
│   │   │   └── services/      # AuthService, AppointmentService, DoctorService, AuditService
│   │   ├── features/
│   │   │   ├── admin/         # Admin operations & audit trail
│   │   │   ├── auth/          # Secure sign-in & registration
│   │   │   ├── consultation/  # WebRTC virtual consultation room
│   │   │   ├── doctor/        # Physician dashboard & queue
│   │   │   └── patient/       # Patient portal & appointment booking
│   │   └── shared/
│   │       └── components/    # Header, Sidebar, StatusBadge
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── angular.json
├── package.json
├── tailwind.config.js
└── tsconfig.json
```
