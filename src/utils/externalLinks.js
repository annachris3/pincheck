import { Alert, Linking, Share } from 'react-native';

// Safe Social Opener
export const openSocial = (url) => {
  if (!url) return;
  const formatted = url.startsWith('http') ? url : `https://${url}`;
  Linking.openURL(formatted).catch(() => {
    Alert.alert('Cannot Open Link', 'The link could not be opened.');
  });
};

// Addressless Google Maps Launcher
export const openInGoogleMaps = (place) => {
  const query = encodeURIComponent(`${place.title}, ${place.city}, ${place.country}`);
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  Linking.openURL(url).catch(() => {
    Alert.alert('Cannot Open Maps', 'Could not launch Google Maps.');
  });
};

// Open Uber
export const openUber = (place) => {
  const nickname = encodeURIComponent(place.title || place.city);
  const uberAppUrl = `uber://?action=setPickup&dropoff[latitude]=${place.lat}&dropoff[longitude]=${place.lng}&dropoff[nickname]=${nickname}`;
  const uberWebUrl = `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${place.lat}&dropoff[longitude]=${place.lng}&dropoff[nickname]=${nickname}`;

  Linking.canOpenURL(uberAppUrl)
    .then((supported) => {
      if (supported) {
        Linking.openURL(uberAppUrl);
      } else {
        Linking.openURL(uberWebUrl);
      }
    })
    .catch(() => Linking.openURL(uberWebUrl));
};

// Open Bolt
export const openBolt = (place) => {
  const boltAppUrl = `bolt://rides?destination_lat=${place.lat}&destination_lng=${place.lng}`;
  const boltWebUrl = 'https://bolt.eu';

  Linking.canOpenURL(boltAppUrl)
    .then((supported) => {
      if (supported) {
        Linking.openURL(boltAppUrl);
      } else {
        Linking.openURL(boltWebUrl);
      }
    })
    .catch(() => Linking.openURL(boltWebUrl));
};

// Share Profile Function
export const shareProfile = async ({
  displayName,
  visitedPlaces,
  youtubeUrl,
  instagramUser,
  tiktokUser,
  customLinkUrl,
  customLinkLabel,
}) => {
  try {
    const countriesCount = new Set(
      visitedPlaces.map((p) => (p.country || '').trim().toLowerCase()).filter(Boolean)
    ).size;
    const citiesCount = new Set(
      visitedPlaces.map((p) => (p.city || '').trim().toLowerCase()).filter(Boolean)
    ).size;
    const beersCount = visitedPlaces.filter((p) => p.category === 'beer').length;
    const sightsCount = visitedPlaces.filter(
      (p) => p.category === 'visit' || !p.category
    ).length;
    const foodCount = visitedPlaces.filter(
      (p) => p.category === 'restaurant' || p.category === 'food' || p.category === 'cafe'
    ).length;

    const linksList = [
      youtubeUrl ? `YouTube: ${youtubeUrl}` : null,
      instagramUser ? `Instagram: @${instagramUser.replace('@', '')}` : null,
      tiktokUser ? `TikTok: @${tiktokUser.replace('@', '')}` : null,
      customLinkUrl ? `${customLinkLabel}: ${customLinkUrl}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    await Share.share({
      title: `${displayName} • PinCheck`,
      message:
        `Check out my travel map on PinCheck! ✈️\n` +
        `🌍 ${countriesCount} Countries • 🏙️ ${citiesCount} Cities\n` +
        `🍺 ${beersCount} Local Beers Tasted\n` +
        `📍 ${sightsCount} Sights & Landmarks | 🍽️ ${foodCount} Food Spots` +
        (linksList ? `\n\nFollow my journey:\n${linksList}` : '') +
        `\n\nNo Plan, Just PinCheck!`,
    });
  } catch (error) {
    console.log('Share error:', error);
  }
};
