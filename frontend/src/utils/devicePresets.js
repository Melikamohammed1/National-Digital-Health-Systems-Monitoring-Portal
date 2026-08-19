/**
 * Interactive sessions can ask the target site to render its Desktop,
 * Tablet, or Mobile responsive layout. Desktop mode auto-fits the actual
 * slot's rendered size (measured at session start) rather than a fixed
 * resolution — Tablet/Mobile force a fixed device viewport + a matching
 * user agent so sites actually serve their touch-optimized layout
 * (bigger tap targets, no hover-only menus), which a real phone or
 * tablet visiting the site would also get.
 *
 * hasTouch is true in every mode — the physical displays are touchscreens
 * regardless of which layout the target site renders.
 */
export const DEVICE_PRESETS = {
  desktop: {
    label: 'Desktop (auto-fit to slot)',
    fixedSize: null, // measured live from the slot's actual rendered size
    isMobile: false,
    hasTouch: true,
    userAgent: null
  },
  tablet: {
    label: 'Tablet (forces touch-friendly layout)',
    fixedSize: { width: 834, height: 1194 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  mobile: {
    label: 'Mobile (forces touch-friendly layout)',
    fixedSize: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  }
};
