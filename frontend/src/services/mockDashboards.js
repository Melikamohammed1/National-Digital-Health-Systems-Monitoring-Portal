/* Sample/demo dashboard content only — no real Ministry of Health systems or data.
 * Lives under services/ because it plays the same role real API/data providers
 * will once each system's real dashboard is wired up. */

export const TARGETS = {
  dhis2:    { name: 'DHIS2 National Tracker',   full: 'DHIS2 — National Health Data Platform', color: '#3A4FC4' },
  openmrs:  { name: 'OpenMRS Central EMR',      full: 'OpenMRS — Central EMR',                 color: '#7C3AED' },
  lis:      { name: 'LIS Laboratory Portal',    full: 'LIS — Pathology Laboratory',             color: '#0891A8' },
  icu:      { name: 'ICU Vitals Dashboard',     full: 'ICU Vitals Monitor — Bay 4',             color: '#B91C1C' },
  hrhis:    { name: 'HRHIS Staff Registry',     full: 'HRHIS — Staff Registry',                 color: '#0F766E' },
  epi:      { name: 'Epi Surveillance Monitor', full: 'Epi Surveillance — Signal Monitor',      color: '#C2410C' },
  pharmacy: { name: 'Pharmacy Stock Manager',   full: 'Pharmacy Stock Manager',                 color: '#15803D' },
  outbreak: { name: 'Disease Outbreak Tracker', full: 'Disease Outbreak Tracker',               color: '#9F1239' }
};

export const DASH = {
  dhis2: {
    stats: [['24,891', 'Enroll.'], ['98.2%', 'Complete']],
    full: { stats: [['24,891', 'Enrollments'], ['98.2%', 'Completeness'], ['3', 'Alerts']],
      list: { title: 'Facility Sync Status', rows: [['Ashanti Region', 'Synced', 'ok'], ['Northern Region', 'Synced', 'ok'], ['Volta Region', 'Pending', 'warn'], ['Bono East', 'Synced', 'ok']] } }
  },
  openmrs: {
    stats: [['1,204', 'Patients'], ['47', 'OPD']],
    full: { stats: [['1,204', 'Active Patients'], ['47', 'Today OPD'], ['8', 'Admissions']],
      list: { title: 'Recent Encounters', rows: [['Dr. Owusu', 'Cardiology', 'ok'], ['Dr. Asante', 'Internal Med', 'ok'], ['Nurse Ama', 'Emergency', 'warn'], ['Dr. Boadi', 'Obs/Gyn', 'ok']] } }
  },
  lis: {
    stats: [['14', 'Pending'], ['2', 'Critical']],
    full: { stats: [['14', 'Pending'], ['203', 'Done'], ['2', 'Critical']],
      list: { title: 'Recent Tests', rows: [['Ama Asante', 'CBC Panel', 'ok'], ['Kweku Boateng', 'Malaria RDT', 'warn'], ['Efua Darko', 'Glucose', 'crit'], ['Yaw Ansah', 'Urinalysis', 'ok']] } }
  },
  icu: {
    stats: [['72', 'HR'], ['98', 'SpO₂']],
    full: { stats: [['72', 'HR bpm'], ['98%', 'SpO₂'], ['118/76', 'BP mmHg']],
      list: { title: 'Bay 4 — Patient Monitor', rows: [['Heart Rate', '72 bpm', 'ok'], ['Temp', '37.1 °C', 'ok'], ['Resp. Rate', '16 /min', 'ok'], ['Alarm Log', 'Clear', 'ok']] } }
  },
  hrhis: {
    stats: [['3,410', 'Staff'], ['92%', 'Filled']],
    full: { stats: [['3,410', 'Total Staff'], ['92%', 'Posts Filled'], ['118', 'New Hires']],
      list: { title: 'Facility Staffing', rows: [['Korle-Bu THC', 'Fully staffed', 'ok'], ['Tamale THC', 'Understaffed', 'warn'], ['Cape Coast RH', 'Fully staffed', 'ok'], ['Ho THC', 'Fully staffed', 'ok']] } }
  },
  epi: {
    stats: [['12', 'Signals'], ['2', 'High']],
    full: { stats: [['12', 'Active Signals'], ['2', 'High Priority'], ['96%', 'Coverage']],
      list: { title: 'Surveillance Signals', rows: [['Cholera — Volta', 'High', 'crit'], ['Measles — Bono', 'Monitoring', 'warn'], ['AFP — Ashanti', 'Closed', 'ok'], ['Meningitis — North', 'Monitoring', 'warn']] } }
  },
  pharmacy: {
    stats: [['86%', 'Stocked'], ['4', 'Low']],
    full: { stats: [['86%', 'Fully Stocked'], ['4', 'Low Stock'], ['1', 'Stockout']],
      list: { title: 'Stock Alerts', rows: [['Amoxicillin 250mg', 'Low', 'warn'], ['ORS Sachets', 'Stocked', 'ok'], ['RDT Kits', 'Stockout', 'crit'], ['Paracetamol', 'Stocked', 'ok']] } }
  },
  outbreak: {
    stats: [['5', 'Active'], ['1', 'Severe']],
    full: { stats: [['5', 'Active Outbreaks'], ['1', 'Severe'], ['214', 'Cases (7d)']],
      list: { title: 'Tracked Outbreaks', rows: [['Cholera — Accra', 'Active', 'crit'], ['Measles — Tamale', 'Contained', 'ok'], ['Lassa Fever — Ho', 'Monitoring', 'warn'], ['Meningitis — Bolga', 'Active', 'crit']] } }
  }
};

export const TAG_COLOR = { ok: '#1F9D57', warn: '#96780A', crit: '#C0392B' };
export const TAG_BG = { ok: '#E5FAEF', warn: '#FDF6DC', crit: '#FDEBE9' };

/** Turns a raw custom-target record from the API into the shape components need. */
export function buildTargetEntry(t) {
  const isInteractive = t.mode === 'interactive';
  return {
    name: t.name,
    full: t.name,
    color: t.color,
    iframe: !isInteractive,
    interactive: isInteractive,
    embedUrl: isInteractive ? null : `/api/proxy?url=${encodeURIComponent(t.url)}`,
    rawUrl: t.url,
    shotUrl: `/api/screenshot?url=${encodeURIComponent(t.url)}`
  };
}
