import { Alert, Linking, Share } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {
  getUniqueCountriesCount,
  getUniqueCitiesCount,
} from './categories';

const STAY22_AFFILIATE_ID = 'noplancheckin';
export const PINCHECK_APP_DOWNLOAD_URL =
  'https://expo.dev/accounts/annachris3/projects/travel-log-app/builds/ceb0bca3-59d1-414b-b3b8-02fdc5794bd8';

// Safe Social Opener
export const openSocial = (url) => {
  if (!url) return;
  const formatted = url.startsWith('http') ? url : `https://${url}`;
  Linking.openURL(formatted).catch(() => {
    Alert.alert('Cannot Open Link', 'The link could not be opened.');
  });
};

// Build shareable Public Profile URL
export const buildProfileShareUrl = ({ displayName, customLinkUrl }) => {
  if (customLinkUrl && customLinkUrl.trim()) {
    const raw = customLinkUrl.trim();
    return raw.startsWith('http') ? raw : `https://${raw}`;
  }
  const slug =
    (displayName || 'traveler')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'traveler';
  return `https://pincheck.app/u/${slug}`;
};

// Open App Download / Registration CTA ("📍 Create Your PinCheck Map")
export const openCreatePinCheckMap = async () => {
  try {
    await WebBrowser.openBrowserAsync(PINCHECK_APP_DOWNLOAD_URL);
  } catch {
    Linking.openURL(PINCHECK_APP_DOWNLOAD_URL).catch(() => {
      Alert.alert('PinCheck', 'Could not open the PinCheck registration page.');
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
  visitedPlaces,
  customLinkUrl,
}) => {
  try {
    const userName = (displayName || 'Traveler').trim();
    const countriesCount = getUniqueCountriesCount(visitedPlaces);
    const citiesCount = getUniqueCitiesCount(visitedPlaces);
    const profileUrl = buildProfileShareUrl({
      displayName: userName,
      customLinkUrl,
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

