import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { styles } from '../styles/styles';
import { openInGoogleMaps, openUber, openBolt } from '../utils/externalLinks';

export function ActionSheetModal({
  visible,
  selectedPlace,
  onClose,
  onEditPlace,
}) {
  const beers = Array.isArray(selectedPlace?.beers) ? selectedPlace.beers : [];
  const foodDrinks = Array.isArray(selectedPlace?.foodDrinks)
    ? selectedPlace.foodDrinks
    : [];

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.actionSheetOverlay}>
        <View style={styles.actionSheetContent}>
          {selectedPlace && (
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

              {/* Subcategory 1: Local Beers Tasted (no navigation needed, just your hobby collection) */}
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

              {/* Subcategory 2: Food & Drink Places (each has instant Google Maps / Bolt / Uber inside this city) */}
              {foodDrinks.length > 0 && (
                <View style={styles.sheetSectionBox}>
                  <Text style={styles.sheetSectionTitle}>
                    🍽️ Food & Drink Spots in {selectedPlace.city}
                  </Text>
                  {foodDrinks.map((spotName, idx) => (
                    <View key={`sheet-fd-${idx}`} style={styles.spotActionCard}>
                      <Text style={styles.spotActionName}>🍽️ {spotName}</Text>
                      <View style={styles.spotActionButtonsRow}>
                        <TouchableOpacity
                          style={styles.spotMiniBtnMaps}
                          onPress={() => openInGoogleMaps(selectedPlace, spotName)}
                        >
                          <Text style={styles.spotMiniBtnText}>🗺️ Maps</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.spotMiniBtnUber}
                          onPress={() => openUber(selectedPlace, spotName)}
                        >
                          <Text style={styles.spotMiniBtnText}>🚗 Uber</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.spotMiniBtnBolt}
                          onPress={() => openBolt(selectedPlace)}
                        >
                          <Text style={[styles.spotMiniBtnText, { color: '#064e3b' }]}>
                            ⚡ Bolt
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* City-Level Navigation */}
              <TouchableOpacity
                style={styles.actionButtonGoogleMaps}
                onPress={() => openInGoogleMaps(selectedPlace)}
              >
                <Text style={styles.actionButtonGoogleMapsText}>
                  🗺️ Open {selectedPlace.city} in Google Maps
                </Text>
              </TouchableOpacity>

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
          )}
        </View>
      </View>
    </Modal>
  );
}
