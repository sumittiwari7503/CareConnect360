export type NotificationCategory = 'APPOINTMENT' | 'PRESCRIPTION' | 'RECORDS' | 'SECURITY';

export interface AppNotification {
  id: number;
  userId: number;
  category: NotificationCategory | string;
  title: string;
  message: string;
  referenceCode?: string;
  badgeText?: string;
  badgeSeverity: 'primary' | 'urgent' | 'warning' | 'info';
  actionLink?: string;
  actionLabel?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}
