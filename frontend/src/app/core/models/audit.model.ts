export interface AuditEvent {
  id: number;
  eventTrackingCode: string;
  actorId: number;
  actorRole: string;
  actionType: string;
  targetResource: string;
  eventStatus: 'SUCCESS' | 'FAILED' | 'WARNING';
  detailsJson?: string;
  verificationHash: string;
  createdAt: string;
}
