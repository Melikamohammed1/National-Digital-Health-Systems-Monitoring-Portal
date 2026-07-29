export const SEED_SCREENS = [
  { id: 'scr_101', name: 'Lobby Projector', location: 'Main Lobby — Level 1', ip: '192.168.1.101', res: '1920x1080', status: 'online', layout: '2x2', slots: ['dhis2', 'openmrs', 'lis', null] },
  { id: 'scr_102', name: 'Conference Room B', location: 'Admin Wing — Level 2', ip: '192.168.1.102', res: '3840x2160', status: 'standby', layout: 'single', slots: ['icu'] },
  { id: 'scr_103', name: 'Emergency Ward Monitor', location: 'Emergency Wing', ip: '192.168.1.103', res: '1920x1080', status: 'offline', layout: '2x2', slots: ['hrhis', 'epi', null, null], lastSeen: '4 hours ago' },
  { id: 'scr_104', name: 'Registration Desk', location: 'Registration — Ground Fl.', ip: '192.168.1.104', res: '2560x1440', status: 'online', layout: '3col', slots: ['hrhis', 'epi', 'pharmacy'] },
  { id: 'scr_105', name: 'Data Center Wall', location: 'Ops Center — Level 3', ip: '192.168.1.105', res: '3840x1080', status: 'online', layout: '2x2', slots: ['outbreak', 'dhis2', 'lis', 'icu'] }
];