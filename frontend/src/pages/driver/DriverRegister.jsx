// MAK Tours & Travels ERP - Commercial Driver Registration & Statutory Verification
// Executive Split-Screen Layout with Sticky Progress Sidebar, Comprehensive Document Uploads, & Strict Route Compliance
import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Compass,
  ArrowLeft,
  ArrowRight,
  Check,
  UploadCloud,
  X,
  FileText,
  User,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Eye,
  CreditCard,
  Building,
  Lock,
  HeartPulse,
  Award,
  AlertTriangle,
  FileCheck,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  Headphones,
  Car
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useDriverData } from '../../context/DriverDataContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';

export function DriverRegister() {
  const navigate = useNavigate();
  const toast = useToast();
  const { submitDriverRegistration } = useDriverData();
  const { currentUser, isAuthenticated, login } = useAuth();

  const handleGoToDriverPortal = () => {
    login({ email: 'driver@maktours.com', password: 'Driver@123', role: 'driver' });
    navigate('/driver/dashboard');
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdApplication, setCreatedApplication] = useState(null);
  const [previewModalUrl, setPreviewModalUrl] = useState(null);
  const [previewModalTitle, setPreviewModalTitle] = useState('');

  // ----------------------------------------------------
  // STEP 1: PERSONAL & CONTACT DETAILS
  // ----------------------------------------------------
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('1992-05-14');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Chennai');
  const [state, setState] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('Spouse');

  // ----------------------------------------------------
  // STEP 2: DEDICATED DRIVER DOCUMENTS & VERIFICATION
  // ----------------------------------------------------
  // E. Passport Photograph
  const [photo, setPhoto] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80');
  const [photoFileName, setPhotoFileName] = useState('Passport_Photograph_Arun.jpg');
  const photoInputRef = useRef(null);

  // A. Driving License
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseHolderName, setLicenseHolderName] = useState('');
  const [licenseType, setLicenseType] = useState('LMV-TR (Commercial Transport Badge)');
  const [licenseIssueDate, setLicenseIssueDate] = useState('2015-06-10');
  const [licenseExpiry, setLicenseExpiry] = useState('2035-06-09');
  const [licenseFrontImage, setLicenseFrontImage] = useState('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80');
  const [licenseFrontFileName, setLicenseFrontFileName] = useState('License_Front_Side.jpg');
  const [licenseBackImage, setLicenseBackImage] = useState('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80');
  const [licenseBackFileName, setLicenseBackFileName] = useState('License_Back_Side.jpg');
  const dlFrontInputRef = useRef(null);
  const dlBackInputRef = useRef(null);

  // B. Identity & Address Proof
  const [aadhaarNumber, setAadhaarNumber] = useState('XXXX-XXXX-4819');
  const [aadhaarFile, setAadhaarFile] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80');
  const [aadhaarFileName, setAadhaarFileName] = useState('Aadhaar_Masked_E-KYC.pdf');
  const aadhaarInputRef = useRef(null);

  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [panFile, setPanFile] = useState('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80');
  const [panFileName, setPanFileName] = useState('PAN_Card_Attested.pdf');
  const panInputRef = useRef(null);

  const [voterId, setVoterId] = useState('');
  const [voterIdFile, setVoterIdFile] = useState('');
  const [voterIdFileName, setVoterIdFileName] = useState('');
  const voterIdInputRef = useRef(null);

  const [passportNumber, setPassportNumber] = useState('');
  const [passportFile, setPassportFile] = useState('');
  const [passportFileName, setPassportFileName] = useState('');
  const passportInputRef = useRef(null);

  // Address Proof Document Type Selector
  const [addressProofType, setAddressProofType] = useState('Electricity Bill');
  const [addressProofFile, setAddressProofFile] = useState('https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80');
  const [addressProofFileName, setAddressProofFileName] = useState('TNEB_Electricity_Bill.pdf');
  const addressProofInputRef = useRef(null);

  // C. Police Verification Certificate (PVC)
  const [pvcNumber, setPvcNumber] = useState('PVC-TN-CHN-2025-9941');
  const [pvcIssuedDate, setPvcIssuedDate] = useState('2025-10-12');
  const [pvcExpiryDate, setPvcExpiryDate] = useState('2027-10-12');
  const [pvcFile, setPvcFile] = useState('https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80');
  const [pvcFileName, setPvcFileName] = useState('Police_Clearance_Certificate.pdf');
  const pvcInputRef = useRef(null);

  // D. Bank Details (Private & Encrypted)
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('•••• •••• 4892');
  const [ifscCode, setIfscCode] = useState('HDFC0001245');
  const [cancelledChequeFile, setCancelledChequeFile] = useState('https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80');
  const [cancelledChequeFileName, setCancelledChequeFileName] = useState('Cancelled_Cheque_HDFC.jpg');
  const chequeInputRef = useRef(null);

  // F. Annual Medical Fitness Certificate (Form 1A)
  const [medicalDocNumber, setMedicalDocNumber] = useState('MED-TN-2026-9182');
  const [doctorName, setDoctorName] = useState('Dr. R. Sundaramoorthy, MBBS, MS');
  const [doctorRegNo, setDoctorRegNo] = useState('TN-MC-48921');
  const [clinicHospital, setClinicHospital] = useState('Aravind Eye Hospital & Diagnostic Center, Chennai');
  const [medicalCheckupDate, setMedicalCheckupDate] = useState('2026-10-20');
  const [medicalExpiryDate, setMedicalExpiryDate] = useState('2027-10-19');
  const [visualAcuity, setVisualAcuity] = useState('6/6 (Both Eyes, Normal Without Glasses)');
  const [colorVision, setColorVision] = useState('Normal (Ishihara 24 Plates Cleared)');
  const [nightVision, setNightVision] = useState('Cleared / Normal Adaptation');
  const [bloodPressure, setBloodPressure] = useState('120/80 mmHg');
  const [fitnessVerdict, setFitnessVerdict] = useState('Certified Fit for Commercial Driver Operations');
  const [medicalFile, setMedicalFile] = useState('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80');
  const [medicalFileName, setMedicalFileName] = useState('Medical_Fitness_Form_1A_Signed.pdf');
  const medicalInputRef = useRef(null);

  // ----------------------------------------------------
  // STEP 3: EXPERIENCE & REGIONAL PREFERENCES
  // ----------------------------------------------------
  const [experienceYears, setExperienceYears] = useState('8');
  const [languages, setLanguages] = useState(['Tamil', 'English']);
  const [preferredTripType, setPreferredTripType] = useState('Tour Package');
  const [previousExperience, setPreviousExperience] = useState('8 years handling luxury tourist driver duties across South India.');
  const [notes, setNotes] = useState('');

  // ----------------------------------------------------
  // STEP 4: DECLARATION & REVIEW
  // ----------------------------------------------------
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [errors, setErrors] = useState({});

  const availableLanguages = ['Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada'];

  // Allowed Trip Categories (STRICTLY NO ONE WAY TRIP)
  const preferredTripTypes = [
    'Tour Package',
    'Round Trip',
    'Local Trip',
    'Airport Transfer',
    'Custom Journey'
  ];

  const toggleLanguage = (lang) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  // File Upload Validator
  const handleFileUpload = (e, setFileUrl, setFileName, docLabel) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      toast.error(`Unsupported format for ${docLabel}. Allowed formats: PDF, JPG, JPEG, PNG.`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(`File size for ${docLabel} exceeds 5MB limit. Please compress file.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileUrl(reader.result);
      setFileName(file.name);
      toast.success(`${docLabel} uploaded successfully (${file.name})`);
    };
    reader.readAsDataURL(file);
  };

  // Step Validation
  const validateStep = (step) => {
    const errs = {};
    if (step === 1) {
      if (!fullName.trim()) errs.fullName = 'Full Name is required';
      if (!phone.trim()) errs.phone = 'Mobile Number is required';
      if (!dob) errs.dob = 'Date of birth is required';
      if (!address.trim()) errs.address = 'Residential address is required';
      if (!city.trim()) errs.city = 'City is required';
      if (!pincode.trim()) errs.pincode = 'Pincode is required';
      if (!emergencyContactName.trim()) errs.emergencyContactName = 'Emergency contact person is required';
      if (!emergencyContactPhone.trim()) errs.emergencyContactPhone = 'Emergency phone is required';
    } else if (step === 2) {
      if (!photo) errs.photo = 'Passport photograph is required';
      if (!licenseNumber.trim()) errs.licenseNumber = 'Driving License number is required';
      if (!licenseHolderName.trim()) errs.licenseHolderName = 'License holder name is required';
      if (!licenseExpiry) errs.licenseExpiry = 'License expiry date is required';
      if (!licenseFrontImage) errs.licenseFrontImage = 'Front image of license is required';
      if (!licenseBackImage) errs.licenseBackImage = 'Back image of license is required';
      if (!aadhaarNumber.trim()) errs.aadhaarNumber = 'Aadhaar Card number is required';
      if (!aadhaarFile) errs.aadhaarFile = 'Aadhaar document upload is required';
      if (!panNumber.trim()) errs.panNumber = 'PAN Card number is required';
      if (!panFile) errs.panFile = 'PAN Card upload is required';
      if (!pvcNumber.trim()) errs.pvcNumber = 'PVC certificate number is required';
      if (!pvcFile) errs.pvcFile = 'PVC certificate upload is required';
      if (!accountNumber.trim()) errs.accountNumber = 'Bank account number is required';
      if (!ifscCode.trim()) errs.ifscCode = 'IFSC code is required';
      if (!cancelledChequeFile) errs.cancelledChequeFile = 'Cancelled cheque or passbook scan is required';
      if (!medicalDocNumber.trim()) errs.medicalDocNumber = 'Medical fitness certificate number is required';
      if (!medicalFile) errs.medicalFile = 'Medical fitness certificate upload is required';
    } else if (step === 4) {
      if (!termsAgreed) errs.terms = 'You must declare that all submitted credentials are legal and valid';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please complete all mandatory required fields and document uploads.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    const newApp = submitDriverRegistration({
      fullName,
      dob,
      gender,
      phone,
      altPhone,
      email,
      address,
      city,
      state,
      pincode,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      licenseNumber: licenseNumber.toUpperCase(),
      licenseHolderName: (licenseHolderName || fullName).toUpperCase(),
      licenseClass: licenseType,
      licenseIssueDate,
      licenseExpiry,
      licenseFrontImage,
      licenseBackImage,
      aadhaarNumber,
      aadhaarFrontUrl: aadhaarFile,
      panNumber: panNumber.toUpperCase(),
      panUrl: panFile,
      voterId: voterId || '',
      voterIdUrl: voterIdFile || '',
      passportNumber: passportNumber || '',
      passportUrl: passportFile || '',
      addressProofType,
      addressProofUrl: addressProofFile,
      pvcNumber,
      pvcIssuedDate,
      pvcExpiryDate,
      pvcUrl: pvcFile,
      pvcStatus: 'Pending',
      bankDetails: {
        accountHolderName: (accountHolderName || fullName).toUpperCase(),
        bankName,
        accountNumber,
        ifscCode: ifscCode.toUpperCase(),
        cancelledChequeUrl: cancelledChequeFile,
        status: 'Pending'
      },
      photo,
      passportPhoto: photo,
      medicalFitness: {
        certificateNumber: medicalDocNumber,
        doctorName,
        doctorRegNo,
        clinicHospital,
        examinationDate: medicalCheckupDate,
        expiryDate: medicalExpiryDate,
        visualAcuity,
        colorVision,
        nightVision,
        bloodPressure,
        fitnessVerdict,
        documentUrl: medicalFile,
        status: 'Pending'
      },
      documents: [
        {
          id: `DOC-DL-${Date.now()}`,
          type: 'Driving License',
          title: 'Commercial Driving License (LMV-TR & Badge)',
          documentNumber: licenseNumber.toUpperCase(),
          holderName: (licenseHolderName || fullName).toUpperCase(),
          expiryDate: licenseExpiry,
          required: true,
          frontImage: licenseFrontImage,
          backImage: licenseBackImage,
          fileUrl: licenseFrontImage,
          fileName: licenseFrontFileName,
          status: 'Pending'
        },
        {
          id: `DOC-UID-${Date.now()}`,
          type: 'Identity Proof',
          title: 'Aadhaar Card (Masked UID)',
          documentNumber: aadhaarNumber,
          holderName: fullName,
          expiryDate: null,
          required: true,
          fileUrl: aadhaarFile,
          fileName: aadhaarFileName,
          status: 'Pending'
        },
        {
          id: `DOC-PAN-${Date.now()}`,
          type: 'PAN Card',
          title: 'Income Tax PAN Card',
          documentNumber: panNumber.toUpperCase(),
          holderName: fullName,
          expiryDate: null,
          required: true,
          fileUrl: panFile,
          fileName: panFileName,
          status: 'Pending'
        },
        {
          id: `DOC-PVC-${Date.now()}`,
          type: 'Police Verification',
          title: 'Police Verification Certificate (PVC)',
          documentNumber: pvcNumber,
          holderName: fullName,
          issueDate: pvcIssuedDate,
          expiryDate: pvcExpiryDate,
          required: true,
          fileUrl: pvcFile,
          fileName: pvcFileName,
          status: 'Pending'
        },
        {
          id: `DOC-BANK-${Date.now()}`,
          type: 'Bank Details',
          title: 'Bank Passbook / Cancelled Cheque',
          documentNumber: `${bankName} (${accountNumber})`,
          holderName: (accountHolderName || fullName).toUpperCase(),
          expiryDate: null,
          required: true,
          fileUrl: cancelledChequeFile,
          fileName: cancelledChequeFileName,
          status: 'Pending'
        },
        {
          id: `DOC-PHOTO-${Date.now()}`,
          type: 'Passport Photograph',
          title: 'Recent Passport-Size Photograph',
          documentNumber: 'PHOTO-SUBMITTED',
          holderName: fullName,
          expiryDate: null,
          required: true,
          fileUrl: photo,
          fileName: photoFileName,
          status: 'Pending'
        },
        {
          id: `DOC-MED-${Date.now()}`,
          type: 'Medical Certificate',
          title: 'Annual Medical Fitness & Eye Checkup Certificate',
          documentNumber: medicalDocNumber,
          holderName: fullName,
          issueDate: medicalCheckupDate,
          expiryDate: medicalExpiryDate,
          required: true,
          fileUrl: medicalFile,
          fileName: medicalFileName,
          status: 'Pending'
        }
      ],
      experienceYears: parseInt(experienceYears, 10) || 5,
      languages,
      preferredTripType,
      previousExperience,
      notes,
      status: 'Submitted for Verification'
    });

    setCreatedApplication(newApp);
    setIsSubmitted(true);
    toast.success('Registration and statutory documents submitted for Admin verification!');
  };

  // Steps definition for vertical tracker
  const stepsList = [
    {
      num: 1,
      title: 'Personal & Contact Details',
      desc: 'Applicant name, DOB, mobile, residential address & emergency contact',
      short: 'Personal & Address'
    },
    {
      num: 2,
      title: 'Driver Documents & Verification',
      desc: 'Commercial DL, Aadhaar, PAN, Police PVC, Bank Details & Medical',
      short: 'Statutory Documents'
    },
    {
      num: 3,
      title: 'Experience & Tour Circuits',
      desc: 'Years of driving, regional languages & circuit specialization',
      short: 'Experience & Circuits'
    },
    {
      num: 4,
      title: 'Review & Statutory Declaration',
      desc: 'Credentials audit preview & Motor Vehicles Act undertaking',
      short: 'Review & Submit'
    }
  ];

  // ----------------------------------------------------
  // SUCCESS SCREEN
  // ----------------------------------------------------
  if (isSubmitted && createdApplication) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '640px', width: '100%', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '16px', backgroundColor: '#EEF0FD', color: '#2C3480', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid #C7CEFA' }}>
            <ShieldCheck size={38} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.5rem' }}>
            Registration Submitted for Verification
          </h2>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '6px', padding: '0.4rem 0.85rem', marginBottom: '1.25rem' }}>
            <Clock size={15} color="#B45309" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#92400e' }}>
              Status: Submitted for Verification (Application #{createdApplication.id})
            </span>
          </div>

          <p style={{ color: '#64748B', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Thank you, <strong>{createdApplication.fullName}</strong>. Your statutory documents (Driving License, Aadhaar, PAN, Police Clearance, Bank Details, and Medical Fitness) have been received. MAK Admin Operations will verify your credentials before authorizing account activation.
          </p>

          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.75rem', textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Statutory Verification Progress
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {[
                { label: 'Registration', status: 'Completed' },
                { label: 'Docs Uploaded', status: 'Completed' },
                { label: 'Admin Audit', status: 'Active' },
                { label: 'Driver Approved', status: 'Pending' },
                { label: 'Duty Activated', status: 'Pending' }
              ].map((st, i) => (
                <div
                  key={st.label}
                  style={{
                    backgroundColor: st.status === 'Completed' ? '#F0FDF4' : st.status === 'Active' ? '#EEF0FD' : '#FFFFFF',
                    border: `1px solid ${st.status === 'Completed' ? '#BBF7D0' : st.status === 'Active' ? '#C7CEFA' : '#E2E8F0'}`,
                    borderTop: st.status === 'Completed' ? '3px solid #16A34A' : st.status === 'Active' ? '3px solid #2C3480' : '3px solid #CBD5E1',
                    borderRadius: '6px',
                    padding: '0.5rem 0.35rem',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '0.625rem', fontWeight: 800, color: st.status === 'Completed' ? '#15803D' : '#2C3480' }}>
                    STEP {i + 1}
                  </div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#0F172A', marginTop: '0.15rem' }}>
                    {st.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Button
              variant="primary"
              size="md"
              style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', width: '100%', fontWeight: 700, borderRadius: '8px' }}
              rightIcon={<ArrowRight size={16} />}
              onClick={() => navigate('/driver/application-status')}
            >
              Track Verification Status
            </Button>
            <Button
              variant="outline"
              size="md"
              style={{ width: '100%', borderRadius: '8px' }}
              onClick={() => navigate('/driver/login')}
            >
              Return to Driver Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // EXECUTIVE SPLIT-LAYOUT ONBOARDING VIEW
  // ----------------------------------------------------
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '1.5rem 1rem' }}>
      {/* Top Floating App Bar */}
      <header
        style={{
          maxWidth: '1240px',
          margin: '0 auto 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: '#FFFFFF',
          padding: '0.85rem 1.5rem',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Link to="/driver/login">
            <button
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass size={22} color="#2C3480" />
            <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
              MAK TOURS &amp; TRAVELS
            </span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, backgroundColor: '#EEF0FD', color: '#2C3480', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              DRIVER ONBOARDING
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            to="/driver/application-status"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: '#64748B',
              textDecoration: 'none'
            }}
          >
            Track Status &rarr;
          </Link>

          <button
            type="button"
            onClick={handleGoToDriverPortal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: '#EEF0FD',
              border: '1px solid #C7CEFA',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: '#2C3480',
              cursor: 'pointer'
            }}
          >
            Already have an account? Go to Driver Portal &rarr;
          </button>
        </div>
      </header>

      {/* Main Two-Column Split Grid */}
      <main
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 360px) 1fr',
          gap: '1.5rem',
          alignItems: 'start'
        }}
      >
        {/* ========================================================
            LEFT COLUMN: BRANDING, VERTICAL STEPPER & TRUST BADGES
            ======================================================== */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '1.5rem' }}>
          {/* Vertical Step Progress Tracker */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem' }}>
              Registration Steps
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stepsList.map((st) => {
                const isActive = currentStep === st.num;
                const isPast = currentStep > st.num;

                return (
                  <div
                    key={st.num}
                    onClick={() => isPast && setCurrentStep(st.num)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem',
                      cursor: isPast ? 'pointer' : 'default',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      backgroundColor: isActive ? '#F8FAFC' : 'transparent',
                      borderLeft: isActive ? '3px solid #2C3480' : isPast ? '3px solid #16A34A' : '3px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isPast ? '#16A34A' : isActive ? '#2C3480' : '#F1F5F9',
                        color: isPast || isActive ? '#FFFFFF' : '#64748B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        flexShrink: 0
                      }}
                    >
                      {isPast ? <Check size={14} /> : st.num}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: isActive ? 800 : 700, color: isActive ? '#0F172A' : isPast ? '#15803D' : '#64748B' }}>
                        {st.short}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.1rem', lineHeight: 1.3 }}>
                        {st.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Help & Support Assistance Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#EEF0FD', color: '#2C3480', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Headphones size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A' }}>Need Assistance?</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Fleet Helpdesk: <strong style={{ color: '#2C3480' }}>+91 98450 77881</strong>
              </div>
            </div>
          </div>
        </aside>

        {/* ========================================================
            RIGHT COLUMN: SPACIOUS MULTI-STEP REGISTRATION FORM
            ======================================================== */}
        <section
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Step Form Header */}
          <div
            style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#2C3480', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  STEP 0{currentStep} OF 04
                </span>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0F172A', margin: '0.15rem 0 0' }}>
                  {stepsList[currentStep - 1]?.title}
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#EEF0FD', color: '#2C3480', padding: '0.25rem 0.65rem', borderRadius: '4px' }}>
                  {Math.round((currentStep / 4) * 100)}% Completed
                </span>
              </div>
            </div>

            {/* Slim Horizontal Progress Track */}
            <div style={{ width: '100%', height: '4px', backgroundColor: '#F1F5F9', borderRadius: '2px', marginTop: '1rem', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(currentStep / 4) * 100}%`,
                  backgroundColor: '#2C3480',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>

          {/* Form Body Container */}
          <div style={{ padding: '2rem' }}>
            {/* ---------------------------------------------------- */}
            {/* STEP 1: PERSONAL & CONTACT DETAILS                   */}
            {/* ---------------------------------------------------- */}
            {currentStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                {/* Subsection 1.1: Primary Identity */}
                <div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
                    1. Applicant Identity
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1rem' }}>
                    Personal details matching government commercial driving badge credentials.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Full Name (As on Driving License) *
                      </label>
                      <Input
                        placeholder="e.g. Arun Kumar Sundaram"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        error={errors.fullName}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Date of Birth *
                      </label>
                      <Input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        error={errors.dob}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Gender *
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Subsection 1.2: Contact Information */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
                    2. Mobile &amp; Contact Details
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1rem' }}>
                    Active numbers for trip dispatch assignments and passenger notifications.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Primary Mobile Number *
                      </label>
                      <Input
                        placeholder="e.g. 9840122345"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        error={errors.phone}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Alternate Phone Number
                      </label>
                      <Input
                        placeholder="e.g. 9840122346"
                        value={altPhone}
                        onChange={(e) => setAltPhone(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Email Address (Optional)
                      </label>
                      <Input
                        type="email"
                        placeholder="e.g. arun.driver@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Subsection 1.3: Residential Address */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
                    3. Residential Address
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1rem' }}>
                    Permanent domicile location within MAK fleet dispatch territory.
                  </p>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Door No., Street Name, Area *
                    </label>
                    <Input
                      placeholder="No 45, Anna Nagar 2nd Main Road"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      error={errors.address}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        City *
                      </label>
                      <Input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        error={errors.city}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        State *
                      </label>
                      <Input
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Pincode *
                      </label>
                      <Input
                        placeholder="600040"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        error={errors.pincode}
                      />
                    </div>
                  </div>
                </div>

                {/* Subsection 1.4: Emergency Relative */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.25rem' }}>
                    4. Designated Emergency Contact
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B', marginBottom: '1rem' }}>
                    Mandatory for passenger safety protocols and on-road insurance coverage.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Contact Person Name *
                      </label>
                      <Input
                        placeholder="e.g. Sundaram P"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        error={errors.emergencyContactName}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Emergency Phone Number *
                      </label>
                      <Input
                        placeholder="e.g. 9840188990"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        error={errors.emergencyContactPhone}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Relationship *
                      </label>
                      <select
                        value={emergencyContactRelation}
                        onChange={(e) => setEmergencyContactRelation(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Brother">Brother</option>
                        <option value="Son">Son</option>
                        <option value="Friend">Friend</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 2: DEDICATED DRIVER DOCUMENTS & VERIFICATION    */}
            {/* ---------------------------------------------------- */}
            {currentStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                <div style={{ backgroundColor: '#EEF0FD', borderRadius: '8px', border: '1px solid #C7CEFA', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShieldCheck size={24} color="#2C3480" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#2C3480', margin: 0 }}>
                      Statutory Compliance &amp; Verification Uploads
                    </h4>
                    <p style={{ fontSize: '0.8125rem', color: '#1E293B', margin: '0.2rem 0 0' }}>
                      Please provide valid government-issued documents. Supported formats: <strong>PDF, JPG, JPEG, PNG</strong> (max 5MB each). Documents are checked with Sarathi, UIDAI, and Police databases.
                    </p>
                  </div>
                </div>

                {/* E. Passport Photograph */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      E. Passport-Size Photograph
                    </h4>
                    <Badge variant="neutral" size="sm">MANDATORY</Badge>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {photo ? (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={photo}
                          alt="Passport Photo Preview"
                          style={{ width: '90px', height: '90px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #2C3480' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewModalUrl(photo);
                            setPreviewModalTitle('Passport Photograph');
                          }}
                          style={{ position: 'absolute', bottom: '4px', right: '4px', backgroundColor: '#2C3480', color: '#FFF', border: 'none', borderRadius: '4px', padding: '3px', cursor: 'pointer' }}
                          title="Preview full size"
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: '90px', height: '90px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '2px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                        <User size={34} />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <input
                        type="file"
                        ref={photoInputRef}
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, setPhoto, setPhotoFileName, 'Passport Photograph')}
                        style={{ display: 'none' }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        style={{ borderRadius: '6px' }}
                        leftIcon={<UploadCloud size={14} />}
                        onClick={() => photoInputRef.current?.click()}
                      >
                        {photo ? 'Replace Photograph' : 'Upload Photograph'}
                      </Button>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>
                        File: <strong>{photoFileName}</strong> (Plain white background recommended)
                      </div>
                    </div>
                  </div>
                </div>

                {/* A. Commercial Driving License */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      A. Commercial Driving License
                    </h4>
                    <Badge variant="neutral" size="sm">MANDATORY</Badge>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Driving License Number *
                      </label>
                      <Input
                        placeholder="TN-07-2015-0089123"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        error={errors.licenseNumber}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        License Holder Name *
                      </label>
                      <Input
                        placeholder="Name on DL"
                        value={licenseHolderName}
                        onChange={(e) => setLicenseHolderName(e.target.value)}
                        error={errors.licenseHolderName}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        License Type / Class *
                      </label>
                      <select
                        value={licenseType}
                        onChange={(e) => setLicenseType(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
                      >
                        <option value="LMV-TR (Commercial Transport Badge)">LMV-TR (Commercial Transport Badge)</option>
                        <option value="LMV-TR + HMV Heavy Transport">LMV-TR + HMV Heavy Transport</option>
                        <option value="LMV-NT + Tourist Taxi Badge">LMV-NT + Tourist Taxi Badge</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        License Expiry Date *
                      </label>
                      <Input
                        type="date"
                        value={licenseExpiry}
                        onChange={(e) => setLicenseExpiry(e.target.value)}
                        error={errors.licenseExpiry}
                      />
                    </div>
                  </div>

                  {/* Scanned Images: Front & Back */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    <div style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.85rem', backgroundColor: '#F8FAFC', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                        License Front Image *
                      </span>
                      {licenseFrontImage && (
                        <img
                          src={licenseFrontImage}
                          alt="DL Front"
                          style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1', marginBottom: '0.5rem' }}
                        />
                      )}
                      <input
                        type="file"
                        ref={dlFrontInputRef}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, setLicenseFrontImage, setLicenseFrontFileName, 'DL Front Image')}
                        style={{ display: 'none' }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        style={{ borderRadius: '6px', width: '100%' }}
                        leftIcon={<UploadCloud size={14} />}
                        onClick={() => dlFrontInputRef.current?.click()}
                      >
                        {licenseFrontImage ? 'Replace Front Image' : 'Upload Front Image'}
                      </Button>
                      <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '0.25rem' }}>
                        {licenseFrontFileName}
                      </div>
                    </div>

                    <div style={{ border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.85rem', backgroundColor: '#F8FAFC', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                        License Back Image (Badge Endorsement) *
                      </span>
                      {licenseBackImage && (
                        <img
                          src={licenseBackImage}
                          alt="DL Back"
                          style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #CBD5E1', marginBottom: '0.5rem' }}
                        />
                      )}
                      <input
                        type="file"
                        ref={dlBackInputRef}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, setLicenseBackImage, setLicenseBackFileName, 'DL Back Image')}
                        style={{ display: 'none' }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        style={{ borderRadius: '6px', width: '100%' }}
                        leftIcon={<UploadCloud size={14} />}
                        onClick={() => dlBackInputRef.current?.click()}
                      >
                        {licenseBackImage ? 'Replace Back Image' : 'Upload Back Image'}
                      </Button>
                      <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '0.25rem' }}>
                        {licenseBackFileName}
                      </div>
                    </div>
                  </div>
                </div>

                {/* B. Identity & Address Proof */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      B. Identity &amp; Address Proof
                    </h4>
                    <Badge variant="neutral" size="sm">MANDATORY</Badge>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    {/* Aadhaar */}
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                        Aadhaar Card Number (Masked) *
                      </label>
                      <Input
                        placeholder="XXXX-XXXX-4819"
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value)}
                        error={errors.aadhaarNumber}
                      />
                      <input
                        type="file"
                        ref={aadhaarInputRef}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, setAadhaarFile, setAadhaarFileName, 'Aadhaar Card')}
                        style={{ display: 'none' }}
                      />
                      <div style={{ marginTop: '0.5rem' }}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          style={{ borderRadius: '6px', width: '100%' }}
                          leftIcon={<UploadCloud size={14} />}
                          onClick={() => aadhaarInputRef.current?.click()}
                        >
                          {aadhaarFile ? 'Replace Aadhaar' : 'Upload Aadhaar PDF'}
                        </Button>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '0.25rem' }}>
                        {aadhaarFileName}
                      </div>
                    </div>

                    {/* PAN Card */}
                    <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
                        Income Tax PAN Card *
                      </label>
                      <Input
                        placeholder="ABCDE1234F"
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value)}
                        error={errors.panNumber}
                      />
                      <input
                        type="file"
                        ref={panInputRef}
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, setPanFile, setPanFileName, 'PAN Card')}
                        style={{ display: 'none' }}
                      />
                      <div style={{ marginTop: '0.5rem' }}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          style={{ borderRadius: '6px', width: '100%' }}
                          leftIcon={<UploadCloud size={14} />}
                          onClick={() => panInputRef.current?.click()}
                        >
                          {panFile ? 'Replace PAN Card' : 'Upload PAN Card'}
                        </Button>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '0.25rem' }}>
                        {panFileName}
                      </div>
                    </div>
                  </div>

                  {/* Supporting Address Proof Document Type Selector */}
                  <div style={{ backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', padding: '1rem' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                      Current Address Proof (Optional Supporting Document)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                      <select
                        value={addressProofType}
                        onChange={(e) => setAddressProofType(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
                      >
                        <option value="Electricity Bill">Electricity Bill (TNEB / BESCOM)</option>
                        <option value="Water Tax Bill">Municipal Water Tax Bill</option>
                        <option value="Piped Gas Connection Bill">Piped Gas / LPG Bill</option>
                        <option value="Rental Agreement">Rental / Lease Agreement</option>
                        <option value="Ration Card">Family Ration Card</option>
                      </select>

                      <div>
                        <input
                          type="file"
                          ref={addressProofInputRef}
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, setAddressProofFile, setAddressProofFileName, 'Address Proof')}
                          style={{ display: 'none' }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          style={{ borderRadius: '6px', width: '100%' }}
                          leftIcon={<UploadCloud size={14} />}
                          onClick={() => addressProofInputRef.current?.click()}
                        >
                          {addressProofFile ? 'Replace Address Document' : 'Upload Selected Proof'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* C. Police Verification Certificate */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      C. Police Verification Certificate (PVC)
                    </h4>
                    <Badge variant="neutral" size="sm">MANDATORY</Badge>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        PVC Certificate Number *
                      </label>
                      <Input
                        placeholder="PVC-TN-CHN-2025-9941"
                        value={pvcNumber}
                        onChange={(e) => setPvcNumber(e.target.value)}
                        error={errors.pvcNumber}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Issued Date *
                      </label>
                      <Input
                        type="date"
                        value={pvcIssuedDate}
                        onChange={(e) => setPvcIssuedDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Expiry Date *
                      </label>
                      <Input
                        type="date"
                        value={pvcExpiryDate}
                        onChange={(e) => setPvcExpiryDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={pvcInputRef}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, setPvcFile, setPvcFileName, 'Police Verification')}
                      style={{ display: 'none' }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      style={{ borderRadius: '6px' }}
                      leftIcon={<UploadCloud size={14} />}
                      onClick={() => pvcInputRef.current?.click()}
                    >
                      {pvcFile ? 'Replace Police Certificate' : 'Upload PVC Certificate'}
                    </Button>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>
                      File: <strong>{pvcFileName}</strong>
                    </div>
                  </div>
                </div>

                {/* D. Bank Details & Settlement Account */}
                <div style={{ border: '1.5px solid #C7CEFA', borderRadius: '8px', padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building size={18} color="#2C3480" />
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        D. Bank Details &amp; Settlement Account
                      </h4>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: '#EEF0FD', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      <Lock size={12} color="#2C3480" />
                      <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#2C3480' }}>
                        ENCRYPTED &bull; CONFIDENTIAL
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '1rem' }}>
                    Bank information is private and accessible only to authorized accounts personnel for settlements and trip allowances.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Account Holder Name *
                      </label>
                      <Input
                        placeholder="Name in Passbook"
                        value={accountHolderName || fullName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Bank Name *
                      </label>
                      <Input
                        placeholder="e.g. HDFC Bank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Account Number *
                      </label>
                      <Input
                        placeholder="501002394892"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        error={errors.accountNumber}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        IFSC Code *
                      </label>
                      <Input
                        placeholder="HDFC0001245"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        error={errors.ifscCode}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Cancelled Cheque / Passbook Scan *
                    </label>
                    <input
                      type="file"
                      ref={chequeInputRef}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, setCancelledChequeFile, setCancelledChequeFileName, 'Cancelled Cheque')}
                      style={{ display: 'none' }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      style={{ borderRadius: '6px' }}
                      leftIcon={<UploadCloud size={14} />}
                      onClick={() => chequeInputRef.current?.click()}
                    >
                      {cancelledChequeFile ? 'Replace Cheque / Passbook' : 'Upload Cancelled Cheque'}
                    </Button>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>
                      File: <strong>{cancelledChequeFileName}</strong>
                    </div>
                  </div>
                </div>

                {/* F. Annual Medical Fitness Certificate */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.25rem', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <HeartPulse size={18} color="#059669" />
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        F. Annual Medical Fitness &amp; Eye Checkup Certificate (Form 1A)
                      </h4>
                    </div>
                    <Badge variant="neutral" size="sm">MANDATORY</Badge>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Certificate Registration No. *
                      </label>
                      <Input
                        value={medicalDocNumber}
                        onChange={(e) => setMedicalDocNumber(e.target.value)}
                        error={errors.medicalDocNumber}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Examining Doctor / Medical Officer *
                      </label>
                      <Input
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Doctor Council Reg. Number *
                      </label>
                      <Input
                        value={doctorRegNo}
                        onChange={(e) => setDoctorRegNo(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Hospital / Eye Care Clinic *
                      </label>
                      <Input
                        value={clinicHospital}
                        onChange={(e) => setClinicHospital(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Checkup Examination Date *
                      </label>
                      <Input
                        type="date"
                        value={medicalCheckupDate}
                        onChange={(e) => setMedicalCheckupDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Annual Certificate Expiry Date *
                      </label>
                      <Input
                        type="date"
                        value={medicalExpiryDate}
                        onChange={(e) => setMedicalExpiryDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={medicalInputRef}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload(e, setMedicalFile, setMedicalFileName, 'Medical Fitness Certificate')}
                      style={{ display: 'none' }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      style={{ borderRadius: '6px' }}
                      leftIcon={<UploadCloud size={14} />}
                      onClick={() => medicalInputRef.current?.click()}
                    >
                      {medicalFile ? 'Replace Medical Certificate' : 'Upload Medical Certificate (Form 1A)'}
                    </Button>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>
                      File: <strong>{medicalFileName}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 3: EXPERIENCE & REGIONAL PREFERENCES            */}
            {/* ---------------------------------------------------- */}
            {currentStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Years of Commercial Driving Experience *
                    </label>
                    <Input
                      type="number"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Preferred Journey Specialization *
                    </label>
                    <select
                      value={preferredTripType}
                      onChange={(e) => setPreferredTripType(e.target.value)}
                      style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.875rem', backgroundColor: '#FFFFFF' }}
                    >
                      {preferredTripTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Regional Languages */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Regional Languages Spoken *
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {availableLanguages.map((lang) => {
                      const isSelected = languages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '6px',
                            border: isSelected ? '1px solid #2C3480' : '1px solid #CBD5E1',
                            backgroundColor: isSelected ? '#2C3480' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : '#475569',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {isSelected && '✓ '} {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Prior Tourist Operator Experience &amp; Hill Driving Endorsement
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g. 8 years with South India luxury tour operators, hill driving experience in Ooty, Kodaikanal, Munnar..."
                    value={previousExperience}
                    onChange={(e) => setPreviousExperience(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem', fontFamily: 'inherit' }}
                  />
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* STEP 4: REVIEW & STATUTORY DECLARATION               */}
            {/* ---------------------------------------------------- */}
            {currentStep === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ backgroundColor: '#EEF0FD', border: '1px solid #C7CEFA', borderRadius: '8px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <ShieldCheck size={28} color="#2C3480" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#2C3480', margin: 0 }}>
                      Final Statutory Verification Review
                    </h4>
                    <p style={{ fontSize: '0.8125rem', color: '#1E293B', margin: '0.2rem 0 0' }}>
                      Once submitted, your application status becomes <strong>Submitted for Verification</strong>. Admin Operations will verify your credentials with RTO and UIDAI before activating your dispatch duty roster.
                    </p>
                  </div>
                </div>

                {/* Summary Matrix */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.8125rem' }}>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ color: '#64748B', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>APPLICANT</span>
                    <strong style={{ fontSize: '0.9375rem', color: '#0F172A', display: 'block', marginTop: '0.15rem' }}>{fullName}</strong>
                    <div style={{ color: '#475569', marginTop: '0.2rem' }}>DOB: {dob} ({gender})</div>
                    <div style={{ color: '#475569' }}>Phone: {phone}</div>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ color: '#64748B', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>DRIVING LICENSE</span>
                    <strong style={{ fontSize: '0.9375rem', color: '#2C3480', fontFamily: 'monospace', display: 'block', marginTop: '0.15rem' }}>{licenseNumber}</strong>
                    <div style={{ color: '#475569', marginTop: '0.2rem' }}>Class: {licenseType}</div>
                    <div style={{ color: '#16A34A', fontWeight: 600 }}>Expires: {licenseExpiry}</div>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ color: '#64748B', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>RESIDENTIAL BASE</span>
                    <strong style={{ color: '#0F172A', display: 'block', marginTop: '0.15rem' }}>{city}, {state}</strong>
                    <div style={{ color: '#475569', marginTop: '0.2rem' }}>{address} - {pincode}</div>
                    <div style={{ color: '#64748B', marginTop: '0.2rem' }}>Emergency: {emergencyContactName} ({emergencyContactPhone})</div>
                  </div>

                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ color: '#64748B', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase' }}>BANK &amp; SETTLEMENT</span>
                    <strong style={{ color: '#0F172A', display: 'block', marginTop: '0.15rem' }}>{bankName}</strong>
                    <div style={{ color: '#475569', marginTop: '0.2rem' }}>A/C: {accountNumber}</div>
                    <div style={{ color: '#475569' }}>IFSC: {ifscCode}</div>
                  </div>
                </div>

                {/* Statutory Documents Attached Summary Strip */}
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem 1.25rem' }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                    Statutory Documents Attached for Verification
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {[
                      { title: 'Driving License', file: licenseFrontFileName, status: 'Attached' },
                      { title: 'Aadhaar Card', file: aadhaarFileName, status: 'Attached' },
                      { title: 'PAN Card', file: panFileName, status: 'Attached' },
                      { title: 'Police Certificate', file: pvcFileName, status: 'Attached' },
                      { title: 'Bank Cheque', file: cancelledChequeFileName, status: 'Attached' },
                      { title: 'Passport Photo', file: photoFileName, status: 'Attached' },
                      { title: 'Medical Certificate', file: medicalFileName, status: 'Attached' }
                    ].map((d) => (
                      <div key={d.title} style={{ backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.65rem 0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A' }}>{d.title}</span>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#15803D' }}>✓ {d.status}</span>
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '0.15rem' }}>
                          {d.file}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Declaration Checkbox */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer', fontSize: '0.8125rem', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      style={{ marginTop: '0.2rem' }}
                    />
                    <span>
                      I hereby solemnly declare that the driving license, identity proofs, police clearance, and medical fitness certificates submitted are authentic and legally valid under the Motor Vehicles Act. I agree to MAK Tours &amp; Travels zero-alcohol, safety, and passenger courtesy compliance policies.
                    </span>
                  </label>
                  {errors.terms && (
                    <p style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.35rem' }}>{errors.terms}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Navigation Footer */}
          <div
            style={{
              padding: '1.25rem 2rem',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#FAFAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  leftIcon={<ArrowLeft size={16} />}
                  style={{ borderRadius: '8px' }}
                >
                  Previous Step
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ borderRadius: '8px' }}
                  onClick={() => navigate('/driver/login')}
                >
                  Cancel Registration
                </Button>
              )}

              <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={handleGoToDriverPortal}
                  style={{ fontWeight: 700, color: '#2C3480', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Go to Driver Portal &rarr;
                </button>
              </span>
            </div>

            {currentStep < 4 ? (
              <Button
                type="button"
                variant="primary"
                style={{ backgroundColor: '#2C3480', borderColor: '#2C3480', borderRadius: '8px', fontWeight: 700, padding: '0.55rem 1.5rem' }}
                onClick={handleNext}
                rightIcon={<ArrowRight size={16} />}
              >
                Continue to {stepsList[currentStep]?.short} &rarr;
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                style={{ backgroundColor: '#10B981', borderColor: '#10B981', fontWeight: 800, borderRadius: '8px', padding: '0.55rem 1.75rem' }}
                onClick={handleSubmit}
                rightIcon={<Check size={16} />}
              >
                Submit Registration to Admin
              </Button>
            )}
          </div>
        </section>
      </main>

      {/* High-Res Document Preview Modal */}
      {previewModalUrl && (
        <Modal
          isOpen={Boolean(previewModalUrl)}
          onClose={() => setPreviewModalUrl(null)}
          title={previewModalTitle}
          size="md"
        >
          <div style={{ textAlign: 'center' }}>
            <img src={previewModalUrl} alt={previewModalTitle} style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px' }} />
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DriverRegister;
