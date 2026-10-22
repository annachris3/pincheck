import React, { useState, useRef } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import pincheckLogo from './assets/pincheck-logo.png';

import {
  usePinCheckData,
  normalizeStoredPlaces,
} from './src/hooks/usePinCheckData';
import {
  fetchCoordinates,
  detectDestinationTypeSync,
} from './src/utils/geocoding';
import { getPlaceCitiesList } from './src/utils/categories';
import { shareProfile, openStay22 } from './src/utils/externalLinks';
import { styles } from './src/styles/styles';

import { ProfileHeader } from './src/components/ProfileHeader';
import { MapViewContainer } from './src/components/MapViewContainer';
import { TimelineView } from './src/components/TimelineView';
import { ActionSheetModal } from './src/components/ActionSheetModal';
import { CheckInModal } from './src/components/CheckInModal';
import { EditProfileModal } from './src/components/EditProfileModal';

export default function App() {
  const webViewRef = useRef(null);
  const [activeTab, setActiveTab] = useState('map'); // 'map' (main page) or 'timeline'

  // Persistent Data Hook (with cloud sync & read-only web viewer isolation)
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
    setCustomLinkUrl,
    customLinkLabel,
    setCustomLinkLabel,
    visitedPlaces,
    setVisitedPlaces,
    isStorageLoaded,
    isReadOnlyViewer,
    startNewUserMap,
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

  // Profile Picture Picker (stores base64 data URI so the photo never expires and syncs to invite page)
  const handlePickImage = async () => {
    if (isReadOnlyViewer) return;
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
      quality: 0.4,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64 && asset.base64.length < 300000) {
        setProfilePhoto(`data:image/jpeg;base64,${asset.base64}`);
      } else if (asset.uri) {
        setProfilePhoto(asset.uri);
      }
    }
  };

  // Share Profile Wrapper
  const handleShareProfile = () =>
    shareProfile({
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

  // Start a brand-new blank PinCheck map for an external visitor (never edits the owner's map!)
  const handleCreateOwnMap = async () => {
    await startNewUserMap();
    setActiveTab('map');
    if (webViewRef.current && webViewRef.current.postMessage) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'SET_MARKERS',
          places: [],
        })
      );
    }
    setProfileModalVisible(true);
  };

  // Open Check-in Modal for New Check-in
  const openNewCheckInModal = (coords = null) => {
    if (isReadOnlyViewer) return;
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
    if (isReadOnlyViewer) return;
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
    if (!editingPinId || isReadOnlyViewer) return;
    const updated = visitedPlaces.filter((p) => p.id !== editingPinId);
    setVisitedPlaces(updated);

    if (webViewRef.current && webViewRef.current.postMessage) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'SET_MARKERS',
          places: updated,
        })
      );
    }
    setModalVisible(false);
  };

  // Save or Update Country Check-in & Re-Geocode Any Changed or New Cities/Islands!
  const handleSavePin = async (
    finalCities = cities,
    finalBeers = beers,
    finalFoodDrinks = foodDrinks,
    overrideCountryName = countryName
  ) => {
    if (isReadOnlyViewer) return;
    const activeCountry = (overrideCountryName || countryName || '').trim();
    const effectiveCities =
      finalCities.length > 0
        ? finalCities
        : activeCountry
        ? [
            {
              name: activeCountry,
              type: 'country',
              year: year.trim() || '2026',
              month: month.trim() || 'May',
            },
          ]
        : [];

    if (!activeCountry && effectiveCities.length === 0) {
      Alert.alert(
        'Missing Destination',
        'Please enter a Country, City, or Island.'
      );
      return;
    }

    setIsSearchingLocation(true);

    // Ensure every city/island in effectiveCities has fresh coordinates for its current name!
    const existingCountryMatch = !editingPinId
      ? visitedPlaces.find(
          (p) =>
            (p.country || '').trim().toLowerCase() ===
            activeCountry.toLowerCase()
        )
      : null;

    const targetPinId = editingPinId || existingCountryMatch?.id || null;
    const existingPlace = targetPinId
      ? visitedPlaces.find((p) => p.id === targetPinId)
      : null;
    const existingCities = existingPlace ? getPlaceCitiesList(existingPlace) : [];

    let detectedParentCountry = activeCountry;
    const resolvedCities = [];
    for (let i = 0; i < effectiveCities.length; i++) {
      const c = effectiveCities[i];
      const cName = (typeof c === 'string' ? c : c.name || '').trim();
      if (!cName) continue;

      const cYear =
        (typeof c === 'object' && c.year ? c.year : year).trim() || '2026';
      const cMonth =
        (typeof c === 'object' && c.month ? c.month : month).trim() || 'May';
      let cType =
        typeof c === 'object' &&
        (c.type === 'island' || c.type === 'country' || c.type === 'city')
          ? c.type
          : null;

      // Check if an existing destination had the exact same name & valid coordinates
      const prevMatch = existingCities.find(
        (prev) => prev.name.trim().toLowerCase() === cName.toLowerCase()
      );

      let cLat =
        typeof c === 'object' && typeof c.lat === 'number'
          ? c.lat
          : prevMatch && typeof prevMatch.lat === 'number'
          ? prevMatch.lat
          : null;
      let cLng =
        typeof c === 'object' && typeof c.lng === 'number'
          ? c.lng
          : prevMatch && typeof prevMatch.lng === 'number'
          ? prevMatch.lng
          : null;

      // If the destination is new or its name changed, fetch fresh coordinates from OpenStreetMap!
      if (!prevMatch || cLat === null || cLng === null) {
        const query = [cName, detectedParentCountry].filter(Boolean).join(', ');
        const fetched = await fetchCoordinates(
          query,
          cName,
          detectedParentCountry
        );
        if (fetched) {
          cLat = fetched.lat;
          cLng = fetched.lng;
          if (!cType && fetched.detectedType) {
            cType = fetched.detectedType;
          }
          if (!detectedParentCountry && fetched.detectedCountry) {
            detectedParentCountry = fetched.detectedCountry;
            setCountryName(fetched.detectedCountry);
          }
        }
      }

      if (!cType) {
        cType = detectDestinationTypeSync(cName, detectedParentCountry);
      }

      if (cLat === null || cLng === null) {
        if (pendingCoords) {
          cLat = pendingCoords.lat;
          cLng = pendingCoords.lng;
        } else {
          // Fallback to country coordinates
          const countryCoords = await fetchCoordinates(
            detectedParentCountry || cName
          );
          cLat = countryCoords ? countryCoords.lat : 48.2082;
          cLng = countryCoords ? countryCoords.lng : 16.3738;
        }
      }

      resolvedCities.push({
        name: cName,
        lat: cLat,
        lng: cLng,
        year: cYear,
        month: cMonth,
        type: cType,
      });
    }

    setIsSearchingLocation(false);

    if (resolvedCities.length === 0) {
      Alert.alert(
        'Location Not Found',
        'Could not find coordinates for the entered destination. Please check the spelling.'
      );
      return;
    }

    const finalCountryName = detectedParentCountry || resolvedCities[0].name;

    const normalizedFoodDrinks = (finalFoodDrinks || []).map((spot) =>
      typeof spot === 'string'
        ? {
            name: spot,
            city: resolvedCities[0].name,
            address: `${resolvedCities[0].name}, ${finalCountryName}`,
            lat: null,
            lng: null,
            year: year.trim() || '2026',
            month: month.trim() || 'May',
          }
        : {
            ...spot,
            year: (spot.year || year || '2026').trim(),
            month: (spot.month || month || 'May').trim(),
          }
    );

    const latestCity = resolvedCities[resolvedCities.length - 1];
    const primaryCity = resolvedCities[0];

    let updatedList;
    if (editingPinId) {
      updatedList = visitedPlaces.map((p) =>
        p.id === editingPinId
          ? {
              ...p,
              country: finalCountryName,
              city: primaryCity.name,
              cities: resolvedCities,
              year: year.trim() || '2026',
              month: month.trim() || 'May',
              beers: finalBeers,
              foodDrinks: normalizedFoodDrinks,
              lat: primaryCity.lat,
              lng: primaryCity.lng,
            }
          : p
      );
    } else if (existingCountryMatch) {
      // Automatically merge repeat visit into the existing Country entry!
      const mergedCities = [...existingCities];
      resolvedCities.forEach((rc) => {
        const existingIdx = mergedCities.findIndex(
          (ec) =>
            ec.name.trim().toLowerCase() === rc.name.toLowerCase() &&
            (ec.year || existingCountryMatch.year) === rc.year &&
            (ec.month || existingCountryMatch.month).toLowerCase() ===
              rc.month.toLowerCase()
        );
        if (existingIdx === -1) {
          mergedCities.push(rc);
        } else {
          mergedCities[existingIdx] = {
            ...mergedCities[existingIdx],
            type: rc.type,
            lat: rc.lat,
            lng: rc.lng,
          };
        }
      });

      const mergedBeers = Array.from(
        new Set([...(existingCountryMatch.beers || []), ...finalBeers])
      );
      const mergedFoodDrinks = [
        ...(existingCountryMatch.foodDrinks || []),
        ...normalizedFoodDrinks,
      ];

      updatedList = visitedPlaces.map((p) =>
        p.id === existingCountryMatch.id
          ? {
              ...p,
              cities: mergedCities,
              beers: mergedBeers,
              foodDrinks: mergedFoodDrinks,
            }
          : p
      );
    } else {
      const newPlace = {
        id: Date.now().toString(),
        country: finalCountryName,
        city: primaryCity.name,
        cities: resolvedCities,
        year: year.trim() || '2026',
        month: month.trim() || 'May',
        beers: finalBeers,
        foodDrinks: normalizedFoodDrinks,
        lat: primaryCity.lat,
        lng: primaryCity.lng,
      };
      updatedList = [newPlace, ...visitedPlaces];
    }

    setVisitedPlaces(updatedList);

    if (webViewRef.current && webViewRef.current.postMessage) {
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
        if (!isReadOnlyViewer) {
          openNewCheckInModal({ lat: data.lat, lng: data.lng });
        }
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

  if (!isStorageLoaded) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: '#030b1c',
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Image
          source={pincheckLogo}
          style={{ width: 130, height: 130, borderRadius: 28, marginBottom: 16 }}
        />
        <Text
          style={{
            color: '#f8fafc',
            fontSize: 24,
            fontWeight: '900',
            letterSpacing: 0.5,
          }}
        >
          PinCheck
        </Text>
        <Text
          style={{
            color: '#38bdf8',
            fontSize: 13,
            fontWeight: '600',
            marginTop: 4,
          }}
        >
          No Plan, Just PinCheck
        </Text>
        <StatusBar style="light" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Profile Header (with World Map & Timeline/List tabs) */}
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
        onOpenProfileModal={() => {
          if (!isReadOnlyViewer) setProfileModalVisible(true);
        }}
        onShareProfile={handleShareProfile}
        readOnly={isReadOnlyViewer}
      />

      {/* 2. Main Body: World Map (main page) or Timeline & List */}
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
          onFindStays={openStay22}
          readOnly={isReadOnlyViewer}
        />
      )}

      {/* 3. Bottom Area: Sticky "📍 Create Your PinCheck Map" CTA for External Viewers OR "+ Check-in" for Map Owner */}
      {isReadOnlyViewer ? (
        <View style={styles.stickyCtaContainer}>
          <TouchableOpacity
            style={styles.stickyCtaButton}
            onPress={handleCreateOwnMap}
            activeOpacity={0.85}
          >
            <Text style={styles.stickyCtaButtonText}>
              📍 Create Your PinCheck Map
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.footerBrand}>
            <Text style={styles.footerBrandText}>
              No Plan, Just PinCheck{' '}
              <Text style={styles.footerSubText}>• by No Plan Checkin</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.fab}
            onPress={() => openNewCheckInModal()}
            activeOpacity={0.8}
          >
            <Text style={styles.fabText}>+ Check-in</Text>
          </TouchableOpacity>
        </>
      )}

      {/* MODAL: Place Action Sheet (Cities + Beers by Country + Food & Drink spots with Google Maps / Find Stays / Uber / Bolt) */}
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
        readOnly={isReadOnlyViewer}
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
        customLinkUrl={customLinkUrl}
        setCustomLinkUrl={setCustomLinkUrl}
        customLinkLabel={customLinkLabel}
        setCustomLinkLabel={setCustomLinkLabel}
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