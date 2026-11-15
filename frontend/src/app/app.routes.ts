import { Routes } from '@angular/router';
import { SignInComponent } from './features/auth/sign-in.component';
import { PatientRegistrationComponent } from './features/auth/patient-registration.component';
import { NotificationCenterComponent } from './features/notifications/notification-center.component';
import { PatientDashboardComponent } from './features/patient/patient-dashboard.component';
import { FindDoctorsComponent } from './features/patient/find-doctors.component';
import { DoctorProfileComponent } from './features/doctor/doctor-profile.component';
import { BookAppointmentComponent } from './features/booking/book-appointment.component';
import { MyAppointmentsComponent } from './features/patient/my-appointments.component';
import { DoctorDashboardComponent } from './features/doctor/doctor-dashboard.component';
import { DoctorAppointmentDetailsComponent } from './features/doctor/doctor-appointment-details.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';
import { ConsultationRoomComponent } from './features/consultation/consultation-room.component';
import { PrescriptionsComponent } from './features/patient/prescriptions.component';
import { MedicalRecordsComponent } from './features/patient/medical-records.component';
import { BillingInvoicesComponent } from './features/patient/billing-invoices.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'patient/dashboard', pathMatch: 'full' },
  { path: 'auth/sign-in', component: SignInComponent },
  { path: 'sign-in', redirectTo: 'auth/sign-in', pathMatch: 'full' },
  { path: 'login', redirectTo: 'auth/sign-in', pathMatch: 'full' },
  { path: 'auth/login', redirectTo: 'auth/sign-in', pathMatch: 'full' },
  { path: 'auth/register', component: PatientRegistrationComponent },
  { path: 'register', redirectTo: 'auth/register', pathMatch: 'full' },
  { path: 'telehealth', redirectTo: 'consultation/room', pathMatch: 'full' },
  { path: 'telehealth/:id', redirectTo: 'consultation/room', pathMatch: 'full' },
  { path: 'prescriptions', redirectTo: 'patient/prescriptions', pathMatch: 'full' },
  { path: 'documents', redirectTo: 'patient/records', pathMatch: 'full' },
  { path: 'records', redirectTo: 'patient/records', pathMatch: 'full' },
  { path: 'appointments', redirectTo: 'patient/appointments', pathMatch: 'full' },
  { path: 'billing', redirectTo: 'patient/billing', pathMatch: 'full' },
  { path: 'admin/credentialing', redirectTo: 'admin/dashboard', pathMatch: 'full' },
  { path: 'notifications', component: NotificationCenterComponent, canActivate: [authGuard] },
  { path: 'patient/notifications', redirectTo: 'notifications', pathMatch: 'full' },
  {
    path: 'patient/dashboard',
    component: PatientDashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'patient/appointments',
    component: MyAppointmentsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'patient/find-doctors',
    component: FindDoctorsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'doctors/:id',
    component: DoctorProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: 'patient/book/:doctorId',
    component: BookAppointmentComponent,
    canActivate: [authGuard]
  },
  {
    path: 'patient/prescriptions',
    component: PrescriptionsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'patient/records',
    component: MedicalRecordsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'patient/billing',
    component: BillingInvoicesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'patient/billing/:id',
    component: BillingInvoicesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'doctor/dashboard',
    component: DoctorDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: ['ROLE_DOCTOR', 'ROLE_ADMIN'] }
  },
  {
    path: 'doctor/appointments/:id',
    component: DoctorAppointmentDetailsComponent,
    canActivate: [roleGuard],
    data: { roles: ['ROLE_DOCTOR', 'ROLE_ADMIN'] }
  },
  {
    path: 'doctor/schedule',
    component: DoctorDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: ['ROLE_DOCTOR', 'ROLE_ADMIN'] }
  },
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },
  {
    path: 'admin/doctors',
    component: AdminDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },
  {
    path: 'admin/patients',
    component: AdminDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },
  {
    path: 'admin/audit-logs',
    component: AdminDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },
  {
    path: 'consultation/room',
    component: ConsultationRoomComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'patient/dashboard' }
];
