// Free OpenStreetMap Nominatim Geocoder & Place Lookup

// 1. Fetch city/country coordinates
export const fetchCoordinates = async (query) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'PinCheckTravelApp/1.0' },
    });
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch {
    return null;
  }
};

// 2. Search for a specific place (e.g. "Café Central") inside a City + Country
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
      const cityPart = addr.city || addr.town || addr.village || city || '';
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
