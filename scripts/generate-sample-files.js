const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'sample_manifests');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Synthetic Linnworks Daily Dispatch CSV
const csvRows = [
  [
    'OrderId',
    'Order Date',
    'Processed',
    'Day',
    'Country',
    'Source',
    'ReferenceNum',
    'Postal Service',
    'Tracking Number',
    'Latest Update',
    'Status',
    'Date',
    'SLA',
    'Estimated Delivery Date',
    'Formula Days Count',
    'SLA For Claims',
    'Courier Name',
  ],
  [
    '879001',
    '2026-10-18',
    '2026-10-18',
    'Sunday',
    'United Kingdom',
    'SHOPIFY',
    'METT-WEB-1001',
    'Royal Mail Tracked 24',
    'MG-RM-2026-901',
    'In Transit: Hub sort scan complete',
    'Within Transit Time',
    '2026-10-19',
    1,
    '2026-10-19',
    0,
    3,
    'Royal Mail',
  ],
  [
    '879002',
    '2026-10-14',
    '2026-10-14',
    'Wednesday',
    'United Kingdom',
    'AMAZON',
    'AMZ-GB-9921',
    'DPD Next Day Parcel',
    'MG-DPD-2026-902',
    'Delayed in Transit: Stalled at Oldbury Hub for 72h',
    'More Than 3 Days Late',
    '2026-10-15',
    1,
    '2026-10-15',
    -6,
    8,
    'DPD',
  ],
  [
    '879003',
    '2026-10-06',
    '2026-10-06',
    'Tuesday',
    'United Kingdom',
    'EBAY',
    'EBAY-UK-4411',
    'Evri Standard 48h',
    'MG-EVRI-2026-903',
    'Dormant: No scan recorded after courier collection',
    'More Than 3 Days Late',
    '2026-10-07',
    2,
    '2026-10-08',
    -12,
    16,
    'Evri',
  ],
  [
    '879004',
    '2026-10-08',
    '2026-10-08',
    'Thursday',
    'United Kingdom',
    'DIRECT',
    'DIR-INV-773',
    'Yodel Xpect 48h',
    'MG-YODEL-2026-904',
    'Investigation: Dock tracer request pending response',
    'More Than 3 Days Late',
    '2026-10-09',
    2,
    '2026-10-10',
    -10,
    14,
    'Yodel',
  ],
  [
    '879005',
    '2026-10-12',
    '2026-10-12',
    'Monday',
    'United States',
    'SHOPIFY',
    'METT-US-551',
    'UPS Worldwide Express',
    '1Z999METT001234',
    'Customs Clearance Delay: Hold at Castle Donington',
    '2 Days Late',
    '2026-10-15',
    3,
    '2026-10-15',
    -2,
    9,
    'UPS',
  ],
];

const csvContent = csvRows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
fs.writeFileSync(path.join(outputDir, 'sample_linnworks_dispatch_manifest.csv'), csvContent);

// 2. Synthetic Multi-Sheet Excel Workbook
const wb = XLSX.utils.book_new();

// Sheet 1: Active In-Transit & Exception Consignments
const wsInTransit = XLSX.utils.aoa_to_sheet(csvRows);
XLSX.utils.book_append_sheet(wb, wsInTransit, 'Active & Stalled Consignments');

// Sheet 2: Delivered Verified Ledger
const deliveredRows = [
  [
    'OrderId',
    'Order Date',
    'Processed',
    'Country',
    'Source',
    'Postal Service',
    'Tracking Number',
    'Status',
    'Date',
    'Courier Name',
  ],
  [
    '878501',
    '2026-10-16',
    '2026-10-16',
    'United Kingdom',
    'SHOPIFY',
    'DPD 12:00 Express',
    'MG-DPD-DELIV-01',
    'Delivered',
    '2026-10-17',
    'DPD',
  ],
  [
    '878502',
    '2026-10-15',
    '2026-10-15',
    'Germany',
    'AMAZON',
    'UPS Standard EU',
    'MG-UPS-DELIV-02',
    'Delivered',
    '2026-10-18',
    'UPS',
  ],
  [
    '878503',
    '2026-10-14',
    '2026-10-14',
    'United Kingdom',
    'EBAY',
    'Royal Mail Tracked 24',
    'MG-RM-DELIV-03',
    'Delivered - 1 Day Late',
    '2026-10-16',
    'Royal Mail',
  ],
];
const wsDelivered = XLSX.utils.aoa_to_sheet(deliveredRows);
XLSX.utils.book_append_sheet(wb, wsDelivered, 'Delivered Archive');

const excelPath = path.join(outputDir, 'sample_courier_performance_report.xlsx');
XLSX.writeFile(wb, excelPath);

console.log('Successfully generated sample files:');
console.log('1. ' + path.join(outputDir, 'sample_linnworks_dispatch_manifest.csv'));
console.log('2. ' + excelPath);
