export const SETTINGS = ['unit', 'theme', 'trendAlerts'];
export const MG_PER_MMOL = 18.018;

export function preferences(saved) {
  return {
    unit: saved.unit === 'mmol/L' ? 'mmol/L' : 'mg/dL',
    theme: saved.theme === 'cyberpunk' ? 'cyberpunk' : 'classic',
    trendAlerts: saved.trendAlerts !== false,
  };
}

const number = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  useGrouping: false,
});

export function displayGlucose(value, unit) {
  return unit === 'mmol/L' ? number.format(value / MG_PER_MMOL) : String(value);
}
