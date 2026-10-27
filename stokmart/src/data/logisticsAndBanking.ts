import { CourierOption, BankAccount } from '../types/inventory';

export const INDONESIA_BANKS: BankAccount[] = [
  {
    bank: 'BCA',
    accountName: 'PT NETSOLUSIONS SOLUSI TEKNOLOGI',
    accountNumber: '8830-1928-33',
    branch: 'KCU Jakarta Thamrin',
    logoColor: 'from-blue-600 to-blue-800',
  },
  {
    bank: 'Mandiri',
    accountName: 'PT NETSOLUSIONS SOLUSI TEKNOLOGI',
    accountNumber: '157-00-8839210-4',
    branch: 'KC Cikarang Kawasan Jababeka',
    logoColor: 'from-blue-700 to-amber-600',
  },
  {
    bank: 'BNI',
    accountName: 'PT NETSOLUSIONS SOLUSI TEKNOLOGI',
    accountNumber: '089-2231-890',
    branch: 'KC Sudirman Jakarta',
    logoColor: 'from-teal-600 to-orange-600',
  },
  {
    bank: 'BRI',
    accountName: 'PT NETSOLUSIONS SOLUSI TEKNOLOGI',
    accountNumber: '0341-01-002891-30-2',
    branch: 'KC Cikarang Industri',
    logoColor: 'from-blue-600 to-sky-700',
  },
  {
    bank: 'BSI',
    accountName: 'PT NETSOLUSIONS SOLUSI TEKNOLOGI',
    accountNumber: '718-9201-445',
    branch: 'KC Bekasi Cyber Park',
    logoColor: 'from-emerald-600 to-teal-700',
  },
];

export const COURIER_OPTIONS: CourierOption[] = [
  {
    id: 'jne',
    name: 'JNE Express',
    service: 'Reguler (REG)',
    eta: '2-3 Hari Kerja',
    cost: 18000,
    badge: 'Populer',
    type: 'regular',
  },
  {
    id: 'jnt',
    name: 'J&T Express',
    service: 'Standard Delivery (EZ)',
    eta: '1-2 Hari Kerja',
    cost: 19000,
    badge: 'Cepat & Andal',
    type: 'express',
  },
  {
    id: 'lalamove',
    name: 'Lalamove Delivery',
    service: 'Van / Multi-Drop Cargo',
    eta: '2-4 Jam (Langsung Berangkat)',
    cost: 65000,
    badge: 'Kapasitas Berat & Suku Cadang',
    type: 'cargo',
  },
  {
    id: 'grab',
    name: 'GrabExpress',
    service: 'Instant / SameDay',
    eta: '3-5 Jam',
    cost: 35000,
    badge: 'Jabodetabek SameDay',
    type: 'instant',
  },
  {
    id: 'gojek',
    name: 'GoSend by Gojek',
    service: 'Instant Kilat',
    eta: '1-2 Jam Sampai',
    cost: 38000,
    badge: 'Paling Cepat',
    type: 'instant',
  },
];

export const QRIS_CONFIG = {
  merchantName: 'NETSOLUSIONS SOLUSI TEKNOLOGI PT',
  nmid: 'ID1020391029312',
  acquirer: 'BANK INDONESIA / ASPI STANDAR NASIONAL',
  qrSvgDataUri:
    'https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=00020101021226610014ID.GO.GPN.WWW01189360091100203910295204581253033605802ID5931NETSOLUSIONS%20SOLUSI%20TEKNOLOGI6007BEKASI61051753062070703A016304C89A',
};
