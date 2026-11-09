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
2. **Instant Utility (Actionable Pins):** Provide one-tap navigation (Google Maps search), rides (Uber / Bolt), and accommodation search (Stay22) for real-world places without requiring manual address entry.
3. **Showcase Travel Milestones:** Generate shareable summaries that showcase the traveler's reach: total countries, cities, and local beers tasted.

---

## 3. Data Structure & How Users Fill It

Every pin is stored with a common geographic backbone, while the top input and details adapt dynamically depending on the selected category:

| Category | Primary Field (Top Input) | Geographic & Date Fields | Additional Fields | External Navigation & Monetization |
| --- | --- | --- | --- | --- |
| **📍 Sights & Landmarks** (`'visit'`) | **Landmark / Spot Name** (e.g., *Schönbrunn Palace, Lake Bled, Viewpoint*) | City, Country, Month, Year | Optional personal memory note | **Active:** One-tap Google Maps, Bolt/Uber ride, & **🏨 Find Stays** |
| **🍽️ Food & ☕ Cafe** (`'food'`, `'restaurant'`, `'cafe'`) | **Venue Name** (e.g., *Figlmüller, Cafe Central*) | City, Country, Month, Year | Auto-resolved street address | **Active:** One-tap Google Maps, Bolt/Uber ride, & **🏨 Find Stays** |
| **🍺 Local Beer** (`'beer'`) | **Beer Name** (e.g., *Augustiner, Guinness, Peroni*) | Country, Month, Year | *None* (streamlined log: `"Beer tasted in Country"`) | **Hidden:** Beer is a logged item, not a physical location |

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

---

## 5. Technical Context (React Native / `App.js`)

* **Framework:** React Native / Expo.
* **Key State Management:**
  * `visitedPlaces`: Array storing all logged country/city check-in objects.
  * `cities`, `beers`, `foodDrinks`: Multi-city support per country, country-scoped beers (`"<Beer> tasted in <Country>"`), and auto-geocoded Food & Drink spots.
* **External Actions:** Built-in deep linking using React Native's `Linking` API for Google Maps search queries, Uber/Bolt dispatch, and `expo-web-browser` for Stay22 in-app accommodation search.

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

# Task: Add Stay22 "Find Stays" Action Button

## 1. Overview
Integrate an affiliate accommodation search button on spot cards to monetize physical check-ins. The button sits alongside the existing action buttons (**"🗺️ Open in Google Maps"** and **"🚗 Ride"**).

## 2. Configuration
* **Partner Engine:** Stay22 Interactive Embed
* **Affiliate ID (`aid`):** `noplancheckin`

## 3. Display Rules & Placement
* **Position:** Place the new button labeled **"🏨 Find Stays"** in the action button row, right beside the Google Maps and Ride buttons.
* **Show when:** The pin belongs to a physical venue category (e.g., Sights / Visits, Food & Drink / Cafes) and has city/country data.
* **Hide when:** The pin category is set to **"Beer"** (beers do not require accommodation search).

## 4. Dynamic URL Logic
* When tapped, generate a dynamic URL passing the pin’s location:
```text
https://www.stay22.com/embed/gm?aid=noplancheckin&address={CITY_OR_COUNTRY}
```
* Combine the pin’s `city` and `country` (e.g., `"Vienna, Austria"`), ensuring the full string is properly URI-encoded.
* If only one field is present (e.g., just city or just landmark), fall back to whatever geographic location data is available.

## 5. In-App User Experience
* Launch the link using an in-app browser sheet (`expo-web-browser` via `WebBrowser.openBrowserAsync`).
* This keeps the user inside PinCheck: they can browse interactive hotel/Airbnb options, and tapping "Done" closes the sheet directly back to their pin details.

---

# Task: Profile Sharing Configuration & Responsive Public Web Profile Card

## 1. In-App Share Trigger (Profile Screen)
* Add a **"Share Profile"** button using React Native's `Share.share` API.
* **Message template:**
```text
Collect your travel stamps with me on PinCheck! ✈️📍
[User Name]'s Map: [X] Countries · [Y] Cities
See my map & start your own collection: [Profile_URL]
```

