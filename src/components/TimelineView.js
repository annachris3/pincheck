import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styles } from '../styles/styles';
import {
  getPlaceCitiesList,
  getUniqueCountriesCount,
  getUniqueCitiesCount,
} from '../utils/categories';

export function TimelineView({ visitedPlaces, onSelectPlace, onSelectFoodSpot }) {
  const groupedByYear = visitedPlaces.reduce((acc, place) => {
    const y = place.year || 'Other';
    if (!acc[y]) acc[y] = [];
    acc[y].push(place);
    return acc;
  }, {});

  return (
    <ScrollView style={styles.timelineContainer}>
      <Text style={styles.timelineHelp}>
        💡 Tap a country check-in to add/edit cities, or tap any 🍽️ spot for Maps & Rides
      </Text>
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
                        <Text style={styles.cardMonth}>{item.month}</Text>
                      </View>

                      {/* Visited Cities inside this Country */}
                      <View style={styles.subItemGroup}>
                        <Text style={styles.subItemGroupLabel}>🏙️ Cities Visited:</Text>
                        <View style={styles.subChipsWrap}>
                          {cityNames.map((cName, idx) => (
                            <View key={`city-${idx}`} style={styles.addedItemChip}>
                              <Text style={styles.subChipText}>📍 {cName}</Text>
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
                              🍽️ Pinned Food & Drink (Tap for Maps / Ride):
                            </Text>
                            <View style={{ gap: 6 }}>
                              {foodDrinks.map((spot, idx) => {
                                const spotName =
                                  typeof spot === 'string' ? spot : spot.name;
                                const spotAddress =
                                  typeof spot === 'object' && spot.address
                                    ? spot.address
                                    : null;
                                return (
                                  <TouchableOpacity
                                    key={`fd-${idx}`}
                                    style={[
                                      styles.subChipFood,
                                      { paddingVertical: 6, paddingHorizontal: 10 },
                                    ]}
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
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}
