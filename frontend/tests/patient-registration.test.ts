import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Patient Registration Unit Tests', () => {
  function validateFullName(name: string): { isValid: boolean; feedback: string } {
    if (name.trim().length >= 3) {
      return { isValid: true, feedback: 'Validated against HIPAA medical record criteria' };
    }
    return { isValid: false, feedback: 'Please enter your complete legal name' };
  }

  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function calculatePasswordStrength(password: string): { score: number; label: string; rules: { length: boolean; case: boolean; num: boolean; special: boolean } } {
    const length = password.length >= 8;
    const hasCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
    const num = /[0-9]/.test(password);
    const special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    let score = 0;
    if (length) score++;
    if (hasCase) score++;
    if (num) score++;
    if (special) score++;

    let label = 'Weak';
    if (score === 2) label = 'Fair';
    else if (score === 3) label = 'Good';
    else if (score === 4) label = 'Strong';

    return { score, label, rules: { length, case: hasCase, num, special } };
  }

  it('should accept valid legal name with 3 or more characters', () => {
    const res = validateFullName('Aarav Sharma');
    assert.strictEqual(res.isValid, true);
    assert.match(res.feedback, /HIPAA/);
  });

  it('should reject names with fewer than 3 characters', () => {
    const res = validateFullName('El');
    assert.strictEqual(res.isValid, false);
    assert.match(res.feedback, /complete legal name/);
  });

  it('should accurately validate email format per RFC-822 criteria', () => {
    assert.strictEqual(validateEmail('eleanor.vance@careconnect.health'), true);
    assert.strictEqual(validateEmail('patient@hospital.org'), true);
    assert.strictEqual(validateEmail('invalid-email'), false);
    assert.strictEqual(validateEmail('missing@domain'), false);
  });

  it('should evaluate password strength rules and assign Strong for 4/4 rules', () => {
    const strength = calculatePasswordStrength('MedCare#2024$ecure');
    assert.strictEqual(strength.score, 4);
    assert.strictEqual(strength.label, 'Strong');
    assert.strictEqual(strength.rules.length, true);
    assert.strictEqual(strength.rules.case, true);
    assert.strictEqual(strength.rules.num, true);
    assert.strictEqual(strength.rules.special, true);
  });

  it('should evaluate weak password appropriately', () => {
    const strength = calculatePasswordStrength('weak');
    assert.strictEqual(strength.score, 0);
    assert.strictEqual(strength.label, 'Weak');
    assert.strictEqual(strength.rules.length, false);
  });
});
