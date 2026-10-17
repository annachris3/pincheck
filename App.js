import React, { useState, useRef } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';

import {
  usePinCheckData,
  normalizeStoredPlaces,
} from './src/hooks/usePinCheckData';
import { fetchCoordinates } from './src/utils/geocoding';
import { getPlaceCitiesList } from './src/utils/categories';
import { shareProfile } from './src/utils/externalLinks';
import { styles } from './src/styles/styles';

import { ProfileHeader } from './src/components/ProfileHeader';
import { MapViewContainer } from './src/components/MapViewContainer';
import { TimelineView } from './src/components/TimelineView';
import { ActionSheetModal } from './src/components/ActionSheetModal';
import { CheckInModal } from './src/components/CheckInModal';
import { EditProfileModal } from './src/components/EditProfileModal';

export default function App() {
  const webViewRef = useRef(null);
  const [activeTab, setActiveTab] = useState('map'); // 'map' or 'timeline'

  // Persistent Data Hook
  const {
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
    customLinkLabel,
    visitedPlaces,
    setVisitedPlaces,
  } = usePinCheckData();

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedSpotName, setSelectedSpotName] = useState(null);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Country & Multi-City Check-in Form State
  const [editingPinId, setEditingPinId] = useState(null);
  const [countryName, setCountryName] = useState('');
  const [cities, setCities] = useState([]);
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('May');
  const [beers, setBeers] = useState([]);
  const [foodDrinks, setFoodDrinks] = useState([]);
  const [pendingCoords, setPendingCoords] = useState(null);

  // Profile Picture Picker
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Needed',
        'Please grant access to your photo library to select a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfilePhoto(result.assets[0].uri);
    }
  };

  // Share Profile Wrapper
  const handleShareProfile = () =>
    shareProfile({
      displayName,
      visitedPlaces,
      youtubeUrl,
      instagramUser,
      tiktokUser,
      customLinkUrl,
      customLinkLabel,
    });

  // Open Check-in Modal for New Check-in
  const openNewCheckInModal = (coords = null) => {
    setEditingPinId(null);
    setCountryName('');
    setCities([]);
    setYear('2026');
    setMonth('May');
    setBeers([]);
    setFoodDrinks([]);
    setPendingCoords(coords);
    setModalVisible(true);
  };

  // Open Modal to Edit existing Country Check-in (add/edit cities, beers, or food & drink spots)
  const openEditModal = (place) => {
    setActionSheetVisible(false);
    setSelectedSpotName(null);
    setEditingPinId(place.id);
    setCountryName(place.country || '');
    setCities(getPlaceCitiesList(place));
    setYear(place.year || '2026');
    setMonth(place.month || 'May');
    setBeers(Array.isArray(place.beers) ? place.beers : []);
    setFoodDrinks(Array.isArray(place.foodDrinks) ? place.foodDrinks : []);
    setPendingCoords(null);
    setModalVisible(true);
  };

  // Delete Check-in
  const handleDeletePin = () => {
    if (!editingPinId) return;
    const updated = visitedPlaces.filter((p) => p.id !== editingPinId);
    setVisitedPlaces(updated);

    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'SET_MARKERS',
          places: updated,
        })
      );
    }
    setModalVisible(false);
  };

  // Save or Update Country Check-in & Re-Geocode Any Changed or New Cities!
  const handleSavePin = async (
    finalCities = cities,
    finalBeers = beers,
    finalFoodDrinks = foodDrinks
  ) => {
    if (!countryName.trim() || finalCities.length === 0) {
      Alert.alert(
        'Missing Destination',
        'Please enter the Country and add at least one City.'
      );
      return;
    }

    setIsSearchingLocation(true);

    // Ensure every city in finalCities has fresh coordinates for its current name!
    const existingPlace = editingPinId
      ? visitedPlaces.find((p) => p.id === editingPinId)
      : null;
    const existingCities = existingPlace ? getPlaceCitiesList(existingPlace) : [];

    const resolvedCities = [];
    for (let i = 0; i < finalCities.length; i++) {
      const c = finalCities[i];
      const cName = (typeof c === 'string' ? c : c.name || '').trim();
      if (!cName) continue;

      // Check if an existing city had the exact same name & valid coordinates
      const prevMatch = existingCities.find(
        (prev) => prev.name.trim().toLowerCase() === cName.toLowerCase()
      );

      let cLat = typeof c === 'object' && typeof c.lat === 'number' ? c.lat : null;
      let cLng = typeof c === 'object' && typeof c.lng === 'number' ? c.lng : null;

      // If the city is new or its name changed, fetch fresh coordinates from OpenStreetMap!
      if (!prevMatch || cLat === null || cLng === null) {
        const fetched = await fetchCoordinates(
          `${cName}, ${countryName.trim()}`
        );
        if (fetched) {
          cLat = fetched.lat;
          cLng = fetched.lng;
        }
      }

      if (cLat === null || cLng === null) {
        if (pendingCoords) {
          cLat = pendingCoords.lat;
          cLng = pendingCoords.lng;
        } else {
          // Fallback to country coordinates
          const countryCoords = await fetchCoordinates(countryName.trim());
          cLat = countryCoords ? countryCoords.lat : 48.2082;
          cLng = countryCoords ? countryCoords.lng : 16.3738;
        }
      }

      resolvedCities.push({
        name: cName,
        lat: cLat,
        lng: cLng,
      });
    }

    setIsSearchingLocation(false);

    if (resolvedCities.length === 0) {
      Alert.alert(
        'Location Not Found',
        'Could not find coordinates for the entered city. Please check the spelling.'
      );
      return;
    }

    const latestCity = resolvedCities[resolvedCities.length - 1];
    const primaryCity = resolvedCities[0];

    let updatedList;
    if (editingPinId) {
      updatedList = visitedPlaces.map((p) =>
        p.id === editingPinId
          ? {
              ...p,
              country: countryName.trim(),
              city: primaryCity.name,
              cities: resolvedCities,
              year: year.trim() || '2026',
              month: month.trim() || 'May',
              beers: finalBeers,
              foodDrinks: finalFoodDrinks,
              lat: primaryCity.lat,
              lng: primaryCity.lng,
            }
          : p
      );
    } else {
      const newPlace = {
        id: Date.now().toString(),
        country: countryName.trim(),
        city: primaryCity.name,
        cities: resolvedCities,
        year: year.trim() || '2026',
        month: month.trim() || 'May',
        beers: finalBeers,
        foodDrinks: finalFoodDrinks,
        lat: primaryCity.lat,
        lng: primaryCity.lng,
      };
      updatedList = [newPlace, ...visitedPlaces];
    }

    setVisitedPlaces(updatedList);

    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'SET_MARKERS',
          places: updatedList,
          flyTo: [latestCity.lat, latestCity.lng],
        })
      );
    }

    setModalVisible(false);
  };

  // Handle messages from Leaflet map
  const onMapMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_CLICK') {
        openNewCheckInModal({ lat: data.lat, lng: data.lng });
      } else if (data.type === 'MARKER_CLICK') {
        const place = visitedPlaces.find((p) => p.id === data.placeId);
        if (place) {
          setSelectedPlace(place);
          setSelectedSpotName(data.spotName || null);
          setActionSheetVisible(true);
        }
      }
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Profile Header */}
      <ProfileHeader
        profilePhoto={profilePhoto}
        displayName={displayName}
        homeLocation={homeLocation}
        youtubeUrl={youtubeUrl}
        instagramUser={instagramUser}
        tiktokUser={tiktokUser}
        customLinkUrl={customLinkUrl}
        customLinkLabel={customLinkLabel}
        visitedPlaces={visitedPlaces}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPickImage={handlePickImage}
        onOpenProfileModal={() => setProfileModalVisible(true)}
        onShareProfile={handleShareProfile}
      />

      {/* 2. Main Body */}
      {activeTab === 'map' ? (
        <MapViewContainer
          webViewRef={webViewRef}
          visitedPlaces={visitedPlaces}
          onMapMessage={onMapMessage}
        />
      ) : (
        <TimelineView
          visitedPlaces={visitedPlaces}
          onSelectPlace={(item) => {
            setSelectedPlace(item);
            setSelectedSpotName(null);
            setActionSheetVisible(true);
          }}
          onSelectFoodSpot={(item, spotName) => {
            setSelectedPlace(item);
            setSelectedSpotName(spotName);
            setActionSheetVisible(true);
          }}
          onEditPlace={openEditModal}
        />
      )}

      {/* 3. Bottom Signature Logo */}
      <View style={styles.footerBrand}>
        <Text style={styles.footerBrandText}>
          No Plan, Just PinCheck <Text style={styles.footerSubText}>• by No Plan Checkin</Text>
        </Text>
      </View>

      {/* Floating Add Check-in Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => openNewCheckInModal()}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+ Check-in</Text>
      </TouchableOpacity>

      {/* MODAL: Place Action Sheet (Cities + Beers by Country + Food & Drink spots with Google Maps / Uber / Bolt) */}
      <ActionSheetModal
        visible={actionSheetVisible}
        selectedPlace={selectedPlace}
        selectedSpotName={selectedSpotName}
        onSelectSpotName={setSelectedSpotName}
        onClose={() => {
          setActionSheetVisible(false);
          setSelectedSpotName(null);
        }}
        onEditPlace={openEditModal}
      />

      {/* MODAL: Check-in Form */}
      <CheckInModal
        visible={modalVisible}
        editingPinId={editingPinId}
        countryName={countryName}
        setCountryName={setCountryName}
        cities={cities}
        setCities={setCities}
        year={year}
        setYear={setYear}
        month={month}
        setMonth={setMonth}
        beers={beers}
        setBeers={setBeers}
        foodDrinks={foodDrinks}
        setFoodDrinks={setFoodDrinks}
        isSearchingLocation={isSearchingLocation}
        onClose={() => setModalVisible(false)}
        onSave={handleSavePin}
        onDelete={handleDeletePin}
      />

      {/* MODAL: Edit Profile */}
      <EditProfileModal
        visible={profileModalVisible}
        displayName={displayName}
        setDisplayName={setDisplayName}
        homeLocation={homeLocation}
        setHomeLocation={setHomeLocation}
        youtubeUrl={youtubeUrl}
        setYoutubeUrl={setYoutubeUrl}
        instagramUser={instagramUser}
        setInstagramUser={setInstagramUser}
        tiktokUser={tiktokUser}
        setTiktokUser={setTiktokUser}
        visitedPlaces={visitedPlaces}
        onImportPlaces={(imported) => {
          const normalized = normalizeStoredPlaces(imported);
          setVisitedPlaces(normalized);
        }}
        onClose={() => setProfileModalVisible(false)}
      />

      <StatusBar style="light" />
    </SafeAreaView>
  );
}