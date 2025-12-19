/**
 * Extended Knowledge Sources - Additional comprehensive knowledge library
 * Expands the base knowledge sources with many more real-world books and frameworks
 */

class KnowledgeSourcesExtended {
    constructor() {
        this.extendedSources = [];
        this.initializeExtendedSources();
    }

    initializeExtendedSources() {
        // Add many more strategy sources
        this.addExtendedStrategySources();
        
        // Add more medicine sources
        this.addExtendedMedicineSources();
        
        // Add more economics sources
        this.addExtendedEconomicsSources();
        
        // Add more finance sources
        this.addExtendedFinanceSources();
        
        // Add more social/psychology sources
        this.addExtendedSocialPsychologySources();
        
        // Add more leadership sources
        this.addExtendedLeadershipSources();
        
        // Add more systems/learning sources
        this.addExtendedSystemsLearningSources();
        
        // Add new domains
        this.addProductivitySources();
        this.addNegotiationSources();
        this.addCommunicationSources();
        this.addDecisionMakingSources();
    }

    addExtendedStrategySources() {
        // The Lean Startup
        this.extendedSources.push({
            id: 'lean-startup',
            title: 'The Lean Startup',
            author: 'Eric Ries',
            domain: 'strategy',
            keywords: ['startup', 'innovation', 'MVP', 'pivot', 'build-measure-learn'],
            principles: [
                { name: 'Build-Measure-Learn loop', description: 'Rapid iteration and learning' },
                { name: 'Minimum Viable Product (MVP)', description: 'Build the smallest version that provides value' },
                { name: 'Validated learning', description: 'Learn from real customer feedback' },
                { name: 'Pivot or persevere', description: 'Know when to change direction' }
            ],
            frameworks: [
                {
                    name: 'Build-Measure-Learn',
                    description: 'Core startup methodology',
                    steps: ['Build: Create MVP', 'Measure: Collect data', 'Learn: Analyze and decide', 'Iterate: Pivot or persevere']
                }
            ],
            exercises: [
                'REAL-WORLD ACTION: Apply Build-Measure-Learn to ONE real project. Document: (1) Your MVP, (2) What you\'ll measure, (3) How you\'ll learn, (4) Execute one cycle, (5) Report results and next steps.',
                'REAL-WORLD ACTION: Create ONE MVP for a real idea. Document: (1) The idea, (2) Your MVP definition, (3) How you built it, (4) What you measured, (5) What you learned and your decision (pivot or persevere).'
            ]
        });

        // Crossing the Chasm
        this.extendedSources.push({
            id: 'crossing-chasm',
            title: 'Crossing the Chasm',
            author: 'Geoffrey Moore',
            domain: 'strategy',
            keywords: ['innovation', 'adoption', 'market', 'technology', 'chasm'],
            principles: [
                { name: 'Technology adoption lifecycle', description: 'Understand different customer segments' },
                { name: 'Cross the chasm', description: 'Move from early adopters to early majority' },
                { name: 'Whole product concept', description: 'Deliver complete solution, not just product' }
            ],
            exercises: [
                'REAL-WORLD ACTION: Analyze ONE product/service using the adoption lifecycle. Document: (1) The product, (2) Current adoption stage, (3) The chasm challenge, (4) Strategy to cross it, (5) One action you\'ll take.',
                'REAL-WORLD ACTION: Apply whole product concept to ONE real offering. Document: (1) Your core product, (2) What makes it whole, (3) Gaps to fill, (4) How you\'ll address them, (5) Execute and measure impact.'
            ]
        });

        // The Innovator\'s Dilemma
        this.extendedSources.push({
            id: 'innovators-dilemma',
            title: 'The Innovator\'s Dilemma',
            author: 'Clayton Christensen',
            domain: 'strategy',
            keywords: ['innovation', 'disruption', 'technology', 'business model'],
            principles: [
                { name: 'Disruptive innovation', description: 'New technologies that disrupt established markets' },
                { name: 'Sustaining vs disruptive', description: 'Understand different types of innovation' },
                { name: 'Resource allocation', description: 'How companies allocate resources affects innovation' }
            ],
            exercises: [
                'REAL-WORLD ACTION: Identify ONE disruptive innovation in your industry. Document: (1) The innovation, (2) How it disrupts, (3) Your position, (4) Your response strategy, (5) One action you\'ll take.',
                'REAL-WORLD ACTION: Analyze ONE company\'s resource allocation for innovation. Document: (1) The company, (2) How resources are allocated, (3) Impact on innovation, (4) One insight you gained, (5) How you\'ll apply this.'
            ]
        });

        // Good to Great
        this.extendedSources.push({
            id: 'good-to-great',
            title: 'Good to Great',
            author: 'Jim Collins',
            domain: 'strategy',
            keywords: ['excellence', 'leadership', 'strategy', 'discipline', 'flywheel'],
            principles: [
                { name: 'Level 5 Leadership', description: 'Humility + will = exceptional results' },
                { name: 'First who, then what', description: 'Get the right people first' },
                { name: 'Hedgehog concept', description: 'Focus on what you can be best at' },
                { name: 'Flywheel effect', description: 'Build momentum through consistent action' }
            ],
            exercises: [
                'REAL-WORLD ACTION: Apply hedgehog concept to ONE real situation. Document: (1) What you\'re passionate about, (2) What you can be best at, (3) What drives your economic engine, (4) Your hedgehog concept, (5) One action aligned with it.',
                'REAL-WORLD ACTION: Build ONE flywheel in your work/life. Document: (1) The flywheel components, (2) How they connect, (3) Your first push, (4) Track momentum, (5) Report results after one week.'
            ]
        });

        // The 7 Habits of Highly Effective People
        this.extendedSources.push({
            id: '7-habits',
            title: 'The 7 Habits of Highly Effective People',
            author: 'Stephen Covey',
            domain: 'strategy',
            keywords: ['effectiveness', 'habits', 'principles', 'leadership', 'personal development'],
            principles: [
                { name: 'Be proactive', description: 'Take responsibility for your actions' },
                { name: 'Begin with the end in mind', description: 'Have a clear vision' },
                { name: 'Put first things first', description: 'Prioritize important over urgent' },
                { name: 'Think win-win', description: 'Seek mutual benefit' },
                { name: 'Seek first to understand', description: 'Listen before speaking' },
                { name: 'Synergize', description: 'Work together for better results' },
                { name: 'Sharpen the saw', description: 'Continuous improvement' }
            ],
            frameworks: [
                {
                    name: 'Time Management Matrix',
                    description: 'Quadrant system for prioritizing',
                    steps: ['Quadrant I: Urgent & Important', 'Quadrant II: Not Urgent & Important (FOCUS HERE)', 'Quadrant III: Urgent & Not Important', 'Quadrant IV: Not Urgent & Not Important']
                }
            ],
            exercises: [
                'REAL-WORLD ACTION: Apply ONE of the 7 habits to a real situation this week. Document: (1) The habit, (2) The situation, (3) How you applied it, (4) The outcome, (5) What you learned.',
                'REAL-WORLD ACTION: Use the Time Management Matrix for ONE day. Document: (1) Your activities, (2) Which quadrant each belongs to, (3) How you shifted to Quadrant II, (4) The impact, (5) Your reflection.'
            ]
        });

        // Additional strategy sources (5 more)
        const strategyBooks = [
            { title: 'The Hard Thing About Hard Things', author: 'Ben Horowitz', focus: 'Entrepreneurship challenges' },
            { title: 'Zero to One', author: 'Peter Thiel', focus: 'Creating new markets' },
            { title: 'Hooked', author: 'Nir Eyal', focus: 'Building habit-forming products' },
            { title: 'The Lean Enterprise', author: 'Jez Humble', focus: 'Enterprise agility' },
            { title: 'Platform Revolution', author: 'Geoffrey Parker', focus: 'Platform business models' }
        ];

        strategyBooks.forEach((book, i) => {
            this.extendedSources.push({
                id: `strategy-extended-${i}`,
                title: book.title,
                author: book.author,
                domain: 'strategy',
                keywords: ['strategy', book.focus.toLowerCase()],
                principles: [
                    { name: `${book.focus} principle`, description: `Core principle from ${book.title}` }
                ],
                exercises: [
                    `REAL-WORLD ACTION: Apply ${book.focus} to ONE real situation. Document: (1) The situation, (2) How the principle applies, (3) Your action, (4) Execute it, (5) Report results.`
                ]
            });
        });
    }

