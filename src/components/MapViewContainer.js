import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { styles } from '../styles/styles';

export function MapViewContainer({ webViewRef, visitedPlaces, onMapMessage }) {
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
            border-radius: 50%;
            font-size: 16px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            width: 34px !important;
            height: 34px !important;
            will-change: transform;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { 
            zoomControl: false,
            zoomAnimation: true,
            fadeAnimation: true,
            bounceAtZoomLimits: false,
            wheelDebounceTime: 40
          }).setView([48.2082, 16.3738], 5);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

          let markersLayer = L.layerGroup().addTo(map);

          function getIcon(cat) {
            if (cat === 'restaurant' || cat === 'food') return '🍽️';
            if (cat === 'cafe') return '☕';
            if (cat === 'beer') return '🍺';
            return '📍';
          }

          function renderMarkers(places) {
            markersLayer.clearLayers();
            places.forEach(p => {
              const iconHtml = "<div class='custom-emoji-marker'>" + getIcon(p.category) + "</div>";
              const customIcon = L.divIcon({
                html: iconHtml,
                className: '',
                iconSize: [34, 34],
                iconAnchor: [17, 17]
              });

              const m = L.marker([p.lat, p.lng], { icon: customIcon }).addTo(markersLayer);
              m.on('click', function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'MARKER_CLICK',
                  placeId: p.id
                }));
              });
            });
          }

          renderMarkers(${JSON.stringify(visitedPlaces)});

          map.on('click', function(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'MAP_CLICK', lat: e.latlng.lat, lng: e.latlng.lng
            }));
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
