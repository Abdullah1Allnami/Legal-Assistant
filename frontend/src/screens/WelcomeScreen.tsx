import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../context/ThemeContext';

interface WelcomeScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToSignUp: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  citations?: string[];
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onNavigateToLogin,
  onNavigateToSignUp,
}) => {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();

  const isLargeScreen = width >= 800;
  const scrollViewRef = useRef<ScrollView>(null);

  // States for Interactive Chat Simulator
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'user',
      text: 'Find precedent for civil negligence in construction cases involving subcontractors in California.',
    },
    {
      id: '2',
      sender: 'ai',
      text: 'Based on California Civil Code § 2782 and recent appellate decisions, general contractors cannot shift liability to subcontractors for their own active negligence. The indemnity clause must explicitly specify the apportionment of fault.',
      citations: ['CIT-042', 'CA-APP-2023'],
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [activeCitation, setActiveCitation] = useState<string | null>(null);

  // States for Demo Booking Modal
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoFirm, setDemoFirm] = useState('');
  const [demoStatus, setDemoStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // States for Case Analyzer Tool
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);
  const [selectedCaseType, setSelectedCaseType] = useState('Contract Dispute');
  const [analyzerStep, setAnalyzerStep] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>('idle');
  const [analyzedResult, setAnalyzedResult] = useState('');

  // Scroll section heights mapping (approximations)
  const scrollToSection = (section: 'features' | 'stats' | 'cta') => {
    let yOffset = 0;
    if (section === 'features') {
      yOffset = isLargeScreen ? 850 : 1200;
    } else if (section === 'stats') {
      yOffset = isLargeScreen ? 1650 : 2500;
    } else if (section === 'cta') {
      yOffset = isLargeScreen ? 1950 : 3100;
    }
    scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
  };

  // Chat Simulator - Handle Send
  const handleChatSend = (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim() || isAiTyping) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAiTyping(true);

    // Simulate AI thinking and reply
    setTimeout(() => {
      let aiText = '';
      let aiCitations: string[] = [];

      const query = text.toLowerCase();
      if (query.includes('negligence') || query.includes('accident') || query.includes('injury')) {
        aiText = 'Under California Law (CCP § 335.1), a personal injury negligence suit must be filed within two years. For structural/construction defects, a patent defect has a 4-year limit, while a latent defect has a 10-year limit (CCP § 337.15).';
        aiCitations = ['CA-CCP-335.1', 'LATENT-DEF-10Y'];
      } else if (query.includes('subcontractor') || query.includes('indemnity') || query.includes('liability')) {
        aiText = 'California Civil Code § 2782.05 invalidates provisions in construction contracts that require a subcontractor to indemnify or hold harmless a general contractor for the general contractor\'s active negligence.';
        aiCitations = ['CIV-2782.05', 'CA-CONTRACTS'];
      } else if (query.includes('fee') || query.includes('billing') || query.includes('cost')) {
        aiText = 'Attorney fees are generally recoverable only if authorized by statute or explicit agreement (CCP § 1021). The "American Rule" mandates each party pays their own fees unless contractually overridden.';
        aiCitations = ['CCP-1021', 'FEES-STATUTE'];
      } else {
        aiText = 'I have scanned our institutional database for related California appellate opinions and statutes. The primary jurisdiction precedents point toward strict construction of liability and duty of care standards.';
        aiCitations = ['CA-APP-GEN', 'STATUTE-REFS'];
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        citations: aiCitations,
      };

      setChatMessages((prev) => [...prev, aiMsg]);
      setIsAiTyping(false);
    }, 1200);
  };

  // Demo Booking - Handle Submit
  const handleBookDemo = () => {
    if (!demoName || !demoEmail || !demoFirm) return;
    setDemoStatus('submitting');
    setTimeout(() => {
      setDemoStatus('success');
    }, 1500);
  };

  // Case Analyzer - Run Simulation
  const runCaseAnalyzer = () => {
    setAnalyzerStep('uploading');
    setTimeout(() => {
      setAnalyzerStep('analyzing');
      setTimeout(() => {
        setAnalyzerStep('done');
        if (selectedCaseType === 'Contract Dispute') {
          setAnalyzedResult(
            'Analysis COMPLETE.\n\n- Flagged: Ambiguity in Clause 14.2 regarding Force Majeure allocation.\n- Risk Index: Moderate.\n- Recommended Action: Redraft standard CA definitions to include sub-contractual labor shortages.'
          );
        } else if (selectedCaseType === 'Negligence') {
          setAnalyzedResult(
            'Analysis COMPLETE.\n\n- Flagged: Strict liability standards under active California litigation precedents.\n- Risk Index: High.\n- Recommended Action: Verify insurance policies for active-negligence exclusions.'
          );
        } else {
          setAnalyzedResult(
            'Analysis COMPLETE.\n\n- Flagged: Patent-to-subcontractor alignment checks required.\n- Risk Index: Low.\n- Recommended Action: Supplement with localized district ruling summaries.'
          );
        }
      }, 1500);
    }, 1200);
  };

  const closeAnalyzer = () => {
    setIsAnalyzerOpen(false);
    setAnalyzerStep('idle');
    setAnalyzedResult('');
  };

  const closeDemoModal = () => {
    setIsDemoModalOpen(false);
    setDemoStatus('idle');
    setDemoName('');
    setDemoEmail('');
    setDemoFirm('');
  };

  return (
    <View style={styles.outerContainer}>
      {/* Top sticky Navigation Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })} activeOpacity={0.7}>
            <Text style={styles.logoText}>LexisAI</Text>
          </TouchableOpacity>

          {isLargeScreen && (
            <View style={styles.navLinks}>
              <TouchableOpacity style={styles.navLinkButton} onPress={() => scrollToSection('features')}>
                <Text style={styles.navLinkText}>Features</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navLinkButton} onPress={() => scrollToSection('stats')}>
                <Text style={styles.navLinkText}>Pricing</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navLinkButton} onPress={() => scrollToSection('cta')}>
                <Text style={styles.navLinkText}>About</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.loginBtn} onPress={onNavigateToLogin}>
              <Text style={styles.loginBtnText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.getStartedHeaderBtn} onPress={onNavigateToSignUp}>
              <Text style={styles.getStartedHeaderBtnText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Absolute Background Mesh Overlays (for premium aesthetics on native & web) */}
        <View style={styles.bgMeshContainer} pointerEvents="none">
          <View style={[styles.meshGlow, styles.glowLeft]} />
          <View style={[styles.meshGlow, styles.glowRight]} />
          <View style={[styles.meshGlow, styles.glowCenter]} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Trust Badge */}
          <View style={styles.trustBadge}>
            <MaterialIcons name="verified" size={16} color="#6366f1" style={styles.trustBadgeIcon} />
            <Text style={styles.trustBadgeText}>Trusted by 500+ Law Firms</Text>
          </View>

          {/* Headlines */}
          <Text style={styles.heroTitle}>AI Legal Assistant</Text>
          <Text style={styles.heroSubText}>
            Get instant, reliable legal answers powered by AI. Navigate complex litigation, research case law, and draft documents with institutional precision.
          </Text>

          {/* CTA Buttons */}
          <View style={[styles.heroButtonsContainer, !isLargeScreen && styles.flexCol]}>
            <TouchableOpacity style={styles.heroPrimaryBtn} onPress={onNavigateToSignUp} activeOpacity={0.9}>
              <Text style={styles.heroPrimaryBtnText}>Get Started</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#ffffff" style={styles.heroArrowIcon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroSecondaryBtn}
              onPress={() => setIsDemoModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.heroSecondaryBtnText}>Schedule Demo</Text>
            </TouchableOpacity>
          </View>

          {/* --- Interactive Chat Mockup (Silk Card Aesthetic) --- */}
          <View style={[styles.chatMockupCard, !isLargeScreen && styles.wFull]}>
            {/* Windows Window Header */}
            <View style={styles.chatWindowHeader}>
              <View style={styles.circleButtons}>
                <View style={[styles.circleDot, styles.dotRed]} />
                <View style={[styles.circleDot, styles.dotYellow]} />
                <View style={[styles.circleDot, styles.dotGreen]} />
              </View>
              <View style={styles.urlBar}>
                <Text style={styles.urlText}>lexis-ai.cloud/active-session</Text>
              </View>
              <View style={styles.w12} />
            </View>

            {/* Window Content Layout */}
            <View style={[styles.chatWindowContent, !isLargeScreen && styles.flexCol]}>
              {/* Sidebar */}
              {isLargeScreen && (
                <View style={styles.chatSidebar}>
                  <View style={[styles.sidebarItem, styles.sidebarItemActive]}>
                    <MaterialCommunityIcons name="gavel" size={16} color="#6366f1" />
                    <View style={styles.sidebarLineShort} />
                  </View>
                  <View style={styles.sidebarItem}>
                    <MaterialCommunityIcons name="file-document-outline" size={16} color="#94a3b8" />
                    <View style={styles.sidebarLineLong} />
                  </View>
                  <View style={styles.sidebarItem}>
                    <MaterialCommunityIcons name="history" size={16} color="#94a3b8" />
                    <View style={styles.sidebarLineMedium} />
                  </View>
                  <View style={styles.sidebarFooter}>
                    <View style={styles.sidebarProgressTrack}>
                      <View style={styles.sidebarProgressFill} />
                    </View>
                  </View>
                </View>
              )}

              {/* Chat Dialogue Pane */}
              <View style={styles.chatMainPane}>
                <ScrollView
                  style={styles.chatMessagesScroll}
                  contentContainerStyle={styles.chatMessagesContainer}
                  nestedScrollEnabled
                >
                  {chatMessages.map((msg) => (
                    <View
                      key={msg.id}
                      style={[
                        styles.chatBubble,
                        msg.sender === 'user' ? styles.bubbleUser : styles.bubbleAi,
                      ]}
                    >
                      {msg.sender === 'ai' && (
                        <View style={styles.aiBubbleHeader}>
                          <View style={styles.aiMiniIcon}>
                            <MaterialIcons name="gavel" size={14} color="#6366f1" />
                          </View>
                          <Text style={styles.aiLabelText}>LexisAI Expert</Text>
                        </View>
                      )}
                      <Text style={[
                        styles.chatBubbleText,
                        msg.sender === 'user' ? styles.textOnPrimary : styles.textOnSurface
                      ]}>
                        {msg.text}
                      </Text>
                      {msg.citations && (
                        <View style={styles.citationRow}>
                          {msg.citations.map((cit) => (
                            <TouchableOpacity
                              key={cit}
                              style={[
                                styles.citationTag,
                                activeCitation === cit && styles.citationTagActive,
                              ]}
                              onPress={() => setActiveCitation(cit === activeCitation ? null : cit)}
                            >
                              <Text style={styles.citationText}>{cit}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}

                  {isAiTyping && (
                    <View style={[styles.chatBubble, styles.bubbleAi, styles.typingBubble]}>
                      <ActivityIndicator size="small" color="#6366f1" style={{ marginRight: 6 }} />
                      <Text style={styles.typingText}>LexisAI is thinking...</Text>
                    </View>
                  )}
                </ScrollView>

                {/* Popups/Tooltips for Clicked Citations */}
                {activeCitation && (
                  <View style={styles.citationTooltip}>
                    <View style={styles.tooltipHeader}>
                      <Text style={styles.tooltipTitle}>Source Citation: {activeCitation}</Text>
                      <TouchableOpacity onPress={() => setActiveCitation(null)}>
                        <Ionicons name="close" size={14} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.tooltipBody}>
                      {activeCitation.includes('CIT-042') && 'California Civil Code § 2782 details limitations on indemnity agreements in construction contracts.'}
                      {activeCitation.includes('CA-APP-2023') && 'Appellate Decision (2023): Landmark holdings determining sub-contractual fault apportionment ratios.'}
                      {activeCitation.includes('CCP-335.1') && 'California Code of Civil Procedure § 335.1: Defines 2-year limitation periods for personal negligence.'}
                      {activeCitation.includes('LATENT-DEF-10Y') && 'California Code of Civil Procedure § 337.15: Specifies a 10-year limit for latent structural defects.'}
                      {activeCitation.includes('CIV-2782.05') && 'CC § 2782.05: General void rules for active negligence subcontractor liabilities.'}
                      {!['CIT-042', 'CA-APP-2023', 'CCP-335.1', 'LATENT-DEF-10Y', 'CIV-2782.05'].some(x => activeCitation.includes(x)) && 'Case ruling summary retrieved from LexisAI historical database.'}
                    </Text>
                  </View>
                )}

                {/* Interactive Tag Prompt Suggestions */}
                <View style={styles.suggestionRow}>
                  <TouchableOpacity
                    style={styles.suggestionBadge}
                    onPress={() => handleChatSend('What is the statute of limitations for negligence in CA?')}
                  >
                    <Text style={styles.suggestionBadgeText}>⏱ Statutes Limit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.suggestionBadge}
                    onPress={() => handleChatSend('Can subcontractor limit active negligence liability?')}
                  >
                    <Text style={styles.suggestionBadgeText}>🏗 Subcontractors</Text>
                  </TouchableOpacity>
                </View>

                {/* Chat Input */}
                <View style={styles.chatInputRow}>
                  <TextInput
                    style={styles.chatTextInput}
                    placeholder="Ask a follow-up question..."
                    placeholderTextColor="#94a3b8"
                    value={chatInput}
                    onChangeText={setChatInput}
                    onSubmitEditing={() => handleChatSend()}
                  />
                  <TouchableOpacity style={styles.chatSendBtn} onPress={() => handleChatSend()} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="send" size={16} color="#6366f1" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Bento Grid Features Section */}
        <View style={styles.bentoSection}>
          <Text style={styles.sectionHeaderTitle}>Engineered for Accuracy</Text>
          <Text style={styles.sectionHeaderSubText}>The legal industry doesn't tolerate "hallucinations". We don't either.</Text>

          <View style={[styles.bentoGrid, !isLargeScreen && styles.flexCol]}>
            {/* Column 1 & 2 combined: Fast Answers */}
            <View style={[styles.bentoCard, styles.bentoCardDouble, !isLargeScreen && styles.wFull]}>
              <View style={styles.bentoCardTextSide}>
                <View style={styles.bentoIconContainer}>
                  <MaterialIcons name="speed" size={28} color="#6366f1" />
                </View>
                <Text style={styles.bentoCardTitle}>Fast Answers</Text>
                <Text style={styles.bentoCardText}>
                  Query thousands of statutes and case files in milliseconds. Our semantic search understands legal context, not just keywords.
                </Text>
              </View>
              <View style={styles.bentoCardGraphicSide}>
                <View style={styles.silkInsetContainer}>
                  <Text style={styles.latencyText}>Latency: 42ms</Text>
                </View>
              </View>
            </View>

            {/* Column 3: Case Guidance (Interactive) */}
            <View style={[styles.bentoCard, styles.bentoCardSingle, !isLargeScreen && styles.wFull]}>
              <View style={styles.bentoIconContainer}>
                <MaterialIcons name="account-balance" size={28} color="#8b5cf6" />
              </View>
              <Text style={styles.bentoCardTitle}>Case Guidance</Text>
              <Text style={styles.bentoCardText}>
                Upload your case briefs and get instant strategic analysis based on current jurisdiction trends.
              </Text>
              <TouchableOpacity
                style={styles.bentoActionBtn}
                onPress={() => setIsAnalyzerOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.bentoActionBtnText}>Analyze Case</Text>
                <MaterialIcons name="chevron-right" size={18} color="#6366f1" />
              </TouchableOpacity>
            </View>

            {/* Row 2 Column 1: Chat History */}
            <View style={[styles.bentoCard, styles.bentoCardSingle, !isLargeScreen && styles.wFull]}>
              <View style={styles.bentoIconContainer}>
                <MaterialIcons name="history" size={28} color="#64748b" />
              </View>
              <Text style={styles.bentoCardTitle}>Chat History</Text>
              <Text style={styles.bentoCardText}>
                Secure, searchable archives of every interaction. Indexed by client and matter ID for easy billing reconciliation.
              </Text>

              <View style={styles.bentoHistoryMock}>
                <View style={styles.historyMockIcon}>
                  <MaterialIcons name="description" size={16} color="#6366f1" />
                </View>
                <View style={styles.historyMockTextGroup}>
                  <View style={styles.historyMockLineTop} />
                  <View style={styles.historyMockLineBottom} />
                </View>
              </View>
            </View>

            {/* Row 2 Column 2 & 3: Bento CTA Card */}
            <View style={[styles.bentoCard, styles.bentoCardDouble, styles.bentoCtaCard, !isLargeScreen && styles.wFull]}>
              <View style={styles.bentoCtaContent}>
                <Text style={styles.bentoCtaTitle}>Ready to elevate your practice?</Text>
                <Text style={styles.bentoCtaText}>
                  Join the leading firms using LexisAI to deliver results faster than ever.
                </Text>
                <TouchableOpacity style={styles.bentoCtaButton} onPress={onNavigateToSignUp} activeOpacity={0.9}>
                  <Text style={styles.bentoCtaButtonText}>Start Free Trial</Text>
                </TouchableOpacity>
              </View>
              {isLargeScreen && (
                <View style={styles.bentoCtaGraphic}>
                  <Ionicons name="shield-checkmark" size={150} color="rgba(255,255,255,0.08)" style={styles.ctaShieldIcon} />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Proof Stats Section */}
        <View style={styles.proofSection}>
          <View style={[styles.proofGrid, !isLargeScreen && styles.flexCol]}>
            <View style={styles.proofStatItem}>
              <Text style={styles.proofStatNumber}>99.8%</Text>
              <Text style={styles.proofStatLabel}>Citation Accuracy</Text>
            </View>
            <View style={[styles.proofStatItem, !isLargeScreen && styles.proofDividerBorder]}>
              <Text style={styles.proofStatNumber}>4.2h</Text>
              <Text style={styles.proofStatLabel}>Avg. Saved per Case</Text>
            </View>
            <View style={[styles.proofStatItem, !isLargeScreen && styles.proofDividerBorder]}>
              <Text style={styles.proofStatNumber}>15k+</Text>
              <Text style={styles.proofStatLabel}>Active Attorneys</Text>
            </View>
            <View style={[styles.proofStatItem, !isLargeScreen && styles.proofDividerBorder]}>
              <Text style={styles.proofStatNumber}>256-bit</Text>
              <Text style={styles.proofStatLabel}>AES Encryption</Text>
            </View>
          </View>
        </View>

        {/* Footer Section */}
        <View style={styles.footerSection}>
          <View style={[styles.footerGrid, !isLargeScreen && styles.flexCol]}>
            <View style={styles.footerInfoCol}>
              <Text style={styles.footerBrandText}>LexisAI</Text>
              <Text style={styles.footerDescriptionText}>
                Institutional-grade legal intelligence for the modern practitioner. Reliable. Secure. Fast.
              </Text>
              <Text style={styles.footerCopyrightText}>
                © 2024 LexisAI Technologies. Licensed Legal Intelligence.
              </Text>
            </View>

            <View style={styles.footerLinksGrid}>
              <View style={styles.footerLinkCol}>
                <Text style={styles.footerLinkHeader}>Product</Text>
                <TouchableOpacity onPress={() => scrollToSection('features')}><Text style={styles.footerLinkItem}>Features</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => scrollToSection('stats')}><Text style={styles.footerLinkItem}>Pricing</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => scrollToSection('cta')}><Text style={styles.footerLinkItem}>Security</Text></TouchableOpacity>
              </View>
              <View style={styles.footerLinkCol}>
                <Text style={styles.footerLinkHeader}>Legal</Text>
                <TouchableOpacity onPress={() => {}}><Text style={styles.footerLinkItem}>Terms of Service</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => {}}><Text style={styles.footerLinkItem}>Privacy Policy</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => {}}><Text style={styles.footerLinkItem}>Contact Support</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* --- Booking Demo Modal --- */}
      <Modal visible={isDemoModalOpen} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule LexisAI Demo</Text>
              <TouchableOpacity onPress={closeDemoModal}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {demoStatus === 'idle' && (
              <View style={styles.modalForm}>
                <Text style={styles.modalSub}>Experience custom institutional research tailored to your firm's domain.</Text>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>FullName</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Attorney Jane Doe"
                    placeholderTextColor="#a1a1aa"
                    value={demoName}
                    onChangeText={setDemoName}
                  />
                </View>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>Work Email</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="jane@firm.com"
                    placeholderTextColor="#a1a1aa"
                    value={demoEmail}
                    onChangeText={setDemoEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>Law Firm / Company</Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder="Doe & Associates LLP"
                    placeholderTextColor="#a1a1aa"
                    value={demoFirm}
                    onChangeText={setDemoFirm}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.modalSubmitBtn,
                    (!demoName || !demoEmail || !demoFirm) && styles.modalSubmitBtnDisabled
                  ]}
                  onPress={handleBookDemo}
                  disabled={!demoName || !demoEmail || !demoFirm}
                >
                  <Text style={styles.modalSubmitBtnText}>Request Invites</Text>
                </TouchableOpacity>
              </View>
            )}

            {demoStatus === 'submitting' && (
              <View style={styles.modalStateCenter}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.modalLoadingText}>Securing demo slots...</Text>
              </View>
            )}

            {demoStatus === 'success' && (
              <View style={styles.modalStateCenter}>
                <Ionicons name="checkmark-circle" size={56} color="#10b981" />
                <Text style={styles.modalSuccessTitle}>Demo Request Submitted!</Text>
                <Text style={styles.modalSuccessSub}>
                  Thank you! An invitation slot outline and case scheduling link has been emailed to {demoEmail}.
                </Text>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={closeDemoModal}>
                  <Text style={styles.modalCloseBtnText}>Close Window</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* --- Case Analyzer Simulator Overlay Modal --- */}
      <Modal visible={isAnalyzerOpen} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.analyzerCard]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="account-balance" size={20} color="#8b5cf6" style={{ marginRight: 6 }} />
                <Text style={styles.modalTitle}>Jurisdiction Case Analyzer</Text>
              </View>
              <TouchableOpacity onPress={closeAnalyzer}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {analyzerStep === 'idle' && (
              <View style={styles.modalForm}>
                <Text style={styles.modalSub}>
                  Test-drive our case evaluation engine. Choose a litigation sector and trigger the simulation.
                </Text>
                <Text style={styles.modalInputLabel}>Select Case Area</Text>
                <View style={styles.caseTypeRow}>
                  {['Contract Dispute', 'Negligence', 'IP Infringe'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.caseTypeSelectorBtn,
                        selectedCaseType === t && styles.caseTypeSelectorBtnActive,
                      ]}
                      onPress={() => setSelectedCaseType(t)}
                    >
                      <Text
                        style={[
                          styles.caseTypeSelectorText,
                          selectedCaseType === t && styles.caseTypeSelectorTextActive,
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.analyzerRunBtn} onPress={runCaseAnalyzer} activeOpacity={0.9}>
                  <Text style={styles.analyzerRunBtnText}>Initialize Verification</Text>
                </TouchableOpacity>
              </View>
            )}

            {analyzerStep === 'uploading' && (
              <View style={styles.modalStateCenter}>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={styles.modalLoadingText}>Uploading briefing metadata...</Text>
                <View style={styles.simulatorProgressContainer}>
                  <View style={[styles.simulatorProgressBar, { width: '40%' }]} />
                </View>
              </View>
            )}

            {analyzerStep === 'analyzing' && (
              <View style={styles.modalStateCenter}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text style={styles.modalLoadingText}>Evaluating local appellate rulings and citations...</Text>
                <View style={styles.simulatorProgressContainer}>
                  <View style={[styles.simulatorProgressBar, { width: '80%', backgroundColor: '#6366f1' }]} />
                </View>
              </View>
            )}

            {analyzerStep === 'done' && (
              <View style={styles.analyzerResultContainer}>
                <View style={styles.successBadge}>
                  <MaterialIcons name="done-all" size={16} color="#065f46" />
                  <Text style={styles.successBadgeText}>Simulation Complete</Text>
                </View>
                <ScrollView style={styles.resultTextScroll} nestedScrollEnabled>
                  <Text style={styles.resultText}>{analyzedResult}</Text>
                </ScrollView>
                <TouchableOpacity style={[styles.modalCloseBtn, { backgroundColor: '#8b5cf6' }]} onPress={closeAnalyzer}>
                  <Text style={styles.modalCloseBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: ThemeColors) => StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  headerBar: {
    width: '100%',
    height: 70,
    backgroundColor: theme.glassBg,
    borderBottomWidth: 1,
    borderColor: theme.glassBorder,
    justifyContent: 'center',
    position: Platform.OS === 'web' ? 'fixed' as any : 'relative',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        boxShadow: theme.isDark ? 'none' : '0 4px 30px rgba(0, 0, 0, 0.03)',
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
  },
  logoText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 22,
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: -0.5,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  navLinkButton: {
    paddingVertical: 8,
  },
  navLinkText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  loginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loginBtnText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    fontWeight: '700',
    color: theme.textMuted,
  },
  getStartedHeaderBtn: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...Platform.select({
      web: {
        boxShadow: theme.isDark ? 'none' : '4px 4px 8px rgba(99, 102, 241, 0.2)',
      },
    }),
  },
  getStartedHeaderBtnText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'web' ? 70 : 0,
  },
  bgMeshContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 1,
    backgroundColor: theme.bg,
  },
  meshGlow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: theme.isDark ? 0.08 : 0.15,
    ...Platform.select({
      web: {
        filter: 'blur(120px)',
      },
    }),
  },
  glowLeft: {
    top: '10%',
    left: '-10%',
    width: 600,
    height: 600,
    backgroundColor: '#818cf8',
  },
  glowRight: {
    top: '20%',
    right: '-10%',
    width: 500,
    height: 500,
    backgroundColor: '#c084fc',
  },
  glowCenter: {
    bottom: '-10%',
    left: '25%',
    width: 700,
    height: 700,
    backgroundColor: theme.primary,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 60,
    zIndex: 2,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.accentBg,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
  },
  trustBadgeIcon: {
    marginRight: 6,
  },
  trustBadgeText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 0.2,
  },
  heroTitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: Platform.OS === 'web' ? 56 : 38,
    fontWeight: '800',
    color: theme.text,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: Platform.OS === 'web' ? 64 : 44,
    maxWidth: 800,
    marginBottom: 20,
  },
  heroSubText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 18,
    color: theme.textMuted,
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 680,
    marginBottom: 40,
    fontWeight: '500',
  },
  heroButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 80,
  },
  heroPrimaryBtn: {
    backgroundColor: theme.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: theme.isDark ? 'none' : '0 10px 20px rgba(99, 102, 241, 0.25)',
      },
    }),
  },
  heroPrimaryBtnText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  heroArrowIcon: {
    marginLeft: 8,
  },
  heroSecondaryBtn: {
    backgroundColor: theme.cardBg,
    borderRadius: 14,
    paddingHorizontal: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.isDark ? theme.cardBorder : '#e2e8f0',
    ...Platform.select({
      web: {
        boxShadow: theme.isDark ? 'none' : '0 4px 10px rgba(0, 0, 0, 0.05)',
      },
      ios: {
        shadowColor: theme.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  heroSecondaryBtnText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: theme.text,
    fontSize: 16,
    fontWeight: '800',
  },
  chatMockupCard: {
    backgroundColor: theme.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    width: '90%',
    maxWidth: 900,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: theme.shadowBox,
      },
      ios: {
        shadowColor: theme.shadowColor,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  chatWindowHeader: {
    height: 48,
    backgroundColor: theme.bgAlt,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  circleButtons: {
    flexDirection: 'row',
    gap: 6,
    width: 60,
  },
  circleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotRed: {
    backgroundColor: '#ef4444',
  },
  dotYellow: {
    backgroundColor: '#fbbf24',
  },
  dotGreen: {
    backgroundColor: '#10b981',
  },
  urlBar: {
    flex: 1,
    maxWidth: 400,
    backgroundColor: theme.bg,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urlText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 11,
    color: theme.textLight,
    fontWeight: '600',
  },
  chatWindowContent: {
    flexDirection: 'row',
    height: 480,
  },
  chatSidebar: {
    width: 64,
    backgroundColor: theme.bgAlt,
    borderRightWidth: 1,
    borderRightColor: theme.divider,
    alignItems: 'center',
    paddingVertical: 20,
    gap: 24,
  },
  sidebarItem: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sidebarItemActive: {
    backgroundColor: theme.accentBg,
  },
  sidebarLineShort: {
    width: 12,
    height: 2,
    backgroundColor: theme.primary,
    borderRadius: 1,
  },
  sidebarLineLong: {
    width: 16,
    height: 2,
    backgroundColor: theme.divider,
    borderRadius: 1,
  },
  sidebarLineMedium: {
    width: 14,
    height: 2,
    backgroundColor: theme.divider,
    borderRadius: 1,
  },
  sidebarFooter: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  sidebarProgressTrack: {
    width: 24,
    height: 4,
    backgroundColor: theme.divider,
    borderRadius: 2,
    overflow: 'hidden',
  },
  sidebarProgressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: theme.primary,
  },
  chatMainPane: {
    flex: 1,
    backgroundColor: theme.cardBg,
  },
  chatMessagesScroll: {
    flex: 1,
  },
  chatMessagesContainer: {
    padding: 20,
    gap: 16,
  },
  chatBubble: {
    borderRadius: 16,
    padding: 14,
    maxWidth: '85%',
  },
  bubbleUser: {
    backgroundColor: theme.primary,
    alignSelf: 'flex-end',
  },
  bubbleAi: {
    backgroundColor: theme.bgAlt,
    alignSelf: 'flex-start',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  aiBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiMiniIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: theme.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  aiLabelText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 11,
    fontWeight: '700',
    color: theme.textMuted,
  },
  chatBubbleText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    lineHeight: 20,
  },
  textOnPrimary: {
    color: '#ffffff',
  },
  textOnSurface: {
    color: theme.text,
  },
  typingText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: '600',
  },
  citationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  citationTag: {
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.divider,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  citationTagActive: {
    borderColor: theme.primary,
    backgroundColor: theme.accentBg,
  },
  citationText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 11,
    color: theme.primary,
    fontWeight: '700',
  },
  citationTooltip: {
    position: 'absolute',
    bottom: 74,
    left: 20,
    right: 20,
    backgroundColor: theme.tooltipBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.tooltipBorder,
    padding: 14,
    zIndex: 10,
    ...Platform.select({
      web: {
        boxShadow: theme.isDark ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0, 0, 0, 0.08)',
      },
      ios: {
        shadowColor: theme.shadowColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
    }),
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tooltipTitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 12,
    fontWeight: '800',
    color: theme.text,
  },
  tooltipBody: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 12,
    color: theme.textMuted,
    lineHeight: 16,
  },
  suggestionRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
  },
  suggestionBadge: {
    backgroundColor: theme.bgAlt,
    borderWidth: 1,
    borderColor: theme.divider,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  suggestionBadgeText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
  },
  chatInputRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  chatTextInput: {
    flex: 1,
    height: 40,
    backgroundColor: theme.bgAlt,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 13,
    color: theme.inputText,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
      },
    }),
  },
  chatSendBtn: {
    width: 40,
    height: 40,
    backgroundColor: theme.bgAlt,
    borderWidth: 1,
    borderColor: theme.divider,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoSection: {
    width: '100%',
    backgroundColor: theme.cardBg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.divider,
    paddingVertical: 80,
    alignItems: 'center',
    zIndex: 2,
  },
  sectionHeaderTitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 32,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 10,
  },
  sectionHeaderSubText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 16,
    color: theme.textMuted,
    fontWeight: '500',
    marginBottom: 50,
  },
  bentoGrid: {
    width: '90%',
    maxWidth: 1100,
    gap: 20,
  },
  bentoCard: {
    backgroundColor: theme.bgAlt,
    borderWidth: 1,
    borderColor: theme.divider,
    borderRadius: 24,
    padding: 30,
    overflow: 'hidden',
  },
  bentoCardDouble: {
    flex: 2,
    flexDirection: 'row',
  },
  bentoCardSingle: {
    flex: 1,
  },
  bentoCardTextSide: {
    flex: 1.2,
    justifyContent: 'center',
  },
  bentoCardGraphicSide: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: theme.isDark ? 'rgba(99, 102, 241, 0.1)' : '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  bentoCardTitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 20,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 10,
  },
  bentoCardText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    color: theme.textMuted,
    lineHeight: 20,
    fontWeight: '500',
  },
  silkInsetContainer: {
    backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  latencyText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    color: theme.primary,
    fontWeight: '800',
  },
  bentoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBg,
    borderWidth: 1.5,
    borderColor: theme.divider,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 40,
    alignSelf: 'flex-start',
    marginTop: 20,
  },
  bentoActionBtnText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 12,
    fontWeight: '800',
    color: theme.primary,
    marginRight: 4,
  },
  bentoHistoryMock: {
    backgroundColor: theme.cardBg,
    borderWidth: 1,
    borderColor: theme.divider,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  historyMockIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: theme.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyMockTextGroup: {
    flex: 1,
    gap: 4,
  },
  historyMockLineTop: {
    width: '80%',
    height: 6,
    backgroundColor: theme.divider,
    borderRadius: 3,
  },
  historyMockLineBottom: {
    width: '40%',
    height: 4,
    backgroundColor: theme.divider,
    borderRadius: 2,
  },
  bentoCtaCard: {
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    position: 'relative',
  },
  bentoCtaContent: {
    flex: 1.2,
    zIndex: 2,
  },
  bentoCtaGraphic: {
    position: 'absolute',
    right: 0,
    bottom: -30,
    opacity: 0.8,
    zIndex: 1,
  },
  bentoCtaTitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  bentoCtaText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    color: '#e0e7ff',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 24,
  },
  bentoCtaButton: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 20,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  bentoCtaButtonText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    fontWeight: '800',
    color: '#4f46e5',
  },
  ctaShieldIcon: {
    transform: [{ rotate: '-10deg' }],
  },
  proofSection: {
    width: '100%',
    backgroundColor: theme.bgAlt,
    borderBottomWidth: 1,
    borderColor: theme.divider,
    paddingVertical: 60,
    alignItems: 'center',
    zIndex: 2,
  },
  proofGrid: {
    width: '90%',
    maxWidth: 1100,
    flexDirection: 'row',
  },
  proofStatItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  proofDividerBorder: {
    ...Platform.select({
      web: {
        borderLeftWidth: 1,
        borderColor: theme.divider,
      },
    }),
  },
  proofStatNumber: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 40,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  proofStatLabel: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: '700',
  },
  footerSection: {
    width: '100%',
    backgroundColor: theme.bgAlt,
    paddingVertical: 60,
    alignItems: 'center',
    zIndex: 2,
  },
  footerGrid: {
    width: '90%',
    maxWidth: 1100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 40,
  },
  footerInfoCol: {
    flex: 1.2,
    gap: 16,
  },
  footerBrandText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 22,
    fontWeight: '800',
    color: theme.primary,
    letterSpacing: -0.5,
  },
  footerDescriptionText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    color: theme.textMuted,
    lineHeight: 20,
    fontWeight: '500',
  },
  footerCopyrightText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 11,
    color: theme.textLight,
    fontWeight: '500',
    marginTop: 10,
  },
  footerLinksGrid: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 80,
  },
  footerLinkCol: {
    gap: 12,
  },
  footerLinkHeader: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    fontWeight: '800',
    color: theme.text,
    letterSpacing: 0.5,
  },
  footerLinkItem: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 11, 15, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: theme.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: theme.shadowBox,
      },
      ios: {
        shadowColor: theme.shadowColor,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
    }),
  },
  analyzerCard: {
    maxWidth: 540,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 20,
    fontWeight: '800',
    color: theme.text,
  },
  modalForm: {
    gap: 16,
  },
  modalSub: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 8,
  },
  modalInputGroup: {
    gap: 6,
  },
  modalInputLabel: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
    paddingLeft: 4,
  },
  modalTextInput: {
    backgroundColor: theme.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.isDark ? theme.inputBorder : 'rgba(255,255,255,0.4)',
    height: 48,
    paddingHorizontal: 16,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    color: theme.inputText,
    ...Platform.select({
      web: {
        boxShadow: theme.shadowInset,
        outlineWidth: 0,
      },
    }),
  },
  modalSubmitBtn: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      web: {
        boxShadow: theme.isDark ? 'none' : '4px 4px 8px rgba(99, 102, 241, 0.3)',
      },
    }),
  },
  modalSubmitBtnDisabled: {
    backgroundColor: theme.isDark ? '#1e293b' : '#cbd5e1',
    opacity: 0.6,
  },
  modalSubmitBtnText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  modalStateCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 12,
  },
  modalLoadingText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalSuccessTitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 18,
    fontWeight: '800',
    color: theme.accent,
    marginTop: 8,
  },
  modalSuccessSub: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  modalCloseBtn: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  caseTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  caseTypeSelectorBtn: {
    flex: 1,
    backgroundColor: theme.bgAlt,
    borderWidth: 1,
    borderColor: theme.isDark ? theme.divider : 'rgba(255,255,255,0.7)',
    borderRadius: 10,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: theme.isDark ? 'none' : '2px 2px 4px #d1d9e6, -2px -2px 4px #ffffff',
      },
    }),
  },
  caseTypeSelectorBtnActive: {
    borderColor: '#8b5cf6',
    backgroundColor: theme.isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.08)',
  },
  caseTypeSelectorText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: '700',
  },
  caseTypeSelectorTextActive: {
    color: '#8b5cf6',
  },
  analyzerRunBtn: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 8px rgba(139, 92, 246, 0.3)',
      },
    }),
  },
  analyzerRunBtnText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  simulatorProgressContainer: {
    width: '80%',
    height: 6,
    backgroundColor: theme.isDark ? '#1e293b' : 'rgba(226, 232, 240, 0.8)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  simulatorProgressBar: {
    height: '100%',
    backgroundColor: '#8b5cf6',
  },
  analyzerResultContainer: {
    alignItems: 'center',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5',
    borderColor: theme.isDark ? 'rgba(16, 185, 129, 0.2)' : '#a7f3d0',
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 4,
    marginBottom: 16,
  },
  successBadgeText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 11,
    fontWeight: '800',
    color: theme.accent,
  },
  resultTextScroll: {
    width: '100%',
    maxHeight: 180,
    backgroundColor: theme.isDark ? '#090a0f' : '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.divider,
    marginBottom: 8,
  },
  resultText: {
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono, monospace' : undefined,
    fontSize: 12,
    color: theme.text,
    lineHeight: 16,
  },
  w12: {
    width: 48,
  },
  flexCol: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  wFull: {
    width: '100%',
  },
  modalCloseBtnText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
