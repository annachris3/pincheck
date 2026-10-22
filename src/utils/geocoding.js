// Free OpenStreetMap Nominatim Geocoder & Smart Destination Type Auto-Detector

const KNOWN_ISLANDS = new Set([
  'santorini',
  'thira',
  'mykonos',
  'rhodes',
  'rodos',
  'kos',
  'crete',
  'kriti',
  'corfu',
  'kerkyra',
  'zakynthos',
  'zante',
  'paros',
  'naxos',
  'milos',
  'ios',
  'skiathos',
  'skopelos',
  'lefkada',
  'kefalonia',
  'cephalonia',
  'samos',
  'lesbos',
  'chios',
  'hydra',
  'spetses',
  'aegina',
  'symi',
  'bali',
  'lombok',
  'nusa penida',
  'gili trawangan',
  'komodo',
  'sumatra',
  'java',
  'sulawesi',
  'borneo',
  'ibiza',
  'mallorca',
  'majorca',
  'menorca',
  'minorca',
  'formentera',
  'tenerife',
  'gran canaria',
  'lanzarote',
  'fuerteventura',
  'la palma',
  'la gomera',
  'el hierro',
  'madeira',
  'porto santo',
  'azores',
  'sao miguel',
  'terceira',
  'pico',
  'faial',
  'sicily',
  'sicilia',
  'sardinia',
  'sardegna',
  'capri',
  'ischia',
  'procida',
  'elba',
  'stromboli',
  'lipari',
  'lampedusa',
  'murano',
  'burano',
  'corsica',
  'corse',
  'malta',
  'gozo',
  'comino',
  'cyprus',
  'phuket',
  'koh samui',
  'ko samui',
  'koh phangan',
  'ko pha ngan',
  'koh tao',
  'ko tao',
  'koh phi phi',
  'phi phi',
  'koh lanta',
  'koh chang',
  'koh lipe',
  'boracay',
  'palawan',
  'siargao',
  'cebu',
  'bohol',
  'coron',
  'zanzibar',
  'mauritius',
  'seychelles',
  'mahe',
  'praslin',
  'la digue',
  'maldives',
  'reunion',
  'madagascar',
  'bora bora',
  'tahiti',
  'moorea',
  'fiji',
  'hawaii',
  'maui',
  'oahu',
  'kauai',
  'big island',
  'key west',
  'aruba',
  'curacao',
  'bonaire',
  'cozumel',
  'isla mujeres',
  'holbox',
  'galapagos',
  'easter island',
  'rapa nui',
  'bahamas',
  'jamaica',
  'barbados',
  'st lucia',
  'saint lucia',
  'antigua',
  'grenada',
  'martinique',
  'guadeloupe',
  'st maarten',
  'saint martin',
  'st barts',
  'puerto rico',
  'cayman islands',
  'bermuda',
  'hvar',
  'brac',
  'korcula',
  'krk',
  'pag',
  'vis',
  'mljet',
  'rab',
  'losinj',
  'gotland',
  'oland',
  'bornholm',
  'lofoten',
  'svalbard',
  'faroe islands',
  'iceland',
  'skye',
  'isle of skye',
  'isle of wight',
  'isle of man',
  'jersey',
  'guernsey',
  'sylt',
  'rugen',
  'rügen',
  'usedom',
  'texel',
  'jeju',
  'okinawa',
  'miyako',
  'ishigaki',
  'naoshima',
  'langkawi',
  'penang',
  'tioman',
  'perhentian',
  'phu quoc',
  'con dao',
  'cat ba',
  'sri lanka',
  'taiwan',
  'kashgar',
  'canary islands',
  'balearic islands',
  'cyclades',
  'dodecanese',
  'ionian islands',
]);

const KNOWN_COUNTRIES = new Set([
  'austria',
  'germany',
  'switzerland',
  'italy',
  'france',
  'spain',
  'portugal',
  'greece',
  'croatia',
  'slovenia',
  'poland',
  'czechia',
  'czech republic',
  'hungary',
  'slovakia',
  'netherlands',
  'belgium',
  'luxembourg',
  'united kingdom',
  'uk',
  'england',
  'scotland',
  'wales',
  'ireland',
  'denmark',
  'sweden',
  'norway',
  'finland',
  'estonia',
  'latvia',
  'lithuania',
  'romania',
  'bulgaria',
  'serbia',
  'montenegro',
  'albania',
  'north macedonia',
  'bosnia and herzegovina',
  'turkey',
  'japan',
  'south korea',
  'china',
  'thailand',
  'vietnam',
  'indonesia',
  'malaysia',
  'singapore',
  'philippines',
  'india',
  'nepal',
  'united arab emirates',
  'uae',
  'qatar',
  'oman',
  'jordan',
  'israel',
  'egypt',
  'morocco',
  'tunisia',
  'south africa',
  'kenya',
  'tanzania',
  'united states',
  'usa',
  'canada',
  'mexico',
  'costa rica',
  'panama',
  'colombia',
  'peru',
  'brazil',
  'argentina',
  'chile',
  'uruguay',
  'australia',
  'new zealand',
]);

