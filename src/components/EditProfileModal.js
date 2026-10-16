import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { styles } from '../styles/styles';

export function EditProfileModal({
  visible,
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
  onClose,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <Text style={styles.modalTitle}>Edit Profile & Links ⚙️</Text>

            <TextInput
              style={styles.input}
              placeholder="Your Name (e.g. Anna)"
              placeholderTextColor="#64748b"
              value={displayName}
              onChangeText={setDisplayName}
            />

            <TextInput
              style={styles.input}
              placeholder="Home Base (e.g. Linz, Austria)"
              placeholderTextColor="#64748b"
              value={homeLocation}
              onChangeText={setHomeLocation}
            />

            <Text style={styles.inputLabel}>Social Media Links (Optional)</Text>

            <TextInput
              style={styles.input}
              placeholder="YouTube URL or @channel"
              placeholderTextColor="#64748b"
              value={youtubeUrl}
              onChangeText={setYoutubeUrl}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Instagram Handle (e.g. @noplancheckin)"
              placeholderTextColor="#64748b"
              value={instagramUser}
              onChangeText={setInstagramUser}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="TikTok Handle (e.g. @noplan)"
              placeholderTextColor="#64748b"
              value={tiktokUser}
              onChangeText={setTiktokUser}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.saveProfileBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.saveProfileBtnText}>Save Profile</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