## 2. Responsive Public Web Profile Card
1. **Structure:**
   * **Top:** User avatar, name, and total stats (Countries, Cities, Pins).
   * **Middle (Content):** Compact, clean version of the full profile:
     * Country stamp badges
     * Selected pins/spots (Landmarks, Sights, Cafes)
     * Maintain the Stay22 **"🏨 Find Stays"** affiliate button on place cards.
   * **Bottom (Fixed/Sticky Call to Action):**
     * Floating bottom button: **"📍 Create Your PinCheck Map"**
     * Links directly to app download / registration.
2. **Mobile-First Web Experience (`https://pincheckin.expo.app`):**
   * Ensure fast loading on mobile browsers (Safari/Chrome).
   * Opens directly on the interactive **`🗺️ World Map`** as the main page, with the **`📅 Timeline & List`** tab right beside it.
   * Read-only view (no editing capabilities for external viewers).
   * Tapping **"📍 Create Your PinCheck Map"** initializes a brand-new blank map in isolated guest storage so external visitors never edit the owner's map.

---

# Task: Timeline Refinements, Per-Spot Month/Year & Linktree Support

1. **Month & Year on Cities and Food & Drink Spots + Repeat Country Merging:**
   * Each City and each Food & Drink spot stores its own `month` and `year`.
   * If a user repeats a country in a different Month/Year, they do not need to create a duplicate country—new cities, beers, and food & drink spots automatically merge into the existing country check-in and appear in the Timeline under the exact Year and Month of each visit.
2. **Minimal Timeline Cards Sorted Oldest First:**
   * Timeline years and months are sorted chronologically from **oldest to newest** (`2019` → `2024` → `2026`, `January` → `December`).
   * Timeline cards display only the main info (**Country**, **City/Cities**, and **Month/Year**). Tapping a card opens the full `ActionSheetModal` with Beers, Food & Drink spots, Google Maps, **🏨 Find Stays**, and Uber/Bolt.
3. **Custom Website / Link Button:**
   * Configurable Website/Custom Link button (`customLinkLabel` & `customLinkUrl`) in `EditProfileModal.js` displayed on the PinCheck profile header.

---

# Task: Automatic Destination Classification (City, Island, Country) & Passport Stats

## Step 1: Set Up Mutual Exclusivity
* Each destination container has one main classification: **City** (`'city'`), **Island** (`'island'`), or **Country** (`'country'`).
* Choosing **Island** means it does **not** count as a **City**, and choosing **City** means it does **not** count as an **Island**.
* Spot pins (`Sights`, `Food & Drink`, `Beer`) sit inside whichever destination container the user picks.

## Step 2: Implement Smart Auto-Detection
* When a user searches or types a place using the location search bar (`src/utils/geocoding.js` + `CheckInModal.js`):
  * If OpenStreetMap Nominatim (`addresstype`, `type`, `class`, or `address.island`/`archipelago`) or the built-in island gazetteer identifies the place as an island or archipelago (e.g., Santorini, Rhodes, Kos, Bali, Ibiza), automatically select the **`🏝️ Island`** toggle.
  * If it identifies the place as a country (e.g., Portugal, Japan), automatically select the **`🌍 Country`** toggle.
  * For everything else (e.g., Athens, Venice, Berlin, Paris), default to the **`🏙️ City`** toggle.

## Step 3: Provide a Manual Override
* Display a 3-button selector directly on the destination screen (`CheckInModal.js`):
  * `[ 🏙️ City ] | [ 🏝️ Island ] | [ 🌍 Country ]`
* The auto-detected option is highlighted automatically unless manually overridden by the user.
* Allow the user to tap any button to override the selection at any time without showing any error or warning.

## Step 4: Update the Passport Stats
* Count each entry toward its respective mutually exclusive passport total (`src/utils/categories.js`):
  * `City` adds `+1` to the **Total Cities** counter (`getUniqueCitiesCount`).
  * `Island` adds `+1` to the **Total Islands** counter (`getUniqueIslandsCount`).
  * `Country` adds `+1` to the **Total Countries** counter (`getUniqueCountriesCount`).
* Display these three counters on the user's passport screen (`ProfileHeader.js`), public web card (`PublicProfileView.js`), and share message (`externalLinks.js`):
  * `[X] Countries · [Y] Cities · [Z] Islands`

