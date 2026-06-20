import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

export type Language = 'en' | 'ar';

export const translations = {
  en: {
    // Common
    lexisai: 'LexisAI',
    support: 'Support',
    privacy: 'Privacy',
    terms: 'Terms',
    security: 'Security',
    legal: 'Legal',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    verifying: 'Verifying...',
    loading: 'Loading...',
    close: 'Close',
    initializing: 'Initializing system...',
    
    // Welcome Screen
    trusted_firms: 'Trusted by 500+ Law Firms',
    hero_title: 'AI Legal Assistant',
    hero_desc: 'Get instant, reliable legal answers powered by AI. Navigate complex litigation, research case law, and draft documents with institutional precision.',
    get_started: 'Get Started',
    schedule_demo: 'Schedule Demo',
    features: 'Features',
    pricing: 'Pricing',
    about: 'About',
    log_in: 'Log In',
    lexisai_expert: 'LexisAI Expert',
    is_thinking: 'LexisAI is thinking...',
    ask_follow_up: 'Ask a follow-up question...',
    engineered_accuracy: 'Engineered for Accuracy',
    accuracy_sub: "The legal industry doesn't tolerate \"hallucinations\". We don't either.",
    fast_answers: 'Fast Answers',
    fast_answers_desc: 'Query thousands of statutes and case files in milliseconds. Our semantic search understands legal context, not just keywords.',
    latency_demo: 'Latency: 42ms',
    case_guidance: 'Case Guidance',
    case_guidance_desc: 'Upload your case briefs and get instant strategic analysis based on current jurisdiction trends.',
    analyze_case: 'Analyze Case',
    chat_history: 'Chat History',
    chat_history_desc: 'Secure, searchable archives of every interaction. Indexed by client and matter ID for easy billing reconciliation.',
    ready_elevate: 'Ready to elevate your practice?',
    ready_elevate_desc: 'Join the leading firms using LexisAI to deliver results faster than ever.',
    start_trial: 'Start Free Trial',
    citation_accuracy: 'Citation Accuracy',
    avg_saved: 'Avg. Saved per Case',
    active_attorneys: 'Active Attorneys',
    aes_encryption: 'AES Encryption',
    inst_grade_desc: 'Institutional-grade legal intelligence for the modern practitioner. Reliable. Secure. Fast.',
    copyright: '© 2024 LexisAI Technologies. Licensed Legal Intelligence.',
    product: 'Product',
    terms_service: 'Terms of Service',
    privacy_policy: 'Privacy Policy',
    contact_support: 'Contact Support',
    schedule_demo_title: 'Schedule LexisAI Demo',
    experience_custom: "Experience custom institutional research tailored to your firm's domain.",
    full_name: 'Full Name',
    work_email: 'Work Email',
    firm_company: 'Law Firm / Company',
    request_invites: 'Request Invites',
    securing_slots: 'Securing demo slots...',
    demo_submitted: 'Demo Request Submitted!',
    thank_demo: 'Thank you! An invitation slot outline and case scheduling link has been emailed to ',
    close_window: 'Close Window',
    case_analyzer_title: 'Jurisdiction Case Analyzer',
    test_drive_engine: 'Test-drive our case evaluation engine. Choose a litigation sector and trigger the simulation.',
    select_case_area: 'Select Case Area',
    init_verification: 'Initialize Verification',
    uploading_metadata: 'Uploading briefing metadata...',
    evaluating_rulings: 'Evaluating local appellate rulings and citations...',
    simulation_complete: 'Simulation Complete',
    done: 'Done',
    
    // Login Screen
    login_subtitle: 'Sign in to your legal intelligence dashboard',
    email_required: 'Email Address is required',
    valid_email_required: 'Please enter a valid email address',
    password_required: 'Password is required',
    forgot_password: 'Forgot password?',
    or_continue_with: 'Or continue with',
    dont_have_account: "Don't have an account?",
    create_account: 'Create account',
    system_copyright: '© 2024 LexisAI Technologies',
    
    // Sign Up Screen
    join_thousands: 'Join thousands of legal professionals using AI-powered intelligence.',
    confirm_password: 'Confirm Password',
    name_required: 'Full Name is required',
    pass_length_required: 'Password must be at least 8 characters',
    pass_symbol_required: 'Password must contain at least one symbol',
    confirm_pass_required: 'Please confirm your password',
    pass_match_required: 'Passwords do not match',
    min_pass_req_sub: 'Min. 8 characters with at least one symbol.',
    signup_google: 'Sign up with Google',
    already_have_account: 'Already have an account?',
    soc2_compliant: 'SOC2 COMPLIANT',
    aes_256_enc: 'AES-256 ENCRYPTION',
    agreement_text_start: 'By clicking "Create account", you agree to our ',
    agreement_text_and: ' and ',
    
    // Dashboard Screen
    how_can_help: 'How can I help you today?',
    jurisdiction: 'Jurisdiction',
    language: 'Language',
    new_consultation: 'New Consultation',
    recent_history: 'Recent History',
    no_recent_chats: 'No recent chats',
    help_center: 'Help Center',
    settings: 'Settings',
    sign_out: 'Sign Out',
    share: 'Share',
    link_copied: 'Link copied to clipboard!',
    session_error: 'Session Error',
    session_error_desc: 'Could not create a new chat session on the server.',
    message_placeholder: 'Message LexisAI...',
    accuracy_notice: 'LexisAI can make mistakes. Verify critical facts.',
    model_tag: 'Silk GPT-4 Legal',
    assistant_settings: 'Assistant Settings',
    theme_preference: 'Theme Preference',
    system_default: 'System Default',
    light_mode: 'Light Mode',
    dark_mode: 'Dark Mode',
    select_language: 'Select Language',
    select_country: 'Select Country',
    save_settings: 'Save Settings',
    settings_saved: 'Settings saved successfully!',
    empty_session: 'This session is empty. Select a jurisdiction and language to start a new consultation.',
    hello_counselor: 'Hello Counselor. I am ready to assist with your legal inquiries. Select a jurisdiction and language to start a new consultation.',
    suggested_starts_header: 'Suggested starting points:',
    suggested_start_1: 'Review a standard SaaS agreement for liability gaps',
    suggested_start_2: 'Compare New York vs. Delaware corporate governance laws',
    suggested_start_3: 'Summarize recent precedents regarding remote work privacy',
    statute_limit_suggested_query: 'What is the statute of limitations for negligence in CA?',
    subcontractor_suggested_query: 'Can subcontractor limit active negligence liability?',
    statute_limit_suggested_title: '⏱ Statutes Limit',
    subcontractor_suggested_title: '🏗 Subcontractors',
    
    // New Keys for Login/SignUp/Dashboard
    email_address: 'Email Address',
    password: 'Password',
    google: 'Google',
    github: 'GitHub',
    or: 'OR',
    login_failed: 'Login failed. Please verify your credentials.',
    unexpected_error: 'An unexpected error occurred. Please try again.',
    work_email_required: 'Work Email is required',
    account_created_success: 'Account created successfully! Redirecting...',
    registration_failed: 'Registration failed. Please try again.',
    creating_account: 'Creating account...',
    accuracy_pct: '98% Accuracy',
    auto: 'Auto',
    usa: 'USA',
    uk: 'UK',
    saudi_arabia: 'Saudi Arabia',
    germany: 'Germany',
    france: 'France',
    english: 'English',
    arabic: 'Arabic',
    spanish: 'Spanish',
    french: 'French',
    german: 'German',
  },
  ar: {
    // Common
    lexisai: 'ليكسيس ذكاء اصطناعي',
    support: 'الدعم',
    privacy: 'الخصوصية',
    terms: 'الشروط',
    security: 'الأمان',
    legal: 'قانوني',
    success: 'تم بنجاح',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    verifying: 'جاري التحقق...',
    loading: 'جاري التحميل...',
    close: 'إغلاق',
    initializing: 'جاري تهيئة النظام...',

    // Welcome Screen
    trusted_firms: 'موثوق من قبل أكثر من ٥٠٠ مكتب محاماة',
    hero_title: 'المساعد القانوني الذكي',
    hero_desc: 'احصل على إجابات قانونية فورية وموثوقة مدعومة بالذكاء الاصطناعي. تصفح الدعاوى القضائية المعقدة، وابحث في السوابق القضائية، وقم بصياغة المستندات بدقة مؤسسية.',
    get_started: 'ابدأ الآن',
    schedule_demo: 'جدولة عرض تجريبي',
    features: 'الميزات',
    pricing: 'الأسعار',
    about: 'حول التطبيق',
    log_in: 'تسجيل الدخول',
    lexisai_expert: 'خبير ليكسيس',
    is_thinking: 'ليكسيس يفكر...',
    ask_follow_up: 'اسأل سؤالاً استكمالياً...',
    engineered_accuracy: 'مصمم من أجل الدقة',
    accuracy_sub: 'قطاع المحاماة لا يتسامح مع "الهلوسة". ونحن كذلك لا نتسامح معها.',
    fast_answers: 'إجابات سريعة',
    fast_answers_desc: 'ابحث في آلاف القوانين وملفات القضايا في أجزاء من الثانية. يفهم بحثنا الدلالي السياق القانوني، وليس فقط الكلمات المفتاحية.',
    latency_demo: 'زمن الاستجابة: ٤٢ مللي ثانية',
    case_guidance: 'التوجيه في القضايا',
    case_guidance_desc: 'ارفع ملخصات قضاياك واحصل على تحليل استراتيجي فوري بناءً على اتجاهات الولاية القضائية الحالية.',
    analyze_case: 'تحليل القضية',
    chat_history: 'سجل المحادثات',
    chat_history_desc: 'أرشيف آمن وقابل للبحث لكل تفاعل. مفهرس بحسب العميل ومعرف القضية لتسوية الفواتير بسهولة.',
    ready_elevate: 'هل أنت مستعد للارتقاء بممارستك المهنية؟',
    ready_elevate_desc: 'انضم إلى الشركات الرائدة التي تستخدم ليكسيس لتقديم النتائج بشكل أسرع من أي وقت مضى.',
    start_trial: 'ابدأ التجربة المجانية',
    citation_accuracy: 'دقة الاستشهادات',
    avg_saved: 'متوسط الساعات الموفرة لكل قضية',
    active_attorneys: 'المحامون النشطون',
    aes_encryption: 'تشفير AES',
    inst_grade_desc: 'ذكاء قانوني بمستوى مؤسسي للممارس الحديث. موثوق. آمن. سريع.',
    copyright: '© ٢٠٢٤ تقنيات ليكسيس. ذكاء قانوني مرخص.',
    product: 'المنتج',
    terms_service: 'شروط الخدمة',
    privacy_policy: 'سياسة الخصوصية',
    contact_support: 'الاتصال بالدعم',
    schedule_demo_title: 'جدولة عرض تجريبي ليكسيس',
    experience_custom: 'اختبر بحثًا مؤسسيًا مخصصًا ومناسبًا لمجال عمل شركتك.',
    full_name: 'الاسم الكامل',
    work_email: 'البريد الإلكتروني للعمل',
    firm_company: 'مكتب المحاماة / الشركة',
    request_invites: 'طلب دعوة',
    securing_slots: 'جاري حجز مقاعد العرض التجريبي...',
    demo_submitted: 'تم تقديم طلب العرض التجريبي!',
    thank_demo: 'شكراً لك! تم إرسال تفاصيل الدعوة ورابط جدولة الموعد إلى البريد الإلكتروني ',
    close_window: 'إغلاق النافذة',
    case_analyzer_title: 'محلل القضايا بحسب الولاية القضائية',
    test_drive_engine: 'اختبر محرك تقييم القضايا الخاص بنا. اختر قطاع التقاضي وابدأ المحاكاة.',
    select_case_area: 'اختر مجال القضية',
    init_verification: 'ابدأ التحقق',
    uploading_metadata: 'جاري رفع البيانات الوصفية للملخص...',
    evaluating_rulings: 'جاري تقييم أحكام الاستئناف والاستشهادات المحلية...',
    simulation_complete: 'اكتملت المحاكاة',
    done: 'تم',

    // Login Screen
    login_subtitle: 'سجل الدخول إلى لوحة التحكم للذكاء القانوني الخاصة بك',
    email_required: 'البريد الإلكتروني مطلوب',
    valid_email_required: 'يرجى إدخال بريد إلكتروني صالح',
    password_required: 'كلمة المرور مطلوبة',
    forgot_password: 'هل نسيت كلمة المرور؟',
    or_continue_with: 'أو تابع باستخدام',
    dont_have_account: 'ليس لديك حساب؟',
    create_account: 'إنشاء حساب',
    system_copyright: '© ٢٠٢٤ تقنيات ليكسيس',

    // Sign Up Screen
    join_thousands: 'انضم إلى الآلاف من المهنيين القانونيين الذين يستخدمون الذكاء الاصطناعي.',
    confirm_password: 'تأكيد كلمة المرور',
    name_required: 'الاسم الكامل مطلوب',
    pass_length_required: 'يجب أن تتكون كلمة المرور من ٨ أحرف على الأقل',
    pass_symbol_required: 'يجب أن تحتوي كلمة المرور على رمز واحد على الأقل',
    confirm_pass_required: 'يرجى تأكيد كلمة المرور الخاصة بك',
    pass_match_required: 'كلمات المرور غير متطابقة',
    min_pass_req_sub: '٨ أحرف كحد أدنى مع رمز واحد على الأقل.',
    signup_google: 'التسجيل باستخدام جوجل',
    already_have_account: 'هل لديك حساب بالفعل؟',
    soc2_compliant: 'متوافق مع معايير SOC2',
    aes_256_enc: 'تشفير AES-256',
    agreement_text_start: 'بالنقر فوق "إنشاء حساب"، فإنك توافق على ',
    agreement_text_and: ' و ',

    // Dashboard Screen
    how_can_help: 'كيف يمكنني مساعدتك اليوم؟',
    jurisdiction: 'الولاية القضائية',
    language: 'اللغة',
    new_consultation: 'استشارة جديدة',
    recent_history: 'السجل الحديث',
    no_recent_chats: 'لا توجد محادثات حديثة',
    help_center: 'مركز المساعدة',
    settings: 'الإعدادات',
    sign_out: 'تسجيل الخروج',
    share: 'مشاركة',
    link_copied: 'تم نسخ الرابط إلى الحافظة!',
    session_error: 'خطأ في الجلسة',
    session_error_desc: 'تعذر إنشاء جلسة محادثة جديدة على الخادم.',
    message_placeholder: 'أرسل رسالة إلى ليكسيس...',
    accuracy_notice: 'يمكن أن يرتكب ليكسيس بعض الأخطاء. تحقق من الحقائق المهمة.',
    model_tag: 'نموذج الحرير القانوني GPT-4',
    assistant_settings: 'إعدادات المساعد',
    theme_preference: 'تفضيلات المظهر',
    system_default: 'افتراضي النظام',
    light_mode: 'الوضع المضيء',
    dark_mode: 'الوضع المظلم',
    select_language: 'اختر اللغة',
    select_country: 'اختر الدولة',
    save_settings: 'حفظ الإعدادات',
    settings_saved: 'تم حفظ الإعدادات بنجاح!',
    empty_session: 'هذه الجلسة فارغة. حدد ولاية قضائية ولغة لبدء استشارة جديدة.',
    hello_counselor: 'مرحباً بك أيها المستشار. أنا مستعد لمساعدتك في استفساراتك القانونية. حدد ولاية قضائية ولغة لبدء استشارة جديدة.',
    suggested_starts_header: 'نقاط البدء المقترحة:',
    suggested_start_1: 'مراجعة اتفاقية SaaS القياسية للبحث عن ثغرات المسؤولية',
    suggested_start_2: 'مقارنة قوانين حوكمة الشركات في نيويورك مقابل ديلاوير',
    suggested_start_3: 'تلخيص السوابق الأخيرة المتعلقة بخصوصية العمل عن بعد',
    statute_limit_suggested_query: 'ما هي فترة تقادم الإهمال في كاليفورنيا؟',
    subcontractor_suggested_query: 'هل يمكن للمقاول الفرعي تحديد مسؤوليته عن الإهمال النشط؟',
    statute_limit_suggested_title: '⏱ تقادم القوانين',
    subcontractor_suggested_title: '🏗 المقاولون الفرعيون',
    
    // New Keys for Login/SignUp/Dashboard
    email_address: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    google: 'جوجل',
    github: 'غيت هاب',
    or: 'أو',
    login_failed: 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.',
    unexpected_error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    work_email_required: 'البريد الإلكتروني للعمل مطلوب',
    account_created_success: 'تم إنشاء الحساب بنجاح! جاري إعادة التوجيه...',
    registration_failed: 'فشل التسجيل. يرجى المحاولة مرة أخرى.',
    creating_account: 'جاري إنشاء الحساب...',
    accuracy_pct: 'دقة ٩٨٪',
    auto: 'تلقائي',
    usa: 'الولايات المتحدة',
    uk: 'المملكة المتحدة',
    saudi_arabia: 'المملكة العربية السعودية',
    germany: 'ألمانيا',
    france: 'فرنسا',
    english: 'الإنجليزية',
    arabic: 'العربية',
    spanish: 'الإسبانية',
    french: 'الفرنسية',
    german: 'الألمانية',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'app_language';

const getStoredLanguage = (): Language => {
  if (Platform.OS === 'web') {
    try {
      const stored = localStorage.getItem(LANGUAGE_KEY);
      if (stored === 'en' || stored === 'ar') {
        return stored;
      }
    } catch {
      return 'en';
    }
  }
  return 'en';
};

const setStoredLanguage = (lang: Language) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(LANGUAGE_KEY, lang);
    } catch (e) {
      console.error('Error saving language preference', e);
    }
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    setLanguageState(getStoredLanguage());
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setStoredLanguage(lang);
  };

  const isRtl = language === 'ar';

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
      } catch (e) {
        console.error('Failed to set HTML document direction', e);
      }
    }
  }, [language, isRtl]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let translation: any = translations[language];
    for (const k of keys) {
      if (translation && translation[k] !== undefined) {
        translation = translation[k];
      } else {
        // Fallback to English
        let fallback: any = translations['en'];
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) {
            fallback = fallback[fk];
          } else {
            return key; // return key if not found
          }
        }
        return fallback;
      }
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
