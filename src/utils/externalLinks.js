import { Alert, Linking, Share, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {
  getUniqueCountriesCount,
  getUniqueCitiesCount,
  getUniqueIslandsCount,
} from './categories';
import { syncPublicProfileToCloud } from '../hooks/usePinCheckData';

const STAY22_AFFILIATE_ID = 'noplancheckin';

// Short, clean live PinCheck Web URL (EAS Hosting production domain)
export const PINCHECK_WEB_BASE_URL = 'https://pincheckin.expo.app';

// Default high-reliability traveler avatar photo when user hasn't uploaded one yet
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

// Build short, clean shareable Public Profile URL
export const buildProfileShareUrl = () => {
  return PINCHECK_WEB_BASE_URL;
};

// Stay22 In-App Accommodation Search ("🏨 Find Stays")
// Uses the destination container's location name (City or Island) + parent Country (e.g. "Santorini, Greece" or "Venice, Italy")
export const openStay22 = async (place, spotName = null) => {
  const destName = (place?.city || '').trim();
  const parentCountry = (place?.country || '').trim();

  // Deduplicate if Country-level container has city === country
  const uniqueDestAndCountry =
    destName &&
    parentCountry &&
    destName.toLowerCase() === parentCountry.toLowerCase()
      ? [parentCountry]
      : [destName, parentCountry].filter(Boolean);

  const cityOrIslandAndCountry = uniqueDestAndCountry.join(', ');

  const locationParts = [spotName, ...uniqueDestAndCountry]
    .map((p) => (p || '').trim())
    .filter(Boolean);

  const targetAddress = cityOrIslandAndCountry || locationParts.join(', ');
  if (!targetAddress) {
    Alert.alert('Missing Location', 'No city, island, or country available to search stays.');
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

// Addressless Google Maps Launcher (works for a City, Island, or specific Food & Drink place)
export const openInGoogleMaps = (place, spotName = null) => {
  const destName = (place?.city || '').trim();
  const parentCountry = (place?.country || '').trim();
  const baseLocation =
    destName &&
    parentCountry &&
    destName.toLowerCase() === parentCountry.toLowerCase()
      ? parentCountry
      : [destName, parentCountry].filter(Boolean).join(', ');

  const target = spotName ? `${spotName}, ${baseLocation}` : baseLocation;
  const query = encodeURIComponent(target);
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  Linking.openURL(url).catch(() => {
    Alert.alert('Cannot Open Maps', 'Could not launch Google Maps.');
  });
};

// Open Uber (for a City, Island, or specific Food & Drink place)
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

// Open Bolt (for a City, Island, or specific Food & Drink place)
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
  profilePhoto,
  displayName,
  homeLocation,
  youtubeUrl,
  instagramUser,
  tiktokUser,
  customLinkUrl,
  customLinkLabel,
  visitedPlaces,
}) => {
  try {
    // Sync latest profile + photo + pins to cloud in background so Share sheet opens immediately
    syncPublicProfileToCloud({
      profilePhoto,
      displayName,
      homeLocation,
      youtubeUrl,
      instagramUser,
      tiktokUser,
      customLinkUrl,
      customLinkLabel,
      visitedPlaces,
    });

    const userName = (displayName || 'Traveler').trim();
    const countriesCount = getUniqueCountriesCount(visitedPlaces);
    const citiesCount = getUniqueCitiesCount(visitedPlaces);
    const islandsCount = getUniqueIslandsCount(visitedPlaces);
    const profileUrl = buildProfileShareUrl();

    const message =
      `Collect your travel stamps with me on PinCheck! ✈️📍\n` +
      `${userName}'s Map: ${countriesCount} Countries · ${citiesCount} Cities · ${islandsCount} Islands\n` +
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
