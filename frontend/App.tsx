import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, ActivityIndicator, Text } from 'react-native';
import { apiService } from './src/services/api';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';

type ScreenState = 'loading' | 'welcome' | 'login' | 'signup' | 'dashboard';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('loading');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    // Check if user is already authenticated
    const checkSession = async () => {
      const token = apiService.getAccessToken();
      if (!token) {
        setCurrentScreen('welcome');
        return;
      }

      try {
        const response = await apiService.getCurrentUser();
        if (response.success && response.data) {
          setCurrentScreen('dashboard');
        } else {
          setCurrentScreen('welcome');
        }
      } catch {
        setCurrentScreen('welcome');
      }
    };

    checkSession();
  }, []);

  const handleLoginSuccess = () => {
    setCurrentScreen('dashboard');
  };

  const handleSignUpSuccess = (email: string) => {
    setRegisteredEmail(email);
    setCurrentScreen('login');
  };

  const handleLogout = () => {
    setCurrentScreen('welcome');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'loading':
        return (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>{t('initializing')}</Text>
          </View>
        );
      case 'welcome':
        return (
          <WelcomeScreen
            onNavigateToLogin={() => setCurrentScreen('login')}
            onNavigateToSignUp={() => setCurrentScreen('signup')}
          />
        );
      case 'login':
        return (
          <LoginScreen
            onNavigateToSignUp={() => setCurrentScreen('signup')}
            onLoginSuccess={handleLoginSuccess}
            initialEmail={registeredEmail}
          />
        );
      case 'signup':
        return (
          <SignUpScreen
            onNavigateToLogin={() => setCurrentScreen('login')}
            onSignUpSuccess={handleSignUpSuccess}
          />
        );
      case 'dashboard':
        return <DashboardScreen onLogout={handleLogout} />;
    }
  };

  const getBackgroundColor = () => {
    if (currentScreen === 'login') return theme.bgAlt;
    if (currentScreen === 'signup' || currentScreen === 'welcome') return theme.bg;
    return theme.bg;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={getBackgroundColor()}
      />
      {renderScreen()}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
});

