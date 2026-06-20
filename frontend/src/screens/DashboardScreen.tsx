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

  // Renders the left sidebar list of links and profile
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
        <MaterialIcons name="add-box" size={20} color="#ffffff" style={styles.newConsultationIcon} />
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
                  size={18}
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
                <MaterialIcons name="delete-outline" size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={[styles.sidebarNavHeader, { marginTop: 24 }]}>Library</Text>
        <TouchableOpacity style={styles.sidebarNavItem}>
          <MaterialIcons name="folder" size={20} color="#64748b" />
          <Text style={styles.sidebarNavItemText}>Documents</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer list */}
      <View style={styles.sidebarFooter}>
        <TouchableOpacity style={styles.sidebarFooterItem}>
          <MaterialIcons name="help-outline" size={20} color="#64748b" />
          <Text style={styles.sidebarFooterItemText}>Help Center</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarFooterItem} onPress={() => setIsSettingsOpen(true)}>
          <MaterialIcons name="settings" size={20} color="#64748b" />
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


  return (
    <SafeAreaView style={styles.outerContainer}>
      <View style={styles.appContainer}>
        {/* Persistent Left Sidebar on Desktop */}
        {isDesktop && <View style={styles.desktopSidebar}>{renderSidebarContent()}</View>}

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
              {!isDesktop && (
                <TouchableOpacity
                  style={styles.hamburgerBtn}
                  onPress={() => setIsSidebarOpen(true)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="menu" size={22} color="#64748b" />
                </TouchableOpacity>
              )}
              <Text style={styles.headerTitle}>Legal Assistant Chat</Text>
            </View>

            <View style={styles.headerRight}>
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

          {/* Country & Language Selectors */}
          <View style={styles.selectorBar}>
            <View style={styles.selectorContainer}>
              <View style={styles.selectorSection}>
                <Text style={styles.selectorTitleText}>Jurisdiction</Text>
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

              <View style={styles.selectorSectionDivider} />

              <View style={styles.selectorSection}>
                <Text style={styles.selectorTitleText}>Language</Text>
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

          {/* Messages Feed */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScrollArea}
            contentContainerStyle={styles.chatScrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.chatContainerMaxWidth}>
              {messages.map((msg) => {
                const isAI = msg.sender === 'ai';
                return (
                  <View key={msg.id} style={[styles.messageWrapper, isAI ? styles.msgAI : styles.msgUser]}>
                    {/* Avatar for AI on Left */}
                    {isAI && (
                      <View style={styles.aiAvatarContainer}>
                        <MaterialIcons name="gavel" size={20} color="#ffffff" />
                      </View>
                    )}

                    <View style={styles.messageContentBlock}>
                      {/* Name Label */}
                      <Text style={[styles.msgSenderLabel, !isAI && styles.msgSenderLabelRight]}>
                        {isAI ? 'LexisAI Assistant' : 'You'}
                      </Text>

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

                    {/* Avatar for User on Right */}
                    {!isAI && (
                      <View style={styles.userAvatarBubble}>
                        <MaterialIcons name="person" size={20} color="#64748b" />
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <View style={[styles.messageWrapper, styles.msgAI]}>
                  <View style={styles.typingAvatarContainer}>
                    <MaterialIcons name="smart-toy" size={20} color="#64748b" />
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
              {/* Suggestion Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.suggestionChipsScroll}
                contentContainerStyle={styles.suggestionChipsContent}
              >
                <TouchableOpacity
                  style={styles.suggestionChip}
                  onPress={() => handleSendMessage('What are my tenant rights?')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.suggestionChipText}>"What are my tenant rights?"</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.suggestionChip}
                  onPress={() => handleSendMessage('Explain contract breach')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.suggestionChipText}>"Explain contract breach"</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.suggestionChip}
                  onPress={() => handleSendMessage('How does employment law work?')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.suggestionChipText}>"How does employment law work?"</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Input Card Container */}
              <View style={styles.inputCard}>
                <View style={styles.inputCardRow}>
                  <TouchableOpacity
                    style={styles.attachmentButton}
                    onPress={() => Alert.alert('Attachment', 'Attach files feature triggered.')}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="attach-file" size={22} color="#64748b" />
                  </TouchableOpacity>

                  <TextInput
                    style={[styles.chatTextInput, { height: Math.min(120, Math.max(48, inputHeight)) }]}
                    placeholder="Ask your legal question..."
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
                      name="send"
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
                      size={12}
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
    backgroundColor: '#f0f2f5',
  },
  appContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    backgroundColor: '#f0f2f5',
    position: 'relative',
  },

  // Desktop Sidebar
  desktopSidebar: {
    width: 288,
    height: '100%',
    backgroundColor: '#f0f2f5',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.4)',
  },

  // Mobile Drawer Sidebar Overlay
  overlayBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
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
    backgroundColor: '#f0f2f5',
    elevation: 16,
    shadowColor: '#1e293b',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    zIndex: 101,
  },

  // Sidebar Inner Layout
  sidebarInner: {
    flex: 1,
    padding: 24,
    flexDirection: 'column',
  },
  sidebarBrandContainer: {
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  sidebarBrandText: {
    fontSize: 24,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
    ...Platform.select({
      web: {
        boxShadow: '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  newConsultationIcon: {
    marginRight: 8,
  },
  newConsultationBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  sidebarNav: {
    flex: 1,
  },
  sidebarNavHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingHorizontal: 8,
    opacity: 0.6,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  sidebarNavItemActive: {
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      web: {
        boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff',
      },
      default: {
        backgroundColor: '#e2e8f0',
      },
    }),
  },
  sidebarNavItemText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  sidebarNavItemTextActive: {
    color: '#6366f1',
    fontWeight: '700',
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    paddingTop: 16,
  },
  sidebarFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  sidebarFooterItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 12,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  userProfileCard: {
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: '#f0f2f5',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    ...Platform.select({
      web: {
        boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  userAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...Platform.select({
      web: {
        boxShadow: '2px 2px 4px #d1d9e6, -2px -2px 4px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  userAvatarText: {
    color: '#6366f1',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  userInfoTextContainer: {
    flex: 1,
  },
  userProfileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  userProfileAccount: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  logoutButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },

  // Main chat pane
  mainContentPane: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#f0f2f5',
    height: '100%',
  },

  // Header Bar
  headerBar: {
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(240, 242, 245, 0.8)',
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(10px)',
      },
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hamburgerBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#f0f2f5',
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accuracyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 12,
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #ffffff',
      },
      default: {
        backgroundColor: '#e2e8f0',
      },
    }),
  },
  accuracyBadgeIcon: {
    marginRight: 6,
  },
  accuracyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // Messages Scroll Area
  chatScrollArea: {
    flex: 1,
  },
  chatScrollContent: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    flexGrow: 1,
  },
  chatContainerMaxWidth: {
    width: '100%',
    maxWidth: 896,
  },

  // Message Bubbles Layout
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 36,
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
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 4,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
      },
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  userAvatarBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  messageContentBlock: {
    flex: 1,
    maxWidth: '80%',
  },
  msgSenderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
    opacity: 0.7,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  msgSenderLabelRight: {
    textAlign: 'right',
  },

  // Standard bubble text
  standardBubble: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  bubbleStyleAI: {
    backgroundColor: '#f0f2f5',
    borderTopLeftRadius: 0,
    ...Platform.select({
      web: {
        boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  bubbleStyleUser: {
    backgroundColor: '#f0f2f5',
    borderTopRightRadius: 0,
    ...Platform.select({
      web: {
        boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  standardMessageText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 22,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  standardMessageTextUser: {
    fontWeight: '500',
  },

  // Suggested starts layout
  suggestedStartsBubble: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: '#f0f2f5',
    borderTopLeftRadius: 0,
    ...Platform.select({
      web: {
        boxShadow: '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  suggestedStartsContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      web: {
        boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff',
      },
      default: {
        backgroundColor: '#e2e8f0',
      },
    }),
  },
  suggestedStartsHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 10,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  suggestedStartBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(99, 102, 241, 0.4)',
    marginRight: 10,
  },
  suggestedStartBulletText: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },

  // California Law Rich Card Layout
  californiaLawCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: '#f0f2f5',
    borderTopLeftRadius: 0,
    ...Platform.select({
      web: {
        boxShadow: '12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  californiaLawTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6366f1',
    marginBottom: 12,
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  californiaLawBodyText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  lawGridContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 16,
    marginBottom: 20,
  },
  lawGridCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      web: {
        boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff',
      },
      default: {
        backgroundColor: '#e2e8f0',
      },
    }),
  },
  lawGridCardHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  lawGridCardText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  numberedListContainer: {
    marginTop: 12,
  },
  numberedListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  numberedListNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366f1',
    marginRight: 10,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  numberedListBody: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  boldText: {
    fontWeight: '700',
  },

  // Typing indicator
  typingAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #ffffff',
      },
      default: {
        backgroundColor: '#e2e8f0',
      },
    }),
  },
  typingBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignSelf: 'flex-start',
    ...Platform.select({
      web: {
        boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff',
      },
      default: {
        backgroundColor: '#e2e8f0',
      },
    }),
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
    marginHorizontal: 3,
  },

  // Footer Containers
  footerContainer: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    backgroundColor: '#f0f2f5',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
  },
  suggestionChipsScroll: {
    marginBottom: 16,
    width: '100%',
  },
  suggestionChipsContent: {
    paddingBottom: 4,
  },
  suggestionChip: {
    backgroundColor: '#f0f2f5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  suggestionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },

  // Chat Input Box
  inputCard: {
    backgroundColor: '#f0f2f5',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    padding: 8,
    ...Platform.select({
      web: {
        boxShadow: '12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.8,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inputCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attachmentButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    marginBottom: 2,
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  chatTextInput: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 14,
    color: '#1e293b',
    paddingVertical: 12,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
      },
    }),
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonActive: {
    backgroundColor: '#6366f1',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
      },
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sendButtonInactive: {
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #ffffff',
      },
      default: {
        backgroundColor: '#e2e8f0',
      },
    }),
  },

  inputCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  footerAccuracyNotice: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(100, 116, 139, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  modelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #ffffff',
      },
      default: {
        backgroundColor: '#e2e8f0',
      },
    }),
  },
  modelTagIcon: {
    marginRight: 4,
  },
  modelTagText: {
    fontSize: 10,
    fontWeight: '800',
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
    maxWidth: 400,
    backgroundColor: '#f0f2f5',
    padding: 32,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.4)',
    elevation: 24,
    shadowColor: '#1e293b',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    zIndex: 102,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  settingsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  closeSettingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  settingsContent: {
    flex: 1,
  },
  themeSelectorGroup: {
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      web: {
        boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff',
      },
      default: {
        backgroundColor: '#e2e8f0',
      },
    }),
  },
  themeSelectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  themeBtnActive: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  themeBtnTextActive: {
    color: '#6366f1',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  themeBtnDisabled: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    opacity: 0.5,
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff',
        cursor: 'not-allowed' as any,
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  themeBtnTextDisabled: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  sidebarNavItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  deleteSessionBtn: {
    padding: 8,
    borderRadius: 8,
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
  selectorBar: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(240, 242, 245, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
  },
  selectorContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    gap: Platform.OS === 'web' ? 24 : 12,
  },
  selectorSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorTitleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginRight: 12,
    minWidth: 80,
  },
  selectorSectionDivider: {
    width: Platform.OS === 'web' ? 1 : 0,
    height: Platform.OS === 'web' ? 24 : 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  selectorChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    gap: 8,
  },
  selectorChip: {
    backgroundColor: '#f0f2f5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    ...Platform.select({
      web: {
        boxShadow: '2px 2px 4px #d1d9e6, -2px -2px 4px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  selectorChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(99, 102, 241, 0.3)',
      },
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectorChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
  },
  selectorChipTextActive: {
    color: '#ffffff',
  },
});
