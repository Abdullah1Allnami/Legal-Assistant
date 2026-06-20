import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  useWindowDimensions,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService, User } from '../services/api';
import { useTheme, ThemeColors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';


interface DashboardScreenProps {
  onLogout: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  type: 'text' | 'california_law' | 'suggested_starts';
  title?: string;
  text: string;
  bulletPoints?: string[];
  gridItems?: { title: string; desc: string }[];
  orderedItems?: string[];
}

// Custom typing animation dot component
const TypingDot = ({ delay, styles }: { delay: number; styles: any }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animatedValue, {
          toValue: -6,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(800 - delay),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue, delay]);

  return (
    <Animated.View
      style={[
        styles.typingDot,
        {
          transform: [{ translateY: animatedValue }],
        },
      ]}
    />
  );
};

// Selection Constants
const COUNTRIES = [
  { code: 'auto', name: 'Auto', flag: '🌐' },
  { code: 'United States', name: 'USA', flag: '🇺🇸' },
  { code: 'United Kingdom', name: 'UK', flag: '🇬🇧' },
  { code: 'Saudi Arabia', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'Germany', name: 'Germany', flag: '🇩🇪' },
  { code: 'France', name: 'France', flag: '🇫🇷' },
];

const LANGUAGES = [
  { code: 'auto', name: 'Auto', flag: '🌐' },
  { code: 'English', name: 'English', flag: '🇺🇸' },
  { code: 'Arabic', name: 'Arabic', flag: '🇸🇦' },
  { code: 'Spanish', name: 'Spanish', flag: '🇪🇸' },
  { code: 'French', name: 'French', flag: '🇫🇷' },
  { code: 'German', name: 'German', flag: '🇩🇪' },
];

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onLogout }) => {
  const { theme, isDark, themePreference, setThemePreference } = useTheme();
  const { language, setLanguage, t, isRtl } = useLanguage();
  const styles = createStyles(theme, isRtl);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const getCountryName = (code: string) => {
    switch (code) {
      case 'auto': return t('auto');
      case 'United States': return t('usa');
      case 'United Kingdom': return t('uk');
      case 'Saudi Arabia': return t('saudi_arabia');
      case 'Germany': return t('germany');
      case 'France': return t('france');
      default: return code;
    }
  };

  const getLanguageName = (code: string) => {
    switch (code) {
      case 'auto': return t('auto');
      case 'English': return t('english');
      case 'Arabic': return t('arabic');
      case 'Spanish': return t('spanish');
      case 'French': return t('french');
      case 'German': return t('german');
      default: return code;
    }
  };

  // App States
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Country & Language settings
  const [selectedCountry, setSelectedCountry] = useState('auto');
  const [selectedLanguage, setSelectedLanguage] = useState('auto');

  // Backend session & chats tracking states
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [inputHeight, setInputHeight] = useState(48);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      type: 'suggested_starts',
      text: 'Hello Counselor. I am ready to assist with your legal inquiries. Select a jurisdiction and language to start a new consultation.',
      bulletPoints: [
        'Review a standard SaaS agreement for liability gaps',
        'Compare New York vs. Delaware corporate governance laws',
        'Summarize recent precedents regarding remote work privacy',
      ],
    },
  ]);

  const scrollViewRef = useRef<ScrollView>(null);

  // Load user info & active sessions on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiService.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
        }
      } catch (err) {
        console.log('Failed to fetch authenticated user profile', err);
      }
    };
    fetchUser();
    fetchSessions(true); // Load last active session if exists
  }, []);

  const fetchSessions = async (loadLastSession = false) => {
    setIsLoadingSessions(true);
    try {
      const res = await apiService.listSessions();
      if (res.success && res.data) {
        setSessionsList(res.data);
        // If we want to load the last session on mount and one exists:
        if (loadLastSession && res.data.length > 0) {
          handleSelectSession(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to list sessions', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleLogout = () => {
    apiService.clearTokens();
    onLogout();
  };

  // Scroll to bottom when new messages are added
  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSelectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setIsSidebarOpen(false);
    setIsTyping(false);

    try {
      const response = await apiService.getSessionDetail(sessionId);
      if (response.success && response.data) {
        const sessionDetail = response.data;
        setSelectedCountry(sessionDetail.country || 'auto');
        setSelectedLanguage(sessionDetail.language || 'auto');

        // Convert backend messages (role/text) to frontend ChatMessage list
        const formattedMessages: ChatMessage[] = sessionDetail.messages.map((m: any) => ({
          id: m.id,
          sender: m.role === 'user' ? 'user' : 'ai',
          type: 'text',
          text: m.text,
        }));

        setMessages(formattedMessages.length > 0 ? formattedMessages : [
          {
            id: 'welcome-msg',
            sender: 'ai',
            type: 'suggested_starts',
            text: 'This session is empty. Select a jurisdiction and language to start a new consultation.',
            bulletPoints: [
              'Review a standard SaaS agreement for liability gaps',
              'Compare New York vs. Delaware corporate governance laws',
              'Summarize recent precedents regarding remote work privacy',
            ],
          }
        ]);
        scrollToBottom();
      }
    } catch (err) {
      console.log('Failed to fetch session detail', err);
    }
  };

  const handleNewConsultation = async () => {
    setIsTyping(false);
    setInputValue('');
    setActiveSessionId(null);
    
    // Start session in state only; backend session will be created on first message
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'ai',
        type: 'suggested_starts',
        text: `Hello Counselor. I am ready to assist with your legal inquiries. Select a jurisdiction and language to start a new consultation.`,
        bulletPoints: [
          'Review a standard SaaS agreement for liability gaps',
          'Compare New York vs. Delaware corporate governance laws',
          'Summarize recent precedents regarding remote work privacy',
        ],
      }
    ]);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const res = await apiService.deleteSession(sessionId);
      if (res.success) {
        if (activeSessionId === sessionId) {
          handleNewConsultation();
        }
        fetchSessions(false);
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    let sessionId = activeSessionId;

    // Start a new session on backend on the fly if none is active
    if (!sessionId) {
      try {
        const startRes = await apiService.startSession(selectedLanguage, selectedCountry);
        if (startRes.success && startRes.data) {
          sessionId = startRes.data.session_id;
          setActiveSessionId(sessionId);
        } else {
          Alert.alert('Session Error', 'Could not create a new chat session on the server.');
          return;
        }
      } catch (err) {
        console.error('Failed to start session on the fly', err);
        return;
      }
    }

    // Append User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      type: 'text',
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setInputHeight(48);
    setIsTyping(true);
    scrollToBottom();

    try {
      const response = await apiService.sendMessage(
        textToSend.trim(),
        sessionId,
        selectedLanguage,
        selectedCountry
      );

      setIsTyping(false);

      if (response.success && response.data) {
        const aiResponse: ChatMessage = {
          id: Date.now().toString(),
          sender: 'ai',
          type: 'text',
          text: response.data.answer,
        };
        setMessages((prev) => [...prev, aiResponse]);
        scrollToBottom();

        // Refresh list to update sidebar and session names
        fetchSessions(false);
      } else {
        const errorMsg: ChatMessage = {
          id: Date.now().toString(),
          sender: 'ai',
          type: 'text',
          text: response.error?.message || 'Error communicating with assistant. Please make sure Ollama is running.',
        };
        setMessages((prev) => [...prev, errorMsg]);
        scrollToBottom();
      }
    } catch (err: any) {
      setIsTyping(false);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'ai',
        type: 'text',
        text: err.message || 'Network error occurred.',
      };
      setMessages((prev) => [...prev, errorMsg]);
      scrollToBottom();
    }
  };

  // Get user display details
  const userInitials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'JD';
  const userFullName = user?.email ? user.email.split('@')[0] + ', Esq.' : 'John Doe, Esq.';
  const userAccountType = user?.role === 'admin' ? 'Administrator Console' : 'Premium Account';
  const renderSidebarContent = () => (
    <View style={styles.sidebarInner}>
      {/* Brand logo */}
      <View style={styles.sidebarBrandContainer}>
        <Text style={styles.sidebarBrandText}>{t('lexisai')}</Text>
      </View>

      {/* New Consultation button */}
      <TouchableOpacity
        style={styles.newConsultationBtn}
        onPress={handleNewConsultation}
        activeOpacity={0.9}
      >
        <MaterialIcons name="add" size={18} color="#ffffff" style={styles.newConsultationIcon} />
        <Text style={styles.newConsultationBtnText}>{t('new_consultation')}</Text>
      </TouchableOpacity>

      {/* Nav Link Section */}
      <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
        <Text style={styles.sidebarNavHeader}>{t('recent_history')}</Text>

        {isLoadingSessions ? (
          <ActivityIndicator size="small" color="#6366f1" style={{ marginVertical: 16 }} />
        ) : sessionsList.length === 0 ? (
          <Text style={styles.emptySessionsText}>{t('no_recent_chats')}</Text>
        ) : (
          sessionsList.map((session) => (
            <View key={session.id} style={styles.sidebarNavItemContainer}>
              <TouchableOpacity
                style={[
                  styles.sidebarNavItem,
                  activeSessionId === session.id && styles.sidebarNavItemActive,
                  { flex: 1, marginRight: isRtl ? 0 : 4, marginLeft: isRtl ? 4 : 0 }
                ]}
                onPress={() => handleSelectSession(session.id)}
              >
                <MaterialIcons
                  name="chat-bubble-outline"
                  size={16}
                  color={activeSessionId === session.id ? '#6366f1' : '#64748b'}
                />
                <Text
                  style={[
                    styles.sidebarNavItemText,
                    activeSessionId === session.id && styles.sidebarNavItemTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {session.title}
                </Text>
              </TouchableOpacity>

              {/* Delete session button */}
              <TouchableOpacity
                style={styles.deleteSessionBtn}
                onPress={() => handleDeleteSession(session.id)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="delete-outline" size={14} color="#dc2626" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer list */}
      <View style={styles.sidebarFooter}>
        <TouchableOpacity style={styles.sidebarFooterItem}>
          <MaterialIcons name="help-outline" size={16} color="#64748b" />
          <Text style={styles.sidebarFooterItemText}>{t('help_center')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarFooterItem} onPress={() => setIsSettingsOpen(true)}>
          <MaterialIcons name="settings" size={16} color="#64748b" />
          <Text style={styles.sidebarFooterItemText}>{t('settings')}</Text>
        </TouchableOpacity>

        {/* User Card */}
        <View style={styles.userProfileCard}>
          <View style={styles.userAvatarContainer}>
            <Text style={styles.userAvatarText}>{userInitials}</Text>
          </View>
          <View style={styles.userInfoTextContainer}>
            <Text style={styles.userProfileName} numberOfLines={1}>
              {userFullName}
            </Text>
            <Text style={styles.userProfileAccount} numberOfLines={1}>
              {userAccountType}
            </Text>
          </View>
        </View>

        {/* Logout button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutButtonText}>{t('sign_out')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const isWelcomeState = messages.length === 1 && messages[0].id === 'welcome-msg';

  const renderWelcomeScreen = () => {
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeLogoContainer}>
          <MaterialIcons name="gavel" size={32} color="#ffffff" />
        </View>
        <Text style={styles.welcomeTitle}>{t('how_can_help')}</Text>

        {/* Country & Language Selectors inside the Welcome Screen */}
        <View style={styles.welcomeSelectorCard}>
          <View style={styles.welcomeSelectorRow}>
            <Text style={styles.welcomeSelectorLabel}>{t('jurisdiction')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorChipsRow}>
              {COUNTRIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.selectorChip,
                    selectedCountry === c.code && styles.selectorChipActive
                  ]}
                  onPress={() => setSelectedCountry(c.code)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.selectorChipText,
                    selectedCountry === c.code && styles.selectorChipTextActive
                  ]}>
                    {c.flag} {getCountryName(c.code)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.welcomeSelectorRow}>
            <Text style={styles.welcomeSelectorLabel}>{t('language')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorChipsRow}>
              {LANGUAGES.map((l) => (
                <TouchableOpacity
                  key={l.code}
                  style={[
                    styles.selectorChip,
                    selectedLanguage === l.code && styles.selectorChipActive
                  ]}
                  onPress={() => setSelectedLanguage(l.code)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.selectorChipText,
                    selectedLanguage === l.code && styles.selectorChipTextActive
                  ]}>
                    {l.flag} {getLanguageName(l.code)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* 2x2 suggested starts cards */}
        <View style={styles.welcomeSuggestionsContainer}>
          {[
            t('suggested_start_1'),
            t('suggested_start_2'),
            t('suggested_start_3'),
          ].map((pt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.welcomeSuggestionCard}
              onPress={() => handleSendMessage(pt)}
              activeOpacity={0.8}
            >
              <Text style={styles.welcomeSuggestionText}>{pt}</Text>
              <MaterialIcons name={isRtl ? "arrow-back" : "arrow-forward"} size={16} color="#6366f1" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.outerContainer}>
      <View style={styles.appContainer}>
        {/* Persistent Left Sidebar on Desktop */}
        {isDesktop && isDesktopSidebarOpen && <View style={styles.desktopSidebar}>{renderSidebarContent()}</View>}

        {/* Slide-out Mobile Left Sidebar Overlay Drawer */}
        {!isDesktop && isSidebarOpen && (
          <View style={styles.overlayBackdrop}>
            <TouchableOpacity
              style={styles.overlayBackdropTap}
              activeOpacity={1}
              onPress={() => setIsSidebarOpen(false)}
            />
            <View style={styles.mobileSidebarDrawer}>{renderSidebarContent()}</View>
          </View>
        )}

        {/* Right Main Panel */}
        <View style={styles.mainContentPane}>
          {/* Header */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              {isDesktop ? (
                <TouchableOpacity
                  style={styles.hamburgerBtn}
                  onPress={() => setIsDesktopSidebarOpen(prev => !prev)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={isDesktopSidebarOpen ? "menu-open" : "menu"}
                    size={22}
                    color="#64748b"
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.hamburgerBtn}
                  onPress={() => setIsSidebarOpen(true)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="menu" size={22} color="#64748b" />
                </TouchableOpacity>
              )}
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>{t('lexisai')}</Text>
                <MaterialIcons name="keyboard-arrow-down" size={18} color="#64748b" style={{ marginLeft: isRtl ? 0 : 4, marginRight: isRtl ? 4 : 0 }} />
              </View>
            </View>

            <View style={styles.headerRight}>
              {/* Active settings indicators */}
              <View style={styles.headerStatusBadge}>
                <Text style={styles.headerStatusBadgeText}>
                  {COUNTRIES.find((c) => c.code === selectedCountry)?.flag || '🌐'}{' '}
                  {getCountryName(selectedCountry)}
                  {' • '}
                  {getLanguageName(selectedLanguage)}
                </Text>
              </View>

              <View style={styles.accuracyBadge}>
                <MaterialIcons
                  name="verified"
                  size={14}
                  color="#6366f1"
                  style={styles.accuracyBadgeIcon}
                />
                <Text style={styles.accuracyBadgeText}>{t('accuracy_pct')}</Text>
              </View>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => Alert.alert(t('share'), t('link_copied'))}
                activeOpacity={0.7}
              >
                <MaterialIcons name="share" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages Feed */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScrollArea}
            contentContainerStyle={styles.chatScrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.chatContainerMaxWidth}>
              {isWelcomeState ? (
                renderWelcomeScreen()
              ) : (
                messages.map((msg) => {
                  const isAI = msg.sender === 'ai';
                  return (
                    <View key={msg.id} style={[styles.messageWrapper, isAI ? styles.msgAI : styles.msgUser]}>
                      {/* Avatar for AI on Left */}
                      {isAI && (
                        <View style={styles.aiAvatarContainer}>
                          <MaterialIcons name="gavel" size={16} color="#ffffff" />
                        </View>
                      )}

                      <View style={styles.messageContentBlock}>
                        {/* Card or Bubble */}
                        {msg.type === 'california_law' ? (
                          <View style={styles.californiaLawCard}>
                            <Text style={styles.californiaLawTitle}>{msg.title}</Text>
                            <Text style={styles.californiaLawBodyText}>{msg.text}</Text>

                            {/* Grid layout - 2 columns */}
                            {msg.gridItems && (
                              <View style={styles.lawGridContainer}>
                                {msg.gridItems.map((item, idx) => (
                                  <View key={idx} style={styles.lawGridCard}>
                                    <Text style={styles.lawGridCardHeader}>{item.title}</Text>
                                    <Text style={styles.lawGridCardText}>{item.desc}</Text>
                                  </View>
                                ))}
                              </View>
                            )}

                            {/* Ordered/Bullet list */}
                            {msg.orderedItems && (
                              <View style={styles.numberedListContainer}>
                                {msg.orderedItems.map((item, idx) => {
                                  const splitPoint = item.indexOf(':');
                                  const num = `0${idx + 1}.`;
                                  const boldText =
                                    splitPoint !== -1 ? item.substring(0, splitPoint + 1) : '';
                                  const normText =
                                    splitPoint !== -1 ? item.substring(splitPoint + 1) : item;

                                  return (
                                    <View key={idx} style={styles.numberedListItem}>
                                      <Text style={styles.numberedListNumber}>{num}</Text>
                                      <Text style={styles.numberedListBody}>
                                        {boldText ? <Text style={styles.boldText}>{boldText}</Text> : null}
                                        {normText}
                                      </Text>
                                    </View>
                                  );
                                })}
                              </View>
                            )}
                          </View>
                        ) : msg.type === 'suggested_starts' ? (
                          <View style={styles.suggestedStartsBubble}>
                            <Text style={styles.standardMessageText}>
                              {t(msg.text.includes('empty') ? 'empty_session' : 'hello_counselor')}
                            </Text>
                            <View style={styles.suggestedStartsContainer}>
                              <Text style={styles.suggestedStartsHeader}>{t('suggested_starts_header')}</Text>
                              {[
                                t('suggested_start_1'),
                                t('suggested_start_2'),
                                t('suggested_start_3'),
                              ].map((pt, idx) => (
                                <View key={idx} style={styles.suggestedStartBulletRow}>
                                  <View style={styles.bulletDot} />
                                  <Text style={styles.suggestedStartBulletText}>{pt}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        ) : (
                          // Standard Bubble
                          <View
                            style={[
                              styles.standardBubble,
                              isAI ? styles.bubbleStyleAI : styles.bubbleStyleUser,
                            ]}
                          >
                            <Text
                              style={[
                                styles.standardMessageText,
                                !isAI && styles.standardMessageTextUser,
                              ]}
                            >
                              {msg.text}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <View style={[styles.messageWrapper, styles.msgAI]}>
                  <View style={styles.aiAvatarContainer}>
                    <MaterialIcons name="smart-toy" size={16} color="#ffffff" />
                  </View>
                  <View style={styles.typingBubbleContainer}>
                    <TypingDot delay={0} styles={styles} />
                    <TypingDot delay={200} styles={styles} />
                    <TypingDot delay={400} styles={styles} />
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer & Chat Input Area */}
          <View style={styles.footerContainer}>
            <View style={styles.chatContainerMaxWidth}>
              {/* Input Card Container */}
              <View style={styles.inputCard}>
                <View style={styles.inputCardRow}>
                  <TouchableOpacity
                    style={styles.attachmentButton}
                    onPress={() => Alert.alert('Attachment', 'Attach files feature triggered.')}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="attach-file" size={20} color="#64748b" />
                  </TouchableOpacity>

                  <TextInput
                    style={[styles.chatTextInput, { height: Math.min(120, Math.max(36, inputHeight)) }]}
                    placeholder={t('message_placeholder')}
                    placeholderTextColor="rgba(100, 116, 139, 0.5)"
                    value={inputValue}
                    onChangeText={setInputValue}
                    multiline
                    onContentSizeChange={(e) => {
                      setInputHeight(e.nativeEvent.contentSize.height);
                    }}
                    onSubmitEditing={() => {
                      if (Platform.OS !== 'web') {
                        handleSendMessage(inputValue);
                      }
                    }}
                  />

                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      inputValue.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
                    ]}
                    onPress={() => handleSendMessage(inputValue)}
                    disabled={!inputValue.trim()}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons
                      name={isRtl ? "arrow-back" : "arrow-upward"}
                      size={20}
                      color={inputValue.trim() ? '#ffffff' : 'rgba(100, 116, 139, 0.4)'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Sub info bar */}
                <View style={styles.inputCardFooter}>
                  <Text style={styles.footerAccuracyNotice}>
                    {t('accuracy_notice')}
                  </Text>
                  <View style={styles.modelTag}>
                    <MaterialIcons
                      name="auto-awesome"
                      size={10}
                      color="#6366f1"
                      style={styles.modelTagIcon}
                    />
                    <Text style={styles.modelTagText}>{t('model_tag')}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Right settings side panel drawer */}
        {isSettingsOpen && (
          <View style={styles.overlayBackdrop}>
            <TouchableOpacity
              style={styles.overlayBackdropTap}
              activeOpacity={1}
              onPress={() => setIsSettingsOpen(false)}
            />
            <View style={styles.settingsDrawerPane}>
              <View style={styles.settingsHeader}>
                <Text style={styles.settingsTitle}>{t('assistant_settings')}</Text>
                <TouchableOpacity
                  style={styles.closeSettingsBtn}
                  onPress={() => setIsSettingsOpen(false)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="close" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.settingsContent}>
                <View style={styles.themeSelectorGroup}>
                  <Text style={styles.themeSelectorLabel}>{t('theme_preference')}</Text>
                  <View style={styles.themeRow}>
                    <TouchableOpacity
                      style={themePreference === 'light' ? styles.themeBtnActive : styles.themeBtnDisabled}
                      onPress={() => setThemePreference('light')}
                      activeOpacity={0.9}
                    >
                      <Text style={themePreference === 'light' ? styles.themeBtnTextActive : styles.themeBtnTextDisabled}>{t('light_mode')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={themePreference === 'dark' ? styles.themeBtnActive : styles.themeBtnDisabled}
                      onPress={() => setThemePreference('dark')}
                      activeOpacity={0.9}
                    >
                      <Text style={themePreference === 'dark' ? styles.themeBtnTextActive : styles.themeBtnTextDisabled}>{t('dark_mode')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={themePreference === 'system' ? styles.themeBtnActive : styles.themeBtnDisabled}
                      onPress={() => setThemePreference('system')}
                      activeOpacity={0.9}
                    >
                      <Text style={themePreference === 'system' ? styles.themeBtnTextActive : styles.themeBtnTextDisabled}>{t('system_default')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Jurisdiction configuration inside settings panel */}
                <View style={[styles.themeSelectorGroup, { marginTop: 16 }]}>
                  <Text style={styles.themeSelectorLabel}>{t('jurisdiction')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorChipsRow}>
                    {COUNTRIES.map((c) => (
                      <TouchableOpacity
                        key={c.code}
                        style={[
                          styles.selectorChip,
                          selectedCountry === c.code && styles.selectorChipActive
                        ]}
                        onPress={() => setSelectedCountry(c.code)}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.selectorChipText,
                          selectedCountry === c.code && styles.selectorChipTextActive
                        ]}>
                          {c.flag} {getCountryName(c.code)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Language configuration inside settings panel */}
                <View style={[styles.themeSelectorGroup, { marginTop: 16 }]}>
                  <Text style={styles.themeSelectorLabel}>{t('language')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorChipsRow}>
                    {LANGUAGES.map((l) => (
                      <TouchableOpacity
                        key={l.code}
                        style={[
                          styles.selectorChip,
                          selectedLanguage === l.code && styles.selectorChipActive
                        ]}
                        onPress={() => setSelectedLanguage(l.code)}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.selectorChipText,
                          selectedLanguage === l.code && styles.selectorChipTextActive
                        ]}>
                          {l.flag} {getLanguageName(l.code)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: ThemeColors, isRtl: boolean) => StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  appContainer: {
    flex: 1,
    flexDirection: isRtl ? 'row-reverse' : 'row',
    height: '100%',
    backgroundColor: theme.bg,
    position: 'relative',
  },

  // Desktop Sidebar
  desktopSidebar: {
    width: 288,
    height: '100%',
    backgroundColor: theme.sidebarBg,
    borderRightWidth: isRtl ? 0 : 1,
    borderRightColor: theme.sidebarBorder,
    borderLeftWidth: isRtl ? 1 : 0,
    borderLeftColor: theme.sidebarBorder,
  },

  // Mobile Drawer Sidebar Overlay
  overlayBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flexDirection: isRtl ? 'row-reverse' : 'row',
  },
  overlayBackdropTap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  mobileSidebarDrawer: {
    width: 288,
    height: '100%',
    backgroundColor: theme.sidebarBg,
    elevation: 16,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: isRtl ? -4 : 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 101,
  },

  // Sidebar Inner Layout
  sidebarInner: {
    flex: 1,
    padding: 20,
    flexDirection: 'column',
  },
  sidebarBrandContainer: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  sidebarBrandText: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  newConsultationBtn: {
    backgroundColor: theme.primary,
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  newConsultationIcon: {
    marginRight: isRtl ? 0 : 8,
    marginLeft: isRtl ? 8 : 0,
  },
  newConsultationBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  sidebarNav: {
    flex: 1,
  },
  sidebarNavHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 8,
    opacity: 0.8,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  sidebarNavItemContainer: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sidebarNavItem: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  sidebarNavItemActive: {
    backgroundColor: theme.sidebarItemBgActive,
  },
  sidebarNavItemText: {
    fontSize: 14,
    color: theme.sidebarText,
    fontWeight: '500',
    marginLeft: isRtl ? 0 : 10,
    marginRight: isRtl ? 10 : 0,
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  sidebarNavItemTextActive: {
    color: theme.sidebarTextActive,
    fontWeight: '600',
  },
  deleteSessionBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  emptySessionsText: {
    fontSize: 13,
    color: theme.textLight,
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.sidebarBorder,
    paddingTop: 12,
  },
  sidebarFooterItem: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  sidebarFooterItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.sidebarText,
    marginLeft: isRtl ? 0 : 10,
    marginRight: isRtl ? 10 : 0,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  userProfileCard: {
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: theme.sidebarItemBgActive,
    borderRadius: 12,
    padding: 12,
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.sidebarBorder,
  },
  userAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: isRtl ? 0 : 10,
    marginLeft: isRtl ? 10 : 0,
  },
  userAvatarText: {
    color: theme.primary,
    fontWeight: '600',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  userInfoTextContainer: {
    flex: 1,
    alignItems: isRtl ? 'flex-end' : 'flex-start',
  },
  userProfileName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  userProfileAccount: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.textLight,
    marginTop: 1,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  logoutButton: {
    backgroundColor: theme.isDark ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.1)',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  logoutButtonText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 12,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },

  // Main chat pane
  mainContentPane: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: theme.bg,
    height: '100%',
  },

  // Header Bar
  headerBar: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: theme.cardBg,
  },
  headerLeft: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  hamburgerBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: isRtl ? 0 : 10,
    marginLeft: isRtl ? 10 : 0,
    backgroundColor: theme.bgAlt,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  headerRight: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
  },
  headerStatusBadge: {
    backgroundColor: theme.bgAlt,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: isRtl ? 0 : 8,
    marginLeft: isRtl ? 8 : 0,
  },
  headerStatusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textMuted,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  accuracyBadge: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: theme.accentBg,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: isRtl ? 0 : 8,
    marginLeft: isRtl ? 8 : 0,
  },
  accuracyBadgeIcon: {
    marginRight: isRtl ? 0 : 4,
    marginLeft: isRtl ? 4 : 0,
  },
  accuracyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.divider,
  },

  // Messages Scroll Area
  chatScrollArea: {
    flex: 1,
  },
  chatScrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexGrow: 1,
  },
  chatContainerMaxWidth: {
    width: '100%',
    maxWidth: 768,
  },

  // Welcome / Empty Chat Screen
  welcomeContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  welcomeLogoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  welcomeSelectorCard: {
    width: '100%',
    backgroundColor: theme.bgAlt,
    borderWidth: 1,
    borderColor: theme.divider,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  welcomeSelectorRow: {
    marginBottom: 12,
  },
  welcomeSelectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  welcomeSuggestionsContainer: {
    width: '100%',
    flexDirection: Platform.OS === 'web' ? (isRtl ? 'row-reverse' : 'row') : 'column',
    flexWrap: 'wrap',
    gap: 12,
  },
  welcomeSuggestionCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.divider,
    borderRadius: 12,
    padding: 16,
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeSuggestionText: {
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: '500',
    flex: 1,
    marginRight: isRtl ? 0 : 12,
    marginLeft: isRtl ? 12 : 0,
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },

  // Message Bubbles Layout
  messageWrapper: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    marginBottom: 24,
    width: '100%',
  },
  msgAI: {
    justifyContent: 'flex-start',
  },
  msgUser: {
    justifyContent: 'flex-end',
  },

  // AI Avatar styling
  aiAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: isRtl ? 0 : 12,
    marginLeft: isRtl ? 12 : 0,
    marginTop: 2,
  },
  userAvatarBubble: {
    width: 0,
    height: 0,
  },
  messageContentBlock: {
    flex: 1,
    maxWidth: '85%',
  },
  msgSenderLabel: {
    width: 0,
    height: 0,
  },
  msgSenderLabelRight: {
    width: 0,
    height: 0,
  },

  // Standard bubble text
  standardBubble: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  bubbleStyleAI: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  bubbleStyleUser: {
    backgroundColor: theme.isDark ? '#1e293b' : '#f3f4f6',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: isRtl ? 'flex-start' : 'flex-end',
  },
  standardMessageText: {
    fontSize: 15,
    color: theme.text,
    lineHeight: 22,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  standardMessageTextUser: {
    fontWeight: '400',
  },

  // Suggested starts layout (fallback or list)
  suggestedStartsBubble: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.divider,
    backgroundColor: theme.cardBg,
  },
  suggestedStartsContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.bgAlt,
    borderWidth: 1,
    borderColor: theme.divider,
  },
  suggestedStartsHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.primary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  suggestedStartBulletRow: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(99, 102, 241, 0.4)',
    marginRight: isRtl ? 0 : 8,
    marginLeft: isRtl ? 8 : 0,
  },
  suggestedStartBulletText: {
    fontSize: 13,
    color: theme.textMuted,
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },

  // California Law Rich Card Layout
  californiaLawCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.divider,
    backgroundColor: theme.cardBg,
    marginTop: 8,
  },
  californiaLawTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.primary,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  californiaLawBodyText: {
    fontSize: 14,
    color: theme.textMuted,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  lawGridContainer: {
    flexDirection: Platform.OS === 'web' ? (isRtl ? 'row-reverse' : 'row') : 'column',
    gap: 12,
    marginBottom: 16,
  },
  lawGridCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.bgAlt,
    borderWidth: 1,
    borderColor: theme.divider,
  },
  lawGridCardHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  lawGridCardText: {
    fontSize: 12,
    color: theme.textLight,
    lineHeight: 16,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  numberedListContainer: {
    marginTop: 8,
  },
  numberedListItem: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  numberedListNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
    marginRight: isRtl ? 0 : 8,
    marginLeft: isRtl ? 8 : 0,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  numberedListBody: {
    fontSize: 14,
    color: theme.textMuted,
    lineHeight: 20,
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  boldText: {
    fontWeight: '700',
  },

  // Typing indicator
  typingAvatarContainer: {
    width: 0,
    height: 0,
  },
  typingBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: theme.isDark ? '#1e293b' : '#f3f4f6',
    alignSelf: isRtl ? 'flex-end' : 'flex-start',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.primary,
    marginHorizontal: 3,
  },

  // Footer & Input Containers
  footerContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.cardBg,
    borderTopWidth: 1,
    borderTopColor: theme.divider,
    alignItems: 'center',
  },
  suggestionChipsScroll: {
    width: 0,
    height: 0,
  },
  suggestionChipsContent: {
    width: 0,
    height: 0,
  },
  suggestionChip: {
    width: 0,
    height: 0,
  },
  suggestionChipText: {
    width: 0,
    height: 0,
  },

  // Chat Input Box
  inputCard: {
    backgroundColor: theme.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.divider,
    padding: 6,
    width: '100%',
  },
  inputCardRow: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
  },
  attachmentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  chatTextInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 15,
    color: theme.inputText,
    paddingVertical: 8,
    textAlignVertical: 'top',
    minHeight: 36,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
      },
    }),
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sendButtonActive: {
    backgroundColor: theme.primary,
  },
  sendButtonInactive: {
    backgroundColor: theme.bgAlt,
  },
  inputCardFooter: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 2,
  },
  footerAccuracyNotice: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.textLight,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  modelTag: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: theme.bgAlt,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  modelTagIcon: {
    marginRight: isRtl ? 0 : 2,
    marginLeft: isRtl ? 2 : 0,
  },
  modelTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },

  // Settings Slide-out panel
  settingsDrawerPane: {
    position: 'absolute',
    right: isRtl ? undefined : 0,
    left: isRtl ? 0 : undefined,
    top: 0,
    bottom: 0,
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.cardBg,
    padding: 24,
    borderLeftWidth: isRtl ? 0 : 1,
    borderLeftColor: theme.divider,
    borderRightWidth: isRtl ? 1 : 0,
    borderRightColor: theme.divider,
    elevation: 24,
    shadowColor: theme.shadowColor,
    shadowOffset: { width: isRtl ? 4 : -4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 102,
  },
  settingsHeader: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  closeSettingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bgAlt,
  },
  settingsContent: {
    flex: 1,
  },
  themeSelectorGroup: {
    backgroundColor: theme.bgAlt,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.divider,
  },
  themeSelectorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    textAlign: isRtl ? 'right' : 'left',
  },
  themeRow: {
    flexDirection: isRtl ? 'row-reverse' : 'row',
    gap: 12,
  },
  themeBtnActive: {
    flex: 1,
    backgroundColor: theme.cardBg,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.primary,
  },
  themeBtnTextActive: {
    color: theme.primary,
    fontWeight: '600',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  themeBtnDisabled: {
    flex: 1,
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#f3f4f6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  themeBtnTextDisabled: {
    color: theme.textLight,
    fontWeight: '600',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },

  // Selector common chips (used inside settings / welcome)
  selectorBar: {
    width: 0,
    height: 0,
  },
  selectorContainer: {
    width: 0,
    height: 0,
  },
  selectorSection: {
    width: 0,
    height: 0,
  },
  selectorTitleText: {
    width: 0,
    height: 0,
  },
  selectorSectionDivider: {
    width: 0,
    height: 0,
  },
  selectorChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  selectorChip: {
    backgroundColor: theme.cardBg,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.divider,
  },
  selectorChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  selectorChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  selectorChipTextActive: {
    color: '#ffffff',
  },
});
