export interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  poster: string;
  liveUrl: string;
  description: string;
  tags: string[];
}

export interface TechnicalSkillItem {
  name: string;
  category: string;
  level: string;
  color: string;
  iconKey: 'mongodb' | 'express' | 'react' | 'node';
}

export const PROFILE = {
  brand: 'HARI',
  fullName: 'Hari Sudhan',
  greeting: "Hello, It's Me",
  roleTitle: 'Associate Software Engineer',
  roleLine: 'MERN Stack Developer',
  company: 'Kiaq Technologies',
  heroBio:
    "I'm a passionate MERN Stack Developer with 1 year of professional experience, dedicated to turning ideas into modern, scalable, and user-friendly web applications using MongoDB, Express.js, React, and Node.js.",
  email: 'sudhanh934@gmail.com',
  phone: '+91 6385443419',
  whatsappNumber: '916385443419',
  whatsappUrl: 'https://wa.me/916385443419',
  linkedinUrl: 'https://www.linkedin.com/in/hari-sudhan-6957732a7/',
  githubUrl: 'https://github.com/HARI-SUDHAN',
  instagramUrl: 'https://www.instagram.com/hiphop._hari',
  resumeUrl: '/assets/aistudio/HARI_SUDHAN_BE_CSE__2025_3ceaeec2.pdf',
  profileImage: '/images/hari-profile.webp',
  profileFallback: '/images/hari-profile.jpg',
};

export const STATS = [
  {
    id: 'experience',
    value: 1,
    suffix: '+ YR',
    label: 'Professional MERN Experience',
  },
  {
    id: 'projects',
    value: 3,
    suffix: '+',
    label: 'Live Web Applications',
  },
  {
    id: 'stack',
    value: 4,
    suffix: 'X',
    label: 'MongoDB · Express · React · Node',
  },
];

// Exact 3 projects from harisudhanportfolio.vercel.app
export const PROJECTS: ProjectItem[] = [
  {
    id: 'easytrip',
    title: 'EasyTrip',
    subtitle: 'Travel Packages Booking Website',
    category: 'Frontend Development',
    poster: '/images/project-easytrip.webp',
    liveUrl: 'https://easytrip-beryl.vercel.app/',
    description:
      'Travel packages booking platform built for seamless holiday planning with From–To route search, curated tour packages, and interactive filtering.',
    tags: ['HTML', 'CSS', 'JavaScript', 'Responsive UI'],
  },
  {
    id: 'cinevault',
    title: 'CineVault',
    subtitle: 'OTT Platform Website',
    category: 'React.js Application',
    poster: '/images/project-cinevault.webp',
    liveUrl: 'https://cinevaultcom.vercel.app/',
    description:
      'Interactive OTT streaming interface featuring curated horizontal movie and series carousels, a dynamic Watchlist, and a sleek user authentication experience.',
    tags: ['React.js', 'JavaScript', 'HTML', 'CSS'],
  },
  {
    id: 'skylark',
    title: 'Skylark',
    subtitle: 'E-commerce Website',
    category: 'Web Storefront',
    poster: '/images/project-skylark.webp',
    liveUrl: 'https://skylark-kappa.vercel.app/',
    description:
      'Modern online shopping storefront featuring category exploration, Offer Zone highlights, search bar filtering, and cart/wishlist user journeys.',
    tags: ['HTML', 'CSS', 'JavaScript', 'E-Commerce'],
  },
];

// Exact About Me content from harisudhanportfolio.vercel.app (index.html + about.html)
export const ABOUT_SUMMARY = {
  title: 'About Me',
  role: 'MERN Stack Developer',
  paragraphs: [
    'I am an Associate Software Engineer at Kiaq Technologies, working as a MERN Stack Developer with hands-on experience in both frontend and backend development.',
    'I build responsive and user-friendly interfaces using React.js and develop robust backend applications using Node.js, Express.js, MongoDB, and Mongoose.',
    'I also work with Microservices Architecture and have gained practical experience with Apache Kafka for messaging and Redis for caching and performance optimization.',
    'I believe in continuous learning and turning concepts into practical solutions. I enjoy solving problems, exploring new technologies, and improving my skills through real-world projects.',
  ],
  fullStoryParagraphs: [
    'I am an Associate Software Engineer at Kiaq Technologies, working as a MERN Stack Developer with hands-on experience in both frontend and backend development. My professional experience has given me the opportunity to work on real-world applications, understand development workflows, and continuously improve my technical and problem-solving skills.',
    'On the frontend, I work with HTML, CSS, JavaScript, React.js, Redux Toolkit, Tailwind CSS, and Bootstrap. I focus on building responsive, interactive, and user-friendly interfaces while maintaining clean, reusable, and maintainable code.',
    'On the backend, I work with Node.js, Express.js, MongoDB, and Mongoose. I develop RESTful APIs, implement business logic, handle database operations, validations, authentication, and other backend functionalities required for real-world applications.',
    'Working across both frontend and backend has helped me understand the complete flow of a web application. I enjoy understanding how different parts of an application communicate with each other and how a feature moves from the user interface to the backend and database.',
    'I have also gained practical experience working with Microservices Architecture. Through my work, I have learned how applications can be divided into independent services and how those services communicate with each other to build scalable and maintainable systems.',
    'As part of my microservices experience, I have worked with Apache Kafka for messaging and event-driven communication. This has helped me understand concepts such as producers, consumers, topics, events, and asynchronous communication between different services.',
    'I have also worked with Redis for caching and performance optimization. Working with caching has helped me understand how frequently accessed data can be handled efficiently and how application performance can be improved by reducing unnecessary database operations.',
    'My goal is to continuously grow as a strong full-stack developer by improving my frontend, backend, database, and system-design knowledge—building scalable, efficient, reliable, and user-focused applications every day.',
  ],
  technologies: [
    'HTML',
    'CSS',
    'JavaScript',
    'React.js',
    'Node.js',
    'Express.js',
    'MongoDB',
    'Bootstrap',
    'Tailwind CSS',
  ],
  focusAreas: [
    'MERN Stack Development',
    'Microservices Architecture',
    'Kafka & Redis Caching',
  ],
};

// MERN Stack Technical Skills with icons (no bars or soft-skill charts)
export const TECHNICAL_SKILLS: TechnicalSkillItem[] = [
  {
    name: 'MongoDB',
    category: 'Database · Mongoose ODM',
    level: 'Proficient',
    color: '#47A248',
    iconKey: 'mongodb',
  },
  {
    name: 'Express.js',
    category: 'Backend · RESTful APIs',
    level: 'Advanced',
    color: '#F3F4F6',
    iconKey: 'express',
  },
  {
    name: 'React.js',
    category: 'Frontend · Redux Toolkit',
    level: 'Proficient',
    color: '#61DAFB',
    iconKey: 'react',
  },
  {
    name: 'Node.js',
    category: 'Runtime · Microservices',
    level: 'Proficient',
    color: '#5FA04E',
    iconKey: 'node',
  },
];
