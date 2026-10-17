import { Alert, Linking, Share } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {
  getUniqueCountriesCount,
  getUniqueCitiesCount,
  getTotalBeersCount,
  getTotalFoodDrinksCount,
} from './categories';

const STAY22_AFFILIATE_ID = 'noplancheckin';

// Safe Social Opener
export const openSocial = (url) => {
  if (!url) return;
  const formatted = url.startsWith('http') ? url : `https://${url}`;
  Linking.openURL(formatted).catch(() => {
    Alert.alert('Cannot Open Link', 'The link could not be opened.');
  });
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

// Share Profile Function
export const shareProfile = async ({
  displayName,
  visitedPlaces,
  youtubeUrl,
  instagramUser,
  tiktokUser,
  customLinkUrl,
  customLinkLabel,
}) => {
  try {
    const countriesCount = getUniqueCountriesCount(visitedPlaces);
    const citiesCount = getUniqueCitiesCount(visitedPlaces);
    const beersCount = getTotalBeersCount(visitedPlaces);
    const foodDrinksCount = getTotalFoodDrinksCount(visitedPlaces);

    const linksList = [
      youtubeUrl ? `YouTube: ${youtubeUrl}` : null,
      instagramUser ? `Instagram: @${instagramUser.replace('@', '')}` : null,
      tiktokUser ? `TikTok: @${tiktokUser.replace('@', '')}` : null,
      customLinkUrl ? `${customLinkLabel}: ${customLinkUrl}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    await Share.share({
      title: `${displayName} • PinCheck`,
      message:
        `✈️ Travel Log • PinCheck\n\n` +
        `🌍 ${countriesCount} Countries | 🏙️ ${citiesCount} Cities\n` +
        `📍 ${visitedPlaces.length} Check-ins\n` +
        `🍺 ${beersCount} Local Beers Tasted\n` +
        `🍽️ ${foodDrinksCount} Food & Drink Spots` +
        (linksList ? `\n\nFollow my journey:\n${linksList}` : '') +
        `\n\nNo Plan, Just PinCheck!`,
    });
  } catch (error) {
    console.log('Share error:', error);
  }
};