## Step 5: Preserve the Stay22 Hotel Link
* Ensure the **"🏨 Find Stays"** button (`openStay22` in `src/utils/externalLinks.js`) uses the container's location name plus its parent country (e.g., `address=Santorini, Greece` or `address=Venice, Italy`).
* Hotel searches work consistently whether the destination is saved as a **City** or an **Island**.

---

# Task: Star Ranking System & Progress Display

## Step 1: Define the Star Ranking Rules
Evaluate the user's rank based on total confirmed destinations (starting with `⭐ Explorer`):
* **⭐ 1 Star (`Explorer`):** Reached **1 to 4 Countries**, AND at least **5 Cities** (or **1 Island**).
* **⭐⭐ 2 Stars (`Voyager`):** Reached **5 to 14 Countries**, AND at least **15 Cities** (or **3 Islands**).
* **⭐⭐⭐ 3 Stars (`Globetrotter`):** Reached **15 to 29 Countries**, AND at least **35 Cities** (or **8 Islands**).
* **⭐⭐⭐⭐ 4 Stars (`Nomad`):** Reached **30 to 49 Countries**, AND at least **75 Cities** (or **15 Islands**).
* **⭐⭐⭐⭐⭐ 5 Stars (`World Legend`):** Reached **50+ Countries**, AND at least **120 Cities** (or **25 Islands**).

## Step 2: Implement the Evaluation Logic
* Run `evaluateStarRanking(visitedPlaces)` (`src/utils/categories.js`) automatically whenever a user adds, edits, or deletes a destination or pin.
* Check from highest to lowest: test if the user meets the **5-Star** criteria first; if not, check **4-Star**, down to **1-Star (`Explorer`)**.
* Store the resulting `starLevel` (`1` to `5`), `starTitle`, `starGraphic`, and `starProgressHint` directly on the user profile record (`usePinCheckData.js`).

## Step 3: Profile, Timeline & Web Card Display
* **Mobile App Profile Screen (`ProfileHeader.js`):**
  * Display the star graphic and badge title directly between `pincheck` and the profile local (`📍 {homeLocation}`):
    `⭐⭐⭐ Globetrotter`
* **Timeline & List Screen (`TimelineView.js`):**
  * Top helper text reads `"💡 Tap any card to see spots, beers, Maps & Stays"`.
  * Includes the **Traveler Star Ranking & Badges** explanation card showing the user's current rank, the one-line progress hint (e.g., `"3 more countries to reach ⭐⭐⭐⭐ Nomad"`), and the full breakdown of all star tiers (`Rookie` through `World Legend`).
* **Public Web Profile Card (`ProfileHeader.js` read-only mode & `PublicProfileView.js`):**
  * Display the star rating and title alongside the counters:
    `[⭐⭐⭐ Globetrotter] · 27 Countries · 42 Cities · 18 Islands`

## Step 4: Make Values Easily Configurable
* Store all tier thresholds (`minCountries`, `maxCountries`, `minCities`, `minIslands`, `stars`, `starGraphic`, `title`) in a dedicated configuration file: `src/constants/starRankingConfig.js`.
* Allows raising or lowering requirements at any time without rewriting core app logic.

---

# Task: Update Profile UI, Rename Sections, and Native Text Share

## 1. Social Media Row (`ProfileHeader.js`)
* Convert the social links row into compact icon-only buttons using official brand logos (`@expo/vector-icons` `Ionicons`): YouTube (`logo-youtube`), Instagram (`logo-instagram`), TikTok (`logo-tiktok`), and a generic Chain/Link icon (`link`).
* Remove all text labels (`"YouTube"`, `"Instagram"`, etc.) so all active icons fit cleanly in a single horizontal row without horizontal overflow.

## 2. `"📤 Share Your PinCheck"` Button (`ProfileHeader.js`)
* Remove `"Share"` from the social icon row.
* Create a dedicated single-row button labeled **`"📤 Share Your PinCheck"`**.
* Place it directly beneath the category chips (`Beers` / `Food & Drink`) and immediately above the **`"🗺️ World Map | 📅 Timeline & List"`** toggle.

