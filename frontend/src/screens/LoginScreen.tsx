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
import { apiService, TokenData } from '../services/api';
import { useTheme, ThemeColors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

interface LoginScreenProps {
  onNavigateToSignUp: () => void;
  onLoginSuccess: (tokens: TokenData) => void;
  initialEmail?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToSignUp,
  onLoginSuccess,
  initialEmail = '',
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loginStatus, setLoginStatus] = useState<'idle' | 'verifying' | 'success'>('idle');

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { theme } = useTheme();
  const { language, setLanguage, t, isRtl } = useLanguage();
  const styles = createStyles(theme, isRtl);

  const validate = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError(t('email_required'));
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError(t('valid_email_required'));
      isValid = false;
    }

    if (!password) {
      setPasswordError(t('password_required'));
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoginStatus('verifying');
    setGeneralError('');

    try {
      const response = await apiService.login(email, password);
      
      if (response.success && response.data) {
        setLoginStatus('success');
        // Smooth visual delay to display Success state
        setTimeout(() => {
          onLoginSuccess(response.data!);
        }, 1200);
      } else {
        const errorMsg = response.error?.message || t('login_failed');
        setGeneralError(errorMsg);
        setLoginStatus('idle');
      }
    } catch (err: any) {
      setGeneralError(t('unexpected_error'));
      setLoginStatus('idle');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      {/* Subtle Gradient Background (Web support) */}
      <View style={styles.gradientOverlay} />

      <View style={styles.mainContainer}>
        {/* Main Card (silk-convex Neomorphic style) */}
        <View style={styles.card}>
          {/* Language Toggle */}
          <View style={styles.langToggleContainer}>
            <TouchableOpacity
              style={styles.langToggleBtn}
              onPress={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="language" size={16} color={theme.primary} style={styles.langToggleIcon} />
              <Text style={styles.langToggleText}>
                {language === 'en' ? 'العربية' : 'English'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.gavelContainer}>
              <MaterialIcons name="gavel" size={32} color={theme.primary} />
            </View>
            <Text style={styles.title}>{t('lexisai')}</Text>
            <Text style={styles.subtitle}>{t('login_subtitle')}</Text>
          </View>

          {generalError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{generalError}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('email_address')}</Text>
              <View style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused,
                emailError ? styles.inputWrapperError : null
              ]}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="alternate-email" size={20} color={theme.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="name@firm.com"
                  placeholderTextColor={theme.isDark ? '#5a6275' : '#a1a1aa'}
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

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>{t('password')}</Text>
                <TouchableOpacity onPress={() => Linking.openURL('#')}>
                  <Text style={styles.forgotPassword}>{t('forgot_password')}</Text>
                </TouchableOpacity>
              </View>
              <View style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused,
                passwordError ? styles.inputWrapperError : null
              ]}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="lock" size={20} color={theme.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={theme.isDark ? '#5a6275' : '#a1a1aa'}
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

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                loginStatus === 'verifying' && styles.submitButtonVerifying,
                loginStatus === 'success' && styles.submitButtonSuccess
              ]}
              onPress={handleLogin}
              disabled={loginStatus !== 'idle'}
              activeOpacity={0.85}
            >
              {loginStatus === 'verifying' ? (
                <View style={styles.btnContent}>
                  <ActivityIndicator size="small" color="#ffffff" style={styles.spinner} />
                  <Text style={styles.submitButtonText}>{t('verifying')}</Text>
                </View>
              ) : loginStatus === 'success' ? (
                <Text style={styles.submitButtonText}>{t('success')}</Text>
              ) : (
                <Text style={styles.submitButtonText}>{t('log_in')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('or_continue_with')}</Text>
          </View>

          {/* Social Logins */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD52f96UBSagMCzQ42BBVMwDL_0WVZUZPdXB5FZtyK2N17ZdcILvKS2Y1f7FzEAQEofG4JFt3VHXsFxVBuzFqV4ujLzG3QbYiNfdIdWRFrlOM2jsxHHJIBVCbrzEGq4nRdwmLf0PfmmZTEGkn8F6D_PZUfu7AEMdA8g1kAEts2pgxlNY4VEsyOoVBahbbZrta3AkHeDd2WWHU5_YDkHtHEtykpSjA30RXonTV6bbRib4UVATrZRJW8RdhH64XZiXsZySxSEaCIDx-yh' }}
                style={styles.socialIconGoogle}
              />
              <Text style={styles.socialButtonText}>{t('google')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <MaterialCommunityIcons name="github" size={20} color={theme.isDark ? '#f8fafc' : '#1f2937'} style={styles.socialIconGithub} />
              <Text style={styles.socialButtonText}>{t('github')}</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Section */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('dont_have_account')} </Text>
            <TouchableOpacity onPress={onNavigateToSignUp}>
              <Text style={styles.createAccountLink}>{t('create_account')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System Footer */}
        <View style={styles.systemFooter}>
          <Text style={styles.systemFooterText}>{t('system_copyright')}</Text>
          <View style={styles.systemFooterLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('#')}>
              <Text style={[styles.systemFooterText, styles.systemLink]}>{t('privacy')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('#')}>
              <Text style={[styles.systemFooterText, styles.systemLink, { marginLeft: isRtl ? 0 : 16, marginRight: isRtl ? 16 : 0 }]}>{t('terms')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: ThemeColors, isRtl: boolean) => StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.bgAlt,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        backgroundImage: theme.isDark 
          ? 'linear-gradient(to bottom right, #0d0e12, #0d0e12, #090a0f)'
          : 'linear-gradient(to bottom right, #f3f4f6, #f3f4f6, #e5e7eb)',
      },
    }),
  },
  mainContainer: {
    width: '100%',
    maxWidth: 440,
    zIndex: 10,
  },
  card: {
    backgroundColor: theme.isDark ? theme.cardBg : theme.bgAlt,
    borderRadius: 24,
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
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  langToggleContainer: {
    flexDirection: isRtl ? 'row' : 'row-reverse',
    marginBottom: -16,
    zIndex: 15,
  },
  langToggleBtn: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  langToggleIcon: {
    marginRight: isRtl ? 0 : 4,
    marginLeft: isRtl ? 4 : 0,
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  gavelContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.isDark ? 'rgba(99, 102, 241, 0.05)' : theme.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: theme.isDark ? 'none' : '6px 6px 12px #dbdbdb, -6px -6px 12px #ffffff',
      },
      ios: {
        shadowColor: theme.isDark ? 'transparent' : '#dbdbdb',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  title: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 30,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '500',
    textAlign: 'center',
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
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    fontWeight: '600',
    color: theme.textMuted,
    paddingHorizontal: 4,
    marginBottom: 6,
    textAlign: isRtl ? 'right' : 'left',
  },
  passwordHeader: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPassword: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
  inputWrapper: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBg,
    borderRadius: 12,
    height: 52,
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
          ? 'inset 2px 2px 5px rgba(0,0,0,0.3), 0 0 0 2px rgba(99, 102, 241, 0.2)' 
          : 'inset 2px 2px 5px #d1d1d1, inset -2px -2px 5px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2)',
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
    fontSize: 15,
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
    marginTop: 6,
    paddingLeft: isRtl ? 0 : 4,
    paddingRight: isRtl ? 4 : 0,
    textAlign: isRtl ? 'right' : 'left',
  },
  submitButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      web: {
        boxShadow: theme.isDark ? 'none' : '4px 4px 10px rgba(99, 102, 241, 0.3), -4px -4px 10px rgba(255, 255, 255, 0.8)',
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
  submitButtonVerifying: {
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
    fontWeight: '800',
  },
  btnContent: {
    flexDirection: 'row',
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
    marginVertical: 40,
    position: 'relative',
  },
  dividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(209, 213, 219, 0.3)',
  },
  dividerText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    backgroundColor: theme.isDark ? theme.cardBg : theme.bgAlt,
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    zIndex: 1,
  },
  socialContainer: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    gap: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.isDark ? theme.cardBg : theme.bgAlt,
    borderRadius: 12,
    height: 52,
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
  socialIconGoogle: {
    width: 16,
    height: 16,
    marginRight: isRtl ? 0 : 8,
    marginLeft: isRtl ? 8 : 0,
  },
  socialIconGithub: {
    marginRight: isRtl ? 0 : 8,
    marginLeft: isRtl ? 8 : 0,
  },
  socialButtonText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  footer: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: theme.textMuted,
    fontSize: 14,
  },
  createAccountLink: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: theme.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  systemFooter: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  systemFooterText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 12,
    fontWeight: '500',
    color: theme.textLight,
  },
  systemFooterLinks: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
  },
  systemLink: {
    // We can add text decoration or transitions on web if needed
  },
});

