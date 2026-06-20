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

  const validate = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email Address is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
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
        const errorMsg = response.error?.message || 'Login failed. Please verify your credentials.';
        setGeneralError(errorMsg);
        setLoginStatus('idle');
      }
    } catch (err: any) {
      setGeneralError('An unexpected error occurred. Please try again.');
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
          
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.gavelContainer}>
              <MaterialIcons name="gavel" size={32} color="#6366f1" />
            </View>
            <Text style={styles.title}>LexisAI</Text>
            <Text style={styles.subtitle}>Sign in to your legal intelligence dashboard</Text>
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
              <Text style={styles.label}>Email Address</Text>
              <View style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused,
                emailError ? styles.inputWrapperError : null
              ]}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="alternate-email" size={20} color="#4b5563" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="name@firm.com"
                  placeholderTextColor="#a1a1aa"
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
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={() => Linking.openURL('#')}>
                  <Text style={styles.forgotPassword}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused,
                passwordError ? styles.inputWrapperError : null
              ]}>
                <View style={styles.inputIcon}>
                  <MaterialIcons name="lock" size={20} color="#4b5563" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#a1a1aa"
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
                  <Text style={styles.submitButtonText}>Verifying...</Text>
                </View>
              ) : loginStatus === 'success' ? (
                <Text style={styles.submitButtonText}>Success</Text>
              ) : (
                <Text style={styles.submitButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
          </View>

          {/* Social Logins */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD52f96UBSagMCzQ42BBVMwDL_0WVZUZPdXB5FZtyK2N17ZdcILvKS2Y1f7FzEAQEofG4JFt3VHXsFxVBuzFqV4ujLzG3QbYiNfdIdWRFrlOM2jsxHHJIBVCbrzEGq4nRdwmLf0PfmmZTEGkn8F6D_PZUfu7AEMdA8g1kAEts2pgxlNY4VEsyOoVBahbbZrta3AkHeDd2WWHU5_YDkHtHEtykpSjA30RXonTV6bbRib4UVATrZRJW8RdhH64XZiXsZySxSEaCIDx-yh' }}
                style={styles.socialIconGoogle}
              />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <MaterialCommunityIcons name="github" size={20} color="#1f2937" style={styles.socialIconGithub} />
              <Text style={styles.socialButtonText}>GitHub</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Section */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onNavigateToSignUp}>
              <Text style={styles.createAccountLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System Footer */}
        <View style={styles.systemFooter}>
          <Text style={styles.systemFooterText}>© 2024 LexisAI Technologies</Text>
          <View style={styles.systemFooterLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('#')}>
              <Text style={[styles.systemFooterText, styles.systemLink]}>Privacy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('#')}>
              <Text style={[styles.systemFooterText, styles.systemLink, { marginLeft: 16 }]}>Terms</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f3f4f6', // Light gray background
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(to bottom right, #f3f4f6, #f3f4f6, #e5e7eb)',
      },
    }),
  },
  mainContainer: {
    width: '100%',
    maxWidth: 440,
    zIndex: 10,
  },
  card: {
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      web: {
        boxShadow: '8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff',
      },
      ios: {
        shadowColor: '#d1d1d1',
        shadowOffset: { width: 8, height: 8 },
        shadowOpacity: 0.9,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  gavelContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '6px 6px 12px #dbdbdb, -6px -6px 12px #ffffff',
      },
      ios: {
        shadowColor: '#dbdbdb',
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
    color: '#1f2937',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    color: '#4b5563',
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
    color: '#4b5563',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPassword: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    height: 52,
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 5px #d1d1d1, inset -2px -2px 5px #ffffff',
      },
      ios: {
        shadowColor: '#d1d1d1',
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
        boxShadow: 'inset 2px 2px 5px #d1d1d1, inset -2px -2px 5px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2)',
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
    color: '#1f2937',
    fontSize: 15,
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
    marginTop: 6,
    paddingLeft: 4,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 10px rgba(99, 102, 241, 0.3), -4px -4px 10px rgba(255, 255, 255, 0.8)',
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
  submitButtonVerifying: {
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
    backgroundColor: 'rgba(209, 213, 219, 0.3)',
  },
  dividerText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: 1,
    zIndex: 1,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      web: {
        boxShadow: '8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff',
      },
      ios: {
        shadowColor: '#d1d1d1',
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
    marginRight: 8,
  },
  socialIconGithub: {
    marginRight: 8,
  },
  socialButtonText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#4b5563',
    fontSize: 14,
  },
  createAccountLink: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '700',
  },
  systemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  systemFooterText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(75, 85, 99, 0.6)',
  },
  systemFooterLinks: {
    flexDirection: 'row',
  },
  systemLink: {
    // We can add text decoration or transitions on web if needed
  },
});
