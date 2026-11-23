// MAK Tours & Travels ERP - Professional PDF Generation Service
import PDFDocument from 'pdfkit';

/**
 * Format date as DD-MM-YYYY
 */
function formatDmy(dateVal) {
  if (!dateVal) return '—';
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    const dmy = trimmed.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
    if (dmy) return `${dmy[1]}-${dmy[2]}-${dmy[3]}`;
    const ymd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymd) return `${String(ymd[3]).padStart(2, '0')}-${String(ymd[2]).padStart(2, '0')}-${ymd[1]}`;
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format currency amount into clean text without Unicode glitches
 */
function formatRs(amount) {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Convert number to words in Indian numbering system
 */
function numberToWords(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num <= 0) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 === 0 ? '' : 'and ' + inWords(n % 100));
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 === 0 ? '' : inWords(n % 1000));
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 === 0 ? '' : inWords(n % 100000));
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 === 0 ? '' : inWords(n % 10000000));
  }
  return (inWords(num).trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

/**
 * Generate Invoice PDF stream / buffer with complete trip, fleet, driver & tax details
 * @param {Object} invoice - Invoice document or object
 * @param {Object} company - Company document or snapshot
 * @returns {Promise<Buffer>}
 */
export function generateInvoicePdfBuffer(invoice, company = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 35, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const branding = invoice.brandingSnapshot || {};
      const companyName = branding.companyName || company.name || company.legalName || 'MAK Tours & Travels India Pvt. Ltd.';
      const companyAddress = branding.address || company.address || '14/2 GST Road, Alandur, Chennai, Tamil Nadu - 600016';
      const companyGstin = branding.gstin || company.gstin || '33AABCM9821K1ZZ';
      const companyPan = branding.pan || company.pan || 'AABCM1234F';
      const companyPhone = branding.phone || company.phone || '+91 98401 11000';
      const companyEmail = branding.email || company.email || 'accounts@maktours.com';

      const trip = invoice.tripDetails || {};
      const cust = invoice.customer || {};

      const custName = cust.name || invoice.customerName || 'Valued Guest';
      const custPhone = cust.phone || invoice.customerPhone || 'Not specified';
      const custEmail = cust.email || invoice.customerEmail || 'Not specified';
      const custAddress = cust.address || trip.pickupLocation || trip.fromLocation || 'Chennai, Tamil Nadu';
      const custGstin = cust.gstin || 'Consumer / Unregistered (B2C)';

      const bookingRef = invoice.bookingRef || trip.bookingId || 'MAK-BOOKING';
      const invoiceNo = invoice.invoiceNumber || `INV-${bookingRef}`;
      const invoiceDateFormatted = formatDmy(invoice.invoiceDate || new Date());
      const journeyDateFormatted = formatDmy(trip.journeyDate || invoice.invoiceDate || new Date());
      const returnDateFormatted = trip.returnDate ? formatDmy(trip.returnDate) : '';

      const tripCategory = trip.bookingType || trip.tripType || 'Round Trip';
      const routeText = trip.route || `${trip.fromLocation || 'Origin'} to ${trip.toLocation || trip.destination || 'Destination'}`;
      const vehicleName = trip.vehicleModel || 'Commercial Fleet Vehicle';
      const vehicleReg = trip.vehicleRegNo || 'TN 01 AB 4002';
      const driverName = trip.driverName || 'Commercial Fleet Driver';
      const driverPhone = trip.driverPhone || '+91 98401 22334';
      const passengerCount = trip.passengers || 4;

      const startOdo = Number(trip.startOdometer) || 0;
      const endOdo = Number(trip.endOdometer) || 0;
      const distKm = Number(trip.distanceTravelled) || (endOdo > startOdo ? endOdo - startOdo : 0);
      const rateKm = Number(trip.ratePerKm) || 15;

      const totalAmount = Number(invoice.amount || trip.totalFare || 0);
      const amountPaid = Number(invoice.amountPaid || trip.advancePaid || 0);
      const balanceDue = Number(invoice.balanceDue !== undefined ? invoice.balanceDue : Math.max(0, totalAmount - amountPaid));

      // 1. TOP NAVY ACCENT STRIPE
      doc.rect(35, 25, 525, 3).fill('#2C3480');

      // 2. HEADER: Company on Left, TAX INVOICE details on Right
      doc.fillColor('#090d16').fontSize(15).font('Helvetica-Bold').text(companyName.toUpperCase(), 35, 36);
      doc.fontSize(8).font('Helvetica-Oblique').fillColor('#475569').text('Authorized Commercial Tourist Cab Operator & Outstation Holiday Services', 35, 53);
      doc.fontSize(8).font('Helvetica').fillColor('#334155').text(companyAddress, 35, 65);
      doc.font('Helvetica-Bold').fillColor('#1e293b').text(`GSTIN: ${companyGstin}  |  PAN: ${companyPan}  |  SAC Code: 996601`, 35, 77);
      doc.font('Helvetica').fillColor('#475569').text(`Phone: ${companyPhone}  |  Email: ${companyEmail}  |  Web: www.maktours.com`, 35, 89);

      // Top Right: TAX INVOICE
      doc.fillColor('#0284c7').fontSize(18).font('Helvetica-Bold').text('TAX INVOICE', 360, 36, { align: 'right', width: 200 });
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#0f172a').text(`Invoice No: ${invoiceNo}`, 360, 58, { align: 'right', width: 200 });
      doc.fontSize(8).font('Helvetica').fillColor('#334155').text(`Date: ${invoiceDateFormatted}`, 360, 71, { align: 'right', width: 200 });
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#2C3480').text(`Booking Ref: #${bookingRef}`, 360, 83, { align: 'right', width: 200 });
      doc.fontSize(7.5).font('Helvetica').fillColor('#64748b').text('Place of Supply: Tamil Nadu (Code 33)', 360, 95, { align: 'right', width: 200 });

      // Horizontal Divider
      doc.moveTo(35, 108).lineTo(560, 108).strokeColor('#cbd5e1').lineWidth(0.75).stroke();

      // 3. TWO-COLUMN INFORMATIONAL PANELS (Y: 115 to 205, height: 90pt)
      const colWidth = 257;
      const colHeight = 88;
      const boxY = 115;

      // Left Box: BILLED TO (CUSTOMER)
      doc.roundedRect(35, boxY, colWidth, colHeight, 5).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.roundedRect(35, boxY, colWidth, 18, 4).fill('#eef2f6');
      doc.fillColor('#1e293b').fontSize(7.5).font('Helvetica-Bold').text('BILLED TO (CUSTOMER DETAILS)', 43, boxY + 5);

      doc.fillColor('#090d16').fontSize(9).font('Helvetica-Bold').text(custName, 43, boxY + 23);
      doc.fillColor('#334155').fontSize(7.5).font('Helvetica');
      doc.text(`Mobile: ${custPhone}`, 43, boxY + 36);
      doc.text(`Email: ${custEmail}`, 43, boxY + 47);
      doc.text(`Pickup: ${custAddress}`, 43, boxY + 58, { width: 240, height: 16 });
      doc.fillColor('#64748b').text(`GSTIN: ${custGstin}`, 43, boxY + 72);

      // Right Box: TRIP & FLEET MANIFEST
      const rightColX = 303;
      doc.roundedRect(rightColX, boxY, colWidth, colHeight, 5).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.roundedRect(rightColX, boxY, colWidth, 18, 4).fill('#eef2f6');
      doc.fillColor('#1e293b').fontSize(7.5).font('Helvetica-Bold').text('JOURNEY & FLEET MANIFEST', rightColX + 8, boxY + 5);

      // Payment Status Tag
      const statusText = (invoice.status || (balanceDue <= 0 ? 'PAID' : amountPaid > 0 ? 'PARTIALLY PAID' : 'UNPAID')).toUpperCase();
      const statusBg = statusText === 'PAID' ? '#15803d' : statusText === 'PARTIALLY PAID' ? '#d97706' : '#dc2626';
      doc.fillColor(statusBg).fontSize(7.5).font('Helvetica-Bold').text(`[ ${statusText} ]`, rightColX + 180, boxY + 5, { align: 'right', width: 68 });

      doc.fillColor('#2C3480').fontSize(8.5).font('Helvetica-Bold').text(`Category: ${tripCategory}`, rightColX + 8, boxY + 23);
      doc.fillColor('#090d16').fontSize(7.5).font('Helvetica-Bold').text(`Route: ${routeText}`, rightColX + 8, boxY + 35, { width: 240, height: 12 });
      doc.fillColor('#334155').fontSize(7.5).font('Helvetica');
      const timeStr = trip.journeyTime ? ` at ${trip.journeyTime}` : '';
      const returnStr = returnDateFormatted ? ` | Return: ${returnDateFormatted}` : '';
      doc.text(`Departure: ${journeyDateFormatted}${timeStr}${returnStr}`, rightColX + 8, boxY + 47);
      doc.text(`Vehicle: ${vehicleName} [${vehicleReg}]`, rightColX + 8, boxY + 59);
      doc.text(`Driver: ${driverName} (${driverPhone})`, rightColX + 8, boxY + 71);

      // 4. TRIP TELEMATICS & AUDIT STRIP (Y: 209 to 239, height: 30pt)
      const teleY = 209;
      doc.roundedRect(35, teleY, 525, 30, 4).fillAndStroke('#f1f5f9', '#cbd5e1');
      const cellW = 525 / 4;

      // Col 1: Starting Odometer
      doc.fillColor('#64748b').fontSize(6.5).font('Helvetica-Bold').text('STARTING ODOMETER', 40, teleY + 4);
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text(startOdo > 0 ? `${startOdo.toLocaleString('en-IN')} km` : 'Depot Verified', 40, teleY + 15);

      // Col 2: Ending Odometer
      doc.fillColor('#64748b').fontSize(6.5).font('Helvetica-Bold').text('ENDING ODOMETER', 35 + cellW + 5, teleY + 4);
      doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text(endOdo > 0 ? `${endOdo.toLocaleString('en-IN')} km` : 'Concluded Drop', 35 + cellW + 5, teleY + 15);

      // Col 3: Distance Travelled
      doc.fillColor('#64748b').fontSize(6.5).font('Helvetica-Bold').text('TOTAL BILLED DISTANCE', 35 + (cellW * 2) + 5, teleY + 4);
      doc.fillColor('#15803d').fontSize(8.5).font('Helvetica-Bold').text(distKm > 0 ? `${distKm.toLocaleString('en-IN')} km` : 'Package Standard', 35 + (cellW * 2) + 5, teleY + 15);

      // Col 4: Tariff Per Km
      doc.fillColor('#64748b').fontSize(6.5).font('Helvetica-Bold').text('TELEMATICS TARIFF', 35 + (cellW * 3) + 5, teleY + 4);
      doc.fillColor('#2563eb').fontSize(8.5).font('Helvetica-Bold').text(rateKm > 0 ? `Rs. ${rateKm.toFixed(2)} / km` : 'Fixed Package', 35 + (cellW * 3) + 5, teleY + 15);

      // 5. LINE ITEMS TABLE (Y: 245 to ~340)
      const tableTop = 245;
      doc.roundedRect(35, tableTop, 525, 20, 3).fill('#2C3480');
      doc.fillColor('#ffffff').fontSize(7.5).font('Helvetica-Bold');
      doc.text('#', 42, tableTop + 6);
      doc.text('SERVICE / ITEM DESCRIPTION', 65, tableTop + 6);
      doc.text('SAC CODE', 315, tableTop + 6, { align: 'center', width: 55 });
      doc.text('QTY', 375, tableTop + 6, { align: 'right', width: 30 });
      doc.text('RATE (Rs.)', 415, tableTop + 6, { align: 'right', width: 65 });
      doc.text('AMOUNT (Rs.)', 485, tableTop + 6, { align: 'right', width: 70 });

      // Table Rows
      let curY = tableTop + 20;
      const items = Array.isArray(invoice.lineItems) && invoice.lineItems.length > 0
        ? invoice.lineItems
        : [
            {
              description: `${tripCategory} Commercial Passenger Transit: ${routeText}` + (vehicleName ? ` (${vehicleName})` : ''),
              sacCode: '996601',
              quantity: 1,
              rate: totalAmount,
              amount: totalAmount
            }
          ];

      items.forEach((item, index) => {
        const rowH = 18;
        if (index % 2 === 1) {
          doc.rect(35, curY, 525, rowH).fill('#f8fafc');
        }
        doc.font('Helvetica').fontSize(7.5).fillColor('#0f172a');
        doc.text(String(index + 1), 42, curY + 5);
        doc.text(item.description || 'Passenger Transport Service', 65, curY + 5, { width: 245, height: 14 });
        doc.fillColor('#475569').text(item.sacCode || '996601', 315, curY + 5, { align: 'center', width: 55 });
        doc.fillColor('#0f172a').text(String(item.quantity || 1), 375, curY + 5, { align: 'right', width: 30 });
        doc.text(Number(item.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 415, curY + 5, { align: 'right', width: 65 });
        doc.font('Helvetica-Bold').text(Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 485, curY + 5, { align: 'right', width: 70 });
        curY += rowH;
      });

      doc.moveTo(35, curY).lineTo(560, curY).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
      curY += 8;

      // 6. BANK DETAILS (LEFT) & FINANCIAL SUMMARY (RIGHT) (Y: curY to curY + 115)
      const summaryStartY = curY;
      const bankW = 257;

      // Left Box: BANK REMITTANCE DETAILS
      doc.roundedRect(35, summaryStartY, bankW, 112, 5).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.roundedRect(35, summaryStartY, bankW, 16, 4).fill('#eef2f6');
      doc.fillColor('#1e293b').fontSize(7.5).font('Helvetica-Bold').text('BANK DETAILS FOR DIRECT REMITTANCE', 43, summaryStartY + 4);

      doc.fontSize(7.5).font('Helvetica').fillColor('#334155');
      doc.text('Beneficiary: MAK Tours & Travels India Pvt. Ltd.', 43, summaryStartY + 21);
      doc.text('Bank Name: HDFC Bank  |  A/C Type: Current Account', 43, summaryStartY + 33);
      doc.font('Helvetica-Bold').fillColor('#090d16').text('Account No: 50200088991122', 43, summaryStartY + 45);
      doc.text('IFSC Code: HDFC0001234', 43, summaryStartY + 57);
      doc.font('Helvetica').fillColor('#334155').text('Branch: Guindy Industrial Estate, Chennai', 43, summaryStartY + 69);
      doc.font('Helvetica-Bold').fillColor('#0284c7').text('UPI VPA ID: maktours@hdfcbank', 43, summaryStartY + 81);
      doc.fontSize(7).font('Helvetica-Oblique').fillColor('#64748b').text('Accepted: Google Pay, PhonePe, Paytm, BHIM & NetBanking.', 43, summaryStartY + 95);

      // Right Box: FINANCIAL BREAKDOWN
      const sumLeft = 303;
      const sumW = 257;
      let sy = summaryStartY;

      doc.font('Helvetica').fontSize(8).fillColor('#475569');
      doc.text('Subtotal (Gross Fare):', sumLeft + 10, sy);
      doc.font('Helvetica-Bold').fillColor('#0f172a').text(formatRs(invoice.subtotal || totalAmount), sumLeft + 130, sy, { align: 'right', width: 115 });
      sy += 14;

      if (Number(invoice.discount || 0) > 0) {
        doc.font('Helvetica').fillColor('#16a34a').text('Discount:', sumLeft + 10, sy);
        doc.font('Helvetica-Bold').text(`- ${formatRs(invoice.discount)}`, sumLeft + 130, sy, { align: 'right', width: 115 });
        sy += 14;
      }

      // GST Split Breakdown
      const cgst = Number(invoice.cgstAmount || 0);
      const sgst = Number(invoice.sgstAmount || 0);
      if (cgst > 0 || sgst > 0) {
        doc.font('Helvetica').fillColor('#475569').text('CGST (2.5%):', sumLeft + 10, sy);
        doc.font('Helvetica-Bold').fillColor('#0f172a').text(formatRs(cgst), sumLeft + 130, sy, { align: 'right', width: 115 });
        sy += 13;
        doc.font('Helvetica').fillColor('#475569').text('SGST (2.5%):', sumLeft + 10, sy);
        doc.font('Helvetica-Bold').fillColor('#0f172a').text(formatRs(sgst), sumLeft + 130, sy, { align: 'right', width: 115 });
        sy += 13;
      } else {
        doc.font('Helvetica').fontSize(7.5).fillColor('#64748b').text('GST Tax (5% SAC 996601): Included in Tariff', sumLeft + 10, sy);
        sy += 13;
      }

      // Highlighted Total Amount Bar
      doc.rect(sumLeft, sy, sumW, 20).fill('#0284c7');
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#ffffff');
      doc.text('TOTAL AMOUNT:', sumLeft + 10, sy + 5);
      doc.text(formatRs(totalAmount), sumLeft + 120, sy + 5, { align: 'right', width: 125 });
      sy += 25;

      // Advance Paid
      doc.font('Helvetica').fontSize(8).fillColor('#15803d').text('Less Advance Received:', sumLeft + 10, sy);
      doc.font('Helvetica-Bold').text(`- ${formatRs(amountPaid)}`, sumLeft + 130, sy, { align: 'right', width: 115 });
      sy += 14;

      // Net Balance Due
      const balClr = balanceDue > 0 ? '#dc2626' : '#15803d';
      doc.font('Helvetica-Bold').fontSize(9).fillColor(balClr).text('Net Balance Due:', sumLeft + 10, sy);
      doc.text(formatRs(balanceDue), sumLeft + 130, sy, { align: 'right', width: 115 });
      sy += 16;

      // Amount in Words
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#475569').text('Amount in Words:', sumLeft + 10, sy);
      doc.font('Helvetica-Oblique').fontSize(7).fillColor('#090d16').text(numberToWords(totalAmount), sumLeft + 10, sy + 10, { width: 235 });

      curY = summaryStartY + 118;

      // 7. TERMS & CONDITIONS (Y: curY to curY + 68)
      doc.roundedRect(35, curY, 525, 66, 4).fillAndStroke('#ffffff', '#e2e8f0');
      doc.fillColor('#1e293b').fontSize(7.5).font('Helvetica-Bold').text('COMMERCIAL TERMS & PASSENGER CODE OF CONDUCT', 43, curY + 5);

      const terms = [
        '1. Toll plaza charges, state entry permits, and airport/railway parking are charged as per actual FASTag logs unless bundled.',
        '2. Standard outstation travel duty is 06:00 AM to 10:00 PM; driver night batta applies for transit between 10:00 PM and 06:00 AM.',
        '3. Kilometers and operational hours are calculated based on garage-to-garage or agreed pickup point manifest.',
        '4. Air conditioning will be temporarily switched off while vehicle is parked/idle or on steep hill ascents for vehicle safety.',
        '5. Invoices are strictly payable upon completion of journey. All legal disputes are subject exclusively to Chennai jurisdiction.'
      ];

      let termY = curY + 17;
      doc.font('Helvetica').fontSize(6.5).fillColor('#475569');
      terms.forEach((t) => {
        doc.text(t, 43, termY, { width: 510 });
        termY += 9.5;
      });

      curY += 72;

      // 8. SIGNATURES & AUTHORIZATION (Y: curY to curY + 45)
      doc.font('Helvetica').fontSize(7).fillColor('#94a3b8');
      doc.text('.........................................................................................', 45, curY + 16);
      doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(7.5).text('Customer / Passenger Signature & Date', 45, curY + 28);
      doc.font('Helvetica').fontSize(6.5).fillColor('#64748b').text('Name: ' + custName, 45, curY + 38);

      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1e293b').text('For MAK Tours & Travels India Pvt. Ltd.', 340, curY + 4, { align: 'right', width: 215 });
      doc.font('Helvetica').fontSize(6.5).fillColor('#0284c7').text('[Digitally Authorized by Operations Center]', 340, curY + 16, { align: 'right', width: 215 });
      doc.fillColor('#94a3b8').text('.........................................................................................', 340, curY + 26, { align: 'right', width: 215 });
      doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(7.5).text('Authorized Signatory (Operations & Accounts)', 340, curY + 36, { align: 'right', width: 215 });

      // 9. FOOTER
      doc.font('Helvetica').fontSize(6.5).fillColor('#94a3b8').text('This is an official computer-generated Tax Invoice issued under Rule 46 of the CGST Rules, 2017. Regd Office: 14/2 GST Road, Alandur, Chennai.', 35, 785, { align: 'center', width: 525 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate Financial Report PDF Buffer
 */
export function generateReportPdfBuffer(title, columns, rows, summary = null, company = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: columns.length > 5 ? 'landscape' : 'portrait' });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const pageWidth = doc.page.width;
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);

      // Title & Header
      doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text(company.name || 'MAK Tours & Travels', margin, 35);
      doc.fillColor('#2563eb').fontSize(12).font('Helvetica-Bold').text(title.toUpperCase(), margin, 55);
      doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(`Generated: ${new Date().toLocaleString('en-IN')} | Accounting Engine`, margin, 70);

      doc.moveTo(margin, 85).lineTo(pageWidth - margin, 85).strokeColor('#cbd5e1').stroke();

      // Table Header
      let y = 95;
      const colWidth = contentWidth / columns.length;
      doc.rect(margin, y, contentWidth, 20).fill('#f1f5f9');
      doc.fillColor('#1e293b').fontSize(8).font('Helvetica-Bold');
      columns.forEach((col, i) => {
        doc.text(col.header, margin + (i * colWidth) + 4, y + 6, { width: colWidth - 8, align: col.isNumber ? 'right' : 'left' });
      });
      y += 20;

      // Table Rows
      doc.font('Helvetica').fontSize(8).fillColor('#334155');
      rows.forEach((row, idx) => {
        if (y > doc.page.height - 60) {
          doc.addPage();
          y = 40;
        }
        if (idx % 2 === 1) {
          doc.rect(margin, y, contentWidth, 18).fill('#f8fafc');
        }
        doc.fillColor('#334155');
        columns.forEach((col, i) => {
          let val = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—';
          if (typeof val === 'string' && /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(val)) {
            val = formatDmy(val);
          }
          doc.text(val, margin + (i * colWidth) + 4, y + 5, { width: colWidth - 8, align: col.isNumber ? 'right' : 'left' });
        });
        y += 18;
      });

      // Summary
      if (summary) {
        doc.rect(margin, y, contentWidth, 20).fill('#e2e8f0');
        doc.fillColor('#0f172a').font('Helvetica-Bold');
        columns.forEach((col, i) => {
          const val = i === 0 ? 'TOTAL' : (summary[col.key] !== undefined ? String(summary[col.key]) : '');
          doc.text(val, margin + (i * colWidth) + 4, y + 6, { width: colWidth - 8, align: col.isNumber ? 'right' : 'left' });
        });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export default {
  generateInvoicePdfBuffer,
  generateReportPdfBuffer
};