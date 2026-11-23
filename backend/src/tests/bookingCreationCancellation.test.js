import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { bookingController } from '../controllers/bookingController.js';

async function run() {
  console.log('--- Starting Booking & Cancellation Verification ---');
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  const tenantId = 'mak-tours';

  // Seed 1 Vehicle and 1 Driver
  await Vehicle.create({
    tenantId,
    id: 'veh-001',
    regNo: 'TN 01 AB 5002',
    name: 'Kia Carnival',
    model: 'Carnival',
    brand: 'Kia',
    status: 'Available',
    ownership: 'Vendor Attached',
    vendorId: 'vnd-101',
    vendorName: 'Apex Fleet Partners',
    vendorPayoutPercent: 85
  });

  await Driver.create({
    tenantId,
    id: 'drv-001',
    driverBadgeId: 'DRV-001',
    fullName: 'Ramesh Kumar',
    name: 'Ramesh Kumar',
    phone: '9845012345',
    dutyStatus: 'Available'
  });

  // 1. Create Booking with Vehicle and Driver
  const mockReqCreate = {
    tenantId,
    user: { tenantId, role: 'admin' },
    body: {
      id: 'BK-2026-099',
      refId: 'MAK-2026-099',
      bookingNumber: 'MAK-2026-099',
      customerName: 'Test Traveler',
      customerPhone: '9876543210',
      bookingCategory: 'Round Trip',
      pickupLocation: 'Chennai Airport',
      destination: 'Mahabalipuram',
      travelDate: '2026-11-20',
      returnDate: '2026-11-22',
      pricing: 15000,
      advancePaid: 5000,
      paymentOption: 'partial_advance',
      vehicleId: 'veh-001',
      vehicleName: 'Kia Carnival (TN 01 AB 5002)',
      assignedVehicle: {
        id: 'veh-001',
        brand: 'Kia',
        model: 'Carnival',
        regNo: 'TN 01 AB 5002',
        ownership: 'Vendor Attached',
        vendorId: 'vnd-101',
        vendorName: 'Apex Fleet Partners',
        vendorPayoutPercent: 85,
        vendorPayableAmount: 12750
      },
      driverId: 'drv-001',
      driverName: 'Ramesh Kumar',
      assignedDriver: {
        id: 'drv-001',
        name: 'Ramesh Kumar',
        fullName: 'Ramesh Kumar',
        phone: '9845012345'
      },
      driverCompensationAmount: 1500,
      driverBaseTripPay: 1500,
      vendorPayoutPercent: 85,
      vendorPayableAmount: 12750
    }
  };

  let createdData = null;
  const mockResCreate = {
    status: (code) => ({
      json: (payload) => {
        createdData = payload.data;
        return payload;
      }
    })
  };

  await bookingController.create(mockReqCreate, mockResCreate, (err) => { if (err) throw err; });

  console.log('✅ Created Booking ID:', createdData.id, '| Number:', createdData.bookingNumber);
  console.log('   Assigned Vehicle:', createdData.assignedVehicle?.model, createdData.assignedVehicle?.regNo);
  console.log('   Assigned Driver:', createdData.assignedDriver?.name);
  console.log('   Status:', createdData.status, '| BookingStatus:', createdData.bookingStatus);
  console.log('   Vendor Payable:', createdData.vendorPayableAmount);

  if (!createdData.assignedVehicle || !createdData.assignedDriver) {
    throw new Error('Vehicle or Driver was not preserved upon creation!');
  }

  // Verify Vehicle is marked Reserved
  const vehAfter = await Vehicle.findOne({ id: 'veh-001' });
  console.log('   Vehicle status in fleet:', vehAfter.status);
  if (vehAfter.status !== 'Reserved') throw new Error('Vehicle was not marked Reserved');

  // Verify Driver is marked Assigned
  const drvAfter = await Driver.findOne({ id: 'drv-001' });
  console.log('   Driver duty status in roster:', drvAfter.dutyStatus);
  if (drvAfter.dutyStatus !== 'Assigned') throw new Error('Driver was not marked Assigned');

  // 2. Test lookup by BK- prefix and MAK- prefix
  let fetchedByBK = null;
  const mockResGetBK = {
    status: () => ({
      json: (payload) => { fetchedByBK = payload.data; }
    })
  };
  await bookingController.getById({ params: { id: 'BK-2026-099' }, tenantId, user: { tenantId } }, mockResGetBK, (e) => { if (e) throw e; });
  console.log('✅ Lookup by BK-2026-099 succeeded:', fetchedByBK?.customerName);

  let fetchedByMAK = null;
  const mockResGetMAK = {
    status: () => ({
      json: (payload) => { fetchedByMAK = payload.data; }
    })
  };
  await bookingController.getById({ params: { id: 'MAK-2026-099' }, tenantId, user: { tenantId } }, mockResGetMAK, (e) => { if (e) throw e; });
  console.log('✅ Lookup by MAK-2026-099 succeeded:', fetchedByMAK?.customerName);

  if (!fetchedByBK || !fetchedByMAK) throw new Error('Cross-prefix lookup failed');

  // 3. Test Cancellation using BK- prefix
  let cancelledData = null;
  const mockResCancel = {
    status: () => ({
      json: (payload) => { cancelledData = payload.data; }
    })
  };
  await bookingController.cancel(
    { params: { id: 'BK-2026-099' }, body: { reason: 'Passenger cancelled flight' }, tenantId, user: { tenantId } },
    mockResCancel,
    (e) => { if (e) throw e; }
  );

  console.log('✅ Cancelled Booking Status:', cancelledData.bookingStatus);
  if (cancelledData.bookingStatus !== 'Cancelled') throw new Error('Booking was not cancelled');

  // Verify Vehicle and Driver were released back to Available
  const vehAfterCancel = await Vehicle.findOne({ id: 'veh-001' });
  const drvAfterCancel = await Driver.findOne({ id: 'drv-001' });
  console.log('   Vehicle status after cancel:', vehAfterCancel.status);
  console.log('   Driver duty status after cancel:', drvAfterCancel.dutyStatus);

  if (vehAfterCancel.status !== 'Available') throw new Error('Vehicle was not released to Available');
  if (drvAfterCancel.dutyStatus !== 'Available') throw new Error('Driver was not released to Available');

  await mongoose.disconnect();
  await mongod.stop();
  console.log('🎉 ALL BOOKING CREATION, ASSIGNMENT & CANCELLATION TESTS PASSED CLEANLY!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
