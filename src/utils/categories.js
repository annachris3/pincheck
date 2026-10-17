// Helper utilities for Country Check-ins, Multiple Cities, Local Beers, and Food & Drink spots

export const getPlaceCitiesList = (place) => {
  if (Array.isArray(place?.cities) && place.cities.length > 0) {
    return place.cities.map((c) =>
      typeof c === 'string'
        ? { name: c, lat: place.lat, lng: place.lng }
        : {
            name: c.name,
            lat: typeof c.lat === 'number' ? c.lat : place.lat,
            lng: typeof c.lng === 'number' ? c.lng : place.lng,
          }
    );
  }
  if (place?.city) {
    return [{ name: place.city, lat: place.lat, lng: place.lng }];
  }
  return [];
};

export const getUniqueCountriesCount = (visitedPlaces) =>
  new Set(
    visitedPlaces
      .map((p) => (p.country || '').trim().toLowerCase())
      .filter(Boolean)
  ).size;

export const getUniqueCitiesCount = (visitedPlaces) => {
  const citySet = new Set();
  visitedPlaces.forEach((p) => {
    const cities = getPlaceCitiesList(p);
    cities.forEach((c) => {
      if (c.name && c.name.trim()) {
        citySet.add(c.name.trim().toLowerCase());
      }
    });
  });
  return citySet.size;
};

export const getTotalBeersCount = (visitedPlaces) =>
  visitedPlaces.reduce(
    (sum, place) => sum + (Array.isArray(place.beers) ? place.beers.length : 0),
    0
  );

export const getTotalFoodDrinksCount = (visitedPlaces) =>
  visitedPlaces.reduce(
    (sum, place) =>
      sum + (Array.isArray(place.foodDrinks) ? place.foodDrinks.length : 0),
    0
  );

export const getTotalPinsCount = (visitedPlaces) =>
  visitedPlaces.reduce((sum, place) => {
    const citiesCount = getPlaceCitiesList(place).length;
    const foodCount = Array.isArray(place.foodDrinks)
      ? place.foodDrinks.length
      : 0;
    const beerCount = Array.isArray(place.beers) ? place.beers.length : 0;
    return sum + Math.max(1, citiesCount + foodCount + beerCount);
  }, 0);

