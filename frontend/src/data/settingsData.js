// MAK Tours & Travels ERP - Settings Mock Data

export const initialSettings = {
  company: {
    legalName: 'MAK Tours & Travels Private Limited',
    brandName: 'MAK Tours and Travels ERP',
    tagline: 'Premier Corporate Mobility, Hill Tours & Luxury Drivers',
    gstin: '29AABCM9012K1Z4',
    pan: 'AABCM9012K',
    cin: 'U63040KA2018PTC112233',
    logoUrl: '/assets/images/mak-logo.png',
    email: 'contact@maktours.com',
    supportPhone: '+91 80 4123 9000',
    emergencyHelpline: '+91 98450 99999',
    website: 'https://maktoursandtravels.com',
    headOffice: {
      addressLine1: 'MAK Towers, #120/4, 80 Feet Road',
      addressLine2: '4th Block, Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      country: 'India'
    },
    branches: [
      { city: 'Chennai', address: '#42, Anna Salai, Teynampet, Chennai - 600018', phone: '+91 44 2433 8000' },
      { city: 'Hyderabad', address: '#18, Road No. 2, Banjara Hills, Hyderabad - 500034', phone: '+91 40 2355 4000' },
      { city: 'Coimbatore', address: '#72, DB Road, RS Puram, Coimbatore - 641002', phone: '+91 422 254 3000' }
    ]
  },
  invoice: {
    prefix: 'MAK-INV-',
    startingSequence: 1081,
    gstTaxRatePercent: 5,
    sacCode: '996601',
    paymentTermsDays: 15,
    currencySymbol: '₹',
    bankDetails: {
      bankName: 'HDFC Bank Ltd',
      accountName: 'MAK Tours & Travels Pvt Ltd',
      accountNumber: '50200088192034',
      ifscCode: 'HDFC0000053',
      branch: 'Koramangala, Bengaluru'
    },
    termsAndConditions: '1. Toll charges & state road taxes are billed on actuals via Fastag.\n2. Standard driver night allowance applies for driving between 22:00 and 06:00.\n3. AC will be switched off during hill station climbs where required by vehicle engine safety regulations.\n4. Disputes subject to Bengaluru jurisdiction only.'
  },
  bookingPolicies: {
    minAdvancePercent: 30,
    driverBattaDay: 400,
    driverBattaNight: 600,
    nightDrivingChargeStart: '22:00',
    nightDrivingChargeEnd: '06:00',
    waitingChargePerHour: 150,
    extraKmRateSedan: 14,
    extraKmRateMpv: 18,
    extraKmRateSuv: 24,
    extraKmRateTempo: 28,
    cancellationPolicy: [
      { hoursBeforePickup: '48+ Hours', refundPercent: 100, deductionNote: 'Full refund minus ₹250 gateway processing charge' },
      { hoursBeforePickup: '24 - 48 Hours', refundPercent: 75, deductionNote: '25% cancellation fee' },
      { hoursBeforePickup: '12 - 24 Hours', refundPercent: 50, deductionNote: '50% cancellation fee' },
      { hoursBeforePickup: 'Less than 12 Hours', refundPercent: 0, deductionNote: 'No refund. Vehicle and driver already dispatched.' }
    ]
  },
  payoutPolicies: {
    // Vendor Partner Payout Configuration (Percentage %)
    vendorPayoutPercent: 85, // 85% goes to the Vendor, 15% retained as Admin Platform Margin
    vendorPayoutTermsDays: 7,

    // Driver Trip Compensation (Fixed Price Amount ₹)
    // Round Trip vs Tour Package (Statutory Note: ONE WAY TRIP IS STRICTLY FORBIDDEN)
    driverRoundTripPay: 1500, // Fixed price amount for Round Trip
    driverTourPackagePay: 2500, // Fixed price amount for Tour Package
    driverDayBatta: 400, // Daily allowance per day
    driverNightBatta: 600 // Night halt allowance
  },
  notificationPreferences: {
    emailAlerts: true,
    smsDispatches: true,
    whatsappUpdates: true,
    soundAlerts: true,
    driverAssignmentNotify: true,
    documentExpiryReminderDays: 30
  },
  theme: {
    primaryColor: '#2C3480',
    contrastRatio: '60-30-10 Enterprise Standards',
    defaultTheme: 'light',
    compactTables: false
  }
};
