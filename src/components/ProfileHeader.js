import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/styles';
import { openSocial, DEFAULT_TRAVELER_AVATAR } from '../utils/externalLinks';
import {
  getUniqueCountriesCount,
  getUniqueCitiesCount,
  getUniqueIslandsCount,
  getTotalBeersCount,
  getTotalFoodDrinksCount,
  evaluateStarRanking,
} from '../utils/categories';

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
  readOnly = false,
}) {
  const [failedUri, setFailedUri] = useState(null);

  // Derived Macro Stats (Mutually Exclusive: Countries, Cities, Islands) & Star Ranking
  const uniqueCountries = getUniqueCountriesCount(visitedPlaces);
  const uniqueCities = getUniqueCitiesCount(visitedPlaces);
  const uniqueIslands = getUniqueIslandsCount(visitedPlaces);
  const starRanking = evaluateStarRanking(visitedPlaces);

  // Subcategory Totals
  const beerCount = getTotalBeersCount(visitedPlaces);
  const foodDrinkCount = getTotalFoodDrinksCount(visitedPlaces);

  const avatarUri =
    profilePhoto && profilePhoto !== failedUri
      ? profilePhoto
      : DEFAULT_TRAVELER_AVATAR;

  return (
    <View style={styles.header}>
      <View style={styles.profileRow}>
        {/* Avatar Photo Picker (Read-Only when viewed by external invitees) */}
        <TouchableOpacity
          disabled={readOnly}
          onPress={readOnly ? undefined : onPickImage}
          activeOpacity={readOnly ? 1 : 0.7}
          style={styles.avatarTouchable}
        >
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatarImage}
            onError={() => setFailedUri(profilePhoto)}
          />
          {!readOnly && (
            <View style={styles.cameraIconBadge}>
              <Text style={{ fontSize: 10 }}>📷</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* User Name -> pincheck -> Stars & Badge Name -> Profile Local */}
        <TouchableOpacity
          disabled={readOnly}
          style={styles.profileTextContainer}
          onPress={readOnly ? undefined : onOpenProfileModal}
          activeOpacity={readOnly ? 1 : 0.7}
        >
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{displayName}</Text>
            {!readOnly && <Text style={styles.editIconHint}>✏️</Text>}
          </View>
          <Text style={styles.appBrandLowercase}>pincheck</Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '800',
              color: '#fbbf24',
              marginBottom: 2,
            }}
          >
            {starRanking.starGraphic} {starRanking.starTitle}
          </Text>
          <Text style={styles.homeLocation}>📍 {homeLocation}</Text>
        </TouchableOpacity>
      </View>

      {/* Compact Icon-Only Social Media Row (YouTube, Instagram, TikTok, Generic Link) */}
      {(youtubeUrl || instagramUser || tiktokUser || customLinkUrl) ? (
        <View style={styles.socialRow}>
          {youtubeUrl ? (
            <TouchableOpacity
              style={styles.socialIconBtn}
              onPress={() => openSocial(youtubeUrl)}
              accessibilityLabel="YouTube"
            >
              <Ionicons name="logo-youtube" size={18} color="#FF0000" />
            </TouchableOpacity>
          ) : null}

          {instagramUser ? (
            <TouchableOpacity
              style={styles.socialIconBtn}
              onPress={() =>
                openSocial(
                  `https://instagram.com/${instagramUser.replace('@', '')}`
                )
              }
              accessibilityLabel="Instagram"
            >
              <Ionicons name="logo-instagram" size={18} color="#E1306C" />
            </TouchableOpacity>
          ) : null}

          {tiktokUser ? (
            <TouchableOpacity
              style={styles.socialIconBtn}
              onPress={() =>
                openSocial(
                  `https://tiktok.com/@${tiktokUser.replace('@', '')}`
                )
              }
              accessibilityLabel="TikTok"
            >
              <Ionicons name="logo-tiktok" size={17} color="#f8fafc" />
            </TouchableOpacity>
          ) : null}

          {customLinkUrl ? (
            <TouchableOpacity
              style={styles.socialIconBtn}
              onPress={() => openSocial(customLinkUrl)}
              accessibilityLabel={customLinkLabel || 'Link'}
            >
              <Ionicons name="link" size={18} color="#38bdf8" />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* Passport Stats Strip: [⭐⭐⭐ Globetrotter] · [X] Countries · [Y] Cities · [Z] Islands */}
      <View
        style={[
          styles.macroStatsRow,
          { flexWrap: 'wrap', rowGap: 4, paddingHorizontal: 10 },
        ]}
      >
        {readOnly && (
          <>
            <Text style={[styles.macroStatText, { color: '#fbbf24' }]}>
              [{starRanking.starGraphic} {starRanking.starTitle}]
            </Text>
            <Text style={styles.statDot}>·</Text>
          </>
        )}
        <Text style={styles.macroStatText}>🌍 {uniqueCountries} Countries</Text>
        <Text style={styles.statDot}>·</Text>
        <Text style={styles.macroStatText}>🏙️ {uniqueCities} Cities</Text>
        <Text style={styles.statDot}>·</Text>
        <Text style={styles.macroStatText}>🏝️ {uniqueIslands} Islands</Text>
      </View>

      {/* Subcategory Stats Badges */}
      <View style={styles.tasteChipsRow}>
        <View style={styles.tasteChip}>
          <Text style={styles.tasteChipText}>🍺 {beerCount} Local Beers</Text>
        </View>
        <View style={styles.tasteChip}>
          <Text style={styles.tasteChipText}>🍽️ {foodDrinkCount} Food & Drink</Text>
        </View>
      </View>

      {/* Dedicated Single-Row "📤 Share Your PinCheck" Button directly beneath category chips and above tabs */}
      {!readOnly && (
        <TouchableOpacity
          style={styles.sharePinCheckBtn}
          onPress={onShareProfile}
          activeOpacity={0.8}
        >
          <Text style={styles.sharePinCheckBtnText}>
            📤 Share Your PinCheck
          </Text>
        </TouchableOpacity>
      )}

      {/* Tab Switcher: World Map (main page) & Timeline / List */}
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
            📅 Timeline & List
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
