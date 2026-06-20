import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, ActivityIndicator, Text } from 'react-native';
import { apiService } from './src/services/api';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';

type ScreenState = 'loading' | 'welcome' | 'login' | 'signup' | 'dashboard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('loading');
  const [registeredEmail, setRegisteredEmail] = useState('');

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
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Initializing system...</Text>
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

  const isLightScreen = currentScreen === 'login' || currentScreen === 'signup' || currentScreen === 'welcome';
  const getBackgroundColor = () => {
    if (currentScreen === 'login') return '#f3f4f6';
    if (currentScreen === 'signup' || currentScreen === 'welcome') return '#f0f2f5';
    return '#0d0e12';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <StatusBar
        barStyle={isLightScreen ? 'dark-content' : 'light-content'}
        backgroundColor={getBackgroundColor()}
      />
      {renderScreen()}
    </SafeAreaView>
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
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
});
