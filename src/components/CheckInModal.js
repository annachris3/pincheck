import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { styles } from '../styles/styles';
import {
  fetchCoordinates,
  searchVenueInCity,
  detectDestinationTypeSync,
} from '../utils/geocoding';
import { getDestinationEmoji } from '../utils/categories';

export function CheckInModal({
  visible,
  editingPinId,
  countryName,
  setCountryName,
  cities,
  setCities,
  year,
  setYear,
  month,
  setMonth,
  beers,
  setBeers,
  foodDrinks,
  setFoodDrinks,
  isSearchingLocation,
  onClose,
  onSave,
  onDelete,
}) {
  // Active tab inside the check-in: 'visit' | 'beer' | 'food'
  const [activeSubTab, setActiveSubTab] = useState('visit');
  const [cityInput, setCityInput] = useState('');
  const [destinationType, setDestinationType] = useState('city'); // 'city' | 'island' | 'country'
  const [manualTypeOverride, setManualTypeOverride] = useState(false);
  const [editingCityIndex, setEditingCityIndex] = useState(null);
  const [isLookingUpCity, setIsLookingUpCity] = useState(false);

  const [beerInput, setBeerInput] = useState('');
  const [foodDrinkInput, setFoodDrinkInput] = useState('');
  const [localBeerInput, setLocalBeerInput] = useState('');
  const [foodMonthInput, setFoodMonthInput] = useState('');
  const [foodYearInput, setFoodYearInput] = useState('');
  const [selectedFoodCity, setSelectedFoodCity] = useState('');
  const [isLookingUpSpot, setIsLookingUpSpot] = useState(false);

  // Smart Auto-Detection as user types a destination name (unless manually overridden)
  const handleCityInputChange = (text) => {
    setCityInput(text);
    if (!manualTypeOverride) {
      const autoType = detectDestinationTypeSync(text, countryName);
      setDestinationType(autoType);
    }
  };

  // Manual Override: Always accept the user's choice without warning/error
  const handleSelectDestinationType = (newType) => {
    setDestinationType(newType);
    setManualTypeOverride(true);

    // If user is currently editing an existing destination chip, update its type immediately too
    if (editingCityIndex !== null) {
      const updated = cities.map((c, idx) => {
        if (idx !== editingCityIndex) return c;
        const cObj =
          typeof c === 'string'
            ? { name: c, lat: null, lng: null, year, month }
            : c;
        return { ...cObj, type: newType };
      });
      setCities(updated);
    }
  };

  // Add or update a Destination (City, Island, or Country)
  const handleAddOrUpdateCity = async () => {
    const trimmedCity =
      cityInput.trim() ||
      (destinationType === 'country' ? countryName.trim() : '');
    if (!trimmedCity) return;

    setIsLookingUpCity(true);
    const query = [trimmedCity, countryName.trim()].filter(Boolean).join(', ');
    const coords = await fetchCoordinates(
      query,
      trimmedCity,
      countryName.trim()
    );
    setIsLookingUpCity(false);

    // Use manual override if user tapped a button; otherwise use smart auto-detected classification
    const finalType = manualTypeOverride
      ? destinationType
      : coords?.detectedType ||
        detectDestinationTypeSync(trimmedCity, countryName);

    if (!countryName.trim() && coords?.detectedCountry) {
      setCountryName(coords.detectedCountry);
    }

    const cityObj = {
      name: trimmedCity,
      lat: coords ? coords.lat : null,
      lng: coords ? coords.lng : null,
      year: year.trim() || '2026',
      month: month.trim() || 'May',
      type: finalType,
    };

    if (editingCityIndex !== null) {
      const updated = cities.map((c, idx) =>
        idx === editingCityIndex ? cityObj : c
      );
      setCities(updated);
      setEditingCityIndex(null);
    } else {
      setCities([...cities, cityObj]);
    }
    setCityInput('');
    setDestinationType('city');
    setManualTypeOverride(false);
  };

  const handleStartEditCity = (index) => {
    const c = cities[index];
    const cName = typeof c === 'string' ? c : c.name;
    const cType =
      typeof c === 'object' && c.type
        ? c.type
        : detectDestinationTypeSync(cName, countryName);
    setCityInput(cName);
    setDestinationType(cType);
    setManualTypeOverride(true);
    if (typeof c === 'object') {
      if (c.year) setYear(c.year);
      if (c.month) setMonth(c.month);
    }
    setEditingCityIndex(index);
  };

  const handleRemoveCity = (index) => {
    setCities(cities.filter((_, i) => i !== index));
    if (editingCityIndex === index) {
      setEditingCityIndex(null);
      setCityInput('');
      setDestinationType('city');
      setManualTypeOverride(false);
    }
  };

  const handleAddBeer = () => {
    const trimmed = beerInput.trim();
    if (!trimmed) return;
    setBeers([...beers, trimmed]);
    setBeerInput('');
  };

  const handleRemoveBeer = (index) => {
    setBeers(beers.filter((_, i) => i !== index));
  };

  // Automatically looks up the address + exact coordinates + saves Month & Year for the Food & Drink spot!
  const handleAddFoodDrink = async () => {
    const trimmed = foodDrinkInput.trim();
    if (!trimmed) return;

    const activeCityName =
      selectedFoodCity ||
      (cities.length > 0
        ? typeof cities[0] === 'string'
          ? cities[0]
          : cities[0].name
        : cityInput.trim() || countryName.trim());

    const spotYear = foodYearInput.trim() || year.trim() || '2026';
    const spotMonth = foodMonthInput.trim() || month.trim() || 'May';
    const spotLocalBeer = localBeerInput.trim();

    setIsLookingUpSpot(true);
    const resolved = await searchVenueInCity(
      trimmed,
      activeCityName,
      countryName.trim()
    );
    setIsLookingUpSpot(false);

    if (resolved) {
      setFoodDrinks([
        ...foodDrinks,
        {
          ...resolved,
          city: activeCityName,
          year: spotYear,
          month: spotMonth,
          localBeerName: spotLocalBeer || '',
        },
      ]);
    } else {
      setFoodDrinks([
        ...foodDrinks,
        {
          name: trimmed,
          city: activeCityName,
          address: [activeCityName, countryName.trim()]
            .filter(Boolean)
            .join(', '),
          lat: null,
          lng: null,
          year: spotYear,
          month: spotMonth,
          localBeerName: spotLocalBeer || '',
        },
      ]);
    }
    if (
      spotLocalBeer &&
      !beers.some((b) => b.trim().toLowerCase() === spotLocalBeer.toLowerCase())
    ) {
      setBeers([...beers, spotLocalBeer]);
    }
    setFoodDrinkInput('');
    setLocalBeerInput('');
    setFoodMonthInput('');
    setFoodYearInput('');
  };

  const handleRemoveFoodDrink = (index) => {
    setFoodDrinks(foodDrinks.filter((_, i) => i !== index));
  };

  // When tapping Pin Spot / Update Spot, also resolve any text still typed inside the inputs
  const handleSaveWithPendingInputs = async () => {
    let finalCities = [...cities];
    let finalBeers = [...beers];
    let finalFoodDrinks = [...foodDrinks];
    let resolvedCountryName = countryName.trim();

    const pendingDestName =
      cityInput.trim() ||
      (finalCities.length === 0 && destinationType === 'country'
        ? resolvedCountryName
        : '');

    if (pendingDestName) {
      setIsLookingUpCity(true);
      const query = [pendingDestName, resolvedCountryName]
        .filter(Boolean)
        .join(', ');
      const coords = await fetchCoordinates(
        query,
        pendingDestName,
        resolvedCountryName
      );
      setIsLookingUpCity(false);

      const finalType = manualTypeOverride
        ? destinationType
        : coords?.detectedType ||
          detectDestinationTypeSync(pendingDestName, resolvedCountryName);

      if (!resolvedCountryName && coords?.detectedCountry) {
        resolvedCountryName = coords.detectedCountry;
        setCountryName(coords.detectedCountry);
      }

      const cityObj = {
        name: pendingDestName,
        lat: coords ? coords.lat : null,
        lng: coords ? coords.lng : null,
        year: year.trim() || '2026',
        month: month.trim() || 'May',
        type: finalType,
      };

      if (editingCityIndex !== null) {
        finalCities = finalCities.map((c, idx) =>
          idx === editingCityIndex ? cityObj : c
        );
        setEditingCityIndex(null);
      } else {
        finalCities = [...finalCities, cityObj];
      }
      setCities(finalCities);
      setCityInput('');
      setManualTypeOverride(false);
    }

    if (beerInput.trim()) {
      finalBeers = [...finalBeers, beerInput.trim()];
      setBeers(finalBeers);
      setBeerInput('');
    }

    if (foodDrinkInput.trim()) {
      const pendingName = foodDrinkInput.trim();
      const activeCityName =
        selectedFoodCity ||
        (finalCities.length > 0
          ? typeof finalCities[0] === 'string'
            ? finalCities[0]
            : finalCities[0].name
          : resolvedCountryName);

      const spotYear = foodYearInput.trim() || year.trim() || '2026';
      const spotMonth = foodMonthInput.trim() || month.trim() || 'May';
      const spotLocalBeer = localBeerInput.trim();

      setIsLookingUpSpot(true);
      const resolved = await searchVenueInCity(
        pendingName,
        activeCityName,
        resolvedCountryName
      );
      setIsLookingUpSpot(false);

      const newSpot = resolved
        ? {
            ...resolved,
            city: activeCityName,
            year: spotYear,
            month: spotMonth,
            localBeerName: spotLocalBeer || '',
          }
        : {
            name: pendingName,
            city: activeCityName,
            address: [activeCityName, resolvedCountryName]
              .filter(Boolean)
              .join(', '),
            lat: null,
            lng: null,
            year: spotYear,
            month: spotMonth,
            localBeerName: spotLocalBeer || '',
          };
      finalFoodDrinks = [...finalFoodDrinks, newSpot];
      setFoodDrinks(finalFoodDrinks);
      if (
        spotLocalBeer &&
        !finalBeers.some(
          (b) => b.trim().toLowerCase() === spotLocalBeer.toLowerCase()
        )
      ) {
        finalBeers = [...finalBeers, spotLocalBeer];
        setBeers(finalBeers);
      }
      setFoodDrinkInput('');
      setLocalBeerInput('');
      setFoodMonthInput('');
      setFoodYearInput('');
    }

    onSave(finalCities, finalBeers, finalFoodDrinks, resolvedCountryName);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {editingPinId ? 'Edit Check-in 📍' : 'New Check-in 📍'}
              </Text>
              {editingPinId && (
                <TouchableOpacity onPress={onDelete}>
                  <Text style={styles.deleteLink}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Step 1: Country, Date & Destination Search */}
            <Text style={styles.fieldLabel}>
              1. Country, Visit Date & Destination (City, Island, or Country):
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Country (e.g. Greece, Italy, Austria, Portugal)"
              placeholderTextColor="#64748b"
              value={countryName}
              onChangeText={setCountryName}
            />

            <View style={styles.formRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Month (e.g. May)"
                placeholderTextColor="#64748b"
                value={month}
                onChangeText={setMonth}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Year (e.g. 2026)"
                placeholderTextColor="#64748b"
                value={year}
                onChangeText={setYear}
              />
            </View>

            {/* Destination Search Input Row */}
            <View style={[styles.inlineAddRow, { marginBottom: 8 }]}>
              <TextInput
                style={[
                  styles.input,
                  { flex: 1, marginBottom: 0, marginRight: 8 },
                ]}
                placeholder="Search place (e.g. Santorini, Venice, Bali, Lisbon)"
                placeholderTextColor="#64748b"
                value={cityInput}
                onChangeText={handleCityInputChange}
                onSubmitEditing={handleAddOrUpdateCity}
              />
              <TouchableOpacity
                style={styles.inlineAddBtn}
                onPress={handleAddOrUpdateCity}
                disabled={isLookingUpCity}
              >
                {isLookingUpCity ? (
                  <ActivityIndicator color="#0f172a" size="small" />
                ) : (
                  <Text style={styles.inlineAddBtnText}>
                    {editingCityIndex !== null ? '✓ Update' : '+ Add'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Step 3: 3-Button Destination Classification Selector (Auto-detected + Manual Override) */}
            <Text style={[styles.fieldLabel, { marginBottom: 4 }]}>
              Destination Type (Auto-detected • Tap to override):
            </Text>
            <View style={styles.categoryPickerRow}>
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  destinationType === 'city' && styles.categoryPillActive,
                ]}
                onPress={() => handleSelectDestinationType('city')}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    destinationType === 'city' && styles.categoryPillTextActive,
                  ]}
                >
                  🏙️ City
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  destinationType === 'island' && styles.categoryPillActive,
                ]}
                onPress={() => handleSelectDestinationType('island')}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    destinationType === 'island' &&
                      styles.categoryPillTextActive,
                  ]}
                >
                  🏝️ Island
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  destinationType === 'country' && styles.categoryPillActive,
                ]}
                onPress={() => handleSelectDestinationType('country')}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    destinationType === 'country' &&
                      styles.categoryPillTextActive,
                  ]}
                >
                  🌍 Country
                </Text>
              </TouchableOpacity>
            </View>

            {/* Added Destinations Chips (Tap a chip to edit/rename or change its City/Island/Country type) */}
            {cities.length > 0 && (
              <View
                style={[
                  styles.addedItemsList,
                  { marginTop: 0, marginBottom: 12 },
                ]}
              >
                {cities.map((c, idx) => {
                  const cName = typeof c === 'string' ? c : c.name;
                  const cType =
                    typeof c === 'object' && c.type
                      ? c.type
                      : detectDestinationTypeSync(cName, countryName);
                  const typeEmoji = getDestinationEmoji(cType);
                  const cDate =
                    typeof c === 'object' && (c.month || c.year)
                      ? ` (${[c.month, c.year].filter(Boolean).join(' ')})`
                      : '';
                  const isBeingEdited = editingCityIndex === idx;
                  return (
                    <View
                      key={`city-chip-${idx}`}
                      style={[
                        styles.addedItemChip,
                        isBeingEdited && {
                          borderColor: '#f59e0b',
                          backgroundColor: '#0f172a',
                        },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => handleStartEditCity(idx)}
                      >
                        <Text style={styles.addedItemChipText}>
                          {typeEmoji} {cName}
                          {cDate} ✏️
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRemoveCity(idx)}>
                        <Text style={styles.removeChipX}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Step 2: Spot Pins inside this Destination Container */}
            <Text style={styles.fieldLabel}>
              2. Spot Pins Inside Destination:
            </Text>
            <View style={styles.categoryPickerRow}>
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  activeSubTab === 'visit' && styles.categoryPillActive,
                ]}
                onPress={() => setActiveSubTab('visit')}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    activeSubTab === 'visit' && styles.categoryPillTextActive,
                  ]}
                >
                  📍 Sights / Visit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  activeSubTab === 'beer' && styles.categoryPillActive,
                ]}
                onPress={() => setActiveSubTab('beer')}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    activeSubTab === 'beer' && styles.categoryPillTextActive,
                  ]}
                >
                  🍺 Beer {beers.length > 0 ? `(${beers.length})` : ''}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  activeSubTab === 'food' && styles.categoryPillActive,
                ]}
                onPress={() => setActiveSubTab('food')}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    activeSubTab === 'food' && styles.categoryPillTextActive,
                  ]}
                >
                  🍽️ Food & Drink{' '}
                  {foodDrinks.length > 0 ? `(${foodDrinks.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mode Content */}
            {activeSubTab === 'visit' && (
              <View style={styles.subCategoryBox}>
                <Text style={styles.subCategoryHint}>
                  ✨ Smart Auto-Detection automatically selects{' '}
                  <Text style={{ color: '#38bdf8', fontWeight: '700' }}>
                    🏝️ Island
                  </Text>{' '}
                  (e.g. Santorini, Bali, Ibiza),{' '}
                  <Text style={{ color: '#38bdf8', fontWeight: '700' }}>
                    🌍 Country
                  </Text>
                  , or{' '}
                  <Text style={{ color: '#38bdf8', fontWeight: '700' }}>
                    🏙️ City
                  </Text>
                  . You can tap any of the 3 buttons above anytime to override!
                </Text>
              </View>
            )}

            {activeSubTab === 'beer' && (
              <View style={styles.subCategoryBox}>
                <Text style={styles.subCategoryTitle}>
                  🍺 Beers tasted in{' '}
                  {countryName.trim() ? countryName.trim() : 'this country'}:
                </Text>
                <View style={styles.inlineAddRow}>
                  <TextInput
                    style={[
                      styles.input,
                      { flex: 1, marginBottom: 0, marginRight: 8 },
                    ]}
                    placeholder="Local Beer Name (e.g. Stiegl, Mythos, Peroni)"
                    placeholderTextColor="#64748b"
                    value={beerInput}
                    onChangeText={setBeerInput}
                    onSubmitEditing={handleAddBeer}
                  />
                  <TouchableOpacity
                    style={styles.inlineAddBtn}
                    onPress={handleAddBeer}
                  >
                    <Text style={styles.inlineAddBtnText}>+ Add</Text>
                  </TouchableOpacity>
                </View>

                {beers.length > 0 && (
                  <View style={styles.addedItemsList}>
                    {beers.map((item, index) => (
                      <View
                        key={`modal-beer-${index}`}
                        style={styles.addedItemChip}
                      >
                        <Text style={styles.addedItemChipText}>🍺 {item}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveBeer(index)}
                        >
                          <Text style={styles.removeChipX}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeSubTab === 'food' && (
              <View style={styles.subCategoryBox}>
                <Text style={styles.subCategoryTitle}>
                  🍽️ Add Food & Drink Spot (with Month & Year):
                </Text>

                {/* If multiple destinations exist in this country, let user pick which City/Island this place is in */}
                {cities.length > 1 && (
                  <View
                    style={[
                      styles.addedItemsList,
                      { marginTop: 0, marginBottom: 8 },
                    ]}
                  >
                    {cities.map((c, idx) => {
                      const cName = typeof c === 'string' ? c : c.name;
                      const cType =
                        typeof c === 'object' && c.type
                          ? c.type
                          : detectDestinationTypeSync(cName, countryName);
                      const isSelected =
                        (selectedFoodCity ||
                          (typeof cities[0] === 'string'
                            ? cities[0]
                            : cities[0].name)) === cName;
                      return (
                        <TouchableOpacity
                          key={`food-city-${idx}`}
                          style={[
                            styles.addedItemChip,
                            isSelected && { backgroundColor: '#38bdf8' },
                          ]}
                          onPress={() => setSelectedFoodCity(cName)}
                        >
                          <Text
                            style={[
                              styles.addedItemChipText,
                              isSelected && {
                                color: '#0f172a',
                                fontWeight: '800',
                              },
                            ]}
                          >
                            {getDestinationEmoji(cType)} {cName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Month & Year specifically for this Food & Drink visit (defaults to main Month/Year if left blank) */}
                <View style={styles.formRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    placeholder={`Month (${month || 'May'})`}
                    placeholderTextColor="#64748b"
                    value={foodMonthInput}
                    onChangeText={setFoodMonthInput}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder={`Year (${year || '2026'})`}
                    placeholderTextColor="#64748b"
                    value={foodYearInput}
                    onChangeText={setFoodYearInput}
                  />
                </View>

                <View style={styles.inlineAddRow}>
                  <TextInput
                    style={[
                      styles.input,
                      { flex: 1, marginBottom: 0, marginRight: 8 },
                    ]}
                    placeholder="Place Name (e.g. Figlmüller, Café Central)"
                    placeholderTextColor="#64748b"
                    value={foodDrinkInput}
                    onChangeText={setFoodDrinkInput}
                    onSubmitEditing={handleAddFoodDrink}
                  />
                  <TouchableOpacity
                    style={styles.inlineAddBtn}
                    onPress={handleAddFoodDrink}
                    disabled={isLookingUpSpot}
                  >
                    {isLookingUpSpot ? (
                      <ActivityIndicator color="#0f172a" size="small" />
                    ) : (
                      <Text style={styles.inlineAddBtnText}>+ Pin</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Optional Local Beer Prompt for Food & Drinks Pins */}
                <Text
                  style={[
                    styles.fieldLabel,
                    { marginTop: 10, marginBottom: 4, color: '#fbbf24' },
                  ]}
                >
                  🍺 Tried a local beer here? (Optional)
                </Text>
                <TextInput
                  style={[styles.input, { marginBottom: 4 }]}
                  placeholder="Beer name (e.g. Peroni, Mythos, Stiegl)"
                  placeholderTextColor="#64748b"
                  value={localBeerInput}
                  onChangeText={setLocalBeerInput}
                  onSubmitEditing={handleAddFoodDrink}
                />

                {foodDrinks.length > 0 && (
                  <View style={{ marginTop: 10, gap: 8 }}>
                    {foodDrinks.map((item, index) => {
                      const spotName =
                        typeof item === 'string' ? item : item.name;
                      const spotAddress =
                        typeof item === 'object' && item.address
                          ? item.address
                          : null;
                      const spotLocalBeer =
                        typeof item === 'object' && item.localBeerName
                          ? item.localBeerName
                          : '';
                      const spotDate =
                        typeof item === 'object' && (item.month || item.year)
                          ? [item.month, item.year].filter(Boolean).join(' ')
                          : [month, year].filter(Boolean).join(' ');

                      return (
                        <View
                          key={`modal-fd-${index}`}
                          style={[
                            styles.addedItemChip,
                            {
                              justifyContent: 'space-between',
                              borderRadius: 10,
                              paddingVertical: 8,
                            },
                          ]}
                        >
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.addedItemChipText}>
                              🍽️ {spotName}{' '}
                              <Text
                                style={{ color: '#38bdf8', fontWeight: '700' }}
                              >
                                • {spotDate}
                              </Text>
                            </Text>
                            {spotAddress ? (
                              <Text
                                style={{
                                  color: '#94a3b8',
                                  fontSize: 11,
                                  marginTop: 2,
                                }}
                              >
                                📍 {spotAddress}
                              </Text>
                            ) : null}
                            {spotLocalBeer ? (
                              <View
                                style={[
                                  styles.subChipBeer,
                                  { alignSelf: 'flex-start', marginTop: 5 },
                                ]}
                              >
                                <Text style={styles.subChipText}>
                                  🍺 Local Brew: {spotLocalBeer}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <TouchableOpacity
                            onPress={() => handleRemoveFoodDrink(index)}
                          >
                            <Text style={styles.removeChipX}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={onClose}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.saveBtn]}
                onPress={handleSaveWithPendingInputs}
                disabled={
                  isSearchingLocation || isLookingUpCity || isLookingUpSpot
                }
              >
                {isSearchingLocation || isLookingUpCity || isLookingUpSpot ? (
                  <ActivityIndicator color="#0f172a" size="small" />
                ) : (
                  <Text style={styles.saveText}>
                    {editingPinId ? 'Update Spot' : 'Pin Spot'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
