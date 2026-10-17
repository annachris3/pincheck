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
import { searchVenueInCity } from '../utils/geocoding';

export function CheckInModal({
  visible,
  editingPinId,
  cityName,
  setCityName,
  countryName,
  setCountryName,
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
  // Active tab inside the city check-in: 'visit' | 'beer' | 'food'
  const [activeSubTab, setActiveSubTab] = useState('visit');
  const [beerInput, setBeerInput] = useState('');
  const [foodDrinkInput, setFoodDrinkInput] = useState('');
  const [isLookingUpSpot, setIsLookingUpSpot] = useState(false);

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

    setIsLookingUpSpot(true);
    const resolved = await searchVenueInCity(
      trimmed,
      cityName.trim(),
      countryName.trim()
    );
    setIsLookingUpSpot(false);

    if (resolved) {
      setFoodDrinks([...foodDrinks, resolved]);
    } else {
      setFoodDrinks([
        ...foodDrinks,
        {
          name: trimmed,
          address: [cityName.trim(), countryName.trim()].filter(Boolean).join(', '),
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

  const handleSaveWithPendingInputs = async () => {
    let finalBeers = beers;
    let finalFoodDrinks = foodDrinks;

    if (beerInput.trim()) {
      finalBeers = [...beers, beerInput.trim()];
      setBeers(finalBeers);
      setBeerInput('');
    }
    if (foodDrinkInput.trim()) {
      const pendingName = foodDrinkInput.trim();
      setIsLookingUpSpot(true);
      const resolved = await searchVenueInCity(
        pendingName,
        cityName.trim(),
        countryName.trim()
      );
      setIsLookingUpSpot(false);

      const newSpot = resolved || {
        name: pendingName,
        address: [cityName.trim(), countryName.trim()].filter(Boolean).join(', '),
        lat: null,
        lng: null,
      };
      finalFoodDrinks = [...foodDrinks, newSpot];
      setFoodDrinks(finalFoodDrinks);
      setFoodDrinkInput('');
    }

    onSave(finalBeers, finalFoodDrinks);
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
                {editingPinId ? 'Edit City Check-in 📍' : 'New City Check-in 📍'}
              </Text>
              {editingPinId && (
                <TouchableOpacity onPress={onDelete}>
                  <Text style={styles.deleteLink}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Step 1: Country & City (Main Check-in Anchor) */}
            <Text style={styles.fieldLabel}>1. Destination (Country & City):</Text>
            <TextInput
              style={styles.input}
              placeholder="Country (e.g. Austria, Slovenia, Poland)"
              placeholderTextColor="#64748b"
              value={countryName}
              onChangeText={setCountryName}
            />
            <TextInput
              style={styles.input}
              placeholder="City (e.g. Vienna, Ljubljana, Krakow)"
              placeholderTextColor="#64748b"
              value={cityName}
              onChangeText={setCityName}
            />

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

            {/* Step 2: Just Visit (📍) or Add Subcategories inside this City */}
            <Text style={styles.fieldLabel}>
              2. Check-in Mode & City Subcategories:
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
                  📍 Pinning {cityName ? cityName : 'this city'} on your map! Tap{' '}
                  <Text style={{ color: '#38bdf8', fontWeight: '700' }}>🍺 Beer</Text> or{' '}
                  <Text style={{ color: '#38bdf8', fontWeight: '700' }}>🍽️ Food & Drink</Text>{' '}
                  above if you also want to log local beers or places inside this city.
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
                            { justifyContent: 'space-between', borderRadius: 10, paddingVertical: 8 },
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
                disabled={isSearchingLocation || isLookingUpSpot}
              >
                {isSearchingLocation || isLookingUpSpot ? (
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
