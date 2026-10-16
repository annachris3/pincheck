// Helper utilities for City Check-ins and their nested subcategories (🍺 Beer & 🍽️ Food & Drink)

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

export const getJustVisitsCount = (visitedPlaces) =>
  visitedPlaces.filter(
    (place) =>
      (!place.beers || place.beers.length === 0) &&
      (!place.foodDrinks || place.foodDrinks.length === 0)
  ).length;
