import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { styles } from '../styles/styles';
import { getCategoryPlaceholder } from '../utils/categories';

export function CheckInModal({
  visible,
  editingPinId,
  selectedCategory,
  setSelectedCategory,
  venueTitle,
  setVenueTitle,
  cityName,
  setCityName,
  countryName,
  setCountryName,
  year,
  setYear,
  month,
  setMonth,
  experienceNotes,
  setExperienceNotes,
  isSearchingLocation,
  onClose,
  onSave,
  onDelete,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>
              {editingPinId ? 'Edit Check-in ✏️' : 'New Check-in 📍'}
            </Text>
            {editingPinId && (
              <TouchableOpacity onPress={onDelete}>
                <Text style={styles.deleteLink}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Selector */}
          <Text style={styles.fieldLabel}>Category:</Text>
          <View style={styles.categoryPickerRow}>
            <TouchableOpacity
              style={[
                styles.categoryPill,
                selectedCategory === 'visit' && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory('visit')}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === 'visit' && styles.categoryPillTextActive,
                ]}
              >
                📍 Just Visit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryPill,
                selectedCategory === 'beer' && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory('beer')}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === 'beer' && styles.categoryPillTextActive,
                ]}
              >
                🍺 Beer
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryPill,
                selectedCategory === 'restaurant' && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory('restaurant')}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === 'restaurant' && styles.categoryPillTextActive,
                ]}
              >
                🍽️ Food
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryPill,
                selectedCategory === 'cafe' && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory('cafe')}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  selectedCategory === 'cafe' && styles.categoryPillTextActive,
                ]}
              >
                ☕ Cafe
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Inputs */}
          <TextInput
            style={styles.input}
            placeholder={getCategoryPlaceholder(selectedCategory)}
            placeholderTextColor="#64748b"
            value={venueTitle}
            onChangeText={setVenueTitle}
          />

          <View style={styles.formRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="City (e.g. Vienna, Ljubljana, Krakow)"
              placeholderTextColor="#64748b"
              value={cityName}
              onChangeText={setCityName}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Country (e.g. Austria)"
              placeholderTextColor="#64748b"
              value={countryName}
              onChangeText={setCountryName}
            />
          </View>

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

          {selectedCategory !== 'beer' && (
            <TextInput
              style={styles.input}
              placeholder="What did you order or enjoy most?"
              placeholderTextColor="#64748b"
              value={experienceNotes}
              onChangeText={setExperienceNotes}
            />
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
              onPress={onSave}
              disabled={isSearchingLocation}
            >
              {isSearchingLocation ? (
                <ActivityIndicator color="#0f172a" size="small" />
              ) : (
                <Text style={styles.saveText}>
                  {editingPinId ? 'Update Spot' : 'Pin Spot'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
