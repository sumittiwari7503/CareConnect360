import { describe, it } from 'node:test';
import assert from 'node:assert';

interface MockNotification {
  id: number;
  category: 'APPOINTMENT' | 'PRESCRIPTION' | 'RECORDS' | 'SECURITY';
  title: string;
  message: string;
  referenceCode?: string;
  isRead: boolean;
}

describe('Notification Center Unit Tests', () => {
  const sampleNotifications: MockNotification[] = [
    { id: 1, category: 'APPOINTMENT', title: 'Telehealth Room Opens in 30 Minutes', message: 'Consultation with Dr. Priya Patel', referenceCode: 'APT-2024-9021', isRead: false },
    { id: 2, category: 'PRESCRIPTION', title: 'Prescription Renewal Approved', message: 'Lisinopril 10mg refill ready at CVS', referenceCode: 'RX-99401-2026', isRead: false },
    { id: 3, category: 'RECORDS', title: 'Laboratory Diagnostic Panel Ready', message: 'Comprehensive Metabolic Panel (CMP) results', referenceCode: 'LAB-DOC-84920', isRead: false },
    { id: 4, category: 'SECURITY', title: 'New Telehealth Login Device Detected', message: 'Login from Austin, TX', referenceCode: 'SEC-LOG-4491', isRead: true },
    { id: 5, category: 'APPOINTMENT', title: 'Post-Consultation Care Summary Available', message: 'Encounter summary ready', referenceCode: 'APT-2024-8819', isRead: true },
  ];

  function filterNotifications(list: MockNotification[], category: string, query: string): MockNotification[] {
    let result = list;
    if (category !== 'all') {
      result = result.filter(n => n.category.toUpperCase() === category.toUpperCase());
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.referenceCode && n.referenceCode.toLowerCase().includes(q))
      );
    }
    return result;
  }

  it('should return all notifications when category is all and query is empty', () => {
    const res = filterNotifications(sampleNotifications, 'all', '');
    assert.strictEqual(res.length, 5);
  });

  it('should filter correctly by APPOINTMENT category', () => {
    const res = filterNotifications(sampleNotifications, 'APPOINTMENT', '');
    assert.strictEqual(res.length, 2);
    assert.strictEqual(res.every(n => n.category === 'APPOINTMENT'), true);
  });

  it('should filter correctly by text query on reference code', () => {
    const res = filterNotifications(sampleNotifications, 'all', 'RX-99401');
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].id, 2);
  });

  it('should calculate unread notification count accurately', () => {
    const unread = sampleNotifications.filter(n => !n.isRead).length;
    assert.strictEqual(unread, 3);
  });

  it('should return empty list when search query matches nothing', () => {
    const res = filterNotifications(sampleNotifications, 'all', 'NONEXISTENT_KEYWORD_XYZ');
    assert.strictEqual(res.length, 0);
  });
});
