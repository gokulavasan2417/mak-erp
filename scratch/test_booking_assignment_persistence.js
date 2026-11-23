import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

import { Booking } from '../backend/src/models/Booking.js';
import { Vehicle } from '../backend/src/models/Vehicle.js';
import { Driver } from '../backend/src/models/Driver.js';
import { bookingController } from '../backend/src/controllers/bookingController.js';

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI is not set in backend/.env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    // 1. Locate or create booking MAK-753587
    let testBooking = await Booking.findOne({
      $or: [{ refId: 'MAK-753587' }, { bookingNumber: 'MAK-753587' }]
    });

    if (!testBooking) {
      console.log('Creating test booking MAK-753587...');
      testBooking = await Booking.create({
        refId: 'MAK-753587',
        bookingNumber: 'MAK-753587',
        customerName: 'Test Customer',
        customerPhone: '9840111222',
        fromLocation: 'Chennai',
        pickupLocation: 'Chennai',
        toLocation: 'Pondicherry',
        destination: 'Pondicherry',
        journeyDate: '2026-11-15',
        travelDate: '2026-11-15',
        pricing: 8500,
        fare: 8500,
        totalFare: 8500,
        totalAmount: 8500,
        advancePaid: 2500,
        balanceAmount: 6000,
        balanceDue: 6000,
        bookingType: 'Round Trip',
        bookingCategory: 'Round Trip',
        bookingStatus: 'Confirmed'
      });
    }

    console.log('Test booking found/created:', testBooking.refId || testBooking.bookingNumber);

    // 2. Locate an existing vehicle and driver
    const vehicle = await Vehicle.findOne();
    const driver = await Driver.findOne();

    console.log('Sample vehicle found:', vehicle?.model, vehicle?.regNo);
    console.log('Sample driver found:', driver?.fullName || driver?.name, driver?.id);

    const vehicleId = vehicle?.id || vehicle?.regNo || 'VEH-105';
    const driverId = driver?.id || 'DRV-004';

    // 3. Simulate Admin assigning vehicle & driver via bookingController.assign
    const mockReq = {
      params: { id: testBooking.refId },
      body: {
        driverId,
        driverName: driver?.fullName || driver?.name || 'Anandh R',
        driverPhone: driver?.phone || '9840111007',
        vehicleId,
        vehicleName: vehicle ? `${vehicle.model} (${vehicle.regNo})` : 'Mahindra XUV700 (TN 01 AB 4002)',
        driverCompensationAmount: 1500,
        vendorPayoutPercent: 85,
        vendorPayableAmount: 0
      }
    };

    let assignedData = null;
    const mockRes = {
      status: (code) => ({
        json: (payload) => {
          assignedData = payload.data;
          return payload;
        }
      })
    };
    const mockNext = (err) => { if (err) throw err; };

    await bookingController.assign(mockReq, mockRes, mockNext);
    console.log('Assignment completed successfully!');

    // 4. Verify MongoDB Atlas persisted document directly
    const directDoc = await Booking.findOne({
      $or: [{ refId: testBooking.refId }, { bookingNumber: testBooking.bookingNumber }]
    }).lean();

    console.log('\n--- VERIFICATION FROM DIRECT MONGODB QUERY ---');
    console.log('Vehicle ID:', directDoc.vehicleId);
    console.log('Driver ID:', directDoc.driverId);
    console.log('Driver Assignment Status:', directDoc.driverAssignmentStatus);
    console.log('Assigned Vehicle in DB:', directDoc.assignedVehicle?.model, directDoc.assignedVehicle?.regNo);
    console.log('Assigned Driver in DB:', directDoc.assignedDriver?.name, directDoc.assignedDriver?.phone);
    console.log('Timeline Count in DB:', directDoc.assignmentTimeline?.length);
    console.log('Timeline Event:', directDoc.assignmentTimeline?.[0]?.event);

    if (!directDoc.assignedVehicle || !directDoc.assignedDriver || !directDoc.assignmentTimeline?.length) {
      throw new Error('FAILED: Assignment fields missing in MongoDB document!');
    }

    // 5. Verify getById API returns full enriched assignment details
    let getByIdData = null;
    const mockGetByIdRes = {
      status: (code) => ({
        json: (payload) => {
          getByIdData = payload.data;
          return payload;
        }
      })
    };

    await bookingController.getById({ params: { id: testBooking.refId } }, mockGetByIdRes, mockNext);

    console.log('\n--- VERIFICATION FROM GETBYID API ---');
    console.log('getById refId:', getByIdData.refId);
    console.log('getById vehicle model:', getByIdData.assignedVehicle?.model);
    console.log('getById vehicle regNo:', getByIdData.assignedVehicle?.regNo);
    console.log('getById driver name:', getByIdData.assignedDriver?.name);
    console.log('getById driver license:', getByIdData.assignedDriver?.licenseNumber);
    console.log('getById timeline entries:', getByIdData.assignmentTimeline?.length);

    if (!getByIdData.assignedVehicle?.regNo || !getByIdData.assignedDriver?.name) {
      throw new Error('FAILED: getById did not return enriched assignedVehicle or assignedDriver!');
    }

    // 6. Verify getAll API returns assignedVehicle and assignedDriver
    let getAllData = null;
    const mockGetAllRes = {
      status: (code) => ({
        json: (payload) => {
          getAllData = payload.data;
          return payload;
        }
      })
    };

    await bookingController.getAll({ query: {} }, mockGetAllRes, mockNext);
    const targetInList = getAllData.find(b => b.refId === testBooking.refId || b.bookingNumber === testBooking.bookingNumber);

    console.log('\n--- VERIFICATION FROM GETALL API ---');
    console.log('Target found in getAll list:', Boolean(targetInList));
    console.log('List vehicle regNo:', targetInList?.assignedVehicle?.regNo);
    console.log('List driver name:', targetInList?.assignedDriver?.name);

    if (!targetInList?.assignedVehicle?.regNo || !targetInList?.assignedDriver?.name) {
      throw new Error('FAILED: getAll did not enrich target booking!');
    }

    console.log('\n>>> ALL PERSISTENCE AND RETRIEVAL TESTS PASSED SUCCESSFULLY! <<<');
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

run();
