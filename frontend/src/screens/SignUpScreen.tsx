import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
  Linking,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { useTheme, ThemeColors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface SignUpScreenProps {
  onNavigateToLogin: () => void;
  onSignUpSuccess: (email: string) => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onNavigateToLogin,
  onSignUpSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [signupStatus, setSignupStatus] = useState<'idle' | 'creating' | 'success'>('idle');

  // Input focus states
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const { theme } = useTheme();
  const { language, setLanguage, t, isRtl } = useLanguage();
  const styles = createStyles(theme, isRtl);

  const validate = () => {
    let isValid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');

    if (!fullName.trim()) {
      setNameError(t('name_required'));
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError(t('work_email_required'));
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError(t('valid_email_required'));
      isValid = false;
    }

    // Password validation: Min 8 chars with at least one symbol
    const symbolRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!password) {
      setPasswordError(t('password_required'));
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError(t('pass_length_required'));
      isValid = false;
    } else if (!symbolRegex.test(password)) {
      setPasswordError(t('pass_symbol_required'));
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(t('confirm_pass_required'));
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(t('pass_match_required'));
      isValid = false;
    }

    return isValid;
  };

  const handleSignUp = async () => {
    if (!validate()) return;

    setSignupStatus('creating');
    setGeneralError('');
    setSuccessMsg('');

    try {
      const response = await apiService.signup(email, password);
      
      if (response.success) {
        setSignupStatus('success');
        setSuccessMsg(t('account_created_success'));
        setTimeout(() => {
          onSignUpSuccess(email);
        }, 1500);
      } else {
        const errorMsg = response.error?.message || t('registration_failed');
        if (response.error?.details && Array.isArray(response.error.details)) {
          const detail = response.error.details[0];
          if (detail.loc?.includes('body') && detail.loc?.includes('password')) {
            setPasswordError(detail.msg);
          } else {
            setGeneralError(detail.msg || errorMsg);
          }
        } else {
          setGeneralError(errorMsg);
        }
        setSignupStatus('idle');
      }
    } catch (err: any) {
      setGeneralError(t('unexpected_error'));
      setSignupStatus('idle');
    }
  };

  // Micro-interaction styling helper: Pink shadow/border if password length > 0 and < 8
  const isPasswordTooShort = password.length > 0 && password.length < 8;

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      {/* Dynamic Background Circles */}
      <View style={styles.backgroundContainer}>
        <View style={styles.blurCircleWhite} />
        <View style={styles.blurCircleIndigo} />
      </View>

      {/* Header Bar */}
      <View style={styles.navHeader}>
        <Text style={styles.brandText}>{t('lexisai')}</Text>
        <View style={styles.navLinks}>
          <TouchableOpacity onPress={() => setLanguage(language === 'en' ? 'ar' : 'en')} style={styles.langToggleHeaderBtn}>
            <MaterialIcons name="language" size={16} color={theme.textMuted} style={{ marginRight: isRtl ? 0 : 4, marginLeft: isRtl ? 4 : 0 }} />
            <Text style={styles.navLinkText}>{language === 'en' ? 'العربية' : 'English'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('#')} style={{ marginLeft: isRtl ? 0 : 16, marginRight: isRtl ? 16 : 0 }}>
            <Text style={styles.navLinkText}>{t('support')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('#')} style={{ marginLeft: isRtl ? 0 : 16, marginRight: isRtl ? 16 : 0 }}>
            <Text style={styles.navLinkText}>{t('privacy')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContainer}>
        {/* Sign-Up Card */}
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('create_account')}</Text>
            <Text style={styles.subtitle}>
              {t('join_thousands')}
            </Text>
          </View>

          {generalError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{generalError}</Text>
            </View>
          ) : null}

          {successMsg ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('full_name')}</Text>
              <View style={[
                styles.inputWrapper,
                nameFocused && styles.inputWrapperFocused,
                nameError ? styles.inputWrapperError : null
              ]}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="person" size={20} color={theme.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={t('full_name')}
                  placeholderTextColor={theme.isDark ? '#5a6275' : '#cbd5e1'}
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  autoCorrect={false}
                />
              </View>
              {nameError ? <Text style={styles.fieldErrorText}>{nameError}</Text> : null}
            </View>

            {/* Work Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('work_email')}</Text>
              <View style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused,
                emailError ? styles.inputWrapperError : null
              ]}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="mail" size={20} color={theme.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="name@firm.com"
                  placeholderTextColor={theme.isDark ? '#5a6275' : '#cbd5e1'}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {emailError ? <Text style={styles.fieldErrorText}>{emailError}</Text> : null}
            </View>

            {/* Password Columns */}
            <View style={styles.passwordRow}>
              {/* Password */}
              <View style={styles.halfInputGroup}>
                <Text style={styles.label}>{t('password')}</Text>
                <View style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputWrapperFocused,
                  isPasswordTooShort && styles.inputWrapperWarning,
                  passwordError ? styles.inputWrapperError : null
                ]}>
                  <View style={styles.inputIcon}>
                    <MaterialIcons name="lock" size={20} color={theme.textMuted} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={theme.isDark ? '#5a6275' : '#cbd5e1'}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {passwordError ? <Text style={styles.fieldErrorText}>{passwordError}</Text> : null}
              </View>

              {/* Confirm Password */}
              <View style={styles.halfInputGroup}>
                <Text style={styles.label}>{t('confirm_password')}</Text>
                <View style={[
                  styles.inputWrapper,
                  confirmFocused && styles.inputWrapperFocused,
                  confirmPasswordError ? styles.inputWrapperError : null
                ]}>
                  <View style={styles.inputIcon}>
                    <MaterialCommunityIcons name="lock-reset" size={20} color={theme.textMuted} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={theme.isDark ? '#5a6275' : '#cbd5e1'}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setConfirmFocused(true)}
                    onBlur={() => setConfirmFocused(false)}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {confirmPasswordError ? <Text style={styles.fieldErrorText}>{confirmPasswordError}</Text> : null}
              </View>
            </View>

            {/* Requirements Ticker */}
            <View style={styles.requirementsTicker}>
              <MaterialIcons name="info" size={18} color={theme.primary} style={{ marginRight: isRtl ? 0 : 8, marginLeft: isRtl ? 8 : 0 }} />
              <Text style={styles.requirementsText}>
                {t('min_pass_req_sub')}
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                signupStatus === 'creating' && styles.submitButtonCreating,
                signupStatus === 'success' && styles.submitButtonSuccess
              ]}
              onPress={handleSignUp}
              disabled={signupStatus !== 'idle'}
              activeOpacity={0.85}
            >
              {signupStatus === 'creating' ? (
                <View style={styles.btnContent}>
                  <ActivityIndicator size="small" color="#ffffff" style={styles.spinner} />
                  <Text style={styles.submitButtonText}>{t('creating_account')}</Text>
                </View>
              ) : signupStatus === 'success' ? (
                <Text style={styles.submitButtonText}>{t('success')}</Text>
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.submitButtonText}>{t('create_account')}</Text>
                  <MaterialIcons name={isRtl ? "arrow-back" : "arrow-forward"} size={18} color="#ffffff" style={{ marginLeft: isRtl ? 0 : 8, marginRight: isRtl ? 8 : 0 }} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('or')}</Text>
          </View>

          {/* Google Sign Up */}
          <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHNj2z0LaE7CLmixsbUDKESq11vwrV0F2NUfI0KOvoDUiLjQZLA_W6fmHe_3oSGaOZCJ8O3xFbKQzVrgRFZydCv0lb9xa7yPuudmDVJE-_-9qoo58z_o9RoP72ONz5hlXixsI8QsExzHuafe3PnzlU4VfcN3a34uEPnHoUzzIfXSVK4DkLwXMkP0_ujEpUVEEuHTZenGxUx-i8bJnFpWxJIziEAInJPxP-AwNqRdqffPVR8iONSEFpEi4vLc_B3B8xvtBeWixIkvFx' }}
              style={styles.googleIcon}
            />
            <Text style={styles.socialButtonText}>{t('signup_google')}</Text>
          </TouchableOpacity>

          {/* Login redirection link */}
          <View style={styles.footerLinkContainer}>
            <Text style={styles.footerLinkText}>{t('already_have_account')} </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.loginLink}>{t('log_in')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trust Badges */}
        <View style={styles.trustContainer}>
          <Text style={styles.agreementText}>
            {t('agreement_text_start')}
            <Text style={styles.underlineText} onPress={() => Linking.openURL('#')}>{t('terms_service')}</Text>{t('agreement_text_and')}
            <Text style={styles.underlineText} onPress={() => Linking.openURL('#')}>{t('privacy_policy')}</Text>.
          </Text>

          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <MaterialIcons name="verified-user" size={16} color={theme.textMuted} style={{ marginRight: isRtl ? 0 : 4, marginLeft: isRtl ? 4 : 0 }} />
              <Text style={styles.badgeText}>{t('soc2_compliant')}</Text>
            </View>
            <View style={styles.badge}>
              <MaterialIcons name="security" size={16} color={theme.textMuted} style={{ marginRight: isRtl ? 0 : 4, marginLeft: isRtl ? 4 : 0 }} />
              <Text style={styles.badgeText}>{t('aes_256_enc')}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Footer */}
      <View style={styles.mainFooter}>
        <Text style={styles.footerCopyright}>
          {t('copyright')}
        </Text>
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => Linking.openURL('#')}>
            <Text style={styles.footerCopyright}>{t('security')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('#')} style={{ marginLeft: isRtl ? 0 : 16, marginRight: isRtl ? 16 : 0 }}>
            <Text style={styles.footerCopyright}>{t('legal')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: ThemeColors, isRtl: boolean) => StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 40,
    paddingHorizontal: 16,
    backgroundColor: theme.bg,
    alignItems: 'center',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: theme.isDark ? 0.15 : 0.4,
    zIndex: 0,
  },
  blurCircleWhite: {
    position: 'absolute',
    top: '-10%',
    right: '-10%',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: theme.isDark ? '#1a1d24' : '#ffffff',
    ...Platform.select({
      web: {
        filter: 'blur(120px)',
      },
    }),
  },
  blurCircleIndigo: {
    position: 'absolute',
    bottom: '-10%',
    left: '-10%',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: theme.isDark ? '#11132e' : '#e0e7ff',
    ...Platform.select({
      web: {
        filter: 'blur(100px)',
      },
    }),
  },
  navHeader: {
    width: '100%',
    maxWidth: 1200,
    flexDirection: isRtl ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 10,
  },
  brandText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.primary,
    letterSpacing: -0.5,
  },
  navLinks: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
  },
  navLinkText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '600',
  },
  langToggleHeaderBtn: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  mainContainer: {
    width: '100%',
    maxWidth: 480,
    zIndex: 10,
  },
  card: {
    backgroundColor: theme.isDark ? theme.cardBg : theme.bg,
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    ...Platform.select({
      web: {
        boxShadow: theme.shadowBox,
      },
      ios: {
        shadowColor: theme.shadowColor,
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: theme.isDark ? 0.3 : 0.9,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  successText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 16,
  },
  passwordRow: {
    flexDirection: Platform.OS === 'web' ? (isRtl ? 'row-reverse' : 'row') : 'column',
    gap: 16,
    marginBottom: 16,
  },
  halfInputGroup: {
    flex: 1,
    marginBottom: Platform.OS === 'web' ? 0 : 0,
  },
  label: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    paddingLeft: isRtl ? 0 : 4,
    paddingRight: isRtl ? 4 : 0,
    textAlign: isRtl ? 'right' : 'left',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBg,
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: theme.isDark ? theme.inputBorder : 'transparent',
    ...Platform.select({
      web: {
        boxShadow: theme.shadowInset,
      },
      ios: {
        shadowColor: theme.shadowColor,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
      },
    }),
  },
  inputWrapperFocused: {
    borderColor: theme.primary,
    ...Platform.select({
      web: {
        boxShadow: theme.isDark 
          ? 'inset 4px 4px 8px rgba(0,0,0,0.3), 0 0 0 2px rgba(99, 102, 241, 0.2)' 
          : 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2)',
      },
    }),
  },
  inputWrapperWarning: {
    borderColor: '#ef4444',
    ...Platform.select({
      web: {
        boxShadow: theme.isDark 
          ? 'inset 4px 4px 8px rgba(239, 68, 68, 0.1), inset -4px -4px 8px rgba(0,0,0,0.3)' 
          : 'inset 4px 4px 8px #ffdada, inset -4px -4px 8px #ffffff',
      },
    }),
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    paddingLeft: isRtl ? 0 : 16,
    paddingRight: isRtl ? 16 : 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: theme.inputText,
    fontSize: 14,
    height: '100%',
    paddingLeft: isRtl ? 16 : 12,
    paddingRight: isRtl ? 12 : 16,
    textAlign: isRtl ? 'right' : 'left',
    ...Platform.select({
      web: {
        outlineWidth: 0,
      },
    }),
  },
  fieldErrorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    paddingLeft: isRtl ? 0 : 4,
    paddingRight: isRtl ? 4 : 0,
    textAlign: isRtl ? 'right' : 'left',
  },
  requirementsTicker: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: theme.isDark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(240, 242, 245, 0.5)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: theme.shadowInset,
      },
    }),
  },
  requirementsText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    textAlign: isRtl ? 'right' : 'left',
  },
  submitButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      web: {
        boxShadow: theme.isDark ? 'none' : '4px 4px 12px rgba(99, 102, 241, 0.3), -4px -4px 12px rgba(255, 255, 255, 0.8)',
      },
      ios: {
        shadowColor: theme.primary,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonCreating: {
    backgroundColor: theme.primaryHover,
    ...Platform.select({
      web: {
        boxShadow: 'inset 4px 4px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  submitButtonSuccess: {
    backgroundColor: theme.accent,
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.1)',
      },
    }),
  },
  submitButtonText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  btnContent: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    position: 'relative',
  },
  dividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : '#cbd5e1',
  },
  dividerText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    backgroundColor: theme.isDark ? theme.cardBg : theme.bg,
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.textMuted,
    zIndex: 1,
  },
  socialButton: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.isDark ? theme.cardBg : theme.bg,
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    ...Platform.select({
      web: {
        boxShadow: theme.shadowBox,
      },
      ios: {
        shadowColor: theme.shadowColor,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: isRtl ? 0 : 8,
    marginLeft: isRtl ? 8 : 0,
  },
  socialButtonText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.text,
  },
  footerLinkContainer: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerLinkText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: theme.textMuted,
    fontSize: 14,
  },
  loginLink: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: theme.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  trustContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  agreementText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 12,
    color: theme.textMuted,
    textAlign: isRtl ? 'right' : 'left',
    lineHeight: 18,
    opacity: 0.8,
    paddingHorizontal: 16,
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
  badgesRow: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    opacity: 0.4,
  },
  badge: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.textMuted,
    letterSpacing: 1,
  },
  mainFooter: {
    width: '100%',
    maxWidth: 1200,
    borderTopWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : '#cbd5e1',
    backgroundColor: theme.bg,
    marginTop: 40,
    paddingTop: 16,
    flexDirection: Platform.OS === 'web' ? (isRtl ? 'row-reverse' : 'row') : 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  footerCopyright: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 12,
    color: theme.textLight,
  },
  footerLinks: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    marginTop: Platform.OS === 'web' ? 0 : 8,
  },
});
