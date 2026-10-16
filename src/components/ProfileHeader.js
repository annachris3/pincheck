import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styles } from '../styles/styles';
import { openSocial } from '../utils/externalLinks';

export function ProfileHeader({
  profilePhoto,
  displayName,
  homeLocation,
  youtubeUrl,
  instagramUser,
  tiktokUser,
  customLinkUrl,
  customLinkLabel,
  visitedPlaces,
  activeTab,
  setActiveTab,
  onPickImage,
  onOpenProfileModal,
  onShareProfile,
}) {
  // Derived Macro Stats
  const uniqueCountries = new Set(
    visitedPlaces.map((p) => (p.country || '').trim().toLowerCase()).filter(Boolean)
  ).size;
  const uniqueCities = new Set(
    visitedPlaces.map((p) => (p.city || '').trim().toLowerCase()).filter(Boolean)
  ).size;

  // Taste Stats
  const beerCount = visitedPlaces.filter((p) => p.category === 'beer').length;
  const restaurantCount = visitedPlaces.filter(
    (p) => p.category === 'restaurant' || p.category === 'food'
  ).length;
  const cafeCount = visitedPlaces.filter((p) => p.category === 'cafe').length;

  return (
    <View style={styles.header}>
      <View style={styles.profileRow}>
        {/* Avatar Photo Picker */}
        <TouchableOpacity onPress={onPickImage} style={styles.avatarTouchable}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{displayName.charAt(0) || 'A'}</Text>
            </View>
          )}
          <View style={styles.cameraIconBadge}>
            <Text style={{ fontSize: 10 }}>📷</Text>
          </View>
        </TouchableOpacity>

        {/* User Name & Lowercase Blue pincheck */}
        <TouchableOpacity
          style={styles.profileTextContainer}
          onPress={onOpenProfileModal}
          activeOpacity={0.7}
        >
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.editIconHint}>✏️</Text>
          </View>
          <Text style={styles.appBrandLowercase}>pincheck</Text>
          <Text style={styles.homeLocation}>📍 {homeLocation}</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Social Media, Custom Links & Share */}
      <View style={styles.socialRow}>
        {youtubeUrl ? (
          <TouchableOpacity
            style={styles.socialPill}
            onPress={() => openSocial(youtubeUrl)}
          >
            <Text style={styles.socialPillText}>▶️ YouTube</Text>
          </TouchableOpacity>
        ) : null}

        {instagramUser ? (
          <TouchableOpacity
            style={styles.socialPill}
            onPress={() =>
              openSocial(`https://instagram.com/${instagramUser.replace('@', '')}`)
            }
          >
            <Text style={styles.socialPillText}>📸 Instagram</Text>
          </TouchableOpacity>
        ) : null}

        {tiktokUser ? (
          <TouchableOpacity
            style={styles.socialPill}
            onPress={() =>
              openSocial(`https://tiktok.com/@${tiktokUser.replace('@', '')}`)
            }
          >
            <Text style={styles.socialPillText}>🎵 TikTok</Text>
          </TouchableOpacity>
        ) : null}

        {/* Custom Link / Linktree */}
        {customLinkUrl ? (
          <TouchableOpacity
            style={styles.socialPill}
            onPress={() => openSocial(customLinkUrl)}
          >
            <Text style={styles.socialPillText}>🔗 {customLinkLabel}</Text>
          </TouchableOpacity>
        ) : null}

        {/* Native Share / Invite Button */}
        <TouchableOpacity
          style={[styles.socialPill, { backgroundColor: '#38bdf8', borderColor: '#38bdf8' }]}
          onPress={onShareProfile}
        >
          <Text style={[styles.socialPillText, { color: '#0f172a', fontWeight: '800' }]}>
            📤 Share
          </Text>
        </TouchableOpacity>
      </View>

      {/* Macro Stats Strip */}
      <View style={styles.macroStatsRow}>
        <Text style={styles.macroStatText}>📍 {visitedPlaces.length} Check-ins</Text>
        <Text style={styles.statDot}>•</Text>
        <Text style={styles.macroStatText}>🌍 {uniqueCountries} Countries</Text>
        <Text style={styles.statDot}>•</Text>
        <Text style={styles.macroStatText}>🏙️ {uniqueCities} Cities</Text>
      </View>

      {/* Taste Stats Badges */}
      <View style={styles.tasteChipsRow}>
        <View style={styles.tasteChip}>
          <Text style={styles.tasteChipText}>🍺 {beerCount} Beers</Text>
        </View>
        <View style={styles.tasteChip}>
          <Text style={styles.tasteChipText}>🍽️ {restaurantCount} Food</Text>
        </View>
        <View style={styles.tasteChip}>
          <Text style={styles.tasteChipText}>☕ {cafeCount} Cafes</Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'map' && styles.tabButtonActive]}
          onPress={() => setActiveTab('map')}
        >
          <Text style={[styles.tabText, activeTab === 'map' && styles.tabTextActive]}>
            🗺️ World Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'timeline' && styles.tabButtonActive]}
          onPress={() => setActiveTab('timeline')}
        >
          <Text style={[styles.tabText, activeTab === 'timeline' && styles.tabTextActive]}>
            📅 Timeline
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
