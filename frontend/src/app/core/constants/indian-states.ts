export interface IndianState {
  code: string;
  name: string;
  type: 'STATE' | 'UT';
}

export const INDIAN_STATES_AND_UTS: IndianState[] = [
  // 28 States
  { code: 'AP', name: 'Andhra Pradesh', type: 'STATE' },
  { code: 'AR', name: 'Arunachal Pradesh', type: 'STATE' },
  { code: 'AS', name: 'Assam', type: 'STATE' },
  { code: 'BR', name: 'Bihar', type: 'STATE' },
  { code: 'CG', name: 'Chhattisgarh', type: 'STATE' },
  { code: 'GA', name: 'Goa', type: 'STATE' },
  { code: 'GJ', name: 'Gujarat', type: 'STATE' },
  { code: 'HR', name: 'Haryana', type: 'STATE' },
  { code: 'HP', name: 'Himachal Pradesh', type: 'STATE' },
  { code: 'JH', name: 'Jharkhand', type: 'STATE' },
  { code: 'KA', name: 'Karnataka', type: 'STATE' },
  { code: 'KL', name: 'Kerala', type: 'STATE' },
  { code: 'MP', name: 'Madhya Pradesh', type: 'STATE' },
  { code: 'MH', name: 'Maharashtra', type: 'STATE' },
  { code: 'MN', name: 'Manipur', type: 'STATE' },
  { code: 'ML', name: 'Meghalaya', type: 'STATE' },
  { code: 'MZ', name: 'Mizoram', type: 'STATE' },
  { code: 'NL', name: 'Nagaland', type: 'STATE' },
  { code: 'OD', name: 'Odisha', type: 'STATE' },
  { code: 'PB', name: 'Punjab', type: 'STATE' },
  { code: 'RJ', name: 'Rajasthan', type: 'STATE' },
  { code: 'SK', name: 'Sikkim', type: 'STATE' },
  { code: 'TN', name: 'Tamil Nadu', type: 'STATE' },
  { code: 'TS', name: 'Telangana', type: 'STATE' },
  { code: 'TR', name: 'Tripura', type: 'STATE' },
  { code: 'UP', name: 'Uttar Pradesh', type: 'STATE' },
  { code: 'UK', name: 'Uttarakhand', type: 'STATE' },
  { code: 'WB', name: 'West Bengal', type: 'STATE' },

  // 8 Union Territories
  { code: 'AN', name: 'Andaman and Nicobar Islands', type: 'UT' },
  { code: 'CH', name: 'Chandigarh', type: 'UT' },
  { code: 'DH', name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'UT' },
  { code: 'DL', name: 'Delhi (NCT)', type: 'UT' },
  { code: 'JK', name: 'Jammu and Kashmir', type: 'UT' },
  { code: 'LA', name: 'Ladakh', type: 'UT' },
  { code: 'LD', name: 'Lakshadweep', type: 'UT' },
  { code: 'PY', name: 'Puducherry', type: 'UT' }
];

export const INDIAN_MEDICAL_COUNCILS = [
  { code: 'NMC', name: 'National Medical Commission (NMC / erstwhile MCI)' },
  { code: 'DMC', name: 'Delhi Medical Council (DMC)' },
  { code: 'MMC', name: 'Maharashtra Medical Council (MMC)' },
  { code: 'KMC', name: 'Karnataka Medical Council (KMC)' },
  { code: 'TNMC', name: 'Tamil Nadu Medical Council (TNMC)' },
  { code: 'WBMC', name: 'West Bengal Medical Council (WBMC)' },
  { code: 'GMC', name: 'Gujarat Medical Council (GMC)' },
  { code: 'UPMC', name: 'Uttar Pradesh Medical Council (UPMC)' },
  { code: 'TMC', name: 'Travancore Cochin Medical Council (Kerala)' },
  { code: 'APMC', name: 'Andhra Pradesh Medical Council (APMC)' },
  { code: 'TSMC', name: 'Telangana State Medical Council (TSMC)' }
];

export const INDIAN_HEALTH_INSURERS = [
  { code: 'STAR', name: 'Star Health & Allied Insurance', networkShare: 'Comprehensive Network' },
  { code: 'HDFC_ERGO', name: 'HDFC ERGO Health Insurance', networkShare: 'Cashless Tier-1' },
  { code: 'CARE', name: 'Care Health Insurance', networkShare: 'Digital OPD & Telehealth' },
  { code: 'NIVA_BUPA', name: 'Niva Bupa Health Insurance', networkShare: 'Express Reimbursement' },
  { code: 'ICICI_LOMBARD', name: 'ICICI Lombard Health Shield', networkShare: 'Preferred Hospital Network' },
  { code: 'BAJAJ_ALLIANZ', name: 'Bajaj Allianz Health Guard', networkShare: 'Telemedicine Care' },
  { code: 'TATA_AIG', name: 'Tata AIG Medicare', networkShare: 'Direct Settlement' },
  { code: 'PMJAY', name: 'Ayushman Bharat PM-JAY (ABDM Integrated)', networkShare: 'National Health Authority' }
];

export const INDIAN_PHARMACIES = [
  { name: 'Apollo Pharmacy', address: 'Indiranagar 100ft Road, Bengaluru, Karnataka' },
  { name: 'MedPlus Pharmacy', address: 'Koramangala 4th Block, Bengaluru, Karnataka' },
  { name: 'Tata 1mg Digital Dispensary', address: 'Whitefield E-Commerce Hub, Bengaluru, Karnataka' },
  { name: 'Netmeds Express Pharmacy', address: 'Connaught Place, New Delhi, Delhi' },
  { name: 'PharmEasy Fulfillment Centre', address: 'Andheri East, Mumbai, Maharashtra' }
];

export const INDIAN_BANKS = [
  { code: 'SBI', name: 'State Bank of India (SBI)' },
  { code: 'HDFC', name: 'HDFC Bank' },
  { code: 'ICICI', name: 'ICICI Bank' },
  { code: 'AXIS', name: 'Axis Bank' },
  { code: 'KOTAK', name: 'Kotak Mahindra Bank' },
  { code: 'PNB', name: 'Punjab National Bank' },
  { code: 'BOB', name: 'Bank of Baroda' }
];

export const COUNTRY_CALLING_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳', isDefault: true },
  { code: '+1', country: 'United States', flag: '🇺🇸', isDefault: false },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', isDefault: false },
  { code: '+971', country: 'UAE', flag: '🇦🇪', isDefault: false },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', isDefault: false }
];
