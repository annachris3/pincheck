import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { styles } from '../styles/styles';
import { PINCHECK_WEB_BASE_URL } from '../utils/externalLinks';

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
  customLinkUrl,
  setCustomLinkUrl,
  customLinkLabel,
  setCustomLinkLabel,
  visitedPlaces,
  onImportPlaces,
  onClose,
}) {
  const [showRestoreBox, setShowRestoreBox] = useState(false);
  const [restoreJsonText, setRestoreJsonText] = useState('');

  // Share / copy the direct PinCheck URL to paste into Linktree
  const handleCopyForLinktree = async () => {
    try {
      await Share.share({
        title: 'PinCheck Link for Linktree',
        message: PINCHECK_WEB_BASE_URL,
        url: PINCHECK_WEB_BASE_URL,
      });
    } catch {
      Alert.alert('PinCheck Link', PINCHECK_WEB_BASE_URL);
    }
  };

  // Export all pins + profile as JSON backup (can be saved to Notes, Google Drive, WhatsApp, or Email)
  const handleExportBackup = async () => {
    try {
      const backupPayload = {
        app: 'PinCheck',
        schemaVersion: 3,
        exportedAt: new Date().toISOString(),
        profile: {
          displayName,
          homeLocation,
          youtubeUrl,
          instagramUser,
          tiktokUser,
          customLinkUrl,
          customLinkLabel,
        },
        places: visitedPlaces,
      };
      await Share.share({
        title: `PinCheck Backup (${visitedPlaces.length} Pins)`,
        message: JSON.stringify(backupPayload, null, 2),
      });
    } catch {
      Alert.alert('Backup Error', 'Could not export backup data.');
    }
  };

  // Restore pins from pasted JSON backup
  const handleRestoreBackup = () => {
    if (!restoreJsonText.trim()) {
      Alert.alert('Empty Backup', 'Please paste your PinCheck backup JSON first.');
      return;
    }
    try {
      const parsed = JSON.parse(restoreJsonText.trim());
      const placesToRestore = Array.isArray(parsed)
        ? parsed
        : parsed && Array.isArray(parsed.places)
        ? parsed.places
        : null;

      if (!placesToRestore) {
        Alert.alert('Invalid Format', 'Could not find a valid places list in the JSON.');
        return;
      }

      if (parsed.profile) {
        if (parsed.profile.displayName) setDisplayName(parsed.profile.displayName);
        if (parsed.profile.homeLocation) setHomeLocation(parsed.profile.homeLocation);
        if (parsed.profile.youtubeUrl !== undefined)
          setYoutubeUrl(parsed.profile.youtubeUrl);
        if (parsed.profile.instagramUser !== undefined)
          setInstagramUser(parsed.profile.instagramUser);
        if (parsed.profile.tiktokUser !== undefined)
          setTiktokUser(parsed.profile.tiktokUser);
        if (parsed.profile.customLinkUrl !== undefined && setCustomLinkUrl)
          setCustomLinkUrl(parsed.profile.customLinkUrl);
        if (parsed.profile.customLinkLabel && setCustomLinkLabel)
          setCustomLinkLabel(parsed.profile.customLinkLabel);
      }

      onImportPlaces(placesToRestore);
      setRestoreJsonText('');
      setShowRestoreBox(false);
      Alert.alert(
        'Backup Restored! 🎉',
        `Successfully restored ${placesToRestore.length} check-in(s).`
      );
    } catch {
      Alert.alert(
        'Invalid Backup JSON',
        'Please make sure you pasted the exact JSON text exported from PinCheck.'
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
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

            {/* Linktree & Custom Link Section */}
            <Text style={styles.inputLabel}>
              🌲 Linktree & Public Map Link
            </Text>
            <View style={styles.subCategoryBox}>
              <Text style={styles.subCategoryHint}>
                Want to put your PinCheck map inside your{' '}
                <Text style={{ color: '#38bdf8', fontWeight: '700' }}>Linktree</Text>{' '}
                account? Add a new link in Linktree and paste this URL:
              </Text>
              <View
                style={[
                  styles.inlineAddRow,
                  { marginTop: 8, marginBottom: 4 },
                ]}
              >
                <View
                  style={[
                    styles.input,
                    {
                      flex: 1,
                      marginBottom: 0,
                      marginRight: 8,
                      justifyContent: 'center',
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: '#38bdf8',
                      fontWeight: '700',
                      fontSize: 13,
                    }}
                    selectable={true}
                  >
                    {PINCHECK_WEB_BASE_URL}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.inlineAddBtn}
                  onPress={handleCopyForLinktree}
                >
                  <Text style={styles.inlineAddBtnText}>📋 Copy</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.inputLabel}>
              Your Linktree / Website Button (shown on your profile):
            </Text>
            <View style={styles.formRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Label (e.g. Linktree)"
                placeholderTextColor="#64748b"
                value={customLinkLabel}
                onChangeText={setCustomLinkLabel}
              />
              <TextInput
                style={[styles.input, { flex: 2 }]}
                placeholder="https://linktr.ee/yourname"
                placeholderTextColor="#64748b"
                value={customLinkUrl}
                onChangeText={setCustomLinkUrl}
                autoCapitalize="none"
              />
            </View>

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

            {/* Data Safety: Cloud/Device Backup & Restore */}
            <Text style={styles.inputLabel}>
              Data Backup & Restore ({visitedPlaces.length} Saved Pins)
            </Text>
            <View style={styles.rideRow}>
              <TouchableOpacity
                style={[
                  styles.rideButton,
                  { backgroundColor: '#0f172a', borderColor: '#38bdf8' },
                ]}
                onPress={handleExportBackup}
              >
                <Text style={[styles.rideButtonText, { color: '#38bdf8' }]}>
                  💾 Export Backup
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.rideButton,
                  { backgroundColor: '#0f172a', borderColor: '#334155' },
                ]}
                onPress={() => setShowRestoreBox(!showRestoreBox)}
              >
                <Text style={[styles.rideButtonText, { color: '#cbd5e1' }]}>
                  📥 Restore Backup
                </Text>
              </TouchableOpacity>
            </View>

            {showRestoreBox && (
              <View style={styles.subCategoryBox}>
                <Text style={styles.subCategoryTitle}>
                  Paste your exported PinCheck JSON backup below:
                </Text>
                <TextInput
                  style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                  placeholder='{"app": "PinCheck", "places": [...]}'
                  placeholderTextColor="#64748b"
                  value={restoreJsonText}
                  onChangeText={setRestoreJsonText}
                  multiline
                />
                <TouchableOpacity
                  style={styles.inlineAddBtn}
                  onPress={handleRestoreBackup}
                >
                  <Text style={styles.inlineAddBtnText}>Restore Pins Now</Text>
                </TouchableOpacity>
              </View>
            )}

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