    addExtendedMedicineSources() {
        // Additional medical sources
        const medicalBooks = [
            { title: 'First Aid for the USMLE Step 1', author: 'Tao Le', focus: 'Medical exam preparation' },
            { title: 'Step-Up to Medicine', author: 'Steven Agabegi', focus: 'Clinical medicine' },
            { title: 'Rapid Interpretation of EKGs', author: 'Dale Dubin', focus: 'EKG interpretation' },
            { title: 'The House of God', author: 'Samuel Shem', focus: 'Medical training insights' },
            { title: 'When Breath Becomes Air', author: 'Paul Kalanithi', focus: 'Medical perspective' },
            { title: 'Being Mortal', author: 'Atul Gawande', focus: 'End-of-life care' },
            { title: 'The Checklist Manifesto', author: 'Atul Gawande', focus: 'Medical checklists' },
            { title: 'Complications', author: 'Atul Gawande', focus: 'Medical practice' }
        ];

        medicalBooks.forEach((book, i) => {
            this.extendedSources.push({
                id: `medicine-extended-${i}`,
                title: book.title,
                author: book.author,
                domain: 'medicine',
                keywords: ['medicine', book.focus.toLowerCase()],
                principles: [
                    { name: `${book.focus} principle`, description: `Core medical principle from ${book.title}` }
                ],
                exercises: [
                    `REAL-WORLD ACTION: Apply ${book.focus} in ONE real clinical situation. Document: (1) The situation, (2) How the principle applies, (3) Your application, (4) The outcome, (5) What you learned.`
                ]
            });
        });
    }

