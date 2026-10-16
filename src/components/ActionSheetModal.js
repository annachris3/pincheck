import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { styles } from '../styles/styles';
import { openInGoogleMaps, openUber, openBolt } from '../utils/externalLinks';

export function ActionSheetModal({
  visible,
  selectedPlace,
  selectedSpotName,
  onSelectSpotName,
  onClose,
  onEditPlace,
}) {
  const beers = Array.isArray(selectedPlace?.beers) ? selectedPlace.beers : [];
  const foodDrinks = Array.isArray(selectedPlace?.foodDrinks)
    ? selectedPlace.foodDrinks.map((s) => (typeof s === 'string' ? s : s.name))
    : [];

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.actionSheetOverlay}>
        <View style={styles.actionSheetContent}>
          {selectedPlace && selectedSpotName ? (
            /* FOCUSED VIEW: A specific Pinned 🍽️ Food & Drink Place inside the City */
            <View>
              <View style={styles.sheetTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>🍽️ {selectedSpotName}</Text>
                  <Text style={styles.sheetSubtitle}>
                    📍 Pinned in {selectedPlace.city}, {selectedPlace.country}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeSheetX}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Primary Action: Google Maps for this Food & Drink place */}
              <TouchableOpacity
                style={styles.actionButtonGoogleMaps}
                onPress={() => openInGoogleMaps(selectedPlace, selectedSpotName)}
              >
                <Text style={styles.actionButtonGoogleMapsText}>
                  🗺️ Open in Google Maps
                </Text>
              </TouchableOpacity>

              {/* Mobility Row: Uber & Bolt to this Food & Drink place */}
              <View style={styles.rideRow}>
                <TouchableOpacity
                  style={[
                    styles.rideButton,
                    { backgroundColor: '#000000', borderColor: '#334155' },
                  ]}
                  onPress={() => openUber(selectedPlace, selectedSpotName)}
                >
                  <Text style={styles.rideButtonText}>🚗 Uber</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.rideButton,
                    { backgroundColor: '#34d399', borderColor: '#059669' },
                  ]}
                  onPress={() => openBolt(selectedPlace)}
                >
                  <Text style={[styles.rideButtonText, { color: '#064e3b' }]}>
                    ⚡ Bolt
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Back to full City overview or Edit */}
              <TouchableOpacity
                style={styles.editPlaceBtn}
                onPress={() => onSelectSpotName(null)}
              >
                <Text style={styles.editPlaceBtnText}>
                  ← View all of {selectedPlace.city}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* CITY OVERVIEW: Shows Beers (hobby list) + Pinned Food & Drink places */
            selectedPlace && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 520 }}
              >
                <View style={styles.sheetTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetTitle}>
                      📍 {selectedPlace.city}, {selectedPlace.country}
                    </Text>
                    <Text style={styles.sheetSubtitle}>
                      {selectedPlace.month} {selectedPlace.year}
                      {beers.length === 0 && foodDrinks.length === 0
                        ? ' • Just Visited'
                        : ` • 🍺 ${beers.length} • 🍽️ ${foodDrinks.length}`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={onClose}>
                    <Text style={styles.closeSheetX}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Subcategory 1: Local Beers Tasted (just the name, no maps/rides) */}
                {beers.length > 0 && (
                  <View style={styles.sheetSectionBox}>
                    <Text style={styles.sheetSectionTitle}>
                      🍺 Local Beers Tasted in {selectedPlace.city}
                    </Text>
                    <View style={styles.subChipsWrap}>
                      {beers.map((beer, idx) => (
                        <View key={`sheet-beer-${idx}`} style={styles.subChipBeer}>
                          <Text style={styles.subChipText}>🍺 {beer}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Subcategory 2: Pinned Food & Drink Places (Google Maps + Uber + Bolt) */}
                {foodDrinks.length > 0 && (
                  <View style={styles.sheetSectionBox}>
                    <Text style={styles.sheetSectionTitle}>
                      🍽️ Pinned Food & Drink Places in {selectedPlace.city}
                    </Text>
                    {foodDrinks.map((spotName, idx) => (
                      <View key={`sheet-fd-${idx}`} style={styles.spotActionCard}>
                        <Text style={styles.spotActionName}>📍🍽️ {spotName}</Text>

                        <TouchableOpacity
                          style={styles.actionButtonGoogleMaps}
                          onPress={() => openInGoogleMaps(selectedPlace, spotName)}
                        >
                          <Text style={styles.actionButtonGoogleMapsText}>
                            🗺️ Open in Google Maps
                          </Text>
                        </TouchableOpacity>

                        <View style={[styles.rideRow, { marginBottom: 0 }]}>
                          <TouchableOpacity
                            style={[
                              styles.rideButton,
                              { backgroundColor: '#000000', borderColor: '#334155' },
                            ]}
                            onPress={() => openUber(selectedPlace, spotName)}
                          >
                            <Text style={styles.rideButtonText}>🚗 Uber</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.rideButton,
                              { backgroundColor: '#34d399', borderColor: '#059669' },
                            ]}
                            onPress={() => openBolt(selectedPlace)}
                          >
                            <Text
                              style={[styles.rideButtonText, { color: '#064e3b' }]}
                            >
                              ⚡ Bolt
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Secondary: Edit / Add Beers or Food & Drink / Delete */}
                <TouchableOpacity
                  style={styles.editPlaceBtn}
                  onPress={() => onEditPlace(selectedPlace)}
                >
                  <Text style={styles.editPlaceBtnText}>
                    ✏️ Add Beers / Food & Drink or Edit Check-in
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )
          )}
        </View>
      </View>
    </Modal>
  );
}
