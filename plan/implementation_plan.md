# PinCheck — Project & Product Overview

PinCheck is a lightweight, mobile-first travel logging and memory tracker designed for travelers who explore spontaneously without rigid itineraries ("No Plan Checkin"). Rather than operating as an exhaustive address directory or a review portal (like TripAdvisor or Yelp), PinCheck records geographic milestones, memorable physical locations, and a signature local beer collection.

---

## 1. Core Concept & Product Philosophy

Most travel apps force users to enter full street addresses, phone numbers, or ratings. PinCheck strips that friction away:

* **Travel-First Hierarchy:** The core currency of the app is **Geography** (Countries and Cities visited), supported by individual **Stops** (Pins).
* **Zero-Address Friction:** Users never type street addresses. The app combines the spot's name, city, and country into an instant Google Maps or ride search on demand.
* **The "Local Brew" Signature Quest:** Beer is treated as its own tasting collection, separated from physical venues. You track the local beers you discover across regions, while keeping landmarks and food spots linked to maps and navigation.

---

## 2. Main Goals

1. **Effortless Logging:** Capture a travel memory in under 10 seconds: pick a category, type a name, choose the city/country, and log.
2. **Instant Utility (Actionable Pins):** Provide one-tap navigation (Google Maps search) and rides (Bolt) for real-world places without requiring address database lookups.
3. **Showcase Travel Milestones:** Generate shareable summaries that showcase the traveler's reach: total countries, cities, and local beers tasted.

---

## 3. Data Structure & How Users Fill It

Every pin is stored with a common geographic backbone, while the top input and details adapt dynamically depending on the selected category:

| Category | Primary Field (Top Input) | Geographic & Date Fields | Additional Fields | External Navigation |
| --- | --- | --- | --- | --- |
| **📍 Sights & Landmarks** (`'visit'`) | **Landmark / Spot Name** (e.g., *Schönbrunn Palace, Lake Bled, Viewpoint*) | City, Country, Month, Year | Optional personal memory note | **Active:** One-tap Google Maps & Bolt ride |
| **🍽️ Food & ☕ Cafe** (`'food'`, `'restaurant'`, `'cafe'`) | **Venue Name** (e.g., *Figlmüller, Cafe Central*) | City, Country, Month, Year | *"What did you order or enjoy most?"* note | **Active:** One-tap Google Maps & Bolt ride |
| **🍺 Local Beer** (`'beer'`) | **Beer Name** (e.g., *Augustiner, Guinness, Peroni*) | City, Country, Month, Year | *None* (streamlined log) | **Hidden:** Beer is a logged item, not a physical location |

### How Addressless Navigation Works

When viewing or acting on a saved physical spot (Landmark or Food), the app constructs an encoded search URL:

```text
https://www.google.com/maps/search/?api=1&query={Place Name}, {City}, {Country}
```

This offloads precise coordinates and opening hours directly to Google Maps or ride providers without maintaining a complex backend venue database.

---

## 4. User Profile & Social Sharing

The user profile acts as an aggregate dashboard reflecting the user's travel footprint:

* **Header Identity:** Custom handle, display name (e.g., *No Plan Checkin / pincheck*), and current base location (e.g., *Linz, Austria*).
* **Quick Stats Bar:**
  * Total Check-ins
  * Countries Visited (calculated from unique country entries)
  * Cities Visited (calculated from unique city entries)
  * Beer Tally (spotlight count of unique local beers tried)
  * Food & Cafe Counts
* **Views & Visualization:** Quick toggles between a World Map and a chronological Timeline.
* **Share Card:** Generates a structured text export for social apps (WhatsApp, Instagram, etc.):
```text
✈️ Travel Log • PinCheck

🌍 2 Countries | 🏙️ 2 Cities
📍 2 Total Check-ins
🍺 0 Local Beers Tasted

📍 1 Sights & Landmarks | 🍽️ 1 Food Spots
```
*(Counts dynamically adapt based on actual user logs)*

---

## 5. Technical Context (React Native / `App.js`)

* **Framework:** React Native / Expo.
* **Key State Management:**
  * `visitedPlaces`: Array storing all logged spot objects.
  * `selectedCategory`: Controls category switching (`'visit'`, `'beer'`, `'food'`, `'restaurant'`, `'cafe'`) and dynamic form rendering.
  * Form inputs: `venueTitle`, `cityName`, `countryName`, `year`, `month`, and `notes`.
* **External Actions:** Built-in deep linking using React Native's `Linking` API for Google Maps search queries and Bolt dispatch.

---

# Implementation Plan: Modular Architecture (`src/`)

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
    ├── categories.js          # getCategoryIcon, getCategoryLabel, getCategoryPlaceholder
    ├── externalLinks.js       # openSocial, openInGoogleMaps, openUber, openBolt, shareProfile
    └── geocoding.js           # OpenStreetMap Nominatim fetchCoordinates helper
```

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