// Instant synchronous auto-detection as the user types a place name
export const detectDestinationTypeSync = (placeName, countryName = '') => {
  const cleanPlace = (placeName || '').trim().toLowerCase();
  const cleanCountry = (countryName || '').trim().toLowerCase();

  if (!cleanPlace) {
    if (cleanCountry && KNOWN_ISLANDS.has(cleanCountry)) return 'island';
    return 'city';
  }

  // Check if the place name contains island/archipelago keywords or is in the known islands gazetteer
  if (
    KNOWN_ISLANDS.has(cleanPlace) ||
    /\b(island|islands|isla|islas|ilha|ilhas|insel|inseln|île|îles|archipelago|isle|atoll|koh|ko)\b/i.test(
      cleanPlace
    )
  ) {
    return 'island';
  }

  // Check if the user typed a Country name into the destination field
  if (
    (cleanCountry && cleanPlace === cleanCountry) ||
    KNOWN_COUNTRIES.has(cleanPlace)
  ) {
    return 'country';
  }

  return 'city';
};

// Inspect OpenStreetMap Nominatim result to classify as 'island' | 'country' | 'city'
const classifyNominatimResults = (results, rawPlaceName, rawCountryName) => {
  const syncGuess = detectDestinationTypeSync(rawPlaceName, rawCountryName);
  if (syncGuess === 'island') return 'island';

  if (Array.isArray(results) && results.length > 0) {
    for (const item of results) {
      const addrType = (item.addresstype || '').toLowerCase();
      const itemType = (item.type || '').toLowerCase();
      const itemClass = (item.class || '').toLowerCase();
      const addr = item.address || {};

      if (
        addrType === 'island' ||
        addrType === 'islet' ||
        addrType === 'archipelago' ||
        itemType === 'island' ||
        itemType === 'islet' ||
        itemType === 'archipelago' ||
        (itemClass === 'natural' &&
          (itemType === 'island' || itemType === 'archipelago')) ||
        Boolean(addr.island) ||
        Boolean(addr.archipelago)
      ) {
        return 'island';
      }

      if (addrType === 'country' || itemType === 'country') {
        return 'country';
      }
    }
  }

  return syncGuess;
};

// 1. Fetch coordinates + smart auto-detected classification ('city' | 'island' | 'country')
export const fetchCoordinates = async (
  query,
  rawPlaceName = '',
  rawCountryName = ''
) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
      query
    )}&limit=3`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'PinCheckTravelApp/1.0' },
    });
    const data = await response.json();
    if (data && data.length > 0) {
      const best = data[0];
      const detectedType = classifyNominatimResults(
        data,
        rawPlaceName || query.split(',')[0],
        rawCountryName
      );
      const detectedCountry = best.address?.country || '';

      return {
        lat: parseFloat(best.lat),
        lng: parseFloat(best.lon),
        detectedType,
        detectedCountry,
      };
    }
    return null;
  } catch {
    return null;
  }
};

// 2. Search for a specific place (e.g. "Café Central") inside a City/Island + Country
// Returns exact coordinates + formatted street address automatically!
export const searchVenueInCity = async (spotName, city, country) => {
  try {
    const fullQuery = [spotName, city, country].filter(Boolean).join(', ');
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
      fullQuery
    )}&limit=3`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'PinCheckTravelApp/1.0' },
    });
    const data = await response.json();
    if (data && data.length > 0) {
      const best = data[0];
      const addr = best.address || {};
      const streetPart = [addr.road, addr.house_number].filter(Boolean).join(' ');
      const districtPart = addr.suburb || addr.quarter || addr.city_district || '';
      const cityPart =
        addr.city || addr.town || addr.village || addr.island || city || '';
      const shortAddress =
        [streetPart, districtPart, cityPart].filter(Boolean).join(', ') ||
        best.display_name.split(',').slice(0, 3).join(',');

      return {
        name: spotName,
        address: shortAddress,
        fullAddress: best.display_name,
        lat: parseFloat(best.lat),
        lng: parseFloat(best.lon),
      };
    }
    return null;
  } catch {
    return null;
  }
};
