import { describe, it } from 'node:test';
import assert from 'node:assert';

type CredentialingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

interface CredentialingTransition {
  currentStatus: CredentialingStatus;
  targetStatus: CredentialingStatus;
  reason?: string;
  adminId: number;
}

function processCredentialing(transition: CredentialingTransition): { success: boolean; error?: string } {
  if (transition.targetStatus === 'REJECTED' && (!transition.reason || transition.reason.trim().length === 0)) {
    return { success: false, error: 'Rejection reason is mandatory under health network credentialing governance' };
  }
  if (transition.currentStatus === 'APPROVED' && transition.targetStatus === 'APPROVED') {
    return { success: false, error: 'Doctor is already approved' };
  }
  if (transition.currentStatus === 'REJECTED' && transition.targetStatus === 'REJECTED') {
    return { success: false, error: 'Doctor is already rejected' };
  }
  return { success: true };
}

describe('Doctor Credentialing Governance Unit Tests', () => {
  it('should approve a pending doctor successfully', () => {
    const res = processCredentialing({
      currentStatus: 'PENDING',
      targetStatus: 'APPROVED',
      adminId: 1
    });
    assert.strictEqual(res.success, true);
  });

  it('should reject credentialing when rejection reason is missing', () => {
    const res = processCredentialing({
      currentStatus: 'PENDING',
      targetStatus: 'REJECTED',
      reason: '',
      adminId: 1
    });
    assert.strictEqual(res.success, false);
    assert.match(res.error || '', /mandatory/);
  });

  it('should allow rejection when explicit clinical audit reason is provided', () => {
    const res = processCredentialing({
      currentStatus: 'PENDING',
      targetStatus: 'REJECTED',
      reason: 'State medical license expired; failed primary source verification',
      adminId: 1
    });
    assert.strictEqual(res.success, true);
  });

  it('should reject redundant status transition', () => {
    const res = processCredentialing({
      currentStatus: 'APPROVED',
      targetStatus: 'APPROVED',
      adminId: 1
    });
    assert.strictEqual(res.success, false);
  });
});
