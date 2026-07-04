export interface HeroTitle {
  line1: string;
  line2: string;
}

export interface HeroButton {
  text: string;
  path: string;
  variant: 'primary' | 'secondary';
}

export interface HeroSection {
  type: 'hero';
  title: HeroTitle;
  description: string;
  buttons: HeroButton[];
  indicator: string;
}

export interface Slide {
  title: string;
  description: string;
  image: string;
  tag: string;
}

export interface SlideshowSection {
  type: 'slideshow';
  sectionLabel: string;
  slides: Slide[];
}

export interface CurationCard {
  cardType: 'large' | 'medium' | 'small_link' | 'small_cta';
  postId?: string;
  title: string;
  description: string;
  image?: string;
  author?: string;
  role?: string;
  date?: string;
  authorImg?: string;
  number?: string;
  btnText?: string;
  btnPath?: string;
  likes?: number;
  isLiked?: boolean;
  isFollowing?: boolean;
}

export interface CurationSection {
  type: 'curation';
  title: string;
  description: string;
  cards: CurationCard[];
}

export interface Stat {
  label: string;
  value: string;
}

export interface StatsBannerButton {
  text: string;
  path?: string;
  variant: 'primary' | 'secondary';
}

export interface StatsBannerSection {
  type: 'stats_banner';
  title: {
    line1: string;
    line2: string;
  };
  description: string;
  buttons: StatsBannerButton[];
  stats: Stat[];
}

export type HomeSection = HeroSection | SlideshowSection | CurationSection | StatsBannerSection;

export const mockData: HomeSection[] = [
  {
    type: 'hero',
    title: {
      line1: 'Join the Future of',
      line2: 'Educational Technology'
    },
    description: 'Connect with 50,000+ technical leaders and pedagogical researchers. Explore the latest breakthroughs or architect the next one.',
    buttons: [
      {
        text: 'Explore Writings',
        path: '/feed',
        variant: 'primary'
      },
      {
        text: 'Join the Community',
        path: '/auth',
        variant: 'secondary'
      }
    ],
    indicator: 'Join our growing community of technical curators'
  },
  {
    type: 'slideshow',
    sectionLabel: 'Featured Insights',
    slides: [
      {
        title: 'AI-Powered Classrooms',
        description: 'Harnessing large language models to provide personalized, real-time feedback for every student.',
        image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1600',
        tag: 'Next-Gen Pedagogy'
      },
      {
        title: 'Immersive VR Labs',
        description: 'Bridging the gap between theory and practice through high-fidelity virtual engineering simulations.',
        image: 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&q=80&w=1600',
        tag: 'Virtual Learning'
      },
      {
        title: 'The Future of Work',
        description: 'Preparing the next generation of engineers for a world of human-machine collaboration.',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1600',
        tag: 'Workforce Evolution'
      }
    ]
  },
  {
    type: 'curation',
    title: 'Voices of Innovation',
    description: 'Where engineering precision meets pedagogical creativity. See what our community is writing.',
    cards: [
      {
        cardType: 'large',
        postId: '1',
        title: 'Distributed Monoliths: The Common Educational Platform Trap',
        description: 'Examining why many LMS systems fail to scale effectively under concurrent load and how modularity is the only cure.',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
        author: 'Dr. Sarah Chen',
        role: 'Infrastructure Architect',
        date: 'May 14, 2024',
        authorImg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        likes: 142,
        isLiked: false,
        isFollowing: false
      },
      {
        cardType: 'medium',
        postId: '2',
        title: 'Cognitive Load Theory in the Age of Immersive Dev Environments',
        description: 'Designing IDE interfaces that scaffold learning rather than overwhelming the novice developer with feature noise.',
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
        likes: 95,
        isLiked: false,
        isFollowing: false
      },
      {
        cardType: 'small_link',
        postId: '3',
        number: '01',
        title: 'The Rust Revolution in Backend Engineering',
        description: 'Why memory safety is becoming the non-negotiable standard for high-concurrency educational APIs.',
        btnText: 'Learn More',
        likes: 67,
        isLiked: false,
        isFollowing: false
      },
      {
        cardType: 'small_cta',
        title: 'Contribute to the Ledger',
        description: 'Share your technical journals with 50k+ readers. Get published in the next edition.',
        btnText: 'Submit Draft',
        btnPath: '/write-article'
      }
    ]
  },
  {
    type: 'stats_banner',
    title: {
      line1: 'Your Voice,',
      line2: 'Our Platform.'
    },
    description: 'From architectural blueprints to pedagogical whitepapers—we provide the stage for your technical expertise to shine. Join 5,000+ active contributors.',
    buttons: [
      {
        text: 'Submit Your Article',
        path: '/write-article',
        variant: 'primary'
      },
      {
        text: 'Writer Guidelines',
        variant: 'secondary'
      }
    ],
    stats: [
      { label: 'Readers', value: '50k+' },
      { label: 'Contributors', value: '5k' },
      { label: 'Journals', value: '15' },
      { label: 'Impact Score', value: '98' }
    ]
  }
];

