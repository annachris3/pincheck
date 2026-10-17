import { Alert, Linking, Share, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {
  getUniqueCountriesCount,
  getUniqueCitiesCount,
  getPlaceCitiesList,
} from './categories';

const STAY22_AFFILIATE_ID = 'noplancheckin';

// Live hosted PinCheck Web App URL (EAS Hosting production deployment)
export const PINCHECK_WEB_BASE_URL = 'https://travel-log-app.expo.app';

// Default high-reliability traveler avatar photo when user hasn't uploaded one or views on web
export const DEFAULT_TRAVELER_AVATAR =
  'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=300&q=80';

// Safe Social Opener
export const openSocial = (url) => {
  if (!url) return;
  const formatted = url.startsWith('http') ? url : `https://${url}`;
  Linking.openURL(formatted).catch(() => {
    Alert.alert('Cannot Open Link', 'The link could not be opened.');
  });
};

// Encode compact profile payload for shareable URL so external viewers see the exact user's map
export const encodeSharedProfilePayload = ({
  displayName,
  homeLocation,
  visitedPlaces,
}) => {
  try {
    const compactPlaces = (visitedPlaces || []).slice(0, 20).map((p) => ({
      c: p.country,
      y: p.year,
      m: p.month,
      ct: getPlaceCitiesList(p).map((cityObj) => cityObj.name),
      fd: Array.isArray(p.foodDrinks)
        ? p.foodDrinks.map((f) =>
            typeof f === 'string'
              ? { n: f, ct: p.city || '' }
              : { n: f.name, ct: f.city || p.city || '' }
          )
        : [],
      b: Array.isArray(p.beers) ? p.beers : [],
    }));

    const payload = {
      n: (displayName || 'Traveler').trim(),
      h: (homeLocation || '').trim(),
      p: compactPlaces,
    };

    const jsonStr = JSON.stringify(payload);
    return encodeURIComponent(jsonStr);
  } catch {
    return '';
  }
};

// Decode compact profile payload from URL query parameters on web
export const decodeSharedProfileFromUrl = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.location) {
    return null;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('public') && !window.location.pathname.startsWith('/u/')) {
      return null;
    }
    const rawData = params.get('d');
    if (!rawData) {
      return { isPublicViewer: true, sharedData: null };
    }
    const parsed = JSON.parse(decodeURIComponent(rawData));
    const places = Array.isArray(parsed.p)
      ? parsed.p.map((item, idx) => {
          const cities = Array.isArray(item.ct)
            ? item.ct.map((name) => ({ name, lat: 48.2082, lng: 16.3738 }))
            : [];
          return {
            id: `shared-${idx}`,
            country: item.c || 'Unknown',
            city: cities[0]?.name || '',
            cities,
            year: item.y || '2026',
            month: item.m || '',
            foodDrinks: Array.isArray(item.fd)
              ? item.fd.map((f) => ({
                  name: f.n,
                  city: f.ct,
                  address: '',
                }))
              : [],
            beers: Array.isArray(item.b) ? item.b : [],
          };
        })
      : null;

    return {
      isPublicViewer: true,
      sharedData: {
        displayName: parsed.n || 'Traveler',
        homeLocation: parsed.h || 'World Traveler',
        visitedPlaces: places,
      },
    };
  } catch {
    return { isPublicViewer: true, sharedData: null };
  }
};

// Build shareable Public Profile URL (always points to the live working web app)
export const buildProfileShareUrl = ({
  displayName,
  homeLocation,
  visitedPlaces,
}) => {
  const baseUrl =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    window.location?.origin
      ? window.location.origin
      : PINCHECK_WEB_BASE_URL;

  const encoded = encodeSharedProfilePayload({
    displayName,
    homeLocation,
    visitedPlaces,
  });

  if (encoded) {
    return `${baseUrl}/?public=1&d=${encoded}`;
  }
  return `${baseUrl}/?public=1`;
};

