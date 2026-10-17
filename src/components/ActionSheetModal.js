import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { styles } from '../styles/styles';
import { openInGoogleMaps, openUber, openBolt } from '../utils/externalLinks';
import { getPlaceCitiesList } from '../utils/categories';

export function ActionSheetModal({
  visible,
  selectedPlace,
  selectedSpotName,
  onSelectSpotName,
  onClose,
  onEditPlace,
}) {
  const citiesList = selectedPlace ? getPlaceCitiesList(selectedPlace) : [];
  const beers = Array.isArray(selectedPlace?.beers) ? selectedPlace.beers : [];
  const rawFoodDrinks = Array.isArray(selectedPlace?.foodDrinks)
    ? selectedPlace.foodDrinks
    : [];

  const normalizedSpots = rawFoodDrinks.map((s) =>
    typeof s === 'string'
      ? {
          name: s,
          city: selectedPlace?.city || '',
          address: `${selectedPlace?.city || ''}, ${selectedPlace?.country || ''}`,
          lat: selectedPlace?.lat,
          lng: selectedPlace?.lng,
        }
      : {
          name: s.name,
          city: s.city || selectedPlace?.city || '',
          address:
            s.address ||
            `${s.city || selectedPlace?.city || ''}, ${selectedPlace?.country || ''}`,
          lat: typeof s.lat === 'number' ? s.lat : selectedPlace?.lat,
          lng: typeof s.lng === 'number' ? s.lng : selectedPlace?.lng,
        }
  );

  const focusedSpot = selectedSpotName
    ? normalizedSpots.find((s) => s.name === selectedSpotName) || {
        name: selectedSpotName,
        city: selectedPlace?.city || '',
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
            /* FOCUSED VIEW: A specific Pinned 🍽️ Food & Drink Place */
            <View style={{ paddingBottom: 18 }}>
              <View style={styles.sheetTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>🍽️ {focusedSpot.name}</Text>
                  <Text style={styles.sheetSubtitle}>
                    📍 {focusedSpot.address}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeSheetBtn}
                  onPress={onClose}
                >
                  <Text style={styles.closeSheetX}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Primary Action: Google Maps for this Food & Drink place */}
              <TouchableOpacity
                style={styles.actionButtonGoogleMaps}
                onPress={() =>
                  openInGoogleMaps(
                    {
                      ...selectedPlace,
                      city: focusedSpot.city || selectedPlace.city,
                    },
                    focusedSpot.name
                  )
                }
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
                        city: focusedSpot.city || selectedPlace.city,
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

              {/* Prominent Back / Edit Button well above bottom system bar */}
              <TouchableOpacity
                style={styles.editPlaceBtn}
                onPress={() => onSelectSpotName(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.editPlaceBtnText}>
                  ← View all of {selectedPlace.country}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* COUNTRY OVERVIEW: Shows Visited Cities + Beers (by Country) + Pinned Food & Drink places */
            selectedPlace && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 540 }}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View style={styles.sheetTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetTitle}>
                      🌍 {selectedPlace.country}
                    </Text>
                    <Text style={styles.sheetSubtitle}>
                      {selectedPlace.month} {selectedPlace.year} • 🏙️{' '}
                      {citiesList.length}{' '}
                      {citiesList.length === 1 ? 'City' : 'Cities'} • 🍺{' '}
                      {beers.length} • 🍽️ {normalizedSpots.length}
                    </Text>
                  </View>

                  {/* Easy-to-tap Edit Pill right at the top + Close X */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity
                      style={styles.topEditBadgeBtn}
                      onPress={() => onEditPlace(selectedPlace)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.topEditBadgeText}>✏️ Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.closeSheetBtn}
                      onPress={onClose}
                    >
                      <Text style={styles.closeSheetX}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Visited Cities in this Country */}
                {citiesList.length > 0 && (
                  <View style={styles.sheetSectionBox}>
                    <Text style={styles.sheetSectionTitle}>
                      🏙️ Cities Visited in {selectedPlace.country}
                    </Text>
                    <View style={styles.subChipsWrap}>
                      {citiesList.map((c, idx) => (
                        <TouchableOpacity
                          key={`sheet-city-${idx}`}
                          style={styles.addedItemChip}
                          onPress={() =>
                            openInGoogleMaps({
                              city: c.name,
                              country: selectedPlace.country,
                            })
                          }
                        >
                          <Text style={styles.subChipText}>📍 {c.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Subcategory 1: Local Beers Tasted in Country (e.g. "🍺 Stiegl tasted in Austria") */}
                {beers.length > 0 && (
                  <View style={styles.sheetSectionBox}>
                    <Text style={styles.sheetSectionTitle}>
                      🍺 Local Beers ({selectedPlace.country})
                    </Text>
                    <View style={styles.subChipsWrap}>
                      {beers.map((beer, idx) => (
                        <View key={`sheet-beer-${idx}`} style={styles.subChipBeer}>
                          <Text style={styles.subChipText}>
                            🍺 {beer} tasted in {selectedPlace.country}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Subcategory 2: Pinned Food & Drink Places (Address + Google Maps + Uber + Bolt) */}
                {normalizedSpots.length > 0 && (
                  <View style={styles.sheetSectionBox}>
                    <Text style={styles.sheetSectionTitle}>
                      🍽️ Pinned Food & Drink Places in {selectedPlace.country}
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
                          onPress={() =>
                            openInGoogleMaps(
                              {
                                ...selectedPlace,
                                city: spot.city || selectedPlace.city,
                              },
                              spot.name
                            )
                          }
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
                                  city: spot.city || selectedPlace.city,
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

                {/* Prominent Full-Width Edit Button with generous safe bottom spacing */}
                <TouchableOpacity
                  style={styles.editPlaceBtn}
                  onPress={() => onEditPlace(selectedPlace)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.editPlaceBtnText}>
                    ✏️ Edit or Add Cities / Beers / Spots
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
