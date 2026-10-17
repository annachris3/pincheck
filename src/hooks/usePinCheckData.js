import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_PLACES_KEY,
  STORAGE_PROFILE_KEY,
  INITIAL_PLACES,
} from '../constants/defaultPlaces';
import { getPlaceCitiesList } from '../utils/categories';

const CURRENT_SCHEMA_VERSION = 3;

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

  // 1. Load data from device on app start
  useEffect(() => {
    const loadStoredData = async () => {
      try {
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
