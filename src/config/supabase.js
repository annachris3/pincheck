import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import {
  getUniqueCountriesCount,
  getUniqueCitiesCount,
  getUniqueIslandsCount,
  getSightsCount,
  getFoodCount,
  getCafesCount,
  getDrinksCount,
  evaluateStarRanking,
} from '../utils/categories';

WebBrowser.maybeCompleteAuthSession();

// Configure these in your `.env` file (or EAS environment variables) once your Supabase project is created:
// EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL.startsWith('https://') &&
    !SUPABASE_URL.includes('your-project-ref')
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;

/**
 * Sign up with Email & Password
 */
export async function signUpWithEmail(email, password, displayName = '') {
  if (!supabase) {
    return {
      user: null,
      error: new Error(
        'Supabase project URL and Anon Key are not configured yet.'
      ),
    };
  }
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: displayName.trim() || email.split('@')[0],
      },
    },
  });
  return { user: data?.user || null, session: data?.session || null, error };
}

/**
 * Sign in with Email & Password
 */
export async function signInWithEmail(email, password) {
  if (!supabase) {
    return {
      user: null,
      error: new Error(
        'Supabase project URL and Anon Key are not configured yet.'
      ),
    };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  return { user: data?.user || null, session: data?.session || null, error };
}

/**
 * Sign in with Google OAuth (works on Web and Mobile via Expo WebBrowser)
 */
export async function signInWithGoogle() {
  if (!supabase) {
    return {
      error: new Error(
        'Supabase project URL and Anon Key are not configured yet.'
      ),
    };
  }

  const redirectTo =
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.origin
      : 'https://pincheckin.expo.app';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== 'web',
    },
  });

  if (error) return { error };

  if (Platform.OS !== 'web' && data?.url) {
    await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  }
  return { data, error: null };
}

/**
 * Sign out current user
 */
export async function signOutUser() {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Save / Sync the authenticated user's full passport + profile counters to Supabase `public.profiles`
 */
export async function syncPassportToSupabase(user, profilePayload) {
  if (!supabase || !user?.id) return { error: null };

  const visitedPlaces = Array.isArray(profilePayload.visitedPlaces)
    ? profilePayload.visitedPlaces
    : [];
  const starRanking = evaluateStarRanking(visitedPlaces);

  const safePhoto =
    typeof profilePayload.profilePhoto === 'string' &&
    profilePayload.profilePhoto.length < 400000 &&
    !profilePayload.profilePhoto.startsWith('file:')
      ? profilePayload.profilePhoto
      : null;

  const row = {
    id: user.id,
    email: user.email || '',
    display_name: profilePayload.displayName || 'Traveler',
    home_location: profilePayload.homeLocation || '',
    profile_photo: safePhoto,
    youtube_url: profilePayload.youtubeUrl || '',
    instagram_user: profilePayload.instagramUser || '',
    tiktok_user: profilePayload.tiktokUser || '',
    custom_link_url: profilePayload.customLinkUrl || '',
    custom_link_label: profilePayload.customLinkLabel || 'My Link',
    star_level: starRanking.starLevel,
    star_title: starRanking.starTitle,
    star_graphic: starRanking.starGraphic,
    countries_count: getUniqueCountriesCount(visitedPlaces),
    cities_count: getUniqueCitiesCount(visitedPlaces),
    islands_count: getUniqueIslandsCount(visitedPlaces),
    sights_count: getSightsCount(visitedPlaces),
    food_count: getFoodCount(visitedPlaces),
    cafes_count: getCafesCount(visitedPlaces),
    drinks_count: getDrinksCount(visitedPlaces),
    visited_places: visitedPlaces,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' });
  return { error };
}

/**
 * Load a user's saved passport from Supabase `public.profiles`
 */
export async function fetchPassportFromSupabase(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/**
 * Fetch all registered users & their saved passports (for Admin view)
 */
export async function fetchAllPassportsForAdmin() {
  if (!supabase) return { data: [], error: null };
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(100);
  return { data: data || [], error };
}