export interface ExpertiseTag {
  name: string;
  category: 'Technical' | 'Education' | 'Research';
  subCategory: string;
}

export const AVAILABLE_EXPERTISE_TAGS: ExpertiseTag[] = [
  // Software & Architecture
  { name: 'Frontend Developer', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Backend Developer', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Full-Stack Engineer', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Software Architect', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Systems Programmer', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Mobile Application Developer', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'iOS Developer', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Android Developer', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Firmware Engineer', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Embedded Systems Engineer', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Release Manager', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Site Reliability Engineer (SRE)', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'DevOps Engineer', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Platform Engineer', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Automation Engineer', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Quality Assurance Tester', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Software Development Engineer in Test (SDET)', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Microservices Architect', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Serverless Architect', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Distributed Systems Engineer', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Kernel Developer', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'API Designer', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'Webmaster', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'ERP Consultant', category: 'Technical', subCategory: 'Software & Architecture' },
  { name: 'CRM Specialist', category: 'Technical', subCategory: 'Software & Architecture' },

  // Data, AI & Machine Learning
  { name: 'Data Scientist', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },
  { name: 'Machine Learning Engineer', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },
  { name: 'Deep Learning Researcher', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },
  { name: 'Computer Vision Engineer', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },
  { name: 'Natural Language Processing Specialist', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },
  { name: 'AI Ethicist', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },
  { name: 'Prompt Engineer', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },
  { name: 'Data Engineer', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },
  { name: 'Data Analyst', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },
  { name: 'Business Intelligence Analyst', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },
  { name: 'Quantitative Analyst', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },
  { name: 'Data Steward', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },
  { name: 'Data Governance Lead', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },
  { name: 'Data Visualizer', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },
  { name: 'Big Data Architect', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },
  { name: 'Algorithm Engineer', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },
  { name: 'Bioinformatics Software Engineer', category: 'Technical', subCategory: 'Data, AI & Machine Learning' },

  // Cybersecurity & IT Infrastructure
  { name: 'Cloud Architect', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'Network Administrator', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'Systems Administrator', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'Database Administrator', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'Information Security Analyst', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'Penetration Tester', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'Security Operations Center (SOC) Analyst', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'Cryptography Engineer', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'Identity and Access Management Specialist', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'Cloud Security Architect', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'Application Security Engineer', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'Threat Intelligence Analyst', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'Incident Responder', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'Forensics Investigator', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'Vulnerability Assessor', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'Malware Analyst', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'IT Support Specialist', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },
  { name: 'Telecommunications Specialist', category: 'Technical', subCategory: 'Cybersecurity & IT Infrastructure' },

  // Hardware & Traditional Engineering
  { name: 'Mechanical Engineer', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },
  { name: 'Electrical Engineer', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },
  { name: 'Electronics Design Engineer', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },
  { name: 'Hardware Architect', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },
  { name: 'VLSI Design Engineer', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },
  { name: 'Mechatronics Engineer', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },
  { name: 'Civil Engineer', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },
  { name: 'Structural Engineer', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },
  { name: 'Aerospace Engineer', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },
  { name: 'Materials Scientist', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },
  { name: 'Chemical Engineer', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },
  { name: 'Industrial Engineer', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },
  { name: 'Manufacturing Engineer', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },
  { name: 'Acoustics Engineer', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },
  { name: 'Optical Engineer', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },
  { name: 'Robotics Engineer', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },
  { name: 'Control Systems Engineer', category: 'Technical', subCategory: 'Hardware & Traditional Engineering' },

  // Design, Product & Gaming
  { name: 'UI Developer', category: 'Technical', subCategory: 'Design, Product & Gaming' },
  { name: 'UX Engineer', category: 'Technical', subCategory: 'Design, Product & Gaming' },
  { name: 'Product Manager', category: 'Technical', subCategory: 'Design, Product & Gaming' },
  { name: 'Motion Graphics Designer', category: 'Technical', subCategory: 'Design, Product & Gaming' },
  { name: '3D Modeler', category: 'Technical', subCategory: 'Design, Product & Gaming' },
  { name: 'Character Rigger', category: 'Technical', subCategory: 'Design, Product & Gaming' },
  { name: 'Technical Artist', category: 'Technical', subCategory: 'Design, Product & Gaming' },
  { name: 'Gameplay Programmer', category: 'Technical', subCategory: 'Design, Product & Gaming' },
  { name: 'Audio Engineer', category: 'Technical', subCategory: 'Design, Product & Gaming' },
  { name: 'Build Engineer', category: 'Technical', subCategory: 'Design, Product & Gaming' },
  { name: 'Toolsmith', category: 'Technical', subCategory: 'Design, Product & Gaming' },

  // Instructional Design & Technology
  { name: 'Instructional Designer', category: 'Education', subCategory: 'Instructional Design & Technology' },
  { name: 'Curriculum Developer', category: 'Education', subCategory: 'Instructional Design & Technology' },
  { name: 'Educational Technologist', category: 'Education', subCategory: 'Instructional Design & Technology' },
  { name: 'Learning Experience (LX) Designer', category: 'Education', subCategory: 'Instructional Design & Technology' },
  { name: 'Corporate Trainer', category: 'Education', subCategory: 'Instructional Design & Technology' },
  { name: 'E-Learning Developer', category: 'Education', subCategory: 'Instructional Design & Technology' },
  { name: 'Pedagogical Consultant', category: 'Education', subCategory: 'Instructional Design & Technology' },
  { name: 'Assessment Specialist', category: 'Education', subCategory: 'Instructional Design & Technology' },
  { name: 'Distance Learning Coordinator', category: 'Education', subCategory: 'Instructional Design & Technology' },
  { name: 'Educational Diagnostician', category: 'Education', subCategory: 'Instructional Design & Technology' },
  { name: 'STEM Coordinator', category: 'Education', subCategory: 'Instructional Design & Technology' },
  { name: 'Textbook Author', category: 'Education', subCategory: 'Instructional Design & Technology' },
  { name: 'Test Item Writer', category: 'Education', subCategory: 'Instructional Design & Technology' },
  { name: 'Psychometrician', category: 'Education', subCategory: 'Instructional Design & Technology' },

  // Academic Administration & Support
  { name: 'Academic Advisor', category: 'Education', subCategory: 'Academic Administration & Support' },
  { name: 'Admissions Counselor', category: 'Education', subCategory: 'Academic Administration & Support' },
  { name: 'Special Education Coordinator', category: 'Education', subCategory: 'Academic Administration & Support' },
  { name: 'Student Affairs Administrator', category: 'Education', subCategory: 'Academic Administration & Support' },
  { name: 'Literacy Specialist', category: 'Education', subCategory: 'Academic Administration & Support' },
  { name: 'Academic Coach', category: 'Education', subCategory: 'Academic Administration & Support' },
  { name: 'Dean of Students', category: 'Education', subCategory: 'Academic Administration & Support' },
  { name: 'Higher Education Administrator', category: 'Education', subCategory: 'Academic Administration & Support' },
  { name: 'Student Retention Specialist', category: 'Education', subCategory: 'Academic Administration & Support' },
  { name: 'Registrar', category: 'Education', subCategory: 'Academic Administration & Support' },
  { name: 'Alumni Relations Director', category: 'Education', subCategory: 'Academic Administration & Support' },
  { name: 'Library Media Specialist', category: 'Education', subCategory: 'Academic Administration & Support' },
  { name: 'School Counselor', category: 'Education', subCategory: 'Academic Administration & Support' },
  { name: 'Institutional Research Analyst', category: 'Education', subCategory: 'Academic Administration & Support' },
  { name: 'Accreditation Coordinator', category: 'Education', subCategory: 'Academic Administration & Support' },
  { name: 'Provost', category: 'Education', subCategory: 'Academic Administration & Support' },
  { name: 'Department Chair', category: 'Education', subCategory: 'Academic Administration & Support' },

  // Teaching & Facilitation
  { name: 'Early Childhood Educator', category: 'Education', subCategory: 'Teaching & Facilitation' },
  { name: 'Secondary Education Teacher', category: 'Education', subCategory: 'Teaching & Facilitation' },
  { name: 'Adult Learning Facilitator', category: 'Education', subCategory: 'Teaching & Facilitation' },
  { name: 'Bilingual Education Specialist', category: 'Education', subCategory: 'Teaching & Facilitation' },
  { name: 'ESL Teacher', category: 'Education', subCategory: 'Teaching & Facilitation' },
  { name: 'Subject Matter Expert', category: 'Education', subCategory: 'Teaching & Facilitation' },
  { name: 'Gifted Education Specialist', category: 'Education', subCategory: 'Teaching & Facilitation' },
  { name: 'Vocational Instructor', category: 'Education', subCategory: 'Teaching & Facilitation' },
  { name: 'Reading Interventionist', category: 'Education', subCategory: 'Teaching & Facilitation' },
  { name: 'Math Interventionist', category: 'Education', subCategory: 'Teaching & Facilitation' },
  { name: 'Tenure-Track Professor', category: 'Education', subCategory: 'Teaching & Facilitation' },
  { name: 'Adjunct Professor', category: 'Education', subCategory: 'Teaching & Facilitation' },
  { name: 'Teaching Assistant', category: 'Education', subCategory: 'Teaching & Facilitation' },
  { name: 'Corporate Learning Officer', category: 'Education', subCategory: 'Teaching & Facilitation' },
  { name: 'Leadership Development Coach', category: 'Education', subCategory: 'Teaching & Facilitation' },
  { name: 'Museum Educator', category: 'Education', subCategory: 'Teaching & Facilitation' },
  { name: 'Outdoor Education Guide', category: 'Education', subCategory: 'Teaching & Facilitation' },

  // Life Sciences & Health
  { name: 'Principal Investigator', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Clinical Research Coordinator', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Postdoctoral Researcher', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Research Scientist', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Lab Manager', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Bioinformatician', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Epidemiologist', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Genomic Researcher', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Pharmacologist', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Toxicologist', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Clinical Data Manager', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Clinical Trial Manager', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Regulatory Affairs Specialist', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Pharmacovigilance Scientist', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Health Economist', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Public Health Researcher', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Microbiologist', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Virologist', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Immunologist', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Genetic Counselor', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Evolutionary Biologist', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Botanist', category: 'Research', subCategory: 'Life Sciences & Health' },
  { name: 'Zoologist', category: 'Research', subCategory: 'Life Sciences & Health' },

  // Physical Sciences & Environment
  { name: 'Ecologist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Conservation Biologist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Marine Biologist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Paleontologist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Seismologist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Volcanologist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Hydrologist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Climatologist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Glaciologist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Astronomer', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Cosmologist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Particle Physicist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Condensed Matter Physicist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Plasma Physicist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Nuclear Engineer', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Radiochemist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Analytical Chemist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Organic Chemist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Materials Engineer', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Nanotechnologist', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Agricultural Researcher', category: 'Research', subCategory: 'Physical Sciences & Environment' },
  { name: 'Agronomist', category: 'Research', subCategory: 'Physical Sciences & Environment' },

  // Humanities & Social Sciences
  { name: 'Cognitive Scientist', category: 'Research', subCategory: 'Humanities & Social Sciences' },
  { name: 'Neuroscientist', category: 'Research', subCategory: 'Humanities & Social Sciences' },
  { name: 'Behavioral Economist', category: 'Research', subCategory: 'Humanities & Social Sciences' },
  { name: 'Anthropologist', category: 'Research', subCategory: 'Humanities & Social Sciences' },
  { name: 'Sociologist', category: 'Research', subCategory: 'Humanities & Social Sciences' },
  { name: 'Archaeologist', category: 'Research', subCategory: 'Humanities & Social Sciences' },
  { name: 'Historian', category: 'Research', subCategory: 'Humanities & Social Sciences' },
  { name: 'Political Scientist', category: 'Research', subCategory: 'Humanities & Social Sciences' },
  { name: 'Demographer', category: 'Research', subCategory: 'Humanities & Social Sciences' },
  { name: 'Criminologist', category: 'Research', subCategory: 'Humanities & Social Sciences' },
  { name: 'Urban Planner', category: 'Research', subCategory: 'Humanities & Social Sciences' },
  { name: 'Transportation Researcher', category: 'Research', subCategory: 'Humanities & Social Sciences' },
  { name: 'Operations Management Researcher', category: 'Research', subCategory: 'Humanities & Social Sciences' },
  { name: 'Operations Management Researcher', category: 'Research', subCategory: 'Humanities & Social Sciences' },
  { name: 'Ethnographer', category: 'Research', subCategory: 'Humanities & Social Sciences' },

  // Research Management & Specialized Analysis
  { name: 'Data Archivist', category: 'Research', subCategory: 'Research Management & Specialized Analysis' },
  { name: 'Research Grant Writer', category: 'Research', subCategory: 'Research Management & Specialized Analysis' },
  { name: 'Ethics Review Board Member', category: 'Research', subCategory: 'Research Management & Specialized Analysis' },
  { name: 'Peer Reviewer', category: 'Research', subCategory: 'Research Management & Specialized Analysis' },
  { name: 'Scientific Editor', category: 'Research', subCategory: 'Research Management & Specialized Analysis' },
  { name: 'Field Researcher', category: 'Research', subCategory: 'Research Management & Specialized Analysis' },
  { name: 'Survey Methodologist', category: 'Research', subCategory: 'Research Management & Specialized Analysis' },
  { name: 'User Experience Researcher', category: 'Research', subCategory: 'Research Management & Specialized Analysis' },
  { name: 'Human-Computer Interaction (HCI) Researcher', category: 'Research', subCategory: 'Research Management & Specialized Analysis' },
  { name: 'Medical Writer', category: 'Research', subCategory: 'Research Management & Specialized Analysis' },
  { name: 'Market Research Analyst', category: 'Research', subCategory: 'Research Management & Specialized Analysis' },
  { name: 'Consumer Insights Analyst', category: 'Research', subCategory: 'Research Management & Specialized Analysis' },
  { name: 'Innovation Manager', category: 'Research', subCategory: 'Research Management & Specialized Analysis' },
  { name: 'Knowledge Manager', category: 'Research', subCategory: 'Research Management & Specialized Analysis' },
  { name: 'Policy Analyst', category: 'Research', subCategory: 'Research Management & Specialized Analysis' }
];