// Open App Download / Registration CTA ("📍 Create Your PinCheck Map")
export const openCreatePinCheckMap = async (onStartInApp = null) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.href = `${window.location.origin}/?create=1`;
    return;
  }
  if (typeof onStartInApp === 'function') {
    onStartInApp();
    return;
  }
  try {
    await WebBrowser.openBrowserAsync(`${PINCHECK_WEB_BASE_URL}/?create=1`);
  } catch {
    Linking.openURL(`${PINCHECK_WEB_BASE_URL}/?create=1`).catch(() => {
      Alert.alert('PinCheck', 'Could not open PinCheck.');
    });
  }
};

// Stay22 In-App Accommodation Search ("🏨 Find Stays")
export const openStay22 = async (place, spotName = null) => {
  const locationParts = [
    spotName,
    place?.city,
    place?.country,
  ]
    .map((p) => (p || '').trim())
    .filter(Boolean);

  // Combine city + country (e.g. "Vienna, Austria"), or fall back to available geographic data
  const cityAndCountry = [place?.city, place?.country]
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join(', ');

  const targetAddress = cityAndCountry || locationParts.join(', ');
  if (!targetAddress) {
    Alert.alert('Missing Location', 'No city or country available to search stays.');
    return;
  }

  const encodedAddress = encodeURIComponent(targetAddress);
  const url = `https://www.stay22.com/embed/gm?aid=${STAY22_AFFILIATE_ID}&address=${encodedAddress}`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    Linking.openURL(url).catch(() => {
      Alert.alert('Cannot Open Stays', 'Could not launch Stay22.');
    });
  }
};

// Addressless Google Maps Launcher (works for a City or a specific Food & Drink place inside that City)
export const openInGoogleMaps = (place, spotName = null) => {
  const target = spotName
    ? `${spotName}, ${place.city}, ${place.country}`
    : `${place.city}, ${place.country}`;
  const query = encodeURIComponent(target);
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  Linking.openURL(url).catch(() => {
    Alert.alert('Cannot Open Maps', 'Could not launch Google Maps.');
  });
};

// Open Uber (for a City or a specific Food & Drink place)
export const openUber = (place, spotName = null) => {
  const label = spotName
    ? `${spotName}, ${place.city}`
    : `${place.city}, ${place.country}`;
  const nickname = encodeURIComponent(label);
  const uberAppUrl = `uber://?action=setPickup&dropoff[latitude]=${place.lat}&dropoff[longitude]=${place.lng}&dropoff[nickname]=${nickname}`;
  const uberWebUrl = `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${place.lat}&dropoff[longitude]=${place.lng}&dropoff[nickname]=${nickname}`;

  Linking.canOpenURL(uberAppUrl)
    .then((supported) => {
      if (supported) {
        Linking.openURL(uberAppUrl);
      } else {
        Linking.openURL(uberWebUrl);
      }
    })
    .catch(() => Linking.openURL(uberWebUrl));
};

// Open Bolt (for a City or a specific Food & Drink place)
export const openBolt = (place) => {
  const boltAppUrl = `bolt://rides?destination_lat=${place.lat}&destination_lng=${place.lng}`;
  const boltWebUrl = 'https://bolt.eu';

  Linking.canOpenURL(boltAppUrl)
    .then((supported) => {
      if (supported) {
        Linking.openURL(boltAppUrl);
      } else {
        Linking.openURL(boltWebUrl);
      }
    })
    .catch(() => Linking.openURL(boltWebUrl));
};

// Share Profile Function (Profile Screen In-App Share Trigger)
export const shareProfile = async ({
  displayName,
  homeLocation,
  visitedPlaces,
}) => {
  try {
    const userName = (displayName || 'Traveler').trim();
    const countriesCount = getUniqueCountriesCount(visitedPlaces);
    const citiesCount = getUniqueCitiesCount(visitedPlaces);
    const profileUrl = buildProfileShareUrl({
      displayName: userName,
      homeLocation,
      visitedPlaces,
    });

    const message =
      `Collect your travel stamps with me on PinCheck! ✈️📍\n` +
      `${userName}'s Map: ${countriesCount} Countries · ${citiesCount} Cities\n` +
      `See my map & start your own collection: ${profileUrl}`;

    await Share.share({
      title: `${userName}'s Map • PinCheck`,
      message,
      url: profileUrl,
    });
  } catch (error) {
    console.log('Share error:', error);
  }
};