    addExtendedEconomicsSources() {
        // Additional economics sources
        const economicsBooks = [
            { title: 'The Wealth of Nations', author: 'Adam Smith', focus: 'Market economics' },
            { title: 'Capital', author: 'Thomas Piketty', focus: 'Wealth inequality' },
            { title: 'The General Theory', author: 'John Maynard Keynes', focus: 'Macroeconomics' },
            { title: 'Animal Spirits', author: 'George Akerlof', focus: 'Behavioral economics' },
            { title: 'Predictably Irrational', author: 'Dan Ariely', focus: 'Behavioral economics' },
            { title: 'The Undercover Economist', author: 'Tim Harford', focus: 'Everyday economics' },
            { title: 'The Armchair Economist', author: 'Steven Landsburg', focus: 'Economic thinking' },
            { title: 'Basic Economics', author: 'Thomas Sowell', focus: 'Economic fundamentals' }
        ];

        economicsBooks.forEach((book, i) => {
            this.extendedSources.push({
                id: `economics-extended-${i}`,
                title: book.title,
                author: book.author,
                domain: 'economics',
                keywords: ['economics', book.focus.toLowerCase()],
                principles: [
                    { name: `${book.focus} principle`, description: `Core economic principle from ${book.title}` }
                ],
                exercises: [
                    `REAL-WORLD ACTION: Apply ${book.focus} to analyze ONE real economic situation. Document: (1) The situation, (2) Your analysis, (3) Insights gained, (4) One action based on it, (5) Execute and report results.`
                ]
            });
        });
    }

    addExtendedFinanceSources() {
        // Additional finance sources
        const financeBooks = [
            { title: 'A Random Walk Down Wall Street', author: 'Burton Malkiel', focus: 'Investment strategy' },
            { title: 'The Little Book of Common Sense Investing', author: 'John Bogle', focus: 'Index investing' },
            { title: 'Security Analysis', author: 'Benjamin Graham', focus: 'Value investing' },
            { title: 'Common Stocks and Uncommon Profits', author: 'Philip Fisher', focus: 'Growth investing' },
            { title: 'One Up On Wall Street', author: 'Peter Lynch', focus: 'Stock picking' },
            { title: 'The Millionaire Next Door', author: 'Thomas Stanley', focus: 'Wealth building' },
            { title: 'Your Money or Your Life', author: 'Vicki Robin', focus: 'Financial independence' },
            { title: 'The Total Money Makeover', author: 'Dave Ramsey', focus: 'Debt elimination' },
            { title: 'I Will Teach You to Be Rich', author: 'Ramit Sethi', focus: 'Personal finance' },
            { title: 'The Simple Path to Wealth', author: 'JL Collins', focus: 'Financial independence' }
        ];

        financeBooks.forEach((book, i) => {
            this.extendedSources.push({
                id: `finance-extended-${i}`,
                title: book.title,
                author: book.author,
                domain: 'finance',
                keywords: ['finance', book.focus.toLowerCase()],
                principles: [
                    { name: `${book.focus} principle`, description: `Core financial principle from ${book.title}` }
                ],
                exercises: [
                    `REAL-WORLD ACTION: Apply ${book.focus} to improve ONE aspect of your finances. Document: (1) Your current situation, (2) How the principle applies, (3) Your action plan, (4) Execute it, (5) Measure and report financial impact.`
                ]
            });
        });
    }