## 3. Native Share Action (`externalLinks.js`)
* When **`"📤 Share Your PinCheck"`** is pressed, trigger the native OS share sheet (`Share.share`) using simple text and link (no image attachment):
  * `Message: "Check out my travel map, passport stamps, and pinned spots on PinCheck! ✈️📍\nhttps://pincheckin.expo.app"`

## 4. Star Ranking Card Layout (`TimelineView.js`)
* Split each ranking tier into a 2-line structure (**Title** on line 1; **requirement criteria** on line 2 with text-wrap enabled) to prevent horizontal text overflow.
* Ensure the card container has at least `16px` horizontal padding (`paddingHorizontal: 18`).

## 5. Section Rename (`TimelineView.js` & `PublicProfileView.js`)
* Rename `"Country Stamp Badges (X)"` to **`"Passport Stamps (X)"`**.

## 6. Official PinCheck Logo & App Branding (`assets/` & `app.json`)
* Generated official PinCheck branding assets from `LOGO.png`:
  * `assets/icon.png` (`1024x1024`) — Main App Icon.
  * `assets/android-icon-foreground.png`, `assets/android-icon-background.png` (`#030b1c`), and `assets/android-icon-monochrome.png` (`1024x1024`) — Android Adaptive Icons.
  * `assets/splash-icon.png` (`1024x1024`) — Native Splash Screen (`app.json`) + In-App Loading Screen (`App.js`).
  * `assets/favicon.png` (`192x192`) — Web Favicon (`https://pincheckin.expo.app`).
  * `assets/pincheck-logo.png` (`256x256`) — Header brand logo displayed beside `pincheck` on mobile (`ProfileHeader.js`) and web (`PublicProfileView.js`).

---

# Task: Add "Local Beer" Prompt to Food & Drinks Pins

## 1. Pin Creation Form (Food & Drinks Categories Only — `CheckInModal.js`)
* When a user selects **"Food & Drink"** as the pin category (`activeSubTab === 'food'`), display an optional field:
  * **Label:** `"🍺 Tried a local beer here? (Optional)"`
  * **Placeholder:** `"Beer name (e.g. Peroni, Mythos, Stiegl)"`
* Store this value as `localBeerName` on the pin record.

## 2. Pin Detail Display (`ActionSheetModal.js` & `PublicProfileView.js`)
* When viewing a saved pin that has a beer logged (`localBeerName`), display a distinct pill tag:
  * **`"🍺 Local Brew: [Beer Name]"`**

## 3. Passport Stats Counter (`categories.js` & `ProfileHeader.js`)
* Calculate total unique local beers logged across all pins (`getTotalBeersCount` deduplicating `beers[]` and `localBeerName`).
* Display this achievement badge on the user's passport summary:
  * **`"🍺 [X] Local Beers Tried"`**

---

# Task: Update Pin Activity Categories and Profile Counters

## 1. Replace Existing Place Categories (`src/utils/categories.js`)
* Deprecate the separate `"Local Beers"` and `"Food & Drink"` chips.
* Introduce **4 standardized pin activity categories**:
  * **`"Sights"`** (`'sights'`, icon: `🏛️`) -> Covers monuments, historical spots, viewpoints, museums.
  * **`"Food"`** (`'food'`, icon: `🍽️`) -> Covers restaurants, street food, markets.
  * **`"Cafes"`** (`'cafes'`, icon: `☕`) -> Covers coffee shops, bakeries, brunch spots.
  * **`"Drinks"`** (`'drinks'`, icon: `🍺`) -> Covers local beer, cocktail bars, wine bars, pubs.
* Backward compatibility via `normalizeSpotCategory(spot)`: automatically classifies existing saved spots into `'sights'`, `'food'`, `'cafes'`, or `'drinks'` when `spot.category` is not explicitly set.

## 2. Pin Creation / Edit Form (`src/components/CheckInModal.js`)
* When dropping or editing a pin, let the user select one of the **4 primary categories** via a 4-way selector:
  * `[ 🏛️ Sights ] | [ 🍽️ Food ] | [ ☕ Cafes ] | [ 🍺 Drinks ]`
