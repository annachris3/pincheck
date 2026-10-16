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
  const rawFoodDrinks = Array.isArray(selectedPlace?.foodDrinks)
    ? selectedPlace.foodDrinks
    : [];

  const normalizedSpots = rawFoodDrinks.map((s) =>
    typeof s === 'string'
      ? {
          name: s,
          address: `${selectedPlace?.city || ''}, ${selectedPlace?.country || ''}`,
          lat: selectedPlace?.lat,
          lng: selectedPlace?.lng,
        }
      : {
          name: s.name,
          address:
            s.address ||
            `${selectedPlace?.city || ''}, ${selectedPlace?.country || ''}`,
          lat: typeof s.lat === 'number' ? s.lat : selectedPlace?.lat,
          lng: typeof s.lng === 'number' ? s.lng : selectedPlace?.lng,
        }
  );

  const focusedSpot = selectedSpotName
    ? normalizedSpots.find((s) => s.name === selectedSpotName) || {
        name: selectedSpotName,
        address: `${selectedPlace?.city || ''}, ${selectedPlace?.country || ''}`,
        lat: selectedPlace?.lat,
        lng: selectedPlace?.lng,
      }
    : null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.actionSheetOverlay}>
        <View style={styles.actionSheetContent}>
          {selectedPlace && focusedSpot ? (
            /* FOCUSED VIEW: A specific Pinned 🍽️ Food & Drink Place inside the City */
            <View>
              <View style={styles.sheetTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>🍽️ {focusedSpot.name}</Text>
                  <Text style={styles.sheetSubtitle}>
                    📍 {focusedSpot.address}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeSheetX}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Primary Action: Google Maps for this Food & Drink place */}
              <TouchableOpacity
                style={styles.actionButtonGoogleMaps}
                onPress={() => openInGoogleMaps(selectedPlace, focusedSpot.name)}
              >
                <Text style={styles.actionButtonGoogleMapsText}>
                  🗺️ Open in Google Maps
                </Text>
              </TouchableOpacity>

              {/* Mobility Row: Uber & Bolt to this Food & Drink place's exact coordinates */}
              <View style={styles.rideRow}>
                <TouchableOpacity
                  style={[
                    styles.rideButton,
                    { backgroundColor: '#000000', borderColor: '#334155' },
                  ]}
                  onPress={() =>
                    openUber(
                      {
                        ...selectedPlace,
                        lat: focusedSpot.lat,
                        lng: focusedSpot.lng,
                      },
                      focusedSpot.name
                    )
                  }
                >
                  <Text style={styles.rideButtonText}>🚗 Uber</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.rideButton,
                    { backgroundColor: '#34d399', borderColor: '#059669' },
                  ]}
                  onPress={() =>
                    openBolt({
                      ...selectedPlace,
                      lat: focusedSpot.lat,
                      lng: focusedSpot.lng,
                    })
                  }
                >
                  <Text style={[styles.rideButtonText, { color: '#064e3b' }]}>
                    ⚡ Bolt
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Back to full City overview */}
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
            /* CITY OVERVIEW: Shows Beers (hobby list) + Pinned Food & Drink places with addresses */
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
                      {beers.length === 0 && normalizedSpots.length === 0
                        ? ' • Just Visited'
                        : ` • 🍺 ${beers.length} • 🍽️ ${normalizedSpots.length}`}
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

                {/* Subcategory 2: Pinned Food & Drink Places (Address + Google Maps + Uber + Bolt) */}
                {normalizedSpots.length > 0 && (
                  <View style={styles.sheetSectionBox}>
                    <Text style={styles.sheetSectionTitle}>
                      🍽️ Pinned Food & Drink Places in {selectedPlace.city}
                    </Text>
                    {normalizedSpots.map((spot, idx) => (
                      <View key={`sheet-fd-${idx}`} style={styles.spotActionCard}>
                        <Text style={styles.spotActionName}>📍🍽️ {spot.name}</Text>
                        {spot.address ? (
                          <Text
                            style={{
                              fontSize: 12,
                              color: '#94a3b8',
                              marginBottom: 10,
                            }}
                          >
                            📍 {spot.address}
                          </Text>
                        ) : null}

                        <TouchableOpacity
                          style={styles.actionButtonGoogleMaps}
                          onPress={() => openInGoogleMaps(selectedPlace, spot.name)}
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
                            onPress={() =>
                              openUber(
                                {
                                  ...selectedPlace,
                                  lat: spot.lat,
                                  lng: spot.lng,
                                },
                                spot.name
                              )
                            }
                          >
                            <Text style={styles.rideButtonText}>🚗 Uber</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.rideButton,
                              { backgroundColor: '#34d399', borderColor: '#059669' },
                            ]}
                            onPress={() =>
                              openBolt({
                                ...selectedPlace,
                                lat: spot.lat,
                                lng: spot.lng,
                              })
                            }
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
