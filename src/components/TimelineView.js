import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styles } from '../styles/styles';
import {
  getPlaceCitiesList,
  getUniqueCountriesCount,
  getUniqueCitiesCount,
} from '../utils/categories';

export function TimelineView({
  visitedPlaces,
  onSelectPlace,
  onSelectFoodSpot,
  onEditPlace,
  onFindStays,
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
      countryStamps.push({
        id: place.id,
        country: cName,
        year: place.year || '2026',
        cityCount: citiesInPlace.length,
        placeRef: place,
      });
    }
  });

  const groupedByYear = visitedPlaces.reduce((acc, place) => {
    const y = place.year || 'Other';
    if (!acc[y]) acc[y] = [];
    acc[y].push(place);
    return acc;
  }, {});

  return (
    <ScrollView style={styles.timelineContainer}>
      <Text style={styles.timelineHelp}>
        {readOnly
          ? '💡 Tap any country or 🍽️ spot to view details, Google Maps & 🏨 Find Stays'
          : '💡 Tap a country check-in to add/edit cities, or tap any 🍽️ spot for Maps & Rides'}
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
                  {stamp.cityCount === 1 ? 'City' : 'Cities'} · {stamp.year}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {Object.keys(groupedByYear)
        .sort((a, b) => b - a)
        .map((yearKey) => {
          const placesThisYear = groupedByYear[yearKey] || [];
          const yearCountries = getUniqueCountriesCount(placesThisYear);
          const yearCities = getUniqueCitiesCount(placesThisYear);

          return (
            <View key={yearKey} style={styles.yearSection}>
              <View style={styles.yearHeaderBadge}>
                <Text style={styles.yearHeaderText}>
                  {yearKey}  •  🌍 {yearCountries} {yearCountries === 1 ? 'country' : 'countries'}  •  🏙️ {yearCities} {yearCities === 1 ? 'city' : 'cities'}
                </Text>
              </View>

              {placesThisYear.map((item) => {
                const citiesList = getPlaceCitiesList(item);
                const cityNames = citiesList.map((c) => c.name);
                const beers = Array.isArray(item.beers) ? item.beers : [];
                const foodDrinks = Array.isArray(item.foodDrinks) ? item.foodDrinks : [];

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.timelineCard}
                    activeOpacity={0.8}
                    onPress={() => onSelectPlace(item)}
                  >
                    <View style={styles.timelineLeftDot}>
                      <Text style={{ fontSize: 16 }}>📍</Text>
                      <View style={styles.line} />
                    </View>
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>
                          🌍 {item.country}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.cardMonth}>{item.month}</Text>
                          {!readOnly && (
                            <TouchableOpacity
                              style={styles.cardEditPill}
                              onPress={() => onEditPlace(item)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.cardEditPillText}>✏️ Edit</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {/* Visited Cities inside this Country (with 🏨 Find Stays & Maps) */}
                      <View style={styles.subItemGroup}>
                        <Text style={styles.subItemGroupLabel}>🏙️ Cities Visited:</Text>
                        <View style={styles.subChipsWrap}>
                          {cityNames.map((cName, idx) => (
                            <View
                              key={`city-${idx}`}
                              style={[
                                styles.addedItemChip,
                                { paddingRight: 6, gap: 6 },
                              ]}
                            >
                              <Text style={styles.subChipText}>📍 {cName}</Text>
                              <TouchableOpacity
                                style={styles.inlineStayPill}
                                onPress={() =>
                                  onFindStays({
                                    city: cName,
                                    country: item.country,
                                  })
                                }
                                activeOpacity={0.7}
                              >
                                <Text style={styles.inlineStayPillText}>
                                  🏨 Find Stays
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      </View>

                      <View style={styles.subItemsContainer}>
                        {beers.length > 0 && (
                          <View style={styles.subItemGroup}>
                            <Text style={styles.subItemGroupLabel}>
                              🍺 Local Beers ({item.country}):
                            </Text>
                            <View style={styles.subChipsWrap}>
                              {beers.map((beer, idx) => (
                                <View key={`beer-${idx}`} style={styles.subChipBeer}>
                                  <Text style={styles.subChipText}>
                                    🍺 {beer} tasted in {item.country}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        {foodDrinks.length > 0 && (
                          <View style={styles.subItemGroup}>
                            <Text style={styles.subItemGroupLabel}>
                              🍽️ Pinned Food & Drink (Tap for Maps / Ride / Stays):
                            </Text>
                            <View style={{ gap: 6 }}>
                              {foodDrinks.map((spot, idx) => {
                                const spotName =
                                  typeof spot === 'string' ? spot : spot.name;
                                const spotCity =
                                  typeof spot === 'object' && spot.city
                                    ? spot.city
                                    : item.city;
                                const spotAddress =
                                  typeof spot === 'object' && spot.address
                                    ? spot.address
                                    : null;
                                return (
                                  <View
                                    key={`fd-${idx}`}
                                    style={[
                                      styles.subChipFood,
                                      {
                                        paddingVertical: 8,
                                        paddingHorizontal: 10,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                      },
                                    ]}
                                  >
                                    <TouchableOpacity
                                      style={{ flex: 1, marginRight: 8 }}
                                      activeOpacity={0.7}
                                      onPress={() => onSelectFoodSpot(item, spotName)}
                                    >
                                      <Text style={styles.subChipText}>
                                        📍🍽️ {spotName}
                                      </Text>
                                      {spotAddress ? (
                                        <Text
                                          style={{
                                            fontSize: 11,
                                            color: '#94a3b8',
                                            marginTop: 2,
                                          }}
                                        >
                                          {spotAddress}
                                        </Text>
                                      ) : null}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      style={styles.inlineStayPill}
                                      onPress={() =>
                                        onFindStays(
                                          {
                                            city: spotCity,
                                            country: item.country,
                                          },
                                          spotName
                                        )
                                      }
                                      activeOpacity={0.7}
                                    >
                                      <Text style={styles.inlineStayPillText}>
                                        🏨 Find Stays
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                );
                              })}
                            </View>
                          </View>
                        )}
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