    addExtendedSocialPsychologySources() {
        // Additional social/psychology sources
        const socialPsychBooks = [
            { title: 'Influence: The Psychology of Persuasion', author: 'Robert Cialdini', focus: 'Persuasion principles' },
            { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', focus: 'Cognitive biases' },
            { title: 'The Power of Habit', author: 'Charles Duhigg', focus: 'Habit formation' },
            { title: 'Atomic Habits', author: 'James Clear', focus: 'Habit building' },
            { title: 'The Social Animal', author: 'David Brooks', focus: 'Social psychology' },
            { title: 'Blink', author: 'Malcolm Gladwell', focus: 'Rapid cognition' },
            { title: 'Outliers', author: 'Malcolm Gladwell', focus: 'Success factors' },
            { title: 'Grit', author: 'Angela Duckworth', focus: 'Perseverance' },
            { title: 'Mindset', author: 'Carol Dweck', focus: 'Growth mindset' },
            { title: 'Emotional Intelligence', author: 'Daniel Goleman', focus: 'EQ development' }
        ];

        socialPsychBooks.forEach((book, i) => {
            this.extendedSources.push({
                id: `social-psych-extended-${i}`,
                title: book.title,
                author: book.author,
                domain: i < 5 ? 'psychology' : 'social',
                keywords: ['psychology', 'social', book.focus.toLowerCase()],
                principles: [
                    { name: `${book.focus} principle`, description: `Core principle from ${book.title}` }
                ],
                exercises: [
                    `REAL-WORLD ACTION: Apply ${book.focus} in ONE real situation. Document: (1) The situation, (2) How the principle applies, (3) Your application, (4) The outcome, (5) What you learned.`
                ]
            });
        });
    }

    addExtendedLeadershipSources() {
        // Additional leadership sources
        const leadershipBooks = [
            { title: 'Leaders Eat Last', author: 'Simon Sinek', focus: 'Servant leadership' },
            { title: 'Start With Why', author: 'Simon Sinek', focus: 'Purpose-driven leadership' },
            { title: 'The 21 Irrefutable Laws of Leadership', author: 'John Maxwell', focus: 'Leadership laws' },
            { title: 'Dare to Lead', author: 'Brené Brown', focus: 'Vulnerable leadership' },
            { title: 'Extreme Ownership', author: 'Jocko Willink', focus: 'Accountability' },
            { title: 'The Five Dysfunctions of a Team', author: 'Patrick Lencioni', focus: 'Team building' },
            { title: 'Radical Candor', author: 'Kim Scott', focus: 'Feedback culture' },
            { title: 'The Culture Code', author: 'Daniel Coyle', focus: 'Team culture' }
        ];

        leadershipBooks.forEach((book, i) => {
            this.extendedSources.push({
                id: `leadership-extended-${i}`,
                title: book.title,
                author: book.author,
                domain: 'leadership',
                keywords: ['leadership', book.focus.toLowerCase()],
                principles: [
                    { name: `${book.focus} principle`, description: `Core leadership principle from ${book.title}` }
                ],
                exercises: [
                    `REAL-WORLD ACTION: Apply ${book.focus} in ONE real leadership situation. Document: (1) The situation, (2) Your team/people, (3) How you applied the principle, (4) Their response, (5) The outcome and impact.`
                ]
            });
        });
    }

    addExtendedSystemsLearningSources() {
        // Additional systems/learning sources
        const systemsLearningBooks = [
            { title: 'The Fifth Discipline', author: 'Peter Senge', focus: 'Learning organizations' },
            { title: 'Make It Stick', author: 'Peter Brown', focus: 'Effective learning' },
            { title: 'Peak', author: 'Anders Ericsson', focus: 'Deliberate practice' },
            { title: 'The Art of Learning', author: 'Josh Waitzkin', focus: 'Mastery' },
            { title: 'Ultralearning', author: 'Scott Young', focus: 'Rapid skill acquisition' },
            { title: 'The Systems View of Life', author: 'Fritjof Capra', focus: 'Systems thinking' }
        ];

        systemsLearningBooks.forEach((book, i) => {
            this.extendedSources.push({
                id: `systems-learning-extended-${i}`,
                title: book.title,
                author: book.author,
                domain: i < 1 ? 'systems' : 'learning',
                keywords: [i < 1 ? 'systems' : 'learning', book.focus.toLowerCase()],
                principles: [
                    { name: `${book.focus} principle`, description: `Core principle from ${book.title}` }
                ],
                exercises: [
                    `REAL-WORLD ACTION: Apply ${book.focus} to ONE real situation. Document: (1) The situation, (2) How the principle applies, (3) Your application, (4) Execute it, (5) Measure and report results.`
                ]
            });
        });
    }

    addProductivitySources() {
        const productivityBooks = [
            { title: 'Getting Things Done', author: 'David Allen', focus: 'GTD methodology' },
            { title: 'Deep Work', author: 'Cal Newport', focus: 'Focused work' },
            { title: 'The 4-Hour Workweek', author: 'Tim Ferriss', focus: 'Efficiency' },
            { title: 'Essentialism', author: 'Greg McKeown', focus: 'Less but better' },
            { title: 'The Power of Full Engagement', author: 'Jim Loehr', focus: 'Energy management' }
        ];

        productivityBooks.forEach((book, i) => {
            this.extendedSources.push({
                id: `productivity-${i}`,
                title: book.title,
                author: book.author,
                domain: 'strategy', // Productivity is strategic
                keywords: ['productivity', book.focus.toLowerCase()],
                principles: [
                    { name: `${book.focus} principle`, description: `Core productivity principle from ${book.title}` }
                ],
                exercises: [
                    `REAL-WORLD ACTION: Apply ${book.focus} to improve ONE aspect of your productivity. Document: (1) Your current approach, (2) How the principle applies, (3) Your new system, (4) Execute for one week, (5) Measure and report productivity gains.`
                ]
            });
        });
    }

    addNegotiationSources() {
        const negotiationBooks = [
            { title: 'Getting to Yes', author: 'Roger Fisher', focus: 'Principled negotiation' },
            { title: 'Never Split the Difference', author: 'Chris Voss', focus: 'Tactical empathy' },
            { title: 'Bargaining for Advantage', author: 'G. Richard Shell', focus: 'Negotiation strategy' }
        ];

        negotiationBooks.forEach((book, i) => {
            this.extendedSources.push({
                id: `negotiation-${i}`,
                title: book.title,
                author: book.author,
                domain: 'social',
                keywords: ['negotiation', book.focus.toLowerCase()],
                principles: [
                    { name: `${book.focus} principle`, description: `Core negotiation principle from ${book.title}` }
                ],
                exercises: [
                    `REAL-WORLD ACTION: Apply ${book.focus} in ONE real negotiation. Document: (1) The negotiation, (2) How you applied the principle, (3) The other party's response, (4) The outcome, (5) What you learned.`
                ]
            });
        });
    }

    addCommunicationSources() {
        const communicationBooks = [
            { title: 'Crucial Conversations', author: 'Patterson et al.', focus: 'Difficult conversations' },
            { title: 'Nonviolent Communication', author: 'Marshall Rosenberg', focus: 'Empathetic communication' },
            { title: 'Talk Like TED', author: 'Carmine Gallo', focus: 'Public speaking' }
        ];

        communicationBooks.forEach((book, i) => {
            this.extendedSources.push({
                id: `communication-${i}`,
                title: book.title,
                author: book.author,
                domain: 'social',
                keywords: ['communication', book.focus.toLowerCase()],
                principles: [
                    { name: `${book.focus} principle`, description: `Core communication principle from ${book.title}` }
                ],
                exercises: [
                    `REAL-WORLD ACTION: Apply ${book.focus} in ONE real conversation. Document: (1) The conversation, (2) How you applied the principle, (3) The other person's response, (4) The outcome, (5) What you learned.`
                ]
            });
        });
    }

    addDecisionMakingSources() {
        const decisionBooks = [
            { title: 'Decisive', author: 'Chip & Dan Heath', focus: 'Better decision making' },
            { title: 'The Art of Thinking Clearly', author: 'Rolf Dobelli', focus: 'Cognitive biases' },
            { title: 'Superforecasting', author: 'Philip Tetlock', focus: 'Prediction accuracy' }
        ];

        decisionBooks.forEach((book, i) => {
            this.extendedSources.push({
                id: `decision-${i}`,
                title: book.title,
                author: book.author,
                domain: 'strategy',
                keywords: ['decision making', book.focus.toLowerCase()],
                principles: [
                    { name: `${book.focus} principle`, description: `Core decision-making principle from ${book.title}` }
                ],
                exercises: [
                    `REAL-WORLD ACTION: Apply ${book.focus} to make ONE important decision. Document: (1) The decision, (2) How you applied the principle, (3) Your decision process, (4) Your final choice, (5) Track the outcome and what you learned.`
                ]
            });
        });
    }

    getAllExtendedSources() {
        return this.extendedSources;
    }
}

const knowledgeSourcesExtended = new KnowledgeSourcesExtended();