* When `"Food"` or `"Drinks"` is selected, display the optional `"🍺 Tried a local beer here? (Optional)"` prompt (`localBeerName`).

## 3. Profile UI Counters (`src/components/ProfileHeader.js` & `src/components/PublicProfileView.js`)
* Display the 4 counters in a balanced **2x2 grid** (two rows) directly below the geographic counters (`Countries / Cities / Islands`):
  ```text
  [ 🏛️ X Sights ]  [ 🍽️ Y Food ]
  [ ☕ Z Cafes ]   [ 🍺 W Drinks ]
  ```
* Keep the **`"📤 Share Your PinCheck"`** button directly below these 4 category chips and immediately above the `"World Map | Timeline & List"` toggle.

---

# Task: Supabase Free-Tier Database, Google/Email Auth & Admin Passports View

## 1. Supabase Database Schema (`supabase/schema.sql`)
* **`public.profiles` Table:** Stores every registered user (`id`, `email`, `display_name`, `home_location`, `profile_photo`, social links, `star_level`, `star_title`, `star_graphic`, `countries_count`, `cities_count`, `islands_count`, `sights_count`, `food_count`, `cafes_count`, `drinks_count`, and full `visited_places` JSONB array).
* **Automatic Sign-Up Trigger (`on_auth_user_created`):** Automatically creates a row in `public.profiles` whenever a new user registers via **Google Sign-In** or **Email/Password**.
* **Admin Dashboard View (`public.admin_passports_view`):** Ready-to-browse view in the Supabase Table Editor showing all registered users, their email, Traveler Rank (`⭐ Explorer` – `⭐⭐⭐⭐⭐ World Legend`), Countries/Cities/Islands & 4 activity category counters, and saved passport JSON.

## 2. Google & Email Sign-In + Cloud Sync (`src/config/supabase.js`, `src/components/AuthModal.js`, `src/hooks/usePinCheckData.js`)
* **`🔐 Sign In` / `☁️ Synced` Header Button (`ProfileHeader.js`):** Opens `AuthModal.js` with **Continue with Google** (`supabase.auth.signInWithOAuth({ provider: 'google' })`), **Email/Password Sign In & Sign Up**, and an in-app **🛡️ Admin View** tab listing registered users and their saved passports.
* **Automatic Passport Sync (`usePinCheckData.js`):** Automatically syncs `visitedPlaces` and all passport stats to Supabase `public.profiles` whenever a signed-in user adds or edits a pin.

---

# Implementation Plan: Modular Architecture (`src/`)

## Target Directory Structure

```text
src/
├── components/
│   ├── ProfileHeader.js       # Avatar, profile details, Star Ranking + progress hint, social links, Share trigger, stats, tabs
│   ├── MapViewContainer.js    # Leaflet WebView + map HTML template
│   ├── TimelineView.js        # Chronological timeline grouped by year with country/city/island badges & Find Stays
│   ├── PublicProfileView.js   # Read-only responsive Public Web Profile Card with Star Ranking, stamps, Stay22, & sticky CTA
│   ├── ActionSheetModal.js    # Venue details, Google Maps / Find Stays (Stay22) / Uber / Bolt buttons, Edit trigger
│   ├── CheckInModal.js        # Dynamic Check-in form with 3-button City/Island/Country selector, beers, & food spots
│   └── EditProfileModal.js    # Profile, social links, Linktree helper, & JSON Backup/Restore modal
├── constants/
│   ├── defaultPlaces.js       # Initial seed places & storage keys
│   └── starRankingConfig.js   # Dedicated configurable thresholds for 0–5 Star Ranking tiers
├── hooks/
│   └── usePinCheckData.js     # Custom hook managing AsyncStorage persistence, Star Ranking sync, backup/restore & schema migration
├── styles/
│   └── styles.js              # Centralized StyleSheet definitions
└── utils/
    ├── categories.js          # Category counters, multi-city/island helpers, & evaluateStarRanking
    ├── externalLinks.js       # openSocial, openInGoogleMaps, openStay22, openUber, openBolt, shareProfile, buildProfileShareUrl
    └── geocoding.js           # OpenStreetMap Nominatim fetchCoordinates, auto-detection & searchVenueInCity helpers
```
