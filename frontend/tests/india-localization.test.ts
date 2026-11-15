import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatInr,
  formatInrCompact,
  isValidIndianMobile,
  extractIndianMobile,
  formatIndianPhoneNumber,
  isValidIndianPinCode,
  isValidUpiId,
  formatIndianDate,
  formatIndianTime,
  formatIndianDateTime
} from '../src/app/core/utils/indian-formatters.ts';

import {
  INDIAN_STATES_AND_UTS,
  INDIAN_MEDICAL_COUNCILS,
  INDIAN_HEALTH_INSURERS,
  INDIAN_PHARMACIES,
  INDIAN_BANKS,
  COUNTRY_CALLING_CODES
} from '../src/app/core/constants/indian-states.ts';

describe('India Localization & Healthcare Regulatory Tests', () => {

  describe('1. Indian Mobile Number & Calling Code Validation', () => {
    it('should validate 10-digit Indian mobile numbers starting with 6, 7, 8, or 9', () => {
      assert.equal(isValidIndianMobile('9876543210'), true);
      assert.equal(isValidIndianMobile('8123456789'), true);
      assert.equal(isValidIndianMobile('7012345678'), true);
      assert.equal(isValidIndianMobile('6398765432'), true);
    });

    it('should validate mobile numbers with +91 or 91 prefix and formatting characters', () => {
      assert.equal(isValidIndianMobile('+91 98765 43210'), true);
      assert.equal(isValidIndianMobile('+91-9876543210'), true);
      assert.equal(isValidIndianMobile('09876543210'), true);
      assert.equal(isValidIndianMobile('919876543210'), true);
    });

    it('should reject invalid mobile numbers (too short, too long, starting with 0-5, US/UK numbers)', () => {
      assert.equal(isValidIndianMobile('5876543210'), false);
      assert.equal(isValidIndianMobile('1234567890'), false);
      assert.equal(isValidIndianMobile('98765'), false);
      assert.equal(isValidIndianMobile('987654321000'), false);
      assert.equal(isValidIndianMobile('+1 555 123 4567'), false); // US number
      assert.equal(isValidIndianMobile(''), false);
    });

    it('should extract canonical 10-digit mobile number and format into standard +91 XXXXX XXXXX', () => {
      assert.equal(extractIndianMobile('+91 (98765) 43210'), '9876543210');
      assert.equal(extractIndianMobile('09876543210'), '9876543210');
      assert.equal(formatIndianPhoneNumber('9876543210'), '+91 98765 43210');
      assert.equal(formatIndianPhoneNumber('+91 8123456789'), '+91 81234 56789');
    });

    it('should have India (+91) as primary default in calling codes', () => {
      assert.ok(COUNTRY_CALLING_CODES.length > 0);
      const indiaCode = COUNTRY_CALLING_CODES[0];
      assert.equal(indiaCode.code, '+91');
      assert.equal(indiaCode.country, 'India');
      assert.equal(indiaCode.flag, '🇮🇳');
    });
  });

  describe('2. Indian Address & PIN Code Validation', () => {
    it('should validate 6-digit Indian postal PIN codes (first digit 1-9)', () => {
      assert.equal(isValidIndianPinCode('560034'), true); // Bengaluru, Karnataka
      assert.equal(isValidIndianPinCode('110001'), true); // New Delhi
      assert.equal(isValidIndianPinCode('400001'), true); // Mumbai, Maharashtra
      assert.equal(isValidIndianPinCode('600001'), true); // Chennai, Tamil Nadu
      assert.equal(isValidIndianPinCode('700001'), true); // Kolkata, West Bengal
    });

    it('should reject invalid PIN codes (5-digit US ZIP, starting with 0, letters, length mismatch)', () => {
      assert.equal(isValidIndianPinCode('012345'), false); // starts with 0
      assert.equal(isValidIndianPinCode('90210'), false);  // US 5-digit ZIP
      assert.equal(isValidIndianPinCode('56003'), false);  // too short
      assert.equal(isValidIndianPinCode('5600345'), false);// too long
      assert.equal(isValidIndianPinCode('5600AB'), false); // non-digits
      assert.equal(isValidIndianPinCode(''), false);
    });

    it('should contain all 28 States and 8 Union Territories (36 total)', () => {
      assert.equal(INDIAN_STATES_AND_UTS.length, 36);

      const stateNames = INDIAN_STATES_AND_UTS.map(s => s.name);
      // Key States
      assert.ok(stateNames.includes('Karnataka'));
      assert.ok(stateNames.includes('Maharashtra'));
      assert.ok(stateNames.includes('Delhi (NCT)'));
      assert.ok(stateNames.includes('Tamil Nadu'));
      assert.ok(stateNames.includes('Telangana'));
      assert.ok(stateNames.includes('Uttar Pradesh'));
      assert.ok(stateNames.includes('Kerala'));
      assert.ok(stateNames.includes('Gujarat'));
      assert.ok(stateNames.includes('West Bengal'));
      // Key UTs
      assert.ok(stateNames.includes('Ladakh'));
      assert.ok(stateNames.includes('Jammu and Kashmir'));
      assert.ok(stateNames.includes('Chandigarh'));
      assert.ok(stateNames.includes('Puducherry'));
    });
  });

  describe('3. INR Currency & Billing Computations', () => {
    it('should format numbers with INR ₹ symbol and Indian numbering separators (lakhs/crores)', () => {
      assert.equal(formatInr(1000), '₹1,000.00');
      assert.equal(formatInr(1500), '₹1,500.00');
      assert.equal(formatInr(150000), '₹1,50,000.00');
      assert.equal(formatInr(10000000), '₹1,00,00,000.00');
    });

    it('should format compact INR amounts correctly (Lakhs and Crores)', () => {
      assert.equal(formatInrCompact(500), '₹500');
      assert.equal(formatInrCompact(1500), '₹1,500');
      assert.equal(formatInrCompact(250000), '₹2,50,000');
      assert.equal(formatInrCompact(12000000), '₹1,20,00,000');
    });

    it('should compute exact 20% patient copay and 80% insurance coverage in INR', () => {
      const consultationFee = 1500.00;
      const patientCopay = Number((consultationFee * 0.20).toFixed(2));
      const insuranceCovered = Number((consultationFee * 0.80).toFixed(2));

      assert.equal(patientCopay, 300.00);
      assert.equal(insuranceCovered, 1200.00);
      assert.equal(patientCopay + insuranceCovered, consultationFee);
    });
  });

  describe('4. Indian Payment Gateways & UPI VPA Validation', () => {
    it('should validate Indian UPI Virtual Payment Addresses (VPAs)', () => {
      assert.equal(isValidUpiId('patient@okhdfcbank'), true);
      assert.equal(isValidUpiId('careconnect@paytm'), true);
      assert.equal(isValidUpiId('9876543210@ybl'), true);
      assert.equal(isValidUpiId('doctor.rajesh@icici'), true);
      assert.equal(isValidUpiId('user_123@oksbi'), true);
    });

    it('should reject invalid UPI IDs', () => {
      assert.equal(isValidUpiId('patient'), false);
      assert.equal(isValidUpiId('patient@'), false);
      assert.equal(isValidUpiId('@paytm'), false);
      assert.equal(isValidUpiId('patient@domain.com@upi'), false);
      assert.equal(isValidUpiId(''), false);
    });

    it('should include major Indian banks for NetBanking', () => {
      assert.ok(INDIAN_BANKS.length >= 6);
      const bankNames = INDIAN_BANKS.map(b => b.name);
      assert.ok(bankNames.includes('State Bank of India (SBI)'));
      assert.ok(bankNames.includes('HDFC Bank'));
      assert.ok(bankNames.includes('ICICI Bank'));
    });
  });

  describe('5. Indian Date & Time (DD/MM/YYYY & IST) Formatting', () => {
    it('should format ISO dates into Indian standard DD/MM/YYYY format', () => {
      const testDate = new Date(Date.UTC(2026, 10, 15, 10, 30, 0)); // Nov 15, 2026
      const formatted = formatIndianDate(testDate);
      assert.match(formatted, /15\/11\/2026/);
    });

    it('should format time with 12-hour AM/PM and IST timezone indicator', () => {
      const testDate = new Date('2026-11-15T14:30:00+05:30');
      const timeStr = formatIndianTime(testDate);
      assert.match(timeStr, /2:30\s*(pm|PM)\s*IST/i);
    });

    it('should format combined date and time with IST suffix', () => {
      const testDate = new Date('2026-11-15T09:15:00+05:30');
      const dateTimeStr = formatIndianDateTime(testDate);
      assert.match(dateTimeStr, /15\/11\/2026/);
      assert.match(dateTimeStr, /9:15\s*(am|AM)\s*IST/i);
    });
  });

  describe('6. Indian Healthcare Regulatory Architecture', () => {
    it('should list recognized Indian Medical Councils (NMC, MMC, DMC, KMC, etc.)', () => {
      assert.ok(INDIAN_MEDICAL_COUNCILS.length >= 5);
      const councilCodes = INDIAN_MEDICAL_COUNCILS.map(c => c.code);
      assert.ok(councilCodes.includes('NMC'));
      assert.ok(councilCodes.includes('MMC'));
      assert.ok(councilCodes.includes('DMC'));
      assert.ok(councilCodes.includes('KMC'));
    });

    it('should list major Indian Health Insurers including Ayushman Bharat PM-JAY', () => {
      assert.ok(INDIAN_HEALTH_INSURERS.length >= 5);
      assert.ok(INDIAN_HEALTH_INSURERS.some(i => i.name.includes('Star Health')));
      assert.ok(INDIAN_HEALTH_INSURERS.some(i => i.name.includes('HDFC ERGO')));
      assert.ok(INDIAN_HEALTH_INSURERS.some(i => i.name.includes('Ayushman Bharat PM-JAY')));
    });

    it('should list top Indian online & retail pharmacy networks', () => {
      assert.ok(INDIAN_PHARMACIES.length >= 4);
      assert.ok(INDIAN_PHARMACIES.some(p => p.name.includes('Apollo Pharmacy')));
      assert.ok(INDIAN_PHARMACIES.some(p => p.name.includes('MedPlus')));
      assert.ok(INDIAN_PHARMACIES.some(p => p.name.includes('Tata 1mg')));
      assert.ok(INDIAN_PHARMACIES.some(p => p.name.includes('Netmeds')));
    });
  });

});
