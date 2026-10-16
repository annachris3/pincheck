// Free OpenStreetMap Geocoder
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
