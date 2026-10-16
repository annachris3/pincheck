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

import { usePinCheckData } from './src/hooks/usePinCheckData';
import { fetchCoordinates } from './src/utils/geocoding';
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
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Pin Form State
  const [editingPinId, setEditingPinId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('visit');
  const [venueTitle, setVenueTitle] = useState('');
  const [cityName, setCityName] = useState('');
  const [countryName, setCountryName] = useState('');
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('May');
  const [experienceNotes, setExperienceNotes] = useState('');
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

  // Open Check-in Modal for New Pin
  const openNewCheckInModal = (coords = null) => {
    setEditingPinId(null);
    setSelectedCategory('visit');
    setVenueTitle('');
    setCityName('');
    setCountryName('');
    setYear('2026');
    setMonth('May');
    setExperienceNotes('');
    setPendingCoords(coords);
    setModalVisible(true);
  };

  // Open Modal to Edit
  const openEditModal = (place) => {
    setActionSheetVisible(false);
    setEditingPinId(place.id);
    setSelectedCategory(place.category || 'visit');
    setVenueTitle(place.title || '');
    setCityName(place.city);
    setCountryName(place.country);
    setYear(place.year);
    setMonth(place.month);
    setExperienceNotes(place.notes || '');
    setPendingCoords({ lat: place.lat, lng: place.lng });
    setModalVisible(true);
  };

  // Delete Pin
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

  // Save or Update Pin
  const handleSavePin = async () => {
    if (!cityName.trim()) {
      Alert.alert('Missing Location', 'Please enter at least a city name.');
      return;
    }

    let coords = pendingCoords;
    if (!coords) {
      setIsSearchingLocation(true);
      const query = [venueTitle, cityName, countryName].filter(Boolean).join(', ');
      coords = await fetchCoordinates(query);

      // Fallback to City + Country if full venue query didn't resolve
      if (!coords && venueTitle) {
        coords = await fetchCoordinates(`${cityName}, ${countryName}`);
      }
      setIsSearchingLocation(false);

      if (!coords) {
        Alert.alert(
          'Location Not Found',
          'Could not find coordinates. Please check the spelling or add the country.'
        );
        return;
      }
    }

    const savedNotes = selectedCategory === 'beer' ? '' : experienceNotes.trim();

    let updatedList;
    if (editingPinId) {
      updatedList = visitedPlaces.map((p) =>
        p.id === editingPinId
          ? {
              ...p,
              title: venueTitle.trim() || cityName.trim(),
              city: cityName.trim(),
              country: countryName.trim() || 'Global',
              category: selectedCategory,
              year: year.trim() || '2026',
              month: month.trim() || 'General',
              notes: savedNotes,
              lat: coords.lat,
              lng: coords.lng,
            }
          : p
      );
    } else {
      const newPlace = {
        id: Date.now().toString(),
        title: venueTitle.trim() || cityName.trim(),
        city: cityName.trim(),
        country: countryName.trim() || 'Global',
        category: selectedCategory,
        year: year.trim() || '2026',
        month: month.trim() || 'General',
        notes: savedNotes,
        lat: coords.lat,
        lng: coords.lng,
      };
      updatedList = [newPlace, ...visitedPlaces];
    }

    setVisitedPlaces(updatedList);

    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'SET_MARKERS',
          places: updatedList,
          flyTo: [coords.lat, coords.lng],
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
            setActionSheetVisible(true);
          }}
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

      {/* MODAL: Place Action Sheet (Google Maps / Uber / Bolt) */}
      <ActionSheetModal
        visible={actionSheetVisible}
        selectedPlace={selectedPlace}
        onClose={() => setActionSheetVisible(false)}
        onEditPlace={openEditModal}
      />

      {/* MODAL: Check-in Form */}
      <CheckInModal
        visible={modalVisible}
        editingPinId={editingPinId}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        venueTitle={venueTitle}
        setVenueTitle={setVenueTitle}
        cityName={cityName}
        setCityName={setCityName}
        countryName={countryName}
        setCountryName={setCountryName}
        year={year}
        setYear={setYear}
        month={month}
        setMonth={setMonth}
        experienceNotes={experienceNotes}
        setExperienceNotes={setExperienceNotes}
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
        onClose={() => setProfileModalVisible(false)}
      />

      <StatusBar style="light" />
    </SafeAreaView>
  );
}