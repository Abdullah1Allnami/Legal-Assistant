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

  const validate = () => {
    let isValid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');

    if (!fullName.trim()) {
      setNameError('Full Name is required');
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Work Email is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Password validation: Min 8 chars with at least one symbol
    const symbolRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    } else if (!symbolRegex.test(password)) {
      setPasswordError('Password must contain at least one symbol');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
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
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => {
          onSignUpSuccess(email);
        }, 1500);
      } else {
        const errorMsg = response.error?.message || 'Registration failed. Please try again.';
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
      setGeneralError('An unexpected error occurred. Please try again.');
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
        <Text style={styles.brandText}>LexisAI</Text>
        <View style={styles.navLinks}>
          <TouchableOpacity onPress={() => Linking.openURL('#')}>
            <Text style={styles.navLinkText}>Support</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('#')}>
            <Text style={[styles.navLinkText, { marginLeft: 16 }]}>Privacy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContainer}>
        {/* Sign-Up Card */}
        <View style={styles.card}>
          <View style={styles.header}>
            <h1 style={styles.title}>Create your account</h1>
            <Text style={styles.subtitle}>
              Join thousands of legal professionals using AI-powered intelligence.
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
              <Text style={styles.label}>Full Name</Text>
              <View style={[
                styles.inputWrapper,
                nameFocused && styles.inputWrapperFocused,
                nameError ? styles.inputWrapperError : null
              ]}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="person" size={20} color="#64748b" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#cbd5e1"
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
              <Text style={styles.label}>Work Email</Text>
              <View style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused,
                emailError ? styles.inputWrapperError : null
              ]}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="mail" size={20} color="#64748b" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="name@firm.com"
                  placeholderTextColor="#cbd5e1"
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
                <Text style={styles.label}>Password</Text>
                <View style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputWrapperFocused,
                  isPasswordTooShort && styles.inputWrapperWarning,
                  passwordError ? styles.inputWrapperError : null
                ]}>
                  <View style={styles.inputIcon}>
                    <MaterialIcons name="lock" size={20} color="#64748b" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#cbd5e1"
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
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[
                  styles.inputWrapper,
                  confirmFocused && styles.inputWrapperFocused,
                  confirmPasswordError ? styles.inputWrapperError : null
                ]}>
                  <View style={styles.inputIcon}>
                    <MaterialCommunityIcons name="lock-reset" size={20} color="#64748b" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#cbd5e1"
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
              <MaterialIcons name="info" size={18} color="#6366f1" style={{ marginRight: 8 }} />
              <Text style={styles.requirementsText}>
                Min. 8 characters with at least one symbol.
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
                  <Text style={styles.submitButtonText}>Creating account...</Text>
                </View>
              ) : signupStatus === 'success' ? (
                <Text style={styles.submitButtonText}>Success</Text>
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.submitButtonText}>Create account</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
          </View>

          {/* Google Sign Up */}
          <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHNj2z0LaE7CLmixsbUDKESq11vwrV0F2NUfI0KOvoDUiLjQZLA_W6fmHe_3oSGaOZCJ8O3xFbKQzVrgRFZydCv0lb9xa7yPuudmDVJE-_-9qoo58z_o9RoP72ONz5hlXixsI8QsExzHuafe3PnzlU4VfcN3a34uEPnHoUzzIfXSVK4DkLwXMkP0_ujEpUVEEuHTZenGxUx-i8bJnFpWxJIziEAInJPxP-AwNqRdqffPVR8iONSEFpEi4vLc_B3B8xvtBeWixIkvFx' }}
              style={styles.googleIcon}
            />
            <Text style={styles.socialButtonText}>Sign up with Google</Text>
          </TouchableOpacity>

          {/* Login redirection link */}
          <View style={styles.footerLinkContainer}>
            <Text style={styles.footerLinkText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Trust Badges */}
        <View style={styles.trustContainer}>
          <Text style={styles.agreementText}>
            By clicking "Create account", you agree to our{' '}
            <Text style={styles.underlineText} onPress={() => Linking.openURL('#')}>Terms of Service</Text> and{' '}
            <Text style={styles.underlineText} onPress={() => Linking.openURL('#')}>Privacy Policy</Text>.
          </Text>

          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <MaterialIcons name="verified-user" size={16} color="#64748b" style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>SOC2 COMPLIANT</Text>
            </View>
            <View style={styles.badge}>
              <MaterialIcons name="security" size={16} color="#64748b" style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>AES-256 ENCRYPTION</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Footer */}
      <View style={styles.mainFooter}>
        <Text style={styles.footerCopyright}>
          © 2024 LexisAI Technologies. Licensed Legal Intelligence.
        </Text>
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => Linking.openURL('#')}>
            <Text style={styles.footerCopyright}>Security</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('#')}>
            <Text style={[styles.footerCopyright, { marginLeft: 16 }]}>Legal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 40,
    paddingHorizontal: 16,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
    zIndex: 0,
  },
  blurCircleWhite: {
    position: 'absolute',
    top: '-10%',
    right: '-10%',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: '#ffffff',
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
    backgroundColor: '#e0e7ff',
    ...Platform.select({
      web: {
        filter: 'blur(100px)',
      },
    }),
  },
  navHeader: {
    width: '100%',
    maxWidth: 1200,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 10,
  },
  brandText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
    letterSpacing: -0.5,
  },
  navLinks: {
    flexDirection: 'row',
  },
  navLinkText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  mainContainer: {
    width: '100%',
    maxWidth: 480,
    zIndex: 10,
  },
  card: {
    backgroundColor: '#f0f2f5',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...Platform.select({
      web: {
        boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.9,
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
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    color: '#64748b',
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
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
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
    color: '#1e293b',
    paddingLeft: 4,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({
      web: {
        boxShadow: 'inset 6px 6px 12px #d1d9e6, inset -6px -6px 12px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
      },
    }),
  },
  inputWrapperFocused: {
    borderColor: '#6366f1',
    ...Platform.select({
      web: {
        boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2)',
      },
    }),
  },
  inputWrapperWarning: {
    borderColor: '#ef4444',
    ...Platform.select({
      web: {
        boxShadow: 'inset 4px 4px 8px #ffdada, inset -4px -4px 8px #ffffff',
      },
    }),
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  inputIcon: {
    paddingLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#1e293b',
    fontSize: 14,
    height: '100%',
    paddingLeft: 12,
    paddingRight: 16,
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
    paddingLeft: 4,
  },
  requirementsTicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 242, 245, 0.5)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: 'inset 6px 6px 12px #d1d9e6, inset -6px -6px 12px #ffffff',
      },
    }),
  },
  requirementsText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 12px rgba(99, 102, 241, 0.3), -4px -4px 12px rgba(255, 255, 255, 0.8)',
      },
      ios: {
        shadowColor: '#6366f1',
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
    backgroundColor: '#4f46e5',
    ...Platform.select({
      web: {
        boxShadow: 'inset 4px 4px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  submitButtonSuccess: {
    backgroundColor: '#10b981',
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
    marginVertical: 24,
    position: 'relative',
  },
  dividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  dividerText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    zIndex: 1,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
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
    marginRight: 8,
  },
  socialButtonText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  footerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerLinkText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#64748b',
    fontSize: 14,
  },
  loginLink: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#6366f1',
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
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.8,
    paddingHorizontal: 16,
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    opacity: 0.4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 1,
  },
  mainFooter: {
    width: '100%',
    maxWidth: 1200,
    borderTopWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f0f2f5',
    marginTop: 40,
    paddingTop: 16,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  footerCopyright: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 12,
    color: '#64748b',
  },
  footerLinks: {
    flexDirection: 'row',
  },
});
