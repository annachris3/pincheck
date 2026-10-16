export const getCategoryIcon = (category) => {
  switch (category) {
    case 'restaurant':
    case 'food':
      return '🍽️';
    case 'cafe':
      return '☕';
    case 'beer':
      return '🍺';
    case 'visit':
    default:
      return '📍';
  }
};

export const getCategoryLabel = (category) => {
  switch (category) {
    case 'restaurant':
    case 'food':
      return 'Restaurant';
    case 'cafe':
      return 'Cafe';
    case 'beer':
      return 'Beer & Bar';
    case 'visit':
    default:
      return 'Just Visit';
  }
};

export const getCategoryPlaceholder = (selectedCategory) => {
  if (selectedCategory === 'beer') {
    return 'Local Beer Name (e.g. Augustiner, Guinness, Peroni)';
  }
  if (selectedCategory === 'restaurant' || selectedCategory === 'food') {
    return 'Restaurant Name (e.g. Figlmüller, Trattoria)';
  }
  if (selectedCategory === 'cafe') {
    return 'Cafe Name (e.g. Café Central, Bakery)';
  }
  return 'Landmark / Sight (e.g. Schönbrunn Palace, Lake Bled, Viewpoint)';
};
