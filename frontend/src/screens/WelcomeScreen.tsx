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

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  headerBar: {
    width: '100%',
    height: 70,
    backgroundColor: 'rgba(240, 242, 245, 0.8)',
    borderBottomWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.3)',
    justifyContent: 'center',
    position: Platform.OS === 'web' ? 'fixed' : 'relative',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.03)',
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
    color: '#6366f1',
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
    color: '#64748b',
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
    color: '#64748b',
  },
  getStartedHeaderBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 8px rgba(99, 102, 241, 0.2)',
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
    paddingTop: Platform.OS === 'web' ? 70 : 0, // offset header
  },
  bgMeshContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 1,
    backgroundColor: '#f0f2f5',
    ...Platform.select({
      web: {
        backgroundImage:
          'radial-gradient(at 0% 0%, hsla(243,100%,95%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(243,100%,98%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(243,100%,95%,1) 0, transparent 50%)',
      },
    }),
  },
  meshGlow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.12,
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowRadius: 150,
        shadowOpacity: 0.8,
      },
      android: {
        // Fallback color overlays on Android
      },
    }),
  },
  glowLeft: {
    top: 0,
    left: -100,
    width: 350,
    height: 350,
    backgroundColor: '#e0e7ff',
  },
  glowRight: {
    top: 100,
    right: -100,
    width: 300,
    height: 300,
    backgroundColor: '#f0f2f5',
  },
  glowCenter: {
    top: -50,
    alignSelf: 'center',
    width: 400,
    height: 400,
    backgroundColor: '#e0e7ff',
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    ...Platform.select({
      web: {
        boxShadow: 'inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff',
      },
    }),
  },
  trustBadgeIcon: {
    marginRight: 4,
  },
  trustBadgeText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '800',
  },
  heroTitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: Platform.OS === 'web' ? 56 : 38,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
  },
  heroSubText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 640,
    marginBottom: 36,
  },
  heroButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 56,
    width: '100%',
    justifyContent: 'center',
  },
  heroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 16,
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 10px rgba(99, 102, 241, 0.3), -4px -4px 10px rgba(255,255,255,0.8)',
      },
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
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
    marginLeft: 6,
  },
  heroSecondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff',
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
  heroSecondaryBtnText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '800',
  },
  flexCol: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  wFull: {
    width: '100%',
  },
  chatMockupCard: {
    width: '100%',
    maxWidth: 960,
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '8px 8px 24px #d1d9e6, -8px -8px 24px #ffffff',
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
  chatWindowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(237, 240, 244, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
  },
  circleButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  circleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotRed: {
    backgroundColor: '#ef4444',
    opacity: 0.6,
  },
  dotYellow: {
    backgroundColor: '#eab308',
    opacity: 0.6,
  },
  dotGreen: {
    backgroundColor: '#22c55e',
    opacity: 0.6,
  },
  urlBar: {
    backgroundColor: '#f0f2f5',
    borderRadius: 99,
    paddingHorizontal: 24,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #ffffff',
      },
    }),
  },
  urlText: {
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono, monospace' : undefined,
    fontSize: 11,
    color: '#64748b',
    opacity: 0.8,
  },
  w12: {
    width: 48,
  },
  chatWindowContent: {
    flexDirection: 'row',
    height: 480,
  },
  chatSidebar: {
    width: 180,
    borderRightWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
    padding: 16,
    backgroundColor: 'rgba(240, 242, 245, 0.3)',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...Platform.select({
      web: {
        boxShadow: '2px 2px 5px #d1d9e6, -2px -2px 5px #ffffff',
      },
    }),
  },
  sidebarLineShort: {
    height: 8,
    backgroundColor: '#6366f1',
    borderRadius: 4,
    width: 45,
    opacity: 0.8,
  },
  sidebarLineLong: {
    height: 8,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    width: 75,
    opacity: 0.6,
  },
  sidebarLineMedium: {
    height: 8,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    width: 60,
    opacity: 0.6,
  },
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: 16,
  },
  sidebarProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sidebarProgressFill: {
    height: '100%',
    width: '40%',
    backgroundColor: '#6366f1',
  },
  chatMainPane: {
    flex: 1,
    flexDirection: 'column',
    padding: 16,
  },
  chatMessagesScroll: {
    flex: 1,
  },
  chatMessagesContainer: {
    paddingBottom: 16,
  },
  chatBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.7,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderBottomRightRadius: 2,
  },
  bubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f2f5',
    borderBottomLeftRadius: 2,
  },
  aiBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiMiniIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...Platform.select({
      web: {
        boxShadow: '1px 1px 3px #d1d9e6',
      },
    }),
  },
  aiLabelText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 11,
    fontWeight: '700',
    color: '#6366f1',
  },
  chatBubbleText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    lineHeight: 18,
  },
  textOnPrimary: {
    color: '#3730a3',
    fontWeight: '500',
  },
  textOnSurface: {
    color: '#1e293b',
  },
  citationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  citationTag: {
    backgroundColor: '#f0f2f5',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #ffffff',
      },
    }),
  },
  citationTagActive: {
    borderColor: '#6366f1',
    backgroundColor: '#e0e7ff',
  },
  citationText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#6366f1',
    fontSize: 10,
    fontWeight: '800',
  },
  typingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f2f5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typingText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff',
      },
    }),
  },
  chatTextInput: {
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    color: '#1e293b',
    height: '100%',
    paddingRight: 8,
    ...Platform.select({
      web: {
        outlineWidth: 0,
      },
    }),
  },
  chatSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...Platform.select({
      web: {
        boxShadow: '2px 2px 5px #d1d9e6, -2px -2px 5px #ffffff',
      },
    }),
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  suggestionBadge: {
    backgroundColor: '#f0f2f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...Platform.select({
      web: {
        boxShadow: '2px 2px 5px #d1d9e6, -2px -2px 5px #ffffff',
      },
    }),
  },
  suggestionBadgeText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '700',
  },
  citationTooltip: {
    position: 'absolute',
    bottom: 74,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    zIndex: 90,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
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
    color: '#6366f1',
  },
  tooltipBody: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 11,
    color: '#4b5563',
    lineHeight: 15,
  },
  bentoSection: {
    paddingVertical: 72,
    paddingHorizontal: 24,
    backgroundColor: '#f0f2f5',
    zIndex: 10,
    alignItems: 'center',
  },
  sectionHeaderTitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionHeaderSubText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 48,
    textAlign: 'center',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    maxWidth: 1000,
    justifyContent: 'center',
    width: '100%',
  },
  bentoCard: {
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    ...Platform.select({
      web: {
        boxShadow: '6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff',
      },
      ios: {
        shadowColor: '#d1d9e6',
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  bentoCardDouble: {
    width: Platform.OS === 'web' ? 'calc(66% - 12px)' : '100%',
    flexDirection: 'row',
    gap: 20,
    minHeight: 220,
  },
  bentoCardSingle: {
    width: Platform.OS === 'web' ? 'calc(33% - 12px)' : '100%',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    minHeight: 220,
  },
  bentoCardTextSide: {
    flex: 1,
  },
  bentoCardGraphicSide: {
    width: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #ffffff',
      },
    }),
  },
  bentoCardTitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  bentoCardText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 18,
  },
  silkInsetContainer: {
    backgroundColor: '#f0f2f5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #ffffff',
      },
    }),
  },
  latencyText: {
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono, monospace' : undefined,
    fontSize: 12,
    fontWeight: '800',
    color: '#6366f1',
  },
  bentoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 'auto',
    paddingTop: 12,
  },
  bentoActionBtnText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#6366f1',
    fontWeight: '800',
    fontSize: 13,
  },
  bentoHistoryMock: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 10,
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #ffffff',
      },
    }),
  },
  historyMockIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    ...Platform.select({
      web: {
        boxShadow: '2px 2px 4px #d1d9e6',
      },
    }),
  },
  historyMockTextGroup: {
    flex: 1,
    gap: 4,
  },
  historyMockLineTop: {
    height: 6,
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
    width: 60,
    opacity: 0.6,
  },
  historyMockLineBottom: {
    height: 6,
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
    width: 100,
    opacity: 0.4,
  },
  bentoCtaCard: {
    backgroundColor: '#6366f1',
    borderColor: 'transparent',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '6px 6px 12px rgba(99,102,241,0.2), -6px -6px 12px rgba(255,255,255,0.8)',
      },
    }),
  },
  bentoCtaContent: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 10,
  },
  bentoCtaTitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  bentoCtaText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 16,
    lineHeight: 18,
  },
  bentoCtaButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...Platform.select({
      web: {
        boxShadow: '2px 4px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  bentoCtaButtonText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '800',
  },
  bentoCtaGraphic: {
    position: 'absolute',
    right: -20,
    bottom: -30,
    opacity: 0.2,
  },
  ctaShieldIcon: {
    // Styling handled in component directly
  },
  proofSection: {
    paddingVertical: 56,
    backgroundColor: 'rgba(237, 240, 244, 0.4)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.3)',
    zIndex: 10,
  },
  proofGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
    gap: 32,
  },
  proofStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  proofStatNumber: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 40,
    fontWeight: '800',
    color: '#6366f1',
    marginBottom: 4,
  },
  proofStatLabel: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  proofDividerBorder: {
    borderTopWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
    paddingTop: 16,
    width: '80%',
  },
  footerSection: {
    backgroundColor: '#f0f2f5',
    paddingVertical: 56,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
    zIndex: 10,
  },
  footerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
    gap: 48,
  },
  footerInfoCol: {
    flex: 1,
    maxWidth: 320,
  },
  footerBrandText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 18,
    fontWeight: '800',
    color: '#6366f1',
    marginBottom: 12,
  },
  footerDescriptionText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 20,
  },
  footerCopyrightText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  footerLinksGrid: {
    flexDirection: 'row',
    gap: 56,
  },
  footerLinkCol: {
    flexDirection: 'column',
    gap: 8,
  },
  footerLinkHeader: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  footerLinkItem: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      },
    }),
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#f0f2f5',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...Platform.select({
      web: {
        boxShadow: '10px 10px 25px rgba(0,0,0,0.1)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  analyzerCard: {
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalForm: {
    gap: 16,
  },
  modalSub: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    color: '#64748b',
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
    color: '#64748b',
    paddingLeft: 4,
  },
  modalTextInput: {
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    height: 48,
    paddingHorizontal: 16,
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 14,
    color: '#1e293b',
    ...Platform.select({
      web: {
        boxShadow: 'inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #ffffff',
        outlineWidth: 0,
      },
    }),
  },
  modalSubmitBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 8px rgba(99, 102, 241, 0.3)',
      },
    }),
  },
  modalSubmitBtnDisabled: {
    backgroundColor: '#cbd5e1',
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
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalSuccessTitle: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
    marginTop: 8,
  },
  modalSuccessSub: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  modalCloseBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  modalCloseBtnText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  caseTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  caseTypeSelectorBtn: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 10,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '2px 2px 4px #d1d9e6, -2px -2px 4px #ffffff',
      },
    }),
  },
  caseTypeSelectorBtnActive: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  caseTypeSelectorText: {
    fontFamily: Platform.OS === 'web' ? 'Plus Jakarta Sans, sans-serif' : undefined,
    fontSize: 11,
    color: '#64748b',
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
    backgroundColor: 'rgba(226, 232, 240, 0.8)',
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
    backgroundColor: '#d1fae5',
    borderColor: '#a7f3d0',
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
    color: '#065f46',
  },
  resultTextScroll: {
    width: '100%',
    maxHeight: 180,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  resultText: {
    fontFamily: Platform.OS === 'web' ? 'JetBrains Mono, monospace' : undefined,
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
});
