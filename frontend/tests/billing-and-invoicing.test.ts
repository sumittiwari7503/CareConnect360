import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Billing & Copay Computation Unit Tests (INR)', () => {
  interface InvoiceBreakdown {
    totalFee: number;
    patientCopay: number;
    insuranceCovered: number;
  }

  function computeEncounterBilling(consultationFee: number, copayPercentage: number = 0.20): InvoiceBreakdown {
    const totalFee = consultationFee;
    const patientCopay = Number((totalFee * copayPercentage).toFixed(2));
    const insuranceCovered = Number((totalFee - patientCopay).toFixed(2));
    return {
      totalFee: Number(totalFee.toFixed(2)),
      patientCopay,
      insuranceCovered
    };
  }

  it('should compute patient copay and insurance coverage for Cardiology encounter (₹1,500)', () => {
    const res = computeEncounterBilling(1500.00, 0.20);
    assert.strictEqual(res.totalFee, 1500.00);
    assert.strictEqual(res.patientCopay, 300.00);
    assert.strictEqual(res.insuranceCovered, 1200.00);
  });

  it('should compute billing for General Medicine encounter (₹800)', () => {
    const res = computeEncounterBilling(800.00, 0.20);
    assert.strictEqual(res.totalFee, 800.00);
    assert.strictEqual(res.patientCopay, 160.00);
    assert.strictEqual(res.insuranceCovered, 640.00);
  });

  it('should compute billing for Pediatrics encounter (₹1,000)', () => {
    const res = computeEncounterBilling(1000.00, 0.20);
    assert.strictEqual(res.totalFee, 1000.00);
    assert.strictEqual(res.patientCopay, 200.00);
    assert.strictEqual(res.insuranceCovered, 800.00);
  });
});
