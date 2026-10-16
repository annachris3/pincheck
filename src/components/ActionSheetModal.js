import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { styles } from '../styles/styles';
import { getCategoryIcon, getCategoryLabel } from '../utils/categories';
import { openInGoogleMaps, openUber, openBolt } from '../utils/externalLinks';

export function ActionSheetModal({
  visible,
  selectedPlace,
  onClose,
  onEditPlace,
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.actionSheetOverlay}>
        <View style={styles.actionSheetContent}>
          {selectedPlace && (
            <>
              <View style={styles.sheetTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetTitle}>
                    {getCategoryIcon(selectedPlace.category)} {selectedPlace.title}
                  </Text>
                  <Text style={styles.sheetSubtitle}>
                    {selectedPlace.city}, {selectedPlace.country} • {getCategoryLabel(selectedPlace.category)}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeSheetX}>✕</Text>
                </TouchableOpacity>
              </View>

              {selectedPlace.notes ? (
                <Text style={styles.sheetNotes}>{`"${selectedPlace.notes}"`}</Text>
              ) : null}

              {selectedPlace.category !== 'beer' && (
                <>
                  {/* Primary Action: Google Maps */}
                  <TouchableOpacity
                    style={styles.actionButtonGoogleMaps}
                    onPress={() => openInGoogleMaps(selectedPlace)}
                  >
                    <Text style={styles.actionButtonGoogleMapsText}>
                      🗺️ Open in Google Maps
                    </Text>
                  </TouchableOpacity>

                  {/* Mobility Row: Uber & Bolt */}
                  <View style={styles.rideRow}>
                    <TouchableOpacity
                      style={[styles.rideButton, { backgroundColor: '#000000', borderColor: '#334155' }]}
                      onPress={() => openUber(selectedPlace)}
                    >
                      <Text style={styles.rideButtonText}>🚗 Uber</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.rideButton, { backgroundColor: '#34d399', borderColor: '#059669' }]}
                      onPress={() => openBolt(selectedPlace)}
                    >
                      <Text style={[styles.rideButtonText, { color: '#064e3b' }]}>⚡ Bolt</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Secondary: Edit / Delete */}
              <TouchableOpacity
                style={styles.editPlaceBtn}
                onPress={() => onEditPlace(selectedPlace)}
              >
                <Text style={styles.editPlaceBtnText}>✏️ Edit or Delete Check-in</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
