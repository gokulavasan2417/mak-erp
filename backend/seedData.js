import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vehiclesPath = path.resolve(__dirname, 'seed/vehicles_atlas.json');
const packagesPath = path.resolve(__dirname, 'seed/packages_atlas.json');

const vehicles = JSON.parse(fs.readFileSync(vehiclesPath, 'utf8'));
const packages = JSON.parse(fs.readFileSync(packagesPath, 'utf8'));

const fleetContent = `// MAK Tours & Travels ERP - Fleet Data (Car Master)
// Sourced directly from MongoDB Atlas mak_tours database (22 Vehicles)

export const vehicleCategories = [
  'All Categories',
  'Hatchback',
  'Sedan',
  'SUV/MUV',
  'SUV',
  'MUV',
  'Tempo Traveller',
  'Premium Van',
  'Luxury Sedan',
  'Premium MPV',
  'Luxury SUV',
  'Tempo Coach'
];

export const vehicleStatuses = ['All', 'Available', 'On Duty', 'Maintenance', 'Inactive'];

export const vehicleScheduleMock = [];

export const initialVehicles = ${JSON.stringify(vehicles, null, 2)};

export default initialVehicles;
`;

const packagesContent = `// MAK Tours & Travels ERP - Tour Packages Data
// Sourced directly from MongoDB Atlas mak_tours database (35 Tour Packages)

export const packageCategories = [
  'All Categories',
  'Pilgrimage Tours',
  'Hill Station Tours',
  'South India',
  'Tamil Nadu',
  'Heritage Tours',
  'Wildlife Tours',
  'Beach Vacations',
  'Family Tours',
  'Adventure'
];

export const initialTourPackages = ${JSON.stringify(packages, null, 2)};

export default initialTourPackages;
`;

fs.writeFileSync('./frontend/src/data/fleetData.js', fleetContent);
fs.writeFileSync('./frontend/src/data/tourPackagesData.js', packagesContent);
console.log(`Successfully seeded fleetData.js with ${vehicles.length} cars and tourPackagesData.js with ${packages.length} packages`);
