import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { styles } from '../styles/styles';
import {
  getPlaceCitiesList,
  getUniqueCountriesCount,
  getUniqueCitiesCount,
  getUniqueIslandsCount,
  evaluateStarRanking,
} from '../utils/categories';
import {
  openStay22,
  openInGoogleMaps,
  DEFAULT_TRAVELER_AVATAR,
} from '../utils/externalLinks';
import pincheckLogo from '../../assets/pincheck-logo.png';

export function PublicProfileView({
  profilePhoto,
  displayName,
  homeLocation,
  visitedPlaces,
  onPickImage = null,
  onShareProfile = null,
  onStartCreateMap = null,
}) {
  const [failedUri, setFailedUri] = useState(null);

  const avatarUri =
    profilePhoto && profilePhoto !== failedUri
      ? profilePhoto
      : DEFAULT_TRAVELER_AVATAR;

  const countriesCount = getUniqueCountriesCount(visitedPlaces);
  const citiesCount = getUniqueCitiesCount(visitedPlaces);
  const islandsCount = getUniqueIslandsCount(visitedPlaces);
  const starRanking = evaluateStarRanking(visitedPlaces);

  // Build unique country stamp badges
  const countryStamps = [];
  const seenCountries = new Set();
  visitedPlaces.forEach((place) => {
    const cName = (place.country || '').trim();
    if (!cName) return;
    const key = cName.toLowerCase();
    if (!seenCountries.has(key)) {
      seenCountries.add(key);
      const citiesInPlace = getPlaceCitiesList(place);
      countryStamps.push({
        id: place.id,
        country: cName,
        year: place.year || '2026',
        cityCount: citiesInPlace.length,
      });
    }
  });

  // Flatten physical spots (Sights / Cities + Cafes / Food & Drink) for the compact read-only cards
  const spotCards = [];
  const beerStamps = [];

  visitedPlaces.forEach((place) => {
    const citiesList = getPlaceCitiesList(place);
    citiesList.forEach((cityObj, idx) => {
      const badgeLabel =
        cityObj.type === 'island'
          ? '🏝️ Island'
          : cityObj.type === 'country'
          ? '🌍 Country'
          : '🏙️ City';
      spotCards.push({
        key: `${place.id}-city-${idx}`,
        type: 'sight',
        badge: badgeLabel,
        title: cityObj.name,
        subtitle: `${place.country} • ${cityObj.month || place.month || ''} ${cityObj.year || place.year || ''}`.trim(),
        placeRef: {
          ...place,
          city: cityObj.name,
          lat: cityObj.lat,
          lng: cityObj.lng,
        },
        spotName: null,
      });
    });

    if (Array.isArray(place.foodDrinks)) {
      place.foodDrinks.forEach((spot, idx) => {
        const spotName = typeof spot === 'string' ? spot : spot.name;
        const spotCity =
          (typeof spot === 'object' && spot.city) || place.city || '';
        const spotAddress =
          (typeof spot === 'object' && spot.address) || '';
        if (!spotName) return;

        spotCards.push({
          key: `${place.id}-food-${idx}`,
          type: 'cafe',
          badge: '🍽️ Cafe / Food & Drink',
          title: spotName,
          subtitle: [spotCity, place.country].filter(Boolean).join(', '),
          address: spotAddress,
          placeRef: {
            ...place,
            city: spotCity || place.city,
          },
          spotName,
        });
      });
    }

    if (Array.isArray(place.beers)) {
      place.beers.forEach((beer, idx) => {
        if (!beer) return;
        beerStamps.push({
          key: `${place.id}-beer-${idx}`,
          label: `🍺 ${beer}`,
        });
      });
    }
  });

  return (
    <View style={styles.publicWebWrapper}>
      <ScrollView
        style={styles.publicScrollContainer}
        contentContainerStyle={styles.publicScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.publicCardContainer}>
          {/* 1. TOP: User Avatar, Name & Total Stats (Countries, Cities, Pins) */}
          <View style={styles.publicTopCard}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <View
                style={[
                  styles.publicBadgeHeader,
                  {
                    marginBottom: 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  },
                ]}
              >
                <Image
                  source={pincheckLogo}
                  style={{ width: 18, height: 18, borderRadius: 4 }}
                />
                <Text style={styles.publicBadgeHeaderText}>
                  PINCHECK PUBLIC TRAVEL CARD
                </Text>
              </View>

              {onShareProfile ? (
                <TouchableOpacity
                  style={[
                    styles.socialPill,
                    { backgroundColor: '#38bdf8', borderColor: '#38bdf8' },
                  ]}
                  onPress={onShareProfile}
                >
                  <Text
                    style={[
                      styles.socialPillText,
                      { color: '#0f172a', fontWeight: '800' },
                    ]}
                  >
                    📤 Share Invite
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.publicIdentityRow}>
              <TouchableOpacity
                disabled={!onPickImage}
                onPress={onPickImage || undefined}
                activeOpacity={onPickImage ? 0.75 : 1}
                style={{ position: 'relative', marginRight: 14 }}
              >
                <Image
                  source={{ uri: avatarUri }}
                  style={[styles.publicAvatarImage, { marginRight: 0 }]}
                  onError={() => setFailedUri(profilePhoto)}
                />
                {onPickImage ? (
                  <View style={styles.cameraIconBadge}>
                    <Text style={{ fontSize: 10 }}>📷</Text>
                  </View>
                ) : null}
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Text style={styles.publicUserName}>{displayName}</Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '800',
                    color: '#fbbf24',
                    marginTop: 2,
                    marginBottom: 2,
                  }}
                >
                  {starRanking.starGraphic} {starRanking.starTitle}
                </Text>
                <Text style={styles.publicHomeLocation}>
                  📍 {homeLocation}
                </Text>
              </View>
            </View>

            {/* Public Web Profile Summary Line: [⭐⭐⭐ Globetrotter] · 27 Countries · 42 Cities · 18 Islands */}
            <View
              style={{
                backgroundColor: '#0f172a',
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#334155',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#f8fafc',
                  fontSize: 13,
                  fontWeight: '700',
                  textAlign: 'center',
                }}
              >
                <Text style={{ color: '#fbbf24', fontWeight: '800' }}>
                  [{starRanking.starGraphic} {starRanking.starTitle}]
                </Text>{' '}
                · {countriesCount} Countries · {citiesCount} Cities ·{' '}
                {islandsCount} Islands
              </Text>
            </View>

            {/* Total Stats Grid: [X] Countries · [Y] Cities · [Z] Islands */}
            <View style={styles.publicStatsGrid}>
              <View style={styles.publicStatBox}>
                <Text style={styles.publicStatNumber}>{countriesCount}</Text>
                <Text style={styles.publicStatLabel}>🌍 Countries</Text>
              </View>
              <View style={styles.publicStatDivider} />
              <View style={styles.publicStatBox}>
                <Text style={styles.publicStatNumber}>{citiesCount}</Text>
                <Text style={styles.publicStatLabel}>🏙️ Cities</Text>
              </View>
              <View style={styles.publicStatDivider} />
              <View style={styles.publicStatBox}>
                <Text style={styles.publicStatNumber}>{islandsCount}</Text>
                <Text style={styles.publicStatLabel}>🏝️ Islands</Text>
              </View>
            </View>
          </View>

          {/* 2. MIDDLE (CONTENT): Passport Stamps */}
          <View style={styles.publicSectionBlock}>
            <Text style={styles.publicSectionTitle}>
              🛂 Passport Stamps ({countryStamps.length})
            </Text>
            <View style={styles.stampGrid}>
              {countryStamps.map((stamp) => (
                <View key={stamp.id} style={styles.stampBadge}>
                  <Text style={styles.stampCountryText}>
                    🌍 {stamp.country.toUpperCase()}
                  </Text>
                  <Text style={styles.stampMetaText}>
                    ★ {stamp.cityCount}{' '}
                    {stamp.cityCount === 1 ? 'City' : 'Cities'} · {stamp.year}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 3. MIDDLE (CONTENT): Selected Pins / Spots (Landmarks, Sights, Cafes) */}
          <View style={styles.publicSectionBlock}>
            <Text style={styles.publicSectionTitle}>
              📍 Pinned Sights, Landmarks & Cafes ({spotCards.length})
            </Text>

            {spotCards.map((spot) => (
              <View key={spot.key} style={styles.publicSpotCard}>
                <View style={styles.publicSpotHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.publicSpotCategoryBadge}>
                      {spot.badge}
                    </Text>
                    <Text style={styles.publicSpotTitle}>{spot.title}</Text>
                    <Text style={styles.publicSpotSubtitle}>
                      {spot.subtitle}
                    </Text>
                    {spot.address ? (
                      <Text
                        style={styles.publicSpotAddress}
                        numberOfLines={1}
                      >
                        📮 {spot.address}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Read-Only Action Row: Google Maps + Stay22 "🏨 Find Stays" Affiliate Button */}
                <View style={styles.publicSpotActionsRow}>
                  <TouchableOpacity
                    style={styles.publicMapsBtn}
                    onPress={() =>
                      openInGoogleMaps(spot.placeRef, spot.spotName)
                    }
                  >
                    <Text style={styles.publicMapsBtnText}>
                      🗺️ Google Maps
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.publicStay22Btn}
                    onPress={() => openStay22(spot.placeRef, spot.spotName)}
                  >
                    <Text style={styles.publicStay22BtnText}>
                      🏨 Find Stays
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Optional Read-Only Local Beer Stamps (No Stay22 button on Beer) */}
          {beerStamps.length > 0 && (
            <View style={styles.publicSectionBlock}>
              <Text style={styles.publicSectionTitle}>
                🍺 Local Beers Tasted ({beerStamps.length})
              </Text>
              <View style={styles.subChipsWrap}>
                {beerStamps.map((b) => (
                  <View key={b.key} style={styles.subChipBeer}>
                    <Text style={styles.subChipText}>{b.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 4. BOTTOM (FIXED / STICKY CALL TO ACTION) */}
      <View style={styles.stickyCtaContainer}>
        <TouchableOpacity
          style={styles.stickyCtaButton}
          onPress={() => {
            if (typeof onStartCreateMap === 'function') {
              onStartCreateMap();
            }
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.stickyCtaButtonText}>
            📍 Create Your PinCheck Map
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
