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
const TypingDot = ({ delay }: { delay: number }) => {
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

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
        <Text style={styles.sidebarBrandText}>LexisAI</Text>
      </View>

      {/* New Consultation button */}
      <TouchableOpacity
        style={styles.newConsultationBtn}
        onPress={handleNewConsultation}
        activeOpacity={0.9}
      >
        <MaterialIcons name="add" size={18} color="#ffffff" style={styles.newConsultationIcon} />
        <Text style={styles.newConsultationBtnText}>New Consultation</Text>
      </TouchableOpacity>

      {/* Nav Link Section */}
      <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
        <Text style={styles.sidebarNavHeader}>Recent History</Text>

        {isLoadingSessions ? (
          <ActivityIndicator size="small" color="#6366f1" style={{ marginVertical: 16 }} />
        ) : sessionsList.length === 0 ? (
          <Text style={styles.emptySessionsText}>No recent chats</Text>
        ) : (
          sessionsList.map((session) => (
            <View key={session.id} style={styles.sidebarNavItemContainer}>
              <TouchableOpacity
                style={[
                  styles.sidebarNavItem,
                  activeSessionId === session.id && styles.sidebarNavItemActive,
                  { flex: 1, marginRight: 4 }
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
          <Text style={styles.sidebarFooterItemText}>Help Center</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarFooterItem} onPress={() => setIsSettingsOpen(true)}>
          <MaterialIcons name="settings" size={16} color="#64748b" />
          <Text style={styles.sidebarFooterItemText}>Settings</Text>
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
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const isWelcomeState = messages.length === 1 && messages[0].id === 'welcome-msg';

  const renderWelcomeScreen = () => {
    const welcomeMsg = messages[0];
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeLogoContainer}>
          <MaterialIcons name="gavel" size={32} color="#ffffff" />
        </View>
        <Text style={styles.welcomeTitle}>How can I help you today?</Text>

        {/* Country & Language Selectors inside the Welcome Screen */}
        <View style={styles.welcomeSelectorCard}>
          <View style={styles.welcomeSelectorRow}>
            <Text style={styles.welcomeSelectorLabel}>Jurisdiction</Text>
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
                    {c.flag} {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.welcomeSelectorRow}>
            <Text style={styles.welcomeSelectorLabel}>Language</Text>
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
                    {l.flag} {l.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* 2x2 suggested starts cards */}
        <View style={styles.welcomeSuggestionsContainer}>
          {welcomeMsg.bulletPoints?.map((pt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.welcomeSuggestionCard}
              onPress={() => handleSendMessage(pt)}
              activeOpacity={0.8}
            >
              <Text style={styles.welcomeSuggestionText}>{pt}</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#6366f1" />
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
                <Text style={styles.headerTitle}>LexisAI</Text>
                <MaterialIcons name="keyboard-arrow-down" size={18} color="#64748b" style={{ marginLeft: 4 }} />
              </View>
            </View>

            <View style={styles.headerRight}>
              {/* Active settings indicators */}
              <View style={styles.headerStatusBadge}>
                <Text style={styles.headerStatusBadgeText}>
                  {COUNTRIES.find((c) => c.code === selectedCountry)?.flag || '🌐'}{' '}
                  {COUNTRIES.find((c) => c.code === selectedCountry)?.name || 'Auto'}
                  {' • '}
                  {LANGUAGES.find((l) => l.code === selectedLanguage)?.name || 'Auto'}
                </Text>
              </View>

              <View style={styles.accuracyBadge}>
                <MaterialIcons
                  name="verified"
                  size={14}
                  color="#6366f1"
                  style={styles.accuracyBadgeIcon}
                />
                <Text style={styles.accuracyBadgeText}>98% Accuracy</Text>
              </View>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => Alert.alert('Share', 'Link copied to clipboard!')}
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
                            <Text style={styles.standardMessageText}>{msg.text}</Text>
                            <View style={styles.suggestedStartsContainer}>
                              <Text style={styles.suggestedStartsHeader}>Suggested starting points:</Text>
                              {msg.bulletPoints?.map((pt, idx) => (
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
                    <TypingDot delay={0} />
                    <TypingDot delay={200} />
                    <TypingDot delay={400} />
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
                    placeholder="Message LexisAI..."
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
                      name="arrow-upward"
                      size={20}
                      color={inputValue.trim() ? '#ffffff' : 'rgba(100, 116, 139, 0.4)'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Sub info bar */}
                <View style={styles.inputCardFooter}>
                  <Text style={styles.footerAccuracyNotice}>
                    LexisAI can make mistakes. Verify critical facts.
                  </Text>
                  <View style={styles.modelTag}>
                    <MaterialIcons
                      name="auto-awesome"
                      size={10}
                      color="#6366f1"
                      style={styles.modelTagIcon}
                    />
                    <Text style={styles.modelTagText}>Silk GPT-4 Legal</Text>
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
                <Text style={styles.settingsTitle}>Assistant Settings</Text>
                <TouchableOpacity
                  style={styles.closeSettingsBtn}
                  onPress={() => setIsSettingsOpen(false)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="close" size={20} color="#1e293b" />
                </TouchableOpacity>
              </View>

              <View style={styles.settingsContent}>
                <View style={styles.themeSelectorGroup}>
                  <Text style={styles.themeSelectorLabel}>Theme Preference</Text>
                  <View style={styles.themeRow}>
                    <TouchableOpacity style={styles.themeBtnActive} activeOpacity={0.9}>
                      <Text style={styles.themeBtnTextActive}>Silk Light</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.themeBtnDisabled}
                      onPress={() => Alert.alert('Settings', 'Silk Dark mode is a premium account exclusive feature.')}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.themeBtnTextDisabled}>Silk Dark</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Jurisdiction configuration inside settings panel */}
                <View style={[styles.themeSelectorGroup, { marginTop: 16 }]}>
                  <Text style={styles.themeSelectorLabel}>Jurisdiction</Text>
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
                          {c.flag} {c.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Language configuration inside settings panel */}
                <View style={[styles.themeSelectorGroup, { marginTop: 16 }]}>
                  <Text style={styles.themeSelectorLabel}>Language</Text>
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
                          {l.flag} {l.name}
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

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  appContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    backgroundColor: '#ffffff',
    position: 'relative',
  },

  // Desktop Sidebar
  desktopSidebar: {
    width: 288,
    height: '100%',
    backgroundColor: '#f9fafb',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },

  // Mobile Drawer Sidebar Overlay
  overlayBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    flexDirection: 'row',
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
    backgroundColor: '#f9fafb',
    elevation: 16,
    shadowColor: '#1e293b',
    shadowOffset: { width: 4, height: 0 },
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
    color: '#6366f1',
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  newConsultationBtn: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  newConsultationIcon: {
    marginRight: 8,
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
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 8,
    opacity: 0.8,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  sidebarNavItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  sidebarNavItemActive: {
    backgroundColor: '#f3f4f6',
  },
  sidebarNavItemText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  sidebarNavItemTextActive: {
    color: '#111827',
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
    color: '#94a3b8',
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  sidebarFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  sidebarFooterItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginLeft: 10,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  userProfileCard: {
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  userInfoTextContainer: {
    flex: 1,
  },
  userProfileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  userProfileAccount: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9ca3af',
    marginTop: 1,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  logoutButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
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
    backgroundColor: '#ffffff',
    height: '100%',
  },

  // Header Bar
  headerBar: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hamburgerBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerStatusBadge: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
  },
  headerStatusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4b5563',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  accuracyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
  },
  accuracyBadgeIcon: {
    marginRight: 4,
  },
  accuracyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  welcomeSelectorCard: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  welcomeSuggestionsContainer: {
    width: '100%',
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    flexWrap: 'wrap',
    gap: 12,
  },
  welcomeSuggestionCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeSuggestionText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },

  // Message Bubbles Layout
  messageWrapper: {
    flexDirection: 'row',
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
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-end',
  },
  standardMessageText: {
    fontSize: 15,
    color: '#1e293b',
    lineHeight: 22,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  standardMessageTextUser: {
    fontWeight: '400',
  },

  // Suggested starts layout (fallback or list)
  suggestedStartsBubble: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  suggestedStartsContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestedStartsHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  suggestedStartBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(99, 102, 241, 0.4)',
    marginRight: 8,
  },
  suggestedStartBulletText: {
    fontSize: 13,
    color: '#4b5563',
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },

  // California Law Rich Card Layout
  californiaLawCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  californiaLawTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  californiaLawBodyText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  lawGridContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 12,
    marginBottom: 16,
  },
  lawGridCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  lawGridCardHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  lawGridCardText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  numberedListContainer: {
    marginTop: 8,
  },
  numberedListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  numberedListNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    marginRight: 8,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  numberedListBody: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
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
    backgroundColor: '#f3f4f6',
    alignSelf: 'flex-start',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
    marginHorizontal: 3,
  },

  // Footer & Input Containers
  footerContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 6,
    width: '100%',
  },
  inputCardRow: {
    flexDirection: 'row',
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
    color: '#1e293b',
    paddingVertical: 8,
    textAlignVertical: 'top',
    minHeight: 36,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
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
    backgroundColor: '#6366f1',
  },
  sendButtonInactive: {
    backgroundColor: '#f3f4f6',
  },
  inputCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 2,
  },
  footerAccuracyNotice: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9ca3af',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  modelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  modelTagIcon: {
    marginRight: 2,
  },
  modelTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },

  // Settings Slide-out panel
  settingsDrawerPane: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    padding: 24,
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
    elevation: 24,
    shadowColor: '#1e293b',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 102,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  closeSettingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  settingsContent: {
    flex: 1,
  },
  themeSelectorGroup: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  themeSelectorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  themeBtnActive: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  themeBtnTextActive: {
    color: '#6366f1',
    fontWeight: '600',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  themeBtnDisabled: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  themeBtnTextDisabled: {
    color: '#9ca3af',
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
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectorChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  selectorChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  selectorChipTextActive: {
    color: '#ffffff',
  },
});
