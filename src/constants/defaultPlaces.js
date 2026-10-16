export const STORAGE_PLACES_KEY = '@pincheck_visited_places';
export const STORAGE_PROFILE_KEY = '@pincheck_user_profile';

export const INITIAL_PLACES = [
  {
    id: '1',
    city: 'Zurich',
    country: 'Switzerland',
    year: '2025',
    month: 'October',
    lat: 47.3769,
    lng: 8.5417,
    beers: ['Quöllfrisch'],
    foodDrinks: [
      {
        name: 'Zeughauskeller',
        address: 'Bahnhofstrasse 28a, Altstadt, Zürich',
        lat: 47.3721,
        lng: 8.5396,
      },
    ],
  },
  {
    id: '2',
    city: 'Munich',
    country: 'Germany',
    year: '2025',
    month: 'December',
    lat: 48.1351,
    lng: 11.582,
    beers: ['Augustiner Edelstoff'],
    foodDrinks: [
      {
        name: 'Augustiner Bräustuben',
        address: 'Landsberger Straße 19, Schwanthalerhöhe, München',
        lat: 48.1396,
        lng: 11.5398,
      },
    ],
  },
  {
    id: '3',
    city: 'Vienna',
    country: 'Austria',
    year: '2026',
    month: 'March',
    lat: 48.2082,
    lng: 16.3738,
    beers: ['Ottakringer'],
    foodDrinks: [
      {
        name: 'Café Central',
        address: 'Herrengasse 14, Innere Stadt, Wien',
        lat: 48.2104,
        lng: 16.3653,
      },
      {
        name: 'Figlmüller',
        address: 'Wollzeile 5, Innere Stadt, Wien',
        lat: 48.2089,
        lng: 16.3746,
      },
    ],
  },
  {
    id: '4',
    city: 'Krakow',
    country: 'Poland',
    year: '2026',
    month: 'April',
    lat: 50.0647,
    lng: 19.945,
    beers: ['Żywiec'],
    foodDrinks: [
      {
        name: 'Pod Wawelem Kompania',
        address: 'Świętego Gertrudy 26-29, Stare Miasto, Kraków',
        lat: 50.0543,
        lng: 19.9372,
      },
    ],
  },
];
