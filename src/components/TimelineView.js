import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styles } from '../styles/styles';
import { getCategoryIcon } from '../utils/categories';

export function TimelineView({ visitedPlaces, onSelectPlace }) {
  const groupedByYear = visitedPlaces.reduce((acc, place) => {
    const y = place.year || 'Other';
    if (!acc[y]) acc[y] = [];
    acc[y].push(place);
    return acc;
  }, {});

  return (
    <ScrollView style={styles.timelineContainer}>
      <Text style={styles.timelineHelp}>💡 Tap any spot to view actions, ride, or edit</Text>
      {Object.keys(groupedByYear)
        .sort((a, b) => b - a)
        .map((yearKey) => {
          const placesThisYear = groupedByYear[yearKey] || [];
          const yearCountries = new Set(
            placesThisYear
              .map((p) => (p.country || '').trim().toLowerCase())
              .filter(Boolean)
          ).size;
          const yearCities = new Set(
            placesThisYear
              .map((p) => (p.city || '').trim().toLowerCase())
              .filter(Boolean)
          ).size;

          return (
            <View key={yearKey} style={styles.yearSection}>
              <View style={styles.yearHeaderBadge}>
                <Text style={styles.yearHeaderText}>
                  {yearKey}  •  🌍 {yearCountries} {yearCountries === 1 ? 'country' : 'countries'}  •  🏙️ {yearCities} {yearCities === 1 ? 'city' : 'cities'}
                </Text>
              </View>

              {placesThisYear.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.timelineCard}
                  activeOpacity={0.7}
                  onPress={() => onSelectPlace(item)}
                >
                  <View style={styles.timelineLeftDot}>
                    <Text style={{ fontSize: 16 }}>{getCategoryIcon(item.category)}</Text>
                    <View style={styles.line} />
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardMonth}>{item.month}</Text>
                    </View>
                    <Text style={styles.cardLocation}>
                      📍 {item.city}, {item.country}
                    </Text>
                    {item.notes ? (
                      <Text style={styles.cardNotes}>{`"${item.notes}"`}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}
