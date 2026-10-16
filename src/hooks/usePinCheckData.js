import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  STORAGE_PLACES_KEY,
  STORAGE_PROFILE_KEY,
  INITIAL_PLACES,
} from '../constants/defaultPlaces';

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

  // Visited entries with categories
  const [visitedPlaces, setVisitedPlaces] = useState(INITIAL_PLACES);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  // 1. Load data from device on app start
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedPlaces = await AsyncStorage.getItem(STORAGE_PLACES_KEY);
        if (storedPlaces !== null) {
          const parsed = JSON.parse(storedPlaces);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVisitedPlaces(parsed);
          }
        }

        const storedProfile = await AsyncStorage.getItem(STORAGE_PROFILE_KEY);
        if (storedProfile !== null) {
          const profile = JSON.parse(storedProfile);
          if (profile.displayName) setDisplayName(profile.displayName);
          if (profile.homeLocation) setHomeLocation(profile.homeLocation);
          if (profile.youtubeUrl) setYoutubeUrl(profile.youtubeUrl);
          if (profile.instagramUser) setInstagramUser(profile.instagramUser);
          if (profile.tiktokUser) setTiktokUser(profile.tiktokUser);
          if (profile.customLinkUrl) setCustomLinkUrl(profile.customLinkUrl);
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
        await AsyncStorage.setItem(STORAGE_PLACES_KEY, JSON.stringify(visitedPlaces));
      } catch (e) {
        console.log('Error saving places:', e);
      }
    };
    savePlaces();
  }, [visitedPlaces, isStorageLoaded]);

  // 3. Auto-save profile details (only after initial load has finished)
  useEffect(() => {
    if (!isStorageLoaded) return;
    const saveProfile = async () => {
      try {
        const profileData = {
          displayName,
          homeLocation,
          youtubeUrl,
          instagramUser,
          tiktokUser,
          customLinkUrl,
          customLinkLabel,
        };
        await AsyncStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profileData));
      } catch (e) {
        console.log('Error saving profile:', e);
      }
    };
    saveProfile();
  }, [
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
  };
}
