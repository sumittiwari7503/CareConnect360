/**
 * Utility functions for India Localization (en-IN locale, Asia/Kolkata timezone, INR currency)
 */

export function formatInr(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatInrCompact(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Validates Indian 10-digit mobile number: Starts with 6, 7, 8, or 9 followed by 9 digits
 */
export function isValidIndianMobile(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  // Handles +91XXXXXXXXXX or 91XXXXXXXXXX or 0XXXXXXXXXX or XXXXXXXXXX
  const mobilePattern = /^(?:(?:\+|0{0,2})91|0)?[6-9]\d{9}$/;
  return mobilePattern.test(cleaned);
}

/**
 * Extracts normalized 10-digit mobile from phone string
 */
export function extractIndianMobile(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return cleaned.substring(2);
  }
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    return cleaned;
  }
  return cleaned;
}

/**
 * Formats phone number into +91 XXXXX XXXXX standard presentation
 */
export function formatIndianPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  const tenDigit = extractIndianMobile(phone);
  if (tenDigit.length === 10) {
    return `+91 ${tenDigit.substring(0, 5)} ${tenDigit.substring(5)}`;
  }
  return phone;
}

/**
 * Validates Indian postal PIN code: 6 digits, first digit between 1-9
 */
export function isValidIndianPinCode(pin: string | null | undefined): boolean {
  if (!pin) return false;
  const pinPattern = /^[1-9][0-9]{5}$/;
  return pinPattern.test(pin.trim());
}

/**
 * Validates Indian Virtual Payment Address (UPI ID)
 * e.g. name@okhdfcbank, user@paytm, name.surname@icici, mobile@upi
 */
export function isValidUpiId(upiId: string | null | undefined): boolean {
  if (!upiId) return false;
  const upiPattern = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiPattern.test(upiId.trim());
}

/**
 * Format date in Indian standard format: DD/MM/YYYY
 */
export function formatIndianDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  }).format(date);
}

/**
 * Format time in 12-hour format with AM/PM IST
 */
export function formatIndianTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const timeStr = new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  }).format(date);

  return `${timeStr} IST`;
}

/**
 * Format full datetime: DD/MM/YYYY • hh:mm a IST
 */
export function formatIndianDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const dateStr = formatIndianDate(dateInput);
  const timeStr = formatIndianTime(dateInput);
  if (!dateStr) return '';
  return `${dateStr} • ${timeStr}`;
}
