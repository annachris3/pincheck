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

# PinCheck: Project Master Plan & Next Steps

## Step 1: Permanent Storage Implementation (Top Priority)
Before filling in your travel history or making major changes, the developer must make sure data is permanently saved:

* **Decide Storage Type:**
  * **Option A (Local-Only):** Use permanent device storage (`AsyncStorage` or `MMKV`). Best if the app is solely for your personal use on your phone.
  * **Option B (Cloud / Shared):** Connect a free cloud backend (Supabase or Firebase). Essential if you want your map to sync across devices, be viewable by friends, or stay backed up if you lose your phone.
* **Connect the Storage Layer:**
  * Load all saved pins when the app launches.
  * Save every new pin automatically whenever you tap "Pin Spot".
* **Future-Proof the Data Structure:** Ensure past pins will not break or vanish when you add new features later (such as ratings, photos, or new categories).

## Step 2: Form Logic & Category Cleanup
Finalize the dynamic check-in modal logic:

* **Dynamic Placeholders:**
  * **Beer:** Prompts for beer names (*Augustiner, Guinness, Peroni*).
  * **Sights:** Prompts for landmarks and viewpoints (*Schönbrunn Palace, Lake Bled, Viewpoint*).
  * **Food / Cafe:** Prompts for dining spots (*Figlmüller, Cafe Central*).
  * **City Field:** Standardize helper text (*Vienna, Ljubljana, Krakow*).
* **Conditional Visibility:**
  * Keep the "Notes / What did you order?" field hidden for Beer, showing it only for Sights, Food, and Cafes.
* **Address-Free Navigation:**
  * Verify that "Open in Google Maps" and "Ride" automatically combine `Name + City + Country` into a search link.
  * Keep navigation buttons visible only for physical places (Sights, Food, Cafe) and disabled for Beers.

## Step 3: Standalone Testing Build (Direct APK)
Move out of the development environment so you can test PinCheck like a real daily app on your phone:

* **Configure Expo EAS:** Set up `eas.json` with an internal preview profile.
* **Generate Direct APK:** Build a standalone `.apk` to install straight to your Android phone without needing Expo Go or a computer.
* **Data Safety Test:** Test closing, clearing the app from memory, and rebooting the phone to confirm your logged pins stay 100% intact.

## Step 4: Over-The-Air (OTA) Updates Workflow
Allow continuous improvements without reinstalling the app:

* **Enable Expo Updates:** Configure the project so any daily UI tweaks, new buttons, or design changes can be pushed directly to your phone over the air.
* **Iterate Safely:** Use the app in your daily life, take notes on what to improve, and let the developer push updates while your logged travels remain completely untouched.

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
│   └── usePinCheckData.js     # Custom hook managing AsyncStorage persistence, backup/restore & schema migration
├── styles/
│   └── styles.js              # Centralized StyleSheet definitions
└── utils/
    ├── categories.js          # Category counters & helpers
    ├── externalLinks.js       # openSocial, openInGoogleMaps, openUber, openBolt, shareProfile
    └── geocoding.js           # OpenStreetMap Nominatim fetchCoordinates helper
```
