import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_PLACES_KEY,
  STORAGE_PROFILE_KEY,
  INITIAL_PLACES,
} from '../constants/defaultPlaces';
import {
  getPlaceCitiesList,
  evaluateStarRanking,
} from '../utils/categories';

const CURRENT_SCHEMA_VERSION = 3;
export const CLOUD_SYNC_TOPIC_URL = 'https://ntfy.sh/pincheckin_anna_sync_v2';

const GUEST_PLACES_KEY = '@pincheck_guest_places_v1';
const GUEST_PROFILE_KEY = '@pincheck_guest_profile_v1';

// Helper to convert local file:// URI on phone to base64 data URI only if compact (< 300KB)
const convertFileUriToDataUrl = async (uri) => {
  if (!uri || typeof uri !== 'string' || uri.startsWith('data:') || uri.startsWith('http')) {
    return uri;
  }
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    if (blob.size > 220000) {
      return uri;
    }
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(typeof reader.result === 'string' ? reader.result : uri);
      };
      reader.onerror = () => resolve(uri);
      reader.readAsDataURL(blob);
    });
  } catch {
    return uri;
  }
};

// Sync owner's profile + photo + pins to cloud (non-blocking) so https://pincheckin.expo.app stays up to date
export const syncPublicProfileToCloud = async (profilePayload) => {
  if (Platform.OS === 'web') return;
  try {
    const safePhoto =
      typeof profilePayload.profilePhoto === 'string' &&
      profilePayload.profilePhoto.length < 400000 &&
      !profilePayload.profilePhoto.startsWith('file:')
        ? profilePayload.profilePhoto
        : null;

    await fetch(CLOUD_SYNC_TOPIC_URL, {
      method: 'POST',
      headers: {
        Filename: 'profile.json',
      },
      body: JSON.stringify({
        ...profilePayload,
        profilePhoto: safePhoto,
        updatedAt: new Date().toISOString(),
      }),
    });
  } catch (e) {
    console.log('Cloud sync skipped:', e);
  }
};

// Fetch latest synced owner profile + photo + pins on web
const fetchPublicProfileFromCloud = async () => {
  try {
    const response = await fetch(
      `${CLOUD_SYNC_TOPIC_URL}/json?poll=1&since=all`
    );
    if (!response.ok) return null;
    const text = await response.text();
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return null;

    const latestEvent = JSON.parse(lines[lines.length - 1]);
    if (latestEvent?.attachment?.url) {
      const fileRes = await fetch(latestEvent.attachment.url);
      if (fileRes.ok) {
        return await fileRes.json();
      }
    }
    if (latestEvent?.message) {
      return JSON.parse(latestEvent.message);
    }
    return null;
  } catch {
    return null;
  }
};

// Future-proof normalizer: supports multiple cities per country check-in (`cities: [{ name, lat, lng }]`)
// while preserving all existing pins, beers, and foodDrinks.
export const normalizeStoredPlaces = (rawList) => {
  if (!Array.isArray(rawList)) return INITIAL_PLACES;
  if (rawList.length === 0) return [];

  const isMultiCityFormat = rawList.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      (Array.isArray(item.beers) ||
        Array.isArray(item.foodDrinks) ||
        Array.isArray(item.cities))
  );

  if (isMultiCityFormat) {
    return rawList.map((item, idx) => {
      const cities = getPlaceCitiesList(item);
      const primaryCity = cities[0] || {
        name: item.city || 'Unknown',
        lat: typeof item.lat === 'number' ? item.lat : 48.2082,
        lng: typeof item.lng === 'number' ? item.lng : 16.3738,
      };

      return {
        ...item,
        id: item.id || `${Date.now()}-${idx}`,
        country: (item.country || 'Global').trim(),
        city: primaryCity.name,
        cities,
        year: item.year || '2026',
        month: item.month || 'May',
        lat: primaryCity.lat,
        lng: primaryCity.lng,
        beers: Array.isArray(item.beers) ? item.beers : [],
        foodDrinks: Array.isArray(item.foodDrinks) ? item.foodDrinks : [],
        schemaVersion: CURRENT_SCHEMA_VERSION,
      };
    });
  }

  // Migrate legacy v1 flat entries by grouping by country + year
  const grouped = {};
  rawList.forEach((p, idx) => {
    if (!p || typeof p !== 'object') return;
    const city = (p.city || 'Unknown').trim();
    const country = (p.country || 'Global').trim();
    const key = country.toLowerCase();

    if (!grouped[key]) {
      grouped[key] = {
        ...p,
        id: p.id || `${Date.now()}-${idx}`,
        country,
        city,
        cities: [
          {
            name: city,
            lat: typeof p.lat === 'number' ? p.lat : 48.2082,
            lng: typeof p.lng === 'number' ? p.lng : 16.3738,
          },
        ],
        year: p.year || '2026',
        month: p.month || 'May',
        lat: typeof p.lat === 'number' ? p.lat : 48.2082,
        lng: typeof p.lng === 'number' ? p.lng : 16.3738,
        beers: [],
        foodDrinks: [],
        schemaVersion: CURRENT_SCHEMA_VERSION,
      };
    } else {
      const exists = grouped[key].cities.some(
        (c) => c.name.toLowerCase() === city.toLowerCase()
      );
      if (!exists) {
        grouped[key].cities.push({
          name: city,
          lat: typeof p.lat === 'number' ? p.lat : grouped[key].lat,
          lng: typeof p.lng === 'number' ? p.lng : grouped[key].lng,
        });
      }
    }

    const itemName = (p.title || '').trim();
    if (itemName && itemName.toLowerCase() !== city.toLowerCase()) {
      if (p.category === 'beer') {
        if (!grouped[key].beers.includes(itemName)) {
          grouped[key].beers.push(itemName);
        }
      } else if (
        p.category === 'restaurant' ||
        p.category === 'food' ||
        p.category === 'cafe'
      ) {
        grouped[key].foodDrinks.push({
          name: itemName,
          city,
          address: `${city}, ${country}`,
          lat: typeof p.lat === 'number' ? p.lat : null,
          lng: typeof p.lng === 'number' ? p.lng : null,
        });
      }
    }
  });

  return Object.values(grouped);
};

