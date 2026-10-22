// Helper utilities for Country Check-ins, Cities, Islands, Local Beers, Food & Drink spots, and Star Ranking
import { detectDestinationTypeSync } from './geocoding';
import {
  STAR_RANKING_TIERS,
  ROOKIE_TIER,
} from '../constants/starRankingConfig';

const MONTH_ORDER = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

export const getMonthOrder = (monthStr) => {
  if (!monthStr || typeof monthStr !== 'string') return 13;
  const key = monthStr.trim().toLowerCase();
  if (MONTH_ORDER[key]) return MONTH_ORDER[key];
  const num = parseInt(key, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= 12) return num;
  return 13;
};

export const getDestinationEmoji = (type) => {
  if (type === 'island') return '🏝️';
  if (type === 'country') return '🌍';
  return '🏙️';
};

export const getPlaceCitiesList = (place) => {
  const parentCountry = place?.country || '';
  if (Array.isArray(place?.cities) && place.cities.length > 0) {
    return place.cities.map((c) => {
      if (typeof c === 'string') {
        return {
          name: c,
          lat: place.lat,
          lng: place.lng,
          year: place.year || '2026',
          month: place.month || 'May',
          type: detectDestinationTypeSync(c, parentCountry),
        };
      }
      const validType =
        c.type === 'island' || c.type === 'country' || c.type === 'city'
          ? c.type
          : detectDestinationTypeSync(c.name, parentCountry);
      return {
        name: c.name,
        lat: typeof c.lat === 'number' ? c.lat : place.lat,
        lng: typeof c.lng === 'number' ? c.lng : place.lng,
        year: c.year || place.year || '2026',
        month: c.month || place.month || 'May',
        type: validType,
      };
    });
  }
  if (place?.city) {
    return [
      {
        name: place.city,
        lat: place.lat,
        lng: place.lng,
        year: place.year || '2026',
        month: place.month || 'May',
        type:
          place.destinationType ||
          detectDestinationTypeSync(place.city, parentCountry),
      },
    ];
  }
  return [];
};

// Total Countries Counter (+1 per unique country)
export const getUniqueCountriesCount = (visitedPlaces) => {
  const countrySet = new Set();
  visitedPlaces.forEach((p) => {
    const cName = (p.country || '').trim().toLowerCase();
    if (cName) countrySet.add(cName);
    const destinations = getPlaceCitiesList(p);
    destinations.forEach((d) => {
      if (d.type === 'country' && d.name && d.name.trim()) {
        countrySet.add(d.name.trim().toLowerCase());
      }
    });
  });
  return countrySet.size;
};

// Total Cities Counter (Mutually Exclusive: ONLY counts 'city', never 'island' or 'country')
export const getUniqueCitiesCount = (visitedPlaces) => {
  const citySet = new Set();
  visitedPlaces.forEach((p) => {
    const destinations = getPlaceCitiesList(p);
    destinations.forEach((d) => {
      if (d.type === 'city' && d.name && d.name.trim()) {
        citySet.add(d.name.trim().toLowerCase());
      }
    });
  });
  return citySet.size;
};

// Total Islands Counter (Mutually Exclusive: ONLY counts 'island', never 'city' or 'country')
export const getUniqueIslandsCount = (visitedPlaces) => {
  const islandSet = new Set();
  visitedPlaces.forEach((p) => {
    const destinations = getPlaceCitiesList(p);
    destinations.forEach((d) => {
      if (d.type === 'island' && d.name && d.name.trim()) {
        islandSet.add(d.name.trim().toLowerCase());
      }
    });
  });
  return islandSet.size;
};

// Total Unique Local Beers Counter across all pins (beers[] + localBeerName on Food & Drink pins)
export const getTotalBeersCount = (visitedPlaces = []) => {
  const uniqueBeers = new Set();
  visitedPlaces.forEach((place) => {
    if (Array.isArray(place?.beers)) {
      place.beers.forEach((b) => {
        if (typeof b === 'string' && b.trim()) {
          uniqueBeers.add(b.trim().toLowerCase());
        }
      });
    }
    if (typeof place?.localBeerName === 'string' && place.localBeerName.trim()) {
      uniqueBeers.add(place.localBeerName.trim().toLowerCase());
    }
    if (Array.isArray(place?.foodDrinks)) {
      place.foodDrinks.forEach((spot) => {
        if (
          spot &&
          typeof spot === 'object' &&
          typeof spot.localBeerName === 'string' &&
          spot.localBeerName.trim()
        ) {
          uniqueBeers.add(spot.localBeerName.trim().toLowerCase());
        }
      });
    }
  });
  return uniqueBeers.size;
};

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

/**
 * Evaluate the user's Star Ranking based on total confirmed destinations.
 * Checks from highest to lowest (5-Star -> 4-Star -> 3-Star -> 2-Star -> 1-Star -> 0-Star Rookie).
 */
export const evaluateStarRanking = (visitedPlaces = []) => {
  const countriesCount = getUniqueCountriesCount(visitedPlaces);
  const citiesCount = getUniqueCitiesCount(visitedPlaces);
  const islandsCount = getUniqueIslandsCount(visitedPlaces);

  let currentTier = ROOKIE_TIER;

  if (countriesCount >= 1) {
    // Check from highest to lowest (5 -> 4 -> 3 -> 2 -> 1)
    for (let i = 0; i < STAR_RANKING_TIERS.length; i++) {
      const tier = STAR_RANKING_TIERS[i];
      const meetsCountries = countriesCount >= tier.minCountries;
      const meetsCitiesOrIslands =
        citiesCount >= tier.minCities || islandsCount >= tier.minIslands;

      if (meetsCountries && meetsCitiesOrIslands) {
        currentTier = tier;
        break;
      }
    }
  }

  // Compute one-line progress hint showing remaining gap to the next star rank
  const nextTier = STAR_RANKING_TIERS.find(
    (t) => t.stars === currentTier.stars + 1
  );

  let progressHint = '🏆 Max rank reached: ⭐⭐⭐⭐⭐ World Legend';
  if (nextTier) {
    const countriesGap = Math.max(0, nextTier.minCountries - countriesCount);
    const meetsNextCityOrIsland =
      citiesCount >= nextTier.minCities || islandsCount >= nextTier.minIslands;
    const citiesGap = Math.max(0, nextTier.minCities - citiesCount);
    const islandsGap = Math.max(0, nextTier.minIslands - islandsCount);

    const countryWord = countriesGap === 1 ? 'country' : 'countries';
    const cityWord = citiesGap === 1 ? 'city' : 'cities';
    const islandWord = islandsGap === 1 ? 'island' : 'islands';

    if (countriesGap > 0 && meetsNextCityOrIsland) {
      progressHint = `${countriesGap} more ${countryWord} to reach ${nextTier.starGraphic} ${nextTier.title}`;
    } else if (countriesGap === 0 && !meetsNextCityOrIsland) {
      progressHint = `${citiesGap} more ${cityWord} (or ${islandsGap} ${islandWord}) to reach ${nextTier.starGraphic} ${nextTier.title}`;
    } else {
      progressHint = `${countriesGap} more ${countryWord} & ${citiesGap} ${cityWord} (or ${islandsGap} ${islandWord}) to reach ${nextTier.starGraphic} ${nextTier.title}`;
    }
  }

  return {
    starLevel: currentTier.stars,
    starTitle: currentTier.title,
    starGraphic: currentTier.starGraphic,
    badgeText: `${currentTier.starGraphic} ${currentTier.title}`,
    progressHint,
    countriesCount,
    citiesCount,
    islandsCount,
  };
};
