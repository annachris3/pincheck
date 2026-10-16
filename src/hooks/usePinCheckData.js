import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_PLACES_KEY,
  STORAGE_PROFILE_KEY,
  INITIAL_PLACES,
} from '../constants/defaultPlaces';

const CURRENT_SCHEMA_VERSION = 2;

// Future-proof normalizer: preserves all unknown/future fields (ratings, photos, etc.)
// and guarantees beers[] and foodDrinks[] arrays exist without losing past pins.
export const normalizeStoredPlaces = (rawList) => {
  if (!Array.isArray(rawList)) return INITIAL_PLACES;
  if (rawList.length === 0) return [];

  const isNewFormat = rawList.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      (Array.isArray(item.beers) || Array.isArray(item.foodDrinks))
  );

  if (isNewFormat) {
    return rawList.map((item, idx) => ({
      ...item, // Preserve any future fields (photos, ratings, tags, etc.)
      id: item.id || `${Date.now()}-${idx}`,
      city: (item.city || 'Unknown').trim(),
      country: (item.country || 'Global').trim(),
      year: item.year || '2026',
      month: item.month || 'May',
      lat: typeof item.lat === 'number' ? item.lat : 48.2082,
      lng: typeof item.lng === 'number' ? item.lng : 16.3738,
      beers: Array.isArray(item.beers) ? item.beers : [],
      foodDrinks: Array.isArray(item.foodDrinks) ? item.foodDrinks : [],
      schemaVersion: CURRENT_SCHEMA_VERSION,
    }));
  }

  // Migrate legacy v1 flat entries by grouping by city + country while preserving metadata
  const grouped = {};
  rawList.forEach((p, idx) => {
    if (!p || typeof p !== 'object') return;
    const city = (p.city || 'Unknown').trim();
    const country = (p.country || 'Global').trim();
    const key = `${city.toLowerCase()}_${country.toLowerCase()}`;

    if (!grouped[key]) {
      grouped[key] = {
        ...p,
        id: p.id || `${Date.now()}-${idx}`,
        city,
        country,
        year: p.year || '2026',
        month: p.month || 'May',
        lat: typeof p.lat === 'number' ? p.lat : 48.2082,
        lng: typeof p.lng === 'number' ? p.lng : 16.3738,
        beers: [],
        foodDrinks: [],
        schemaVersion: CURRENT_SCHEMA_VERSION,
      };
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
        if (!grouped[key].foodDrinks.includes(itemName)) {
          grouped[key].foodDrinks.push(itemName);
        }
      }
    }
  });

  return Object.values(grouped);
};

export function usePinCheckData() {
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

  // Visited city check-ins with nested beers[] and foodDrinks[]
  const [visitedPlaces, setVisitedPlaces] = useState(INITIAL_PLACES);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  // 1. Load data from device on app start
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedPlaces = await AsyncStorage.getItem(STORAGE_PLACES_KEY);
        if (storedPlaces !== null) {
          const parsed = JSON.parse(storedPlaces);
          // Support both raw array or versioned envelope { version, places }
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
          if (profile.profilePhoto) setProfilePhoto(profile.profilePhoto);
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

  // 2. Auto-save pins (only after initial load has finished)
  useEffect(() => {
    if (!isStorageLoaded) return;
    const savePlaces = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_PLACES_KEY,
          JSON.stringify(visitedPlaces)
        );
      } catch (e) {
        console.log('Error saving places:', e);
      }
    };
    savePlaces();
  }, [visitedPlaces, isStorageLoaded]);

  // 3. Auto-save profile details including profilePhoto (only after initial load has finished)
  useEffect(() => {
    if (!isStorageLoaded) return;
    const saveProfile = async () => {
      try {
        const profileData = {
          profilePhoto,
          displayName,
          homeLocation,
          youtubeUrl,
          instagramUser,
          tiktokUser,
          customLinkUrl,
          customLinkLabel,
          updatedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(
          STORAGE_PROFILE_KEY,
          JSON.stringify(profileData)
        );
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
    isStorageLoaded,
  ]);

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
    isStorageLoaded,
  };
}
