import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styles } from '../styles/styles';
import {
  getPlaceCitiesList,
  getMonthOrder,
  getDestinationEmoji,
  evaluateStarRanking,
} from '../utils/categories';
import {
  STAR_RANKING_TIERS,
  ROOKIE_TIER,
} from '../constants/starRankingConfig';

export function TimelineView({
  visitedPlaces,
  onSelectPlace,
  onEditPlace,
  readOnly = false,
}) {
  const starRanking = evaluateStarRanking(visitedPlaces);
  const allStarTiersAsc = [ROOKIE_TIER, ...[...STAR_RANKING_TIERS].reverse()];

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
      const uniqueCities = new Set(
        citiesInPlace
          .filter((c) => (c.type || 'city') === 'city')
          .map((c) => (c.name || '').trim().toLowerCase())
          .filter(Boolean)
      );
      const uniqueIslands = new Set(
        citiesInPlace
          .filter((c) => c.type === 'island')
          .map((c) => (c.name || '').trim().toLowerCase())
          .filter(Boolean)
      );
      countryStamps.push({
        id: place.id,
        country: cName,
        year: place.year || '2026',
        cityCount: uniqueCities.size,
        islandCount: uniqueIslands.size,
        placeRef: place,
      });
    }
  });

  // Expand each country's cities, islands, and foodDrinks into distinct (Year, Month) timeline visits
  // so repeat visits to the same country appear in the exact Year and Month you went there!
  const timelineEntries = [];
  visitedPlaces.forEach((place) => {
    const citiesList = getPlaceCitiesList(place);
    const foodDrinks = Array.isArray(place.foodDrinks) ? place.foodDrinks : [];
    const visitMap = {};

    const addVisitDestination = (vYear, vMonth, destName, destType = 'city') => {
      const y = (vYear || place.year || '2026').trim();
      const m = (vMonth || place.month || 'May').trim();
      const key = `${y}__${m.toLowerCase()}`;
      if (!visitMap[key]) {
        visitMap[key] = {
          id: `${place.id}-${key}`,
          country: place.country,
          year: y,
          month: m,
          destinations: [],
          placeRef: place,
        };
      }
      if (
        destName &&
        !visitMap[key].destinations.some(
          (existing) => existing.name.toLowerCase() === destName.trim().toLowerCase()
        )
      ) {
        visitMap[key].destinations.push({
          name: destName.trim(),
          type: destType || 'city',
        });
      }
    };

    citiesList.forEach((c) => {
      addVisitDestination(
        c.year || place.year,
        c.month || place.month,
        c.name,
        c.type || 'city'
      );
    });

    foodDrinks.forEach((spot) => {
      if (typeof spot === 'object' && spot !== null) {
        const sCity = spot.city || place.city || citiesList[0]?.name || '';
        const matchedDest = citiesList.find(
          (c) => (c.name || '').toLowerCase() === sCity.toLowerCase()
        );
        addVisitDestination(
          spot.year || place.year,
          spot.month || place.month,
          sCity,
          matchedDest?.type || 'city'
        );
      }
    });

    const visits = Object.values(visitMap);
    if (visits.length === 0) {
      timelineEntries.push({
        id: place.id,
        country: place.country,
        year: place.year || '2026',
        month: place.month || 'May',
        destinations: place.city
          ? [{ name: place.city, type: 'city' }]
          : [],
        placeRef: place,
      });
    } else {
      visits.forEach((v) => timelineEntries.push(v));
    }
  });

  // Group timeline entries by year
  const groupedByYear = timelineEntries.reduce((acc, entry) => {
    const y = entry.year || 'Other';
    if (!acc[y]) acc[y] = [];
    acc[y].push(entry);
    return acc;
  }, {});

  // Sort years OLDEST first (ascending: e.g. 2019 -> 2022 -> 2024 -> 2026)
  const sortedYears = Object.keys(groupedByYear).sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
      return numA - numB;
    }
    return String(a).localeCompare(String(b));
  });

  return (
    <ScrollView style={styles.timelineContainer}>
      <Text style={styles.timelineHelp}>
        💡 Tap any card to see spots, beers, Maps & Stays
      </Text>

      {/* Star Ranking & Badge Name Explanation */}
      <View style={styles.publicSectionBlock}>
        <Text style={styles.publicSectionTitle}>
          ⭐ Traveler Star Ranking & Badges
        </Text>
        <View
          style={{
            backgroundColor: '#1e293b',
            borderRadius: 14,
            paddingVertical: 16,
            paddingHorizontal: 18,
            borderWidth: 1,
            borderColor: '#334155',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4,
            }}
          >
            <Text style={{ color: '#fbbf24', fontSize: 15, fontWeight: '800' }}>
              Current Rank: {starRanking.starGraphic} {starRanking.starTitle}
            </Text>
          </View>
          <Text
            style={{
              color: '#38bdf8',
              fontSize: 12,
              fontWeight: '700',
              marginBottom: 10,
            }}
          >
            🎯 {starRanking.progressHint}
          </Text>

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: '#334155',
              paddingTop: 10,
              gap: 8,
            }}
          >
            {allStarTiersAsc.map((tier) => {
              const isCurrent = tier.stars === starRanking.starLevel;
              const ruleText =
                tier.stars === 0
                  ? 'Less than 1 country'
                  : tier.maxCountries
                  ? `${tier.minCountries}–${tier.maxCountries} Countries + ${tier.minCities} Cities (or ${tier.minIslands} ${tier.minIslands === 1 ? 'Island' : 'Islands'})`
                  : `${tier.minCountries}+ Countries + ${tier.minCities} Cities (or ${tier.minIslands} Islands)`;

              return (
                <View
                  key={`rank-tier-${tier.stars}`}
                  style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    backgroundColor: isCurrent
                      ? 'rgba(251, 191, 36, 0.12)'
                      : 'transparent',
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: isCurrent ? '#fbbf24' : '#e2e8f0',
                      fontSize: 13,
                      fontWeight: isCurrent ? '800' : '700',
                      marginBottom: 2,
                    }}
                  >
                    {tier.starGraphic} {tier.title}
                  </Text>
                  <Text
                    style={{
                      color: isCurrent ? '#f8fafc' : '#94a3b8',
                      fontSize: 12,
                      fontWeight: isCurrent ? '600' : '500',
                      lineHeight: 17,
                      flexShrink: 1,
                    }}
                  >
                    {ruleText}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Passport Stamps */}
      {countryStamps.length > 0 && (
        <View style={styles.publicSectionBlock}>
          <Text style={styles.publicSectionTitle}>
            🛂 Passport Stamps ({countryStamps.length})
          </Text>
          <View style={styles.stampGrid}>
            {countryStamps.map((stamp) => (
              <TouchableOpacity
                key={stamp.id}
                style={styles.stampBadge}
                activeOpacity={0.75}
                onPress={() => onSelectPlace(stamp.placeRef)}
              >
                <Text style={styles.stampCountryText}>
                  🌍 {stamp.country.toUpperCase()}
                </Text>
                <Text style={styles.stampMetaText}>
                  ★ {stamp.cityCount}{' '}
                  {stamp.cityCount === 1 ? 'City' : 'Cities'}
                  {stamp.islandCount > 0
                    ? ` · 🏝️ ${stamp.islandCount} ${
                        stamp.islandCount === 1 ? 'Island' : 'Islands'
                      }`
                    : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {sortedYears.map((yearKey) => {
        // Sort entries within the year by Month OLDEST first (Jan -> Dec)
        const entriesThisYear = [...(groupedByYear[yearKey] || [])].sort(
          (a, b) => getMonthOrder(a.month) - getMonthOrder(b.month)
        );

        const yearCountriesCount = new Set(
          entriesThisYear
            .map((e) => (e.country || '').trim().toLowerCase())
            .filter(Boolean)
        ).size;

        const yearCitiesSet = new Set();
        const yearIslandsSet = new Set();
        entriesThisYear.forEach((e) => {
          (e.destinations || []).forEach((d) => {
            if (!d || !d.name) return;
            if (d.type === 'island') {
              yearIslandsSet.add(d.name.toLowerCase());
            } else if ((d.type || 'city') === 'city') {
              yearCitiesSet.add(d.name.toLowerCase());
            }
          });
        });
        const yearCitiesCount = yearCitiesSet.size;
        const yearIslandsCount = yearIslandsSet.size;

        return (
          <View key={yearKey} style={styles.yearSection}>
            <View style={styles.yearHeaderBadge}>
              <Text style={styles.yearHeaderText}>
                {yearKey}  •  🌍 {yearCountriesCount}{' '}
                {yearCountriesCount === 1 ? 'country' : 'countries'}  •  🏙️{' '}
                {yearCitiesCount} {yearCitiesCount === 1 ? 'city' : 'cities'}
                {yearIslandsCount > 0
                  ? `  •  🏝️ ${yearIslandsCount} ${
                      yearIslandsCount === 1 ? 'island' : 'islands'
                    }`
                  : ''}
              </Text>
            </View>

            {entriesThisYear.map((entry) => {
              const destList = entry.destinations || [];
              const cityDisplay =
                destList.length > 0
                  ? destList
                      .map((d) => `${getDestinationEmoji(d.type)} ${d.name}`)
                      .join(', ')
                  : entry.placeRef?.city
                  ? `🏙️ ${entry.placeRef.city}`
                  : `🌍 ${entry.country}`;

              return (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.timelineCard}
                  activeOpacity={0.8}
                  onPress={() => onSelectPlace(entry.placeRef)}
                >
                  <View style={styles.timelineLeftDot}>
                    <Text style={{ fontSize: 16 }}>📍</Text>
                    <View style={styles.line} />
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>
                        🌍 {entry.country}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Text style={styles.cardMonth}>
                          {entry.month} {entry.year}
                        </Text>
                        {!readOnly && (
                          <TouchableOpacity
                            style={styles.cardEditPill}
                            onPress={() => onEditPlace(entry.placeRef)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.cardEditPillText}>✏️ Edit</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Main Info Only: City / Cities + Tap hint */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#cbd5e1',
                          fontWeight: '600',
                          flex: 1,
                        }}
                      >
                        {cityDisplay}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: '#38bdf8',
                          fontWeight: '700',
                          marginLeft: 8,
                        }}
                      >
                        Tap for details ›
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}
      <View style={{ height: 110 }} />
    </ScrollView>
  );
}
