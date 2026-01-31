// Site-wide search data index
// This file contains all searchable content from the KIUMA website

const SEARCH_DATA = [
    // Home Page
    {
        title: "Home",
        description: "KIUMA - Kampala International University Muslim Students Association. Your guide to Islamic values, programs, and activities.",
        url: "index.html",
        category: "page",
        keywords: ["home", "kiuma", "kampala", "university", "muslim", "association", "students", "islamic", "welcome"],
        icon: "fa-home"
    },
    
    // About Page
    {
        title: "About KIUMA",
        description: "Learn about Kampala International University Muslim Students Association, our mission, vision, and history.",
        url: "about.html",
        category: "page",
        keywords: ["about", "kiuma", "mission", "vision", "history", "muslim", "students", "association", "organization"],
        icon: "fa-info-circle"
    },
    
    // Values Page
    {
        title: "Our Values",
        description: "Discover the core Islamic values and principles that guide KIUMA members.",
        url: "values.html",
        category: "page",
        keywords: ["values", "principles", "islamic", "faith", "iman", "taqwa", "brotherhood", "sisterhood", "unity"],
        icon: "fa-heart"
    },
    
    // Programs Page
    {
        title: "Programs",
        description: "Explore KIUMA's educational and spiritual programs including Quran study, Islamic lectures, and more.",
        url: "programs.html",
        category: "page",
        keywords: ["programs", "education", "quran", "lectures", "study", "circles", "halaqah", "learning", "courses"],
        icon: "fa-book"
    },
    
    // Activities Page
    {
        title: "Activities",
        description: "Join KIUMA's community activities including charity visits, sports, and social events.",
        url: "activities.html",
        category: "page",
        keywords: ["activities", "events", "charity", "sports", "social", "community", "kizumu", "visit", "dawah"],
        icon: "fa-running"
    },
    
    // Events Page
    {
        title: "Events",
        description: "Stay updated with upcoming KIUMA events, seminars, and gatherings.",
        url: "events.html",
        category: "page",
        keywords: ["events", "calendar", "seminars", "gatherings", "meetings", "upcoming", "schedule"],
        icon: "fa-calendar-alt"
    },
    
    // Leadership Page
    {
        title: "Leadership",
        description: "Meet the KIUMA leadership team and executive committee members.",
        url: "leadership.html",
        category: "page",
        keywords: ["leadership", "executives", "committee", "team", "president", "amir", "secretary", "treasurer"],
        icon: "fa-users"
    },
    
    // Contact Page
    {
        title: "Contact Us",
        description: "Get in touch with KIUMA through various contact channels.",
        url: "contact.html",
        category: "page",
        keywords: ["contact", "phone", "email", "whatsapp", "address", "location", "reach", "message"],
        icon: "fa-phone"
    },
    
    // Library Page
    {
        title: "Library",
        description: "Access KIUMA's digital library with Islamic books, PDFs, and educational resources.",
        url: "library.html",
        category: "page",
        keywords: ["library", "books", "pdf", "ebooks", "resources", "download", "read", "islamic", "quran", "hadith", "fiqh"],
        icon: "fa-book-open"
    },
    
    // Media Page
    {
        title: "Media",
        description: "View KIUMA's photo gallery, videos, and media content.",
        url: "media.html",
        category: "page",
        keywords: ["media", "photos", "videos", "gallery", "images", "pictures", "recordings"],
        icon: "fa-photo-video"
    },
    
    // Ask Question Page
    {
        title: "Ask a Question",
        description: "Submit your Islamic questions to KIUMA scholars and get answers.",
        url: "ask-question.html",
        category: "page",
        keywords: ["ask", "question", "fatwa", "answer", "scholar", "islamic", "ruling", "help", "guidance"],
        icon: "fa-question-circle"
    },
    
    // Join Programs Page
    {
        title: "Join Programs",
        description: "Register for KIUMA programs and educational circles.",
        url: "join-programs.html",
        category: "page",
        keywords: ["join", "register", "signup", "programs", "enroll", "membership", "participate"],
        icon: "fa-user-plus"
    },
    
    // Notifications Page
    {
        title: "Notifications",
        description: "View your KIUMA notifications and announcements.",
        url: "notifications.html",
        category: "page",
        keywords: ["notifications", "alerts", "announcements", "news", "updates", "messages"],
        icon: "fa-bell"
    },
    
    // Pay Page
    {
        title: "Payments",
        description: "Make payments for subscriptions, charity, zakat, and donations to KIUMA.",
        url: "pay.html",
        category: "page",
        keywords: ["pay", "payment", "subscription", "donate", "charity", "zakat", "sadaqah", "money", "contribution", "fees"],
        icon: "fa-credit-card"
    },
    
    // Join Us Page
    {
        title: "Join Us",
        description: "Become a member of KIUMA and join the Muslim community at KIU.",
        url: "join-us.html",
        category: "page",
        keywords: ["join", "membership", "register", "become", "member", "community", "signup"],
        icon: "fa-hand-holding-heart"
    },
    
    // Quran Page
    {
        title: "Quran",
        description: "Read and study the Holy Quran with translations and tafsir.",
        url: "quran.html",
        category: "page",
        keywords: ["quran", "surah", "ayah", "verse", "recitation", "tafsir", "translation", "arabic", "read", "holy"],
        icon: "fa-book-quran"
    },
    
    // Counselling Page
    {
        title: "Counselling",
        description: "Access Islamic counselling services for personal and spiritual guidance.",
        url: "counselling.html",
        category: "page",
        keywords: ["counselling", "guidance", "help", "support", "advice", "spiritual", "personal", "problems"],
        icon: "fa-hands-helping"
    },
    
    // Important Lessons Page
    {
        title: "Important Lessons",
        description: "Essential Islamic lessons including prayer, hadiths, and character building.",
        url: "important-lessons.html",
        category: "page",
        keywords: ["lessons", "prayer", "salah", "hadith", "akhlaq", "character", "learning", "education"],
        icon: "fa-graduation-cap"
    },
    
    // Subscription Form
    {
        title: "Subscription Form",
        description: "Subscribe to KIUMA monthly or semester plans.",
        url: "subscription-form.html",
        category: "page",
        keywords: ["subscription", "subscribe", "monthly", "semester", "plan", "register", "fees"],
        icon: "fa-file-signature"
    },
    
    // Zakat Form
    {
        title: "Zakat Calculation",
        description: "Submit your zakat calculation request to KIUMA.",
        url: "zakat-form.html",
        category: "page",
        keywords: ["zakat", "calculation", "obligatory", "charity", "nisab", "wealth", "purification"],
        icon: "fa-calculator"
    },
    
    // Programs - Specific
    {
        title: "Quran Study Circle",
        description: "Weekly Quran recitation and tajweed study sessions.",
        url: "programs.html#quran-circle",
        category: "program",
        keywords: ["quran", "study", "circle", "tajweed", "recitation", "weekly", "halaqah"],
        icon: "fa-book-quran"
    },
    {
        title: "Islamic Lectures",
        description: "Regular Islamic lectures and talks by scholars.",
        url: "programs.html#lectures",
        category: "program",
        keywords: ["lectures", "talks", "scholars", "islamic", "knowledge", "learning"],
        icon: "fa-chalkboard-teacher"
    },
    {
        title: "Arabic Classes",
        description: "Learn Arabic language for understanding the Quran.",
        url: "programs.html#arabic",
        category: "program",
        keywords: ["arabic", "language", "learn", "classes", "nahw", "sarf", "grammar"],
        icon: "fa-language"
    },
    
    // Activities - Specific
    {
        title: "Kizumu Tahfiz Charity Visit",
        description: "Support Islamic education through charity visits to Kizumu Tahfiz.",
        url: "activities.html#charity-visit",
        category: "activity",
        keywords: ["kizumu", "tahfiz", "charity", "visit", "support", "education", "orphans"],
        icon: "fa-heart"
    },
    {
        title: "Tuition for Brothers",
        description: "Support brothers' education through tuition assistance.",
        url: "pay.html?type=charity&donation=tuition-brothers",
        category: "activity",
        keywords: ["tuition", "brothers", "education", "support", "fees", "scholarship"],
        icon: "fa-graduation-cap"
    },
    {
        title: "Community Sports",
        description: "Join KIUMA sports activities and tournaments.",
        url: "activities.html#sports",
        category: "activity",
        keywords: ["sports", "football", "basketball", "tournament", "fitness", "games"],
        icon: "fa-futbol"
    },
    {
        title: "Dawah Activities",
        description: "Participate in spreading Islamic knowledge and awareness.",
        url: "activities.html#dawah",
        category: "activity",
        keywords: ["dawah", "outreach", "islam", "sharing", "teaching", "awareness"],
        icon: "fa-bullhorn"
    },
    
    // Payment Types
    {
        title: "Monthly Subscription",
        description: "Subscribe to KIUMA monthly membership plan.",
        url: "subscription-form.html?plan=monthly",
        category: "payment",
        keywords: ["monthly", "subscription", "membership", "fees", "payment", "plan"],
        icon: "fa-calendar"
    },
    {
        title: "Semester Subscription",
        description: "Subscribe to KIUMA semester membership plan.",
        url: "subscription-form.html?plan=semester",
        category: "payment",
        keywords: ["semester", "subscription", "membership", "fees", "payment", "plan"],
        icon: "fa-calendar-alt"
    },
    {
        title: "Donate to Charity",
        description: "Make charitable donations to support KIUMA initiatives.",
        url: "pay.html?type=charity",
        category: "payment",
        keywords: ["donate", "charity", "sadaqah", "give", "contribution", "help"],
        icon: "fa-hand-holding-heart"
    },
    {
        title: "Pay Zakat",
        description: "Submit your zakat payments through KIUMA.",
        url: "pay.html?type=zakat",
        category: "payment",
        keywords: ["zakat", "obligatory", "charity", "pillar", "islam", "payment"],
        icon: "fa-donate"
    },
    
    // Islamic Topics
    {
        title: "Learn to Pray (Salah)",
        description: "Complete guide on how to perform the Islamic prayer correctly.",
        url: "important-lessons.html#learn-prayer",
        category: "lesson",
        keywords: ["prayer", "salah", "salat", "how", "learn", "wudu", "ablution", "rakah", "sujud", "ruku"],
        icon: "fa-pray"
    },
    {
        title: "Important Hadiths",
        description: "Collection of essential hadiths every Muslim should know.",
        url: "important-lessons.html#hadiths",
        category: "lesson",
        keywords: ["hadith", "prophet", "muhammad", "sayings", "sunnah", "tradition"],
        icon: "fa-book"
    },
    {
        title: "Islamic Character (Akhlaq)",
        description: "Building good character and manners in Islam.",
        url: "important-lessons.html#akhlaq",
        category: "lesson",
        keywords: ["akhlaq", "character", "manners", "adab", "ethics", "morals", "behavior"],
        icon: "fa-heart"
    },
    {
        title: "Misunderstood Concepts",
        description: "Clarifying common misconceptions about Islam.",
        url: "important-lessons.html#misunderstood",
        category: "lesson",
        keywords: ["misconceptions", "misunderstood", "clarify", "explain", "truth", "islam"],
        icon: "fa-lightbulb"
    },
    {
        title: "Did You Know",
        description: "Interesting Islamic facts and knowledge.",
        url: "important-lessons.html#did-you-know",
        category: "lesson",
        keywords: ["facts", "interesting", "knowledge", "learn", "islam", "discover"],
        icon: "fa-info-circle"
    },
    
    // Leadership Positions
    {
        title: "Amir (President)",
        description: "The leader of KIUMA executive committee.",
        url: "leadership.html#amir",
        category: "leadership",
        keywords: ["amir", "president", "leader", "head", "executive", "chairman"],
        icon: "fa-user-tie"
    },
    {
        title: "Amir Finance",
        description: "KIUMA's financial officer managing funds and payments.",
        url: "leadership.html#finance",
        category: "leadership",
        keywords: ["finance", "treasurer", "money", "funds", "payments", "accounts"],
        icon: "fa-coins"
    },
    
    // Contact Methods
    {
        title: "WhatsApp Contact",
        description: "Contact KIUMA via WhatsApp messenger.",
        url: "contact.html#whatsapp",
        category: "contact",
        keywords: ["whatsapp", "message", "chat", "contact", "reach"],
        icon: "fa-whatsapp"
    },
    {
        title: "Email Contact",
        description: "Send an email to KIUMA.",
        url: "contact.html#email",
        category: "contact",
        keywords: ["email", "mail", "send", "write", "contact"],
        icon: "fa-envelope"
    }
];

// Category colors for styling
const CATEGORY_COLORS = {
    page: "#4CAF50",
    program: "#2196F3",
    activity: "#FF9800",
    payment: "#9C27B0",
    lesson: "#E91E63",
    leadership: "#00BCD4",
    contact: "#607D8B"
};

// Category labels
const CATEGORY_LABELS = {
    page: "Page",
    program: "Program",
    activity: "Activity",
    payment: "Payment",
    lesson: "Lesson",
    leadership: "Leadership",
    contact: "Contact"
};

// Export for use in search.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SEARCH_DATA, CATEGORY_COLORS, CATEGORY_LABELS };
}