export function usePinCheckData() {
  // On web, visitors start in read-only Public Viewer mode unless they click "📍 Create Your PinCheck Map"
  const [isReadOnlyViewer, setIsReadOnlyViewer] = useState(
    Platform.OS === 'web'
  );
  const [isGuestCreator, setIsGuestCreator] = useState(false);

  // Profile State
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [displayName, setDisplayName] = useState('Anna');
  const [homeLocation, setHomeLocation] = useState('Linz, Austria');

  // Social Links
  const [youtubeUrl, setYoutubeUrl] = useState('https://youtube.com/@noplancheckin');
  const [instagramUser, setInstagramUser] = useState('');
  const [tiktokUser, setTiktokUser] = useState('');

  // Custom Link State (Linktree / Website / Blog)
  const [customLinkUrl, setCustomLinkUrl] = useState('');
  const [customLinkLabel, setCustomLinkLabel] = useState('My Link');

  // Visited country/city check-ins with nested cities[], beers[], and foodDrinks[]
  const [visitedPlaces, setVisitedPlaces] = useState(INITIAL_PLACES);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  // Switch a web visitor from Read-Only view of the shared map into their OWN brand-new blank PinCheck map
  const startNewUserMap = useCallback(async () => {
    setIsReadOnlyViewer(false);
    setIsGuestCreator(true);
    setProfilePhoto(null);
    setDisplayName('My Travel Map');
    setHomeLocation('Your City, Country');
    setYoutubeUrl('');
    setInstagramUser('');
    setTiktokUser('');
    setCustomLinkUrl('');
    setCustomLinkLabel('My Link');
    setVisitedPlaces([]);
    try {
      await AsyncStorage.removeItem(GUEST_PLACES_KEY);
      await AsyncStorage.removeItem(GUEST_PROFILE_KEY);
    } catch {}
  }, []);

  // 1. Load data on start
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        // WEB PUBLIC VIEWER: Fetch the owner's live shared profile (photo, name, pins) from cloud
        if (Platform.OS === 'web') {
          try {
            const cloud = await fetchPublicProfileFromCloud();
            if (cloud) {
              if (cloud.profilePhoto) setProfilePhoto(cloud.profilePhoto);
              if (cloud.displayName) setDisplayName(cloud.displayName);
              if (cloud.homeLocation) setHomeLocation(cloud.homeLocation);
              if (cloud.youtubeUrl !== undefined) setYoutubeUrl(cloud.youtubeUrl);
              if (cloud.instagramUser !== undefined) setInstagramUser(cloud.instagramUser);
              if (cloud.tiktokUser !== undefined) setTiktokUser(cloud.tiktokUser);
              if (cloud.customLinkUrl !== undefined) setCustomLinkUrl(cloud.customLinkUrl);
              if (cloud.customLinkLabel) setCustomLinkLabel(cloud.customLinkLabel);
              if (Array.isArray(cloud.visitedPlaces) && cloud.visitedPlaces.length > 0) {
                setVisitedPlaces(normalizeStoredPlaces(cloud.visitedPlaces));
              }
            }
          } catch (err) {
            console.log('Could not fetch cloud profile:', err);
          } finally {
            setIsStorageLoaded(true);
          }
          return;
        }

        // NATIVE APP: Load from local AsyncStorage
        const storedPlaces = await AsyncStorage.getItem(STORAGE_PLACES_KEY);
        if (storedPlaces !== null) {
          const parsed = JSON.parse(storedPlaces);
          const placesArray = Array.isArray(parsed)
            ? parsed
            : parsed && Array.isArray(parsed.places)
            ? parsed.places
            : null;

          if (placesArray && placesArray.length > 0) {
            setVisitedPlaces(normalizeStoredPlaces(placesArray));
          }
        }

        const storedProfile = await AsyncStorage.getItem(STORAGE_PROFILE_KEY);
        if (storedProfile !== null) {
          const profile = JSON.parse(storedProfile);
          if (profile.profilePhoto) {
            const dataUrl = await convertFileUriToDataUrl(profile.profilePhoto);
            setProfilePhoto(dataUrl);
          }
          if (profile.displayName) setDisplayName(profile.displayName);
          if (profile.homeLocation) setHomeLocation(profile.homeLocation);
          if (profile.youtubeUrl !== undefined) setYoutubeUrl(profile.youtubeUrl);
          if (profile.instagramUser !== undefined) setInstagramUser(profile.instagramUser);
          if (profile.tiktokUser !== undefined) setTiktokUser(profile.tiktokUser);
          if (profile.customLinkUrl !== undefined) setCustomLinkUrl(profile.customLinkUrl);
          if (profile.customLinkLabel) setCustomLinkLabel(profile.customLinkLabel);
        }
      } catch (e) {
        console.log('Error loading data from storage:', e);
      } finally {
        setIsStorageLoaded(true);
      }
    };

    loadStoredData();
  }, []);

  // 2. Auto-save pins & sync to cloud (never overwrite owner's data if web viewer!)
  useEffect(() => {
    if (!isStorageLoaded) return;
    if (Platform.OS === 'web' && isReadOnlyViewer) return;

    const targetPlacesKey =
      Platform.OS === 'web' && isGuestCreator
        ? GUEST_PLACES_KEY
        : STORAGE_PLACES_KEY;

    const savePlaces = async () => {
      try {
        await AsyncStorage.setItem(
          targetPlacesKey,
          JSON.stringify(visitedPlaces)
        );
      } catch (e) {
        console.log('Error saving places:', e);
      }
    };
    savePlaces();
  }, [visitedPlaces, isStorageLoaded, isReadOnlyViewer, isGuestCreator]);

  // 3. Auto-save profile details & sync owner's live profile + photo + pins to cloud
  useEffect(() => {
    if (!isStorageLoaded) return;
    if (Platform.OS === 'web' && isReadOnlyViewer) return;

    const targetProfileKey =
      Platform.OS === 'web' && isGuestCreator
        ? GUEST_PROFILE_KEY
        : STORAGE_PROFILE_KEY;

    const saveProfile = async () => {
      try {
        const starRanking = evaluateStarRanking(visitedPlaces);
        const profileData = {
          profilePhoto,
          displayName,
          homeLocation,
          youtubeUrl,
          instagramUser,
          tiktokUser,
          customLinkUrl,
          customLinkLabel,
          starLevel: starRanking.starLevel,
          starTitle: starRanking.starTitle,
          starGraphic: starRanking.starGraphic,
          starProgressHint: starRanking.progressHint,
          updatedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(
          targetProfileKey,
          JSON.stringify(profileData)
        );

        // If on owner's native phone app, also sync to cloud so https://pincheckin.expo.app has latest photo, star rank & pins
        if (Platform.OS !== 'web') {
          await syncPublicProfileToCloud({
            ...profileData,
            visitedPlaces,
          });
        }
      } catch (e) {
        console.log('Error saving profile:', e);
      }
    };
    saveProfile();
  }, [
    profilePhoto,
    displayName,
    homeLocation,
    youtubeUrl,
    instagramUser,
    tiktokUser,
    customLinkUrl,
    customLinkLabel,
    visitedPlaces,
    isStorageLoaded,
    isReadOnlyViewer,
    isGuestCreator,
  ]);

  // Automatically evaluated Star Ranking whenever destinations/pins are added, edited, or deleted
  const starRanking = evaluateStarRanking(visitedPlaces);

  return {
    profilePhoto,
    setProfilePhoto,
    displayName,
    setDisplayName,
    homeLocation,
    setHomeLocation,
    youtubeUrl,
    setYoutubeUrl,
    instagramUser,
    setInstagramUser,
    tiktokUser,
    setTiktokUser,
    customLinkUrl,
    setCustomLinkUrl,
    customLinkLabel,
    setCustomLinkLabel,
    visitedPlaces,
    setVisitedPlaces,
    starLevel: starRanking.starLevel,
    starTitle: starRanking.starTitle,
    starGraphic: starRanking.starGraphic,
    starProgressHint: starRanking.progressHint,
    starRanking,
    isStorageLoaded,
    isReadOnlyViewer,
    isGuestCreator,
    startNewUserMap,
  };
}
