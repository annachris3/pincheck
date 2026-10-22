// Helper utilities for Country Check-ins, Cities, Islands, Local Beers, Food & Drink spots, and Star Ranking
import { detectDestinationTypeSync } from './geocoding';
import { STAR_RANKING_TIERS } from '../constants/starRankingConfig';

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

// 4 Standardized Pin Activity Categories: 'sights' (🏛️), 'food' (🍽️), 'cafes' (☕), 'drinks' (🍺)
export const PIN_ACTIVITY_CATEGORIES = [
  { key: 'sights', label: 'Sights', icon: '🏛️' },
  { key: 'food', label: 'Food', icon: '🍽️' },
  { key: 'cafes', label: 'Cafes', icon: '☕' },
  { key: 'drinks', label: 'Drinks', icon: '🍺' },
];

export const normalizeSpotCategory = (spot) => {
  if (!spot || typeof spot === 'string') return 'food';
  const cat = (spot.category || '').trim().toLowerCase();
  if (cat === 'sights' || cat === 'sight' || cat === 'visit') return 'sights';
  if (cat === 'cafes' || cat === 'cafe' || cat === 'coffee') return 'cafes';
  if (cat === 'drinks' || cat === 'drink' || cat === 'beer' || cat === 'bar')
    return 'drinks';
  if (cat === 'food' || cat === 'restaurant') return 'food';

  // Smart fallback inference for legacy spots without an explicit category field
  const lowerName = (spot.name || '').toLowerCase();
  if (
    lowerName.includes('cafe') ||
    lowerName.includes('café') ||
    lowerName.includes('coffee') ||
    lowerName.includes('bakery') ||
    lowerName.includes('brunch')
  ) {
    return 'cafes';
  }
  if (
    lowerName.includes('palace') ||
    lowerName.includes('museum') ||
    lowerName.includes('castle') ||
    lowerName.includes('cathedral') ||
    lowerName.includes('temple') ||
    lowerName.includes('viewpoint') ||
    lowerName.includes('monument')
  ) {
    return 'sights';
  }
  if (
    lowerName.includes('bar') ||
    lowerName.includes('pub') ||
    lowerName.includes('brewery') ||
    lowerName.includes('taproom')
  ) {
    return 'drinks';
  }
  return 'food';
};

export const getSpotCategoryEmoji = (category) => {
  const normalized =
    typeof category === 'object'
      ? normalizeSpotCategory(category)
      : (category || '').toLowerCase();
  if (normalized === 'sights') return '🏛️';
  if (normalized === 'cafes') return '☕';
  if (normalized === 'drinks') return '🍺';
  return '🍽️';
};

export const getSpotCategoryLabel = (category) => {
  const normalized =
    typeof category === 'object'
      ? normalizeSpotCategory(category)
      : (category || '').toLowerCase();
  if (normalized === 'sights') return '🏛️ Sights';
  if (normalized === 'cafes') return '☕ Cafes';
  if (normalized === 'drinks') return '🍺 Drinks';
  return '🍽️ Food';
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

// 4 Standardized Activity Category Counters: Sights (🏛️), Food (🍽️), Cafes (☕), Drinks (🍺)
export const getSightsCount = (visitedPlaces = []) =>
  visitedPlaces.reduce((sum, place) => {
    const spots = Array.isArray(place?.foodDrinks) ? place.foodDrinks : [];
    const sightSpots = spots.filter(
      (s) => normalizeSpotCategory(s) === 'sights'
    ).length;
    return sum + sightSpots;
  }, 0);

export const getFoodCount = (visitedPlaces = []) =>
  visitedPlaces.reduce((sum, place) => {
    const spots = Array.isArray(place?.foodDrinks) ? place.foodDrinks : [];
    const foodSpots = spots.filter(
      (s) => normalizeSpotCategory(s) === 'food'
    ).length;
    return sum + foodSpots;
  }, 0);

export const getCafesCount = (visitedPlaces = []) =>
  visitedPlaces.reduce((sum, place) => {
    const spots = Array.isArray(place?.foodDrinks) ? place.foodDrinks : [];
    const cafeSpots = spots.filter(
      (s) => normalizeSpotCategory(s) === 'cafes'
    ).length;
    return sum + cafeSpots;
  }, 0);

export const getDrinksCount = (visitedPlaces = []) =>
  visitedPlaces.reduce((sum, place) => {
    const spots = Array.isArray(place?.foodDrinks) ? place.foodDrinks : [];
    const drinkSpots = spots.filter(
      (s) => normalizeSpotCategory(s) === 'drinks'
    );
    const drinkSpotCount = drinkSpots.length;

    // Also include legacy standalone beers[] that aren't already counted via a spot's localBeerName or name
    const countedBeerNames = new Set();
    spots.forEach((s) => {
      if (s && typeof s === 'object') {
        if (s.localBeerName && s.localBeerName.trim()) {
          countedBeerNames.add(s.localBeerName.trim().toLowerCase());
        }
        if (normalizeSpotCategory(s) === 'drinks' && s.name && s.name.trim()) {
          countedBeerNames.add(s.name.trim().toLowerCase());
        }
      }
    });

    const extraBeersCount = Array.isArray(place?.beers)
      ? place.beers.filter(
          (b) =>
            typeof b === 'string' &&
            b.trim() &&
            !countedBeerNames.has(b.trim().toLowerCase())
        ).length
      : 0;

    const spotLocalBeersOnNonDrinkSpots = spots.filter(
      (s) =>
        s &&
        typeof s === 'object' &&
        normalizeSpotCategory(s) !== 'drinks' &&
        typeof s.localBeerName === 'string' &&
        s.localBeerName.trim()
    ).length;

    return sum + drinkSpotCount + extraBeersCount + spotLocalBeersOnNonDrinkSpots;
  }, 0);

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
 * Checks from highest to lowest (5-Star -> 4-Star -> 3-Star -> 2-Star -> 1-Star Explorer).
 */
export const evaluateStarRanking = (visitedPlaces = []) => {
  const countriesCount = getUniqueCountriesCount(visitedPlaces);
  const citiesCount = getUniqueCitiesCount(visitedPlaces);
  const islandsCount = getUniqueIslandsCount(visitedPlaces);

  // Start with 1-Star Explorer as the base rank
  let currentTier = STAR_RANKING_TIERS[STAR_RANKING_TIERS.length - 1];

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
