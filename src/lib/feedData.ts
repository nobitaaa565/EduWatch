import { calculatePopularityScore, rankCreatorsByPopularity } from '../algorithms/recommendations';

export interface Article {
  id: string;
  title: string;
  author: string;
  role?: string;
  description: string;
  tags: string[];
  date: string;
  readTime: string;
  views: string;
  progress: number;
  image: string;
  source: 'website' | 'community';
}

export interface Creator {
  id: string;
  name: string;
  role: string;
  avatar: string;
  followers: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  isFollowing?: boolean;
}

export const creators: Creator[] = [
  {
    id: 'c1',
    name: 'Dr. Sarah Chen',
    role: 'Infrastructure Architect',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    followers: 12400,
    likes: 45000,
    comments: 1200,
    shares: 3400,
    reach: 150000,
    isFollowing: false
  },
  {
    id: 'c2',
    name: 'Prof. Liam Whitby',
    role: 'UX Researcher',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    followers: 8900,
    likes: 32000,
    comments: 800,
    shares: 2100,
    reach: 95000,
    isFollowing: true
  },
  {
    id: 'c3',
    name: 'Alex Rivera',
    role: 'Backend Engineer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    followers: 15600,
    likes: 58000,
    comments: 2400,
    shares: 5200,
    reach: 210000,
    isFollowing: false
  },
  {
    id: 'c4',
    name: 'Dr. Elena Rodriguez',
    role: 'AI Ethics Expert',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    followers: 10200,
    likes: 28000,
    comments: 1500,
    shares: 1800,
    reach: 120000,
    isFollowing: false
  },
  {
    id: 'c5',
    name: 'Marcus Thorne',
    role: 'Security Specialist',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    followers: 6700,
    likes: 15000,
    comments: 400,
    shares: 900,
    reach: 45000,
    isFollowing: false
  }
];

export { calculatePopularityScore };

export const getPopularCreators = () => {
  return rankCreatorsByPopularity(creators);
};

export const feed: Article[] = [
  {
    id: '1',
    title: 'Distributed Monoliths: The Common Educational Platform Trap',
    author: 'Dr. Sarah Chen',
    description: 'Examining why many LMS systems fail to scale effectively under concurrent load and how modularity is the only cure.',
    tags: ['Research', 'Infrastructure', 'Professional Dev'],
    date: 'May 14, 2024',
    readTime: '3 Min Read',
    views: '277K',
    progress: 85,
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
    source: 'website'
  },
  {
    id: '2',
    title: 'Cognitive Load Theory in the Age of Immersive Dev Environments',
    author: 'Prof. Liam Whitby',
    description: 'Designing IDE interfaces that scaffold learning rather than overwhelming the novice developer with feature noise.',
    tags: ['Learning Resources', 'UX Design', 'Observations'],
    date: 'May 12, 2024',
    readTime: '4 Min Read',
    views: '12.5M',
    progress: 72,
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    source: 'website'
  },
  {
    id: '3',
    title: 'The Rust Revolution in Backend Engineering',
    author: 'Alex Rivera',
    description: 'Why memory safety is becoming the non-negotiable standard for high-concurrency educational APIs.',
    tags: ['Research', 'Professional Dev'],
    date: 'May 10, 2024',
    readTime: '18 Min Read',
    views: '890K',
    progress: 45,
    image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=800',
    source: 'community'
  },
  {
    id: '4',
    title: 'Algorithmic Bias in Automated Grading Systems',
    author: 'Dr. Elena Rodriguez',
    description: 'A critical look at how machine learning models can inadvertently penalize non-traditional coding styles.',
    tags: ['Assessment', 'Research', 'AI Ethics'],
    date: 'May 08, 2024',
    readTime: '22 Min Read',
    views: '1.2M',
    progress: 30,
    image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=800',
    source: 'website'
  },
  {
    id: '5',
    title: 'Serverless Architectures for Global Classrooms',
    author: 'Jameson K. Miller',
    description: 'Reducing latency for students in remote regions using edge computing and globally distributed functions.',
    tags: ['Learning Resources', 'Infrastructure', 'Professional Dev'],
    date: 'May 05, 2024',
    readTime: '10 Min Read',
    views: '450K',
    progress: 90,
    image: 'https://images.unsplash.com/photo-1496065187959-7f07b8353c55?auto=format&fit=crop&q=80&w=800',
    source: 'community'
  },
  {
    id: '6',
    title: 'The Future of WebAssembly in Browser-Based IDEs',
    author: 'Sophia J. Vance',
    description: 'Bringing near-native performance to the browser for complex compilation tasks in technical education.',
    tags: ['Research', 'Learning Resources', 'Performance'],
    date: 'May 03, 2024',
    readTime: '14 Min Read',
    views: '670K',
    progress: 55,
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800',
    source: 'website'
  },
  {
    id: '7',
    title: 'Cybersecurity Literacy for the Next Generation',
    author: 'Marcus Thorne',
    description: 'Integrating security-first mindsets into early-stage computer science curriculum design.',
    tags: ['Curriculum', 'Professional Dev', 'Security'],
    date: 'May 01, 2024',
    readTime: '20 Min Read',
    views: '320K',
    progress: 20,
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    source: 'community'
  },
  {
    id: '8',
    title: 'Data Visualization for Complex Learning Analytics',
    author: 'Dr. Emily Watson',
    description: 'How to present multi-dimensional student performance data without losing actionable insights.',
    tags: ['Assessment', 'Observations', 'Data Science'],
    date: 'Apr 28, 2024',
    readTime: '16 Min Read',
    views: '540K',
    progress: 65,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
    source: 'website'
  },
  {
    id: '9',
    title: 'Kubernetes for Academic Research Clusters',
    author: 'Prof. David Kim',
    description: 'Managing high-performance computing workloads for large-scale pedagogical experiments.',
    tags: ['Research', 'Professional Dev', 'Infrastructure'],
    date: 'Apr 25, 2024',
    readTime: '25 Min Read',
    views: '180K',
    progress: 15,
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800',
    source: 'community'
  },
  {
    id: '10',
    title: 'The Psychology of Gamified Learning Environments',
    author: 'Lisa M. Ray',
    description: 'Balancing extrinsic rewards with intrinsic motivation in technical skill acquisition.',
    tags: ['Observations', 'Curriculum', 'Pedagogy'],
    date: 'Apr 22, 2024',
    readTime: '13 Min Read',
    views: '920K',
    progress: 80,
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800',
    source: 'website'
  }
];
