/**
 * Country Codes Utility
 * Uses the free CountriesNow API (no API key required)
 * Endpoint: https://countriesnow.space/api/v0.1/countries/codes
 *
 * Returns an array of: { name, code (ISO-2), dial_code }
 * Adds emoji flag generated from ISO code.
 */

// Priority countries to show at the top of the dropdown
const PRIORITY_ISO = ['SA', 'AE', 'PK', 'GB', 'US', 'KW', 'QA', 'OM', 'BH', 'TR', 'EG', 'IN', 'ID', 'MY', 'BD', 'JO']

/**
 * Convert ISO 2-letter code to flag emoji
 * Works in all modern browsers and most dropdown renderers
 */
export function isoToFlag(iso = '') {
  if (!iso || iso.length !== 2) return '🌍'
  return iso
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('')
}

/**
 * Fetch all country calling codes from the free CountriesNow API
 * No API key required. Falls back to a curated inline list on error.
 */
export async function fetchCountryCodes() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch('https://countriesnow.space/api/v0.1/countries/codes', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })

    clearTimeout(timeout)

    if (!res.ok) throw new Error(`CountriesNow API HTTP ${res.status}`)

    const json = await res.json()
    if (json.error || !Array.isArray(json.data)) throw new Error('Invalid API response')

    // Sort: priority countries first, then alphabetical
    const all = json.data
      .filter((c) => c.dial_code && c.code && c.name)
      .map((c) => ({
        name: c.name,
        iso: c.code.toUpperCase(),
        dialCode: c.dial_code.trim(),
        flag: isoToFlag(c.code),
      }))

    const priority = PRIORITY_ISO
      .map((iso) => all.find((c) => c.iso === iso))
      .filter(Boolean)

    const rest = all
      .filter((c) => !PRIORITY_ISO.includes(c.iso))
      .sort((a, b) => a.name.localeCompare(b.name))

    return [...priority, ...rest]
  } catch (err) {
    console.warn('[countryCodes] Falling back to static list. Reason:', err.message)
    return FALLBACK_CODES
  }
}

/**
 * Detect user's country code by IP using the free ipapi.co endpoint
 * Returns a dial_code string like "+966" or falls back to "+966"
 */
export async function detectDialCodeByIP() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const res = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) throw new Error('ipapi.co HTTP error')

    const data = await res.json()

    if (data && data.country_calling_code) {
      return data.country_calling_code  // e.g. "+966"
    }
  } catch {
    // silent fallback
  }
  return '+966'
}

/**
 * Curated fallback list (used when API is unavailable)
 */
const FALLBACK_CODES = [
  { name: 'Saudi Arabia', iso: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'United Arab Emirates', iso: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'Pakistan', iso: 'PK', dialCode: '+92', flag: '🇵🇰' },
  { name: 'United Kingdom', iso: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'United States', iso: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'Kuwait', iso: 'KW', dialCode: '+965', flag: '🇰🇼' },
  { name: 'Qatar', iso: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { name: 'Oman', iso: 'OM', dialCode: '+968', flag: '🇴🇲' },
  { name: 'Bahrain', iso: 'BH', dialCode: '+973', flag: '🇧🇭' },
  { name: 'Turkey', iso: 'TR', dialCode: '+90', flag: '🇹🇷' },
  { name: 'Egypt', iso: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { name: 'India', iso: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'Indonesia', iso: 'ID', dialCode: '+62', flag: '🇮🇩' },
  { name: 'Malaysia', iso: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { name: 'Bangladesh', iso: 'BD', dialCode: '+880', flag: '🇧🇩' },
  { name: 'Jordan', iso: 'JO', dialCode: '+962', flag: '🇯🇴' },
  { name: 'France', iso: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Germany', iso: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'Australia', iso: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Canada', iso: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'South Africa', iso: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { name: 'Nigeria', iso: 'NG', dialCode: '+234', flag: '🇳🇬' },
  { name: 'China', iso: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { name: 'Japan', iso: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'Singapore', iso: 'SG', dialCode: '+65', flag: '🇸🇬' },
]
