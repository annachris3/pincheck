import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styles } from '../styles/styles';
import {
  getPlaceCitiesList,
  getMonthOrder,
} from '../utils/categories';

export function TimelineView({
  visitedPlaces,
  onSelectPlace,
  onEditPlace,
  readOnly = false,
}) {
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
      const uniqueCityNames = new Set(
        citiesInPlace.map((c) => (c.name || '').trim().toLowerCase()).filter(Boolean)
      );
      countryStamps.push({
        id: place.id,
        country: cName,
        year: place.year || '2026',
        cityCount: uniqueCityNames.size,
        placeRef: place,
      });
    }
  });

  // Expand each country's cities and foodDrinks into distinct (Year, Month) timeline visits
  // so repeat visits to the same country appear in the exact Year and Month you went there!
  const timelineEntries = [];
  visitedPlaces.forEach((place) => {
    const citiesList = getPlaceCitiesList(place);
    const foodDrinks = Array.isArray(place.foodDrinks) ? place.foodDrinks : [];
    const visitMap = {};

    const addVisitCity = (vYear, vMonth, cityName) => {
      const y = (vYear || place.year || '2026').trim();
      const m = (vMonth || place.month || 'May').trim();
      const key = `${y}__${m.toLowerCase()}`;
      if (!visitMap[key]) {
        visitMap[key] = {
          id: `${place.id}-${key}`,
          country: place.country,
          year: y,
          month: m,
          cities: [],
          placeRef: place,
        };
      }
      if (
        cityName &&
        !visitMap[key].cities.some(
          (existing) => existing.toLowerCase() === cityName.trim().toLowerCase()
        )
      ) {
        visitMap[key].cities.push(cityName.trim());
      }
    };

    citiesList.forEach((c) => {
      addVisitCity(c.year || place.year, c.month || place.month, c.name);
    });

    foodDrinks.forEach((spot) => {
      if (typeof spot === 'object' && spot !== null) {
        const sCity = spot.city || place.city || citiesList[0]?.name || '';
        addVisitCity(spot.year || place.year, spot.month || place.month, sCity);
      }
    });

    const visits = Object.values(visitMap);
    if (visits.length === 0) {
      timelineEntries.push({
        id: place.id,
        country: place.country,
        year: place.year || '2026',
        month: place.month || 'May',
        cities: place.city ? [place.city] : [],
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
        💡 Sorted oldest to newest • Tap any card to see spots, beers, Maps & Stays
      </Text>

      {/* Country Stamp Badges */}
      {countryStamps.length > 0 && (
        <View style={styles.publicSectionBlock}>
          <Text style={styles.publicSectionTitle}>
            🛂 Country Stamp Badges ({countryStamps.length})
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
        entriesThisYear.forEach((e) => {
          (e.cities || []).forEach((cName) => {
            if (cName) yearCitiesSet.add(cName.toLowerCase());
          });
        });
        const yearCitiesCount = yearCitiesSet.size;

        return (
          <View key={yearKey} style={styles.yearSection}>
            <View style={styles.yearHeaderBadge}>
              <Text style={styles.yearHeaderText}>
                {yearKey}  •  🌍 {yearCountriesCount}{' '}
                {yearCountriesCount === 1 ? 'country' : 'countries'}  •  🏙️{' '}
                {yearCitiesCount} {yearCitiesCount === 1 ? 'city' : 'cities'}
              </Text>
            </View>

            {entriesThisYear.map((entry) => {
              const cityDisplay =
                entry.cities && entry.cities.length > 0
                  ? entry.cities.join(', ')
                  : entry.placeRef?.city || '';

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
                        🏙️ {cityDisplay}
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
