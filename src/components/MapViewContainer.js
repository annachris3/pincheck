import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { styles } from '../styles/styles';

export function MapViewContainer({ webViewRef, visitedPlaces, onMapMessage }) {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (webViewRef.current && webViewRef.current.postMessage) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'SET_MARKERS',
          places: visitedPlaces,
        })
      );
    }
  }, [visitedPlaces, webViewRef]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handleWindowMessage = (event) => {
      if (typeof event.data === 'string' && onMapMessage) {
        onMapMessage({ nativeEvent: { data: event.data } });
      }
    };
    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [onMapMessage]);

  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map { 
            margin: 0; padding: 0; width: 100%; height: 100%; 
            background: #0f172a; 
            touch-action: pan-x pan-y;
            overflow: hidden;
            -webkit-user-select: none;
            user-select: none;
          }
          .custom-emoji-marker {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #1e293b;
            border: 2px solid #38bdf8;
            border-radius: 20px;
            padding: 0 6px;
            font-size: 14px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            height: 32px !important;
            min-width: 32px !important;
            white-space: nowrap;
            will-change: transform;
          }
          .custom-food-marker {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0f172a;
            border: 2px solid #f59e0b;
            border-radius: 50%;
            font-size: 15px;
            box-shadow: 0 3px 8px rgba(0,0,0,0.6);
            width: 32px !important;
            height: 32px !important;
            will-change: transform;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          function sendToHost(payload) {
            const msg = JSON.stringify(payload);
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(msg);
            } else if (window.parent) {
              window.parent.postMessage(msg, '*');
            }
          }

          const map = L.map('map', { 
            zoomControl: false,
            zoomAnimation: true,
            fadeAnimation: true,
            bounceAtZoomLimits: false,
            wheelDebounceTime: 40
          }).setView([48.2082, 16.3738], 5);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

          let markersLayer = L.layerGroup().addTo(map);

          function getSpotEmoji(spot) {
            if (spot && typeof spot === 'object') {
              const cat = (spot.category || '').toLowerCase();
              if (cat === 'sights') return '🏛️';
              if (cat === 'cafes') return '☕';
              if (cat === 'drinks') return '🍺';
              if (cat === 'food') return '🍽️';
            }
            const name = ((typeof spot === 'string' ? spot : spot && spot.name) || '').toLowerCase();
            if (/\\b(museum|palace|castle|cathedral|church|temple|monument|tower|park|square|plaza|viewpoint|bridge|fort|ruins|abbey|gallery|basilica|schloss|pantheon|colosseum|acropolis)\\b/i.test(name)) {
              return '🏛️';
            }
            if (/\\b(cafe|café|coffee|bakery|patisserie|konditorei|roastery|espresso|tea house|boulangerie|gelato|ice cream)\\b/i.test(name)) {
              return '☕';
            }
            if (/\\b(bar|pub|brewery|brauerei|bräu|taproom|tavern|wine bar|cocktail|biergarten|beer|club|lounge)\\b/i.test(name)) {
              return '🍺';
            }
            return '🍽️';
          }

          function renderMarkers(places) {
            markersLayer.clearLayers();
            places.forEach(p => {
              const hasBeers = Array.isArray(p.beers) && p.beers.length > 0;
              const spots = Array.isArray(p.foodDrinks) ? p.foodDrinks : [];
              const spotEmojisSet = new Set(spots.map(getSpotEmoji));
              if (hasBeers) spotEmojisSet.add('🍺');
              const extraEmojis = Array.from(spotEmojisSet).join('');

              // 1. Render a pin for EVERY city or island inside this Country check-in
              const citiesList = Array.isArray(p.cities) && p.cities.length > 0
                ? p.cities
                : [{ name: p.city, lat: p.lat, lng: p.lng, type: 'city' }];

              citiesList.forEach(c => {
                const cLat = (typeof c === 'object' && typeof c.lat === 'number') ? c.lat : p.lat;
                const cLng = (typeof c === 'object' && typeof c.lng === 'number') ? c.lng : p.lng;
                const basePinEmoji = (typeof c === 'object' && c.type === 'island') ? '🏝️' : '📍';
                const markerEmojis = basePinEmoji + extraEmojis;
                const markerWidth = markerEmojis.length > 2 ? Math.min(82, 26 + markerEmojis.length * 8) : 34;

                if (typeof cLat === 'number' && typeof cLng === 'number') {
                  const cityIcon = L.divIcon({
                    html: "<div class='custom-emoji-marker'>" + markerEmojis + "</div>",
                    className: '',
                    iconSize: [markerWidth, 32],
                    iconAnchor: [markerWidth / 2, 16]
                  });

                  const cityMarker = L.marker([cLat, cLng], { icon: cityIcon }).addTo(markersLayer);
                  cityMarker.on('click', function() {
                    sendToHost({
                      type: 'MARKER_CLICK',
                      placeId: p.id,
                      spotName: null
                    });
                  });
                }
              });

              // 2. Exact Pinned Activity Places (🏛️ Sights, 🍽️ Food, ☕ Cafes, 🍺 Drinks) inside this Country/City
              spots.forEach((spot, idx) => {
                const name = typeof spot === 'string' ? spot : spot.name;
                const spotEmoji = getSpotEmoji(spot);
                const angle = (idx + 1) * (Math.PI / 3);
                const lat = (spot && typeof spot.lat === 'number') ? spot.lat : (p.lat + 0.008 * Math.cos(angle));
                const lng = (spot && typeof spot.lng === 'number') ? spot.lng : (p.lng + 0.008 * Math.sin(angle));

                const foodIcon = L.divIcon({
                  html: "<div class='custom-food-marker'>" + spotEmoji + "</div>",
                  className: '',
                  iconSize: [32, 32],
                  iconAnchor: [16, 16]
                });

                const spotMarker = L.marker([lat, lng], { icon: foodIcon }).addTo(markersLayer);
                spotMarker.on('click', function() {
                  sendToHost({
                    type: 'MARKER_CLICK',
                    placeId: p.id,
                    spotName: name
                  });
                });
              });
            });
          }

          renderMarkers(${JSON.stringify(visitedPlaces)});

          map.on('click', function(e) {
            sendToHost({
              type: 'MAP_CLICK', lat: e.latlng.lat, lng: e.latlng.lng
            });
          });

          window.addEventListener('message', function(ev) {
            try {
              const d = JSON.parse(ev.data);
              if (d.type === 'SET_MARKERS') {
                renderMarkers(d.places);
                if (d.flyTo) {
                  map.flyTo(d.flyTo, 8, { duration: 1.5 });
                }
              }
            } catch(e) {}
          });
        </script>
      </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.bodyContainer}>
        <iframe
          title="PinCheck World Map"
          srcDoc={mapHtml}
          style={{ width: '100%', height: '100%', border: 'none', flex: 1 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.bodyContainer}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={onMapMessage}
      />
    </View>
  );
}

