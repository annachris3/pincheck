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
import { fetchCoordinates, searchVenueInCity } from '../utils/geocoding';

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
  const [editingCityIndex, setEditingCityIndex] = useState(null);
  const [isLookingUpCity, setIsLookingUpCity] = useState(false);

  const [beerInput, setBeerInput] = useState('');
  const [foodDrinkInput, setFoodDrinkInput] = useState('');
  const [selectedFoodCity, setSelectedFoodCity] = useState('');
  const [isLookingUpSpot, setIsLookingUpSpot] = useState(false);

  // Add or update a City (always fetches fresh coordinates when added or edited!)
  const handleAddOrUpdateCity = async () => {
    const trimmedCity = cityInput.trim();
    if (!trimmedCity) return;

    setIsLookingUpCity(true);
    const query = [trimmedCity, countryName.trim()].filter(Boolean).join(', ');
    const coords = await fetchCoordinates(query);
    setIsLookingUpCity(false);

    const cityObj = {
      name: trimmedCity,
      lat: coords ? coords.lat : null,
      lng: coords ? coords.lng : null,
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
  };

  const handleStartEditCity = (index) => {
    const c = cities[index];
    setCityInput(typeof c === 'string' ? c : c.name);
    setEditingCityIndex(index);
  };

  const handleRemoveCity = (index) => {
    setCities(cities.filter((_, i) => i !== index));
    if (editingCityIndex === index) {
      setEditingCityIndex(null);
      setCityInput('');
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

  // Automatically looks up the address + exact coordinates from just the place name + city + country!
  const handleAddFoodDrink = async () => {
    const trimmed = foodDrinkInput.trim();
    if (!trimmed) return;

    const activeCityName =
      selectedFoodCity ||
      (cities.length > 0
        ? typeof cities[0] === 'string'
          ? cities[0]
          : cities[0].name
        : cityInput.trim());

    setIsLookingUpSpot(true);
    const resolved = await searchVenueInCity(
      trimmed,
      activeCityName,
      countryName.trim()
    );
    setIsLookingUpSpot(false);

    if (resolved) {
      setFoodDrinks([...foodDrinks, { ...resolved, city: activeCityName }]);
    } else {
      setFoodDrinks([
        ...foodDrinks,
        {
          name: trimmed,
          city: activeCityName,
          address: [activeCityName, countryName.trim()].filter(Boolean).join(', '),
          lat: null,
          lng: null,
        },
      ]);
    }
    setFoodDrinkInput('');
  };

  const handleRemoveFoodDrink = (index) => {
    setFoodDrinks(foodDrinks.filter((_, i) => i !== index));
  };

  // When tapping Pin Spot / Update Spot, also resolve any text still typed inside the inputs
  const handleSaveWithPendingInputs = async () => {
    let finalCities = [...cities];
    let finalBeers = [...beers];
    let finalFoodDrinks = [...foodDrinks];

    if (cityInput.trim()) {
      const pendingCityName = cityInput.trim();
      setIsLookingUpCity(true);
      const query = [pendingCityName, countryName.trim()]
        .filter(Boolean)
        .join(', ');
      const coords = await fetchCoordinates(query);
      setIsLookingUpCity(false);

      const cityObj = {
        name: pendingCityName,
        lat: coords ? coords.lat : null,
        lng: coords ? coords.lng : null,
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
          : '');

      setIsLookingUpSpot(true);
      const resolved = await searchVenueInCity(
        pendingName,
        activeCityName,
        countryName.trim()
      );
      setIsLookingUpSpot(false);

      const newSpot = resolved
        ? { ...resolved, city: activeCityName }
        : {
            name: pendingName,
            city: activeCityName,
            address: [activeCityName, countryName.trim()].filter(Boolean).join(', '),
            lat: null,
            lng: null,
          };
      finalFoodDrinks = [...finalFoodDrinks, newSpot];
      setFoodDrinks(finalFoodDrinks);
      setFoodDrinkInput('');
    }

    onSave(finalCities, finalBeers, finalFoodDrinks);
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

            {/* Step 1: Country & Multiple Cities */}
            <Text style={styles.fieldLabel}>1. Country & Visited Cities:</Text>
            <TextInput
              style={styles.input}
              placeholder="Country (e.g. Austria, Slovenia, Poland)"
              placeholderTextColor="#64748b"
              value={countryName}
              onChangeText={setCountryName}
            />

            {/* Multi-City Input Row */}
            <View style={[styles.inlineAddRow, { marginBottom: 10 }]}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                placeholder="City (e.g. Vienna, Linz, Salzburg)"
                placeholderTextColor="#64748b"
                value={cityInput}
                onChangeText={setCityInput}
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
                    {editingCityIndex !== null ? '✓ Update' : '+ City'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Added Cities Chips (Tap a city to edit/rename & move its pin, or ✕ to remove) */}
            {cities.length > 0 && (
              <View style={[styles.addedItemsList, { marginTop: 0, marginBottom: 12 }]}>
                {cities.map((c, idx) => {
                  const cName = typeof c === 'string' ? c : c.name;
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
                      <TouchableOpacity onPress={() => handleStartEditCity(idx)}>
                        <Text style={styles.addedItemChipText}>
                          📍 {cName} ✏️
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

            <View style={styles.formRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Year (e.g. 2026)"
                placeholderTextColor="#64748b"
                value={year}
                onChangeText={setYear}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Month (e.g. May)"
                placeholderTextColor="#64748b"
                value={month}
                onChangeText={setMonth}
              />
            </View>

            {/* Step 2: Just Visit (📍) or Add Subcategories */}
            <Text style={styles.fieldLabel}>
              2. Check-in Mode & Subcategories:
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
                  📍 Just Visit
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
                  🍽️ Food & Drink {foodDrinks.length > 0 ? `(${foodDrinks.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mode Content */}
            {activeSubTab === 'visit' && (
              <View style={styles.subCategoryBox}>
                <Text style={styles.subCategoryHint}>
                  📍 Every city you add above gets pinned on your map! Tap any city chip (
                  <Text style={{ color: '#38bdf8', fontWeight: '700' }}>📍 City ✏️</Text>
                  ) to rename it and automatically move its pin on the map, or add more cities with{' '}
                  <Text style={{ color: '#38bdf8', fontWeight: '700' }}>+ City</Text>.
                </Text>
              </View>
            )}

            {activeSubTab === 'beer' && (
              <View style={styles.subCategoryBox}>
                <Text style={styles.subCategoryTitle}>
                  🍺 Add Local Beer for {countryName ? countryName : 'this country'}:
                </Text>
                <View style={styles.inlineAddRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                    placeholder="Local Beer Name (e.g. Stiegl, Augustiner, Peroni)"
                    placeholderTextColor="#64748b"
                    value={beerInput}
                    onChangeText={setBeerInput}
                    onSubmitEditing={handleAddBeer}
                  />
                  <TouchableOpacity style={styles.inlineAddBtn} onPress={handleAddBeer}>
                    <Text style={styles.inlineAddBtnText}>+ Add</Text>
                  </TouchableOpacity>
                </View>

                {beers.length > 0 && (
                  <View style={styles.addedItemsList}>
                    {beers.map((item, index) => (
                      <View key={`modal-beer-${index}`} style={styles.addedItemChip}>
                        <Text style={styles.addedItemChipText}>
                          🍺 {item}
                          {countryName.trim() ? ` tasted in ${countryName.trim()}` : ''}
                        </Text>
                        <TouchableOpacity onPress={() => handleRemoveBeer(index)}>
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
                  🍽️ Type Place Name (we find the address & pin it automatically!):
                </Text>

                {/* If multiple cities exist in this country, let user pick which city this place is in */}
                {cities.length > 1 && (
                  <View style={[styles.addedItemsList, { marginTop: 0, marginBottom: 8 }]}>
                    {cities.map((c, idx) => {
                      const cName = typeof c === 'string' ? c : c.name;
                      const isSelected =
                        (selectedFoodCity || (typeof cities[0] === 'string' ? cities[0] : cities[0].name)) ===
                        cName;
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
                              isSelected && { color: '#0f172a', fontWeight: '800' },
                            ]}
                          >
                            📍 {cName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <View style={styles.inlineAddRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
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

                {foodDrinks.length > 0 && (
                  <View style={{ marginTop: 10, gap: 8 }}>
                    {foodDrinks.map((item, index) => {
                      const spotName = typeof item === 'string' ? item : item.name;
                      const spotAddress =
                        typeof item === 'object' && item.address ? item.address : null;

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
                            <Text style={styles.addedItemChipText}>🍽️ {spotName}</Text>
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
                          </View>
                          <TouchableOpacity onPress={() => handleRemoveFoodDrink(index)}>
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
                disabled={isSearchingLocation || isLookingUpCity || isLookingUpSpot}
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
