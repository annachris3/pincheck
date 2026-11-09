import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/styles';
import {
  isSupabaseConfigured,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOutUser,
  fetchAllPassportsForAdmin,
} from '../config/supabase';

export function AuthModal({
  visible,
  onClose,
  authUser,
  onAuthSuccess,
  onManualSync,
}) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Admin Passports List
  const [adminPassports, setAdminPassports] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  const loadAdminPassports = async () => {
    if (!isSupabaseConfigured) return;
    setLoadingAdmin(true);
    const { data, error } = await fetchAllPassportsForAdmin();
    setLoadingAdmin(false);
    if (!error && Array.isArray(data)) {
      setAdminPassports(data);
    }
  };

  const handleEmailSubmit = async () => {
    setErrorMessage('');
    setStatusMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    if (mode === 'signup') {
      const { user, error } = await signUpWithEmail(email, password, fullName);
      setLoading(false);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      setStatusMessage(
        'Account created! Your PinCheck passport is now synced to Supabase.'
      );
      if (user && onAuthSuccess) {
        onAuthSuccess(user);
      }
    } else {
      const { user, error } = await signInWithEmail(email, password);
      setLoading(false);
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      setStatusMessage('Signed in! Syncing your passport...');
      if (user && onAuthSuccess) {
        onAuthSuccess(user);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setStatusMessage('');
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOutUser();
    setLoading(false);
    setStatusMessage('Signed out of cloud account. Local pins remain safe.');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '90%' }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <Text style={styles.modalTitle}>
                🔐 PinCheck Cloud & Sign-In
              </Text>
              <TouchableOpacity
                style={styles.closeSheetBtn}
                onPress={onClose}
              >
                <Text style={styles.closeSheetX}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Sign in with Google or Email to back up your passport to Supabase
              and sync across devices.
            </Text>

            {/* Mode Switcher: Sign In | Create Account | Admin Passports */}
            <View style={[styles.categoryPickerRow, { marginBottom: 14 }]}>
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  mode === 'signin' && styles.categoryPillActive,
                ]}
                onPress={() => {
                  setMode('signin');
                  setErrorMessage('');
                  setStatusMessage('');
                }}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    mode === 'signin' && styles.categoryPillTextActive,
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  mode === 'signup' && styles.categoryPillActive,
                ]}
                onPress={() => {
                  setMode('signup');
                  setErrorMessage('');
                  setStatusMessage('');
                }}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    mode === 'signup' && styles.categoryPillTextActive,
                  ]}
                >
                  Create Account
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  mode === 'admin' && styles.categoryPillActive,
                ]}
                onPress={() => {
                  setMode('admin');
                  setErrorMessage('');
                  setStatusMessage('');
                  loadAdminPassports();
                }}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    mode === 'admin' && styles.categoryPillTextActive,
                  ]}
                >
                  🛡️ Admin View
                </Text>
              </TouchableOpacity>
            </View>

            {!isSupabaseConfigured && (
              <View
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.14)',
                  borderWidth: 1,
                  borderColor: '#f59e0b',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{
                    color: '#fbbf24',
                    fontSize: 13,
                    fontWeight: '800',
                    marginBottom: 4,
                  }}
                >
                  ⚡ Waiting for Supabase Project Keys
                </Text>
                <Text style={{ color: '#e2e8f0', fontSize: 12, lineHeight: 17 }}>
                  Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
                  to your .env file and run supabase/schema.sql in your Supabase
                  SQL Editor to activate live Google & Email sign-in.
                </Text>
              </View>
            )}

            {mode === 'admin' ? (
              <View style={styles.subCategoryBox}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <Text style={styles.subCategoryTitle}>
                    🛡️ Registered Users & Saved Passports ({adminPassports.length})
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.cardEditPill,
                      { paddingHorizontal: 10, paddingVertical: 5 },
                    ]}
                    onPress={loadAdminPassports}
                  >
                    <Text style={styles.cardEditPillText}>↻ Refresh</Text>
                  </TouchableOpacity>
                </View>

                {loadingAdmin ? (
                  <ActivityIndicator
                    color="#38bdf8"
                    size="small"
                    style={{ marginVertical: 16 }}
                  />
                ) : adminPassports.length === 0 ? (
                  <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                    No registered cloud passports found yet. Once users sign up
                    with Google or Email, their saved passports will appear here
                    and in your Supabase Table Editor (`profiles` &
                    `admin_passports_view`).
                  </Text>
                ) : (
                  <View style={{ gap: 10 }}>
                    {adminPassports.map((p) => (
                      <View
                        key={p.id}
                        style={{
                          backgroundColor: '#0f172a',
                          borderRadius: 10,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: '#334155',
                        }}
                      >
                        <Text
                          style={{
                            color: '#f8fafc',
                            fontSize: 14,
                            fontWeight: '800',
                          }}
                        >
                          {p.display_name || 'Traveler'}{' '}
                          <Text style={{ color: '#fbbf24', fontSize: 12 }}>
                            ({p.star_graphic || '⭐'} {p.star_title || 'Explorer'})
                          </Text>
                        </Text>
                        {p.email ? (
                          <Text
                            style={{
                              color: '#38bdf8',
                              fontSize: 12,
                              marginTop: 2,
                            }}
                          >
                            ✉️ {p.email}
                          </Text>
                        ) : null}
                        <Text
                          style={{
                            color: '#cbd5e1',
                            fontSize: 12,
                            marginTop: 6,
                          }}
                        >
                          🌍 {p.countries_count || 0} Countries · 🏙️{' '}
                          {p.cities_count || 0} Cities · 🏝️{' '}
                          {p.islands_count || 0} Islands
                        </Text>
                        <Text
                          style={{
                            color: '#94a3b8',
                            fontSize: 11,
                            marginTop: 3,
                          }}
                        >
                          🏛️ {p.sights_count || 0} Sights · 🍽️{' '}
                          {p.food_count || 0} Food · ☕ {p.cafes_count || 0}{' '}
                          Cafes · 🍺 {p.drinks_count || 0} Drinks
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : authUser ? (
              /* Signed-in User Card */
              <View style={styles.subCategoryBox}>
                <Text style={styles.subCategoryTitle}>
                  ✅ Signed in to PinCheck Cloud
                </Text>
                <Text
                  style={{
                    color: '#f8fafc',
                    fontSize: 14,
                    fontWeight: '700',
                    marginBottom: 4,
                  }}
                >
                  {authUser.email}
                </Text>
                <Text
                  style={{ color: '#94a3b8', fontSize: 12, marginBottom: 14 }}
                >
                  Your passport stamps, rank, and pins automatically sync to
                  Supabase whenever you update your map.
                </Text>

                {onManualSync && (
                  <TouchableOpacity
                    style={[styles.inlineAddBtn, { marginBottom: 10 }]}
                    onPress={async () => {
                      setLoading(true);
                      await onManualSync();
                      setLoading(false);
                      setStatusMessage(
                        'Passport synced to Supabase successfully!'
                      );
                    }}
                  >
                    <Text style={styles.inlineAddBtnText}>
                      ☁️ Sync Passport Now
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn, { width: '100%' }]}
                  onPress={handleSignOut}
                >
                  <Text style={styles.cancelText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Sign In / Create Account Form */
              <View>
                {/* Google OAuth Button */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    marginBottom: 14,
                    gap: 10,
                  }}
                  onPress={handleGoogleLogin}
                  disabled={loading}
                >
                  <Ionicons name="logo-google" size={18} color="#EA4335" />
                  <Text
                    style={{
                      color: '#0f172a',
                      fontSize: 14,
                      fontWeight: '800',
                    }}
                  >
                    Continue with Google
                  </Text>
                </TouchableOpacity>

                <Text
                  style={{
                    color: '#64748b',
                    fontSize: 12,
                    fontWeight: '700',
                    textAlign: 'center',
                    marginBottom: 12,
                  }}
                >
                  — OR USE EMAIL —
                </Text>

                {mode === 'signup' && (
                  <>
                    <Text style={styles.fieldLabel}>Display Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Your Name (e.g. Anna)"
                      placeholderTextColor="#64748b"
                      value={fullName}
                      onChangeText={setFullName}
                    />
                  </>
                )}

                <Text style={styles.fieldLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />

                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={handleEmailSubmit}
                />

                {errorMessage ? (
                  <Text
                    style={{
                      color: '#f87171',
                      fontSize: 12,
                      fontWeight: '600',
                      marginBottom: 10,
                    }}
                  >
                    ⚠️ {errorMessage}
                  </Text>
                ) : null}

                {statusMessage ? (
                  <Text
                    style={{
                      color: '#34d399',
                      fontSize: 12,
                      fontWeight: '600',
                      marginBottom: 10,
                    }}
                  >
                    ✅ {statusMessage}
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.btn, styles.saveBtn, { marginTop: 4 }]}
                  onPress={handleEmailSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#0f172a" size="small" />
                  ) : (
                    <Text style={styles.saveText}>
                      {mode === 'signup'
                        ? 'Create Account & Save Passport'
                        : 'Sign In with Email'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
