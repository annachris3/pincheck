# Implementation Plan: Modular Architecture Refactoring (`src/`)

## Goal Description
Refactor the monolithic ~1,600-line [App.js](file:///C:/Users/annac/travel-log-app/App.js) into a clean, professional, modular folder structure under `src/`. Each responsibility—UI components, modals, persistent storage hooks, external link/map helpers, geocoding, and shared styling—is isolated in its own dedicated module.

---

## Target Directory Structure

```text
src/
├── components/
│   ├── ProfileHeader.js       # Avatar, profile details, social links, Share trigger, macro/taste stats, tabs
│   ├── MapViewContainer.js    # Leaflet WebView + map HTML template
│   ├── TimelineView.js        # Chronological timeline grouped by year with country/city badges
│   ├── ActionSheetModal.js    # Venue details, selective Google Maps / Uber / Bolt buttons, Edit trigger
│   ├── CheckInModal.js        # Dynamic Check-in form with category-aware placeholders & conditional notes
│   └── EditProfileModal.js    # Profile & social links configuration modal
├── constants/
│   └── defaultPlaces.js       # Initial seed places & storage keys
├── hooks/
│   └── usePinCheckData.js     # Custom hook managing AsyncStorage persistence for places & user profile
├── styles/
│   └── styles.js              # Centralized StyleSheet definitions
└── utils/
    ├── categories.js          # getCategoryIcon, getCategoryLabel, getVenuePlaceholder
    ├── externalLinks.js       # openSocial, openInGoogleMaps, openUber, openBolt, shareProfile
    └── geocoding.js           # OpenStreetMap Nominatim fetchCoordinates helper
```

---

## Module Breakdown

1. **`src/constants/defaultPlaces.js`**
   - Exports `STORAGE_PLACES_KEY`, `STORAGE_PROFILE_KEY`, and `INITIAL_PLACES`.
2. **`src/utils/categories.js`**
   - Exports `getCategoryIcon(category)`, `getCategoryLabel(category)`, and `getCategoryPlaceholder(category)`.
3. **`src/utils/geocoding.js`**
   - Exports `fetchCoordinates(query)` for OpenStreetMap Nominatim lookup.
4. **`src/utils/externalLinks.js`**
   - Exports `openSocial(url)`, `openInGoogleMaps(place)`, `openUber(place)`, `openBolt(place)`, and `shareProfile({ displayName, visitedPlaces, youtubeUrl, instagramUser, tiktokUser, customLinkUrl, customLinkLabel })`.
5. **`src/hooks/usePinCheckData.js`**
   - Encapsulates `visitedPlaces`, profile state (`displayName`, `homeLocation`, `profilePhoto`, social handles), and automatic `AsyncStorage` hydration and persistence.
6. **`src/components/*`**
   - Dedicated, self-contained presentational and modal components.
7. **`App.js`**
   - Lightweight root container (~120 lines) that coordinates state, map WebView ref, and modals.
