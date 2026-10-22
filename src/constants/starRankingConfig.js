/**
 * Dedicated Star Ranking Configuration
 *
 * Store the tier numbers (country, city, and island thresholds) in this
 * dedicated configuration file rather than hard-coding them in components.
 * You can raise or lower these requirements at any time without rewriting core app logic.
 */

export const STAR_RANKING_TIERS = [
  {
    stars: 5,
    starGraphic: '⭐⭐⭐⭐⭐',
    title: 'World Legend',
    minCountries: 50,
    maxCountries: null, // 50+ Countries
    minCities: 120,
    minIslands: 25,
  },
  {
    stars: 4,
    starGraphic: '⭐⭐⭐⭐',
    title: 'Nomad',
    minCountries: 30,
    maxCountries: 49, // 30 to 49 Countries
    minCities: 75,
    minIslands: 15,
  },
  {
    stars: 3,
    starGraphic: '⭐⭐⭐',
    title: 'Globetrotter',
    minCountries: 15,
    maxCountries: 29, // 15 to 29 Countries
    minCities: 35,
    minIslands: 8,
  },
  {
    stars: 2,
    starGraphic: '⭐⭐',
    title: 'Voyager',
    minCountries: 5,
    maxCountries: 14, // 5 to 14 Countries
    minCities: 15,
    minIslands: 3,
  },
  {
    stars: 1,
    starGraphic: '⭐',
    title: 'Explorer',
    minCountries: 1,
    maxCountries: 4, // 1 to 4 Countries
    minCities: 5,
    minIslands: 1,
  },
];
