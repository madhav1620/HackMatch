/** Seed: demo users (students + organizer) + hackathon feed data (Discovery Hub).
 *  Run: npm run db:seed -w server   (also wired as `npx prisma db seed`) */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const tags = (...s: string[]) => s;
const d = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const HACKATHON_IDS: Record<string, string> = {};

type SeedHackathon = {
  name: string;
  tagline: string;
  description: string;
  mode: string;
  location: string | null;
  orgType: string;
  prizePool: number;
  deadlineInDays: number;
  startInDays: number;
  endInDays: number;
  techTags: string[];
  minTeamSize: number;
  maxTeamSize: number;
  status?: string;
  url?: string;
  byOrganizer?: boolean;
};

const HACKATHONS: SeedHackathon[] = [
  {
    name: "CalHacks 11.0",
    tagline: "36 hours of frontier tech at UC Berkeley",
    description:
      "CalHacks is the largest collegiate hackathon in the world. 36 hours, 2000+ hackers, high-bandwidth compute clusters, and venture partners on the floor.",
    mode: "OFFLINE",
    location: "Pauley Ballroom, Berkeley, CA",
    orgType: "EXTERNAL",
    prizePool: 3300000,
    deadlineInDays: 9,
    startInDays: 24,
    endInDays: 26,
    techTags: ["AI/ML", "Rust", "React", "Hardware"],
    minTeamSize: 3,
    maxTeamSize: 5,
    url: "https://calhacks.io",
  },
  {
    name: "Smart India Hackathon 2026",
    tagline: "India's biggest hackathon — innovate for a billion people",
    description:
      "SIH is a nationwide flagship hackathon organized by AICTE. Solve real problems posed by ministries and industries in 36 hours.",
    mode: "HYBRID",
    location: "Campus nodal centres",
    orgType: "INTERNAL",
    prizePool: 100000,
    deadlineInDays: 12,
    startInDays: 20,
    endInDays: 22,
    techTags: ["React", "Python", "IoT", "AI/ML"],
    minTeamSize: 4,
    maxTeamSize: 6,
    url: "https://sih.gov.in",
    byOrganizer: true,
  },
  {
    name: "GDG Solution Challenge 2027",
    tagline: "Build with Google tech, ship for social impact",
    description:
      "Solution Challenge invites students to build projects using Google technologies (Firebase, Flutter, AI APIs) that solve local problems.",
    mode: "ONLINE",
    location: null,
    orgType: "EXTERNAL",
    prizePool: 250000,
    deadlineInDays: 30,
    startInDays: 35,
    endInDays: 37,
    techTags: ["Flutter", "Firebase", "AI/ML", "React"],
    minTeamSize: 1,
    maxTeamSize: 4,
    url: "https://developers.google.com/community/gdsc-solution-challenge",
  },
  {
    name: "HackVIT '26",
    tagline: "48-hour sprint at VIT Vellore",
    description: "In-person 48-hour hackathon with mentorship from industry engineers and on-the-spot prizes.",
    mode: "OFFLINE",
    location: "VIT Vellore, TN",
    orgType: "EXTERNAL",
    prizePool: 200000,
    deadlineInDays: 5,
    startInDays: 8,
    endInDays: 10,
    techTags: ["React", "Node.js", "AI/ML"],
    minTeamSize: 2,
    maxTeamSize: 5,
  },
  {
    name: "Midnight Hacks",
    tagline: "24 hours, one night, ship something real",
    description:
      "A single-night online sprint. Small scope, fast judgement, brutal deadline. Perfect first hackathon.",
    mode: "ONLINE",
    location: null,
    orgType: "EXTERNAL",
    prizePool: 30000,
    deadlineInDays: 1,
    startInDays: 2,
    endInDays: 3,
    techTags: ["TypeScript", "React", "Python"],
    minTeamSize: 1,
    maxTeamSize: 3,
  },
  {
    name: "Hack the North",
    tagline: "Canada's largest hackathon",
    description: "36 hours at the University of Waterloo with hardware labs, mentors, and a legendary opening ceremony.",
    mode: "OFFLINE",
    location: "Waterloo, ON",
    orgType: "EXTERNAL",
    prizePool: 2500000,
    deadlineInDays: 45,
    startInDays: 60,
    endInDays: 62,
    techTags: ["TypeScript", "React", "Python", "Hardware"],
    minTeamSize: 2,
    maxTeamSize: 4,
    url: "https://hackthenorth.com",
  },
  {
    name: "TreeHacks 2027",
    tagline: "Stanford's AI-first hackathon",
    description: "TreeHacks pushes teams toward genuinely new machine learning. Compute credits and research mentors included.",
    mode: "OFFLINE",
    location: "Stanford, CA",
    orgType: "EXTERNAL",
    prizePool: 2000000,
    deadlineInDays: 40,
    startInDays: 55,
    endInDays: 57,
    techTags: ["AI/ML", "Rust", "iOS"],
    minTeamSize: 2,
    maxTeamSize: 4,
  },
  {
    name: "EthIndia 2026",
    tagline: "India's largest web3 hackathon",
    description: "Build decentralised applications with Solidity and zk tooling. Bounties from 30+ protocols.",
    mode: "OFFLINE",
    location: "Bengaluru, KA",
    orgType: "EXTERNAL",
    prizePool: 1500000,
    deadlineInDays: 60,
    startInDays: 75,
    endInDays: 77,
    techTags: ["Web3", "Solidity", "React"],
    minTeamSize: 2,
    maxTeamSize: 4,
  },
  {
    name: "HackBITS Pilani",
    tagline: "Campus league opener",
    description: "Internal 30-hour hackathon for BITS students. Design-heavy briefs, small teams, sharp judging.",
    mode: "OFFLINE",
    location: "BITS Pilani, RJ",
    orgType: "INTERNAL",
    prizePool: 150000,
    deadlineInDays: 7,
    startInDays: 11,
    endInDays: 12,
    techTags: ["React", "Figma", "UI/UX"],
    minTeamSize: 2,
    maxTeamSize: 4,
    byOrganizer: true,
  },
  {
    name: "MLH Global Hack Week",
    tagline: "Five days of online build sessions",
    description: "A free online week of workshops, challenges, and open-source contribution sprints. Beginner friendly.",
    mode: "ONLINE",
    location: null,
    orgType: "EXTERNAL",
    prizePool: 50000,
    deadlineInDays: 3,
    startInDays: 4,
    endInDays: 9,
    techTags: ["Python", "JavaScript", "Open Source"],
    minTeamSize: 1,
    maxTeamSize: 2,
  },
  {
    name: "HackMIT 2027",
    tagline: "Hardware, robotics, and computer vision",
    description: "MIT's flagship hackathon, heavy on hardware. Lab access, soldering stations, and CV toolkits.",
    mode: "OFFLINE",
    location: "Cambridge, MA",
    orgType: "EXTERNAL",
    prizePool: 1200000,
    deadlineInDays: 90,
    startInDays: 110,
    endInDays: 112,
    techTags: ["Hardware", "Robotics", "Computer Vision"],
    minTeamSize: 2,
    maxTeamSize: 4,
  },
  {
    name: "CodeSprint '25",
    tagline: "Closed — archived external sprint",
    description: "A past edition kept in the database to verify that CLOSED hackathons stay out of the discovery feed.",
    mode: "ONLINE",
    location: null,
    orgType: "EXTERNAL",
    prizePool: 100000,
    deadlineInDays: -20,
    startInDays: -15,
    endInDays: -13,
    techTags: ["JavaScript"],
    minTeamSize: 1,
    maxTeamSize: 3,
    status: "CLOSED",
  },
  {
    name: "NexHack 2027",
    tagline: "Draft — not published yet",
    description: "Work in progress draft posted by the organizer account.",
    mode: "HYBRID",
    location: "BITS Pilani, RJ",
    orgType: "INTERNAL",
    prizePool: 250000,
    deadlineInDays: 50,
    startInDays: 70,
    endInDays: 72,
    techTags: ["React", "Go"],
    minTeamSize: 2,
    maxTeamSize: 4,
    status: "DRAFT",
    byOrganizer: true,
  },
];

async function main() {
  // Clean slate (dev only)
  await prisma.joinRequest.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.soloPost.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.hackathon.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const arjun = await prisma.user.create({
    data: {
      email: "arjun@iiit.ac.in",
      passwordHash,
      name: "Arjun Iyer",
      verified: true,
      primaryRole: "BACKEND",
      bio: "Go + Postgres backend dev. I like boring infrastructure and fast APIs.",
      skills: tags("Go", "PostgreSQL", "Docker", "Python", "Express"),
      githubUrl: "https://github.com/arjun",
      discordHandle: "arjun_iyer",
      availability: "AVAILABLE",
    },
  });

  const maya = await prisma.user.create({
    data: {
      email: "maya@berkeley.edu",
      passwordHash,
      name: "Maya Chen",
      verified: true,
      primaryRole: "FRONTEND",
      bio: "React + design systems. Building tactile interfaces that feel physical.",
      skills: tags("React", "TypeScript", "Tailwind", "Figma"),
      portfolioUrl: "https://maya.design",
      availability: "AVAILABLE",
    },
  });

  const ravi = await prisma.user.create({
    data: {
      email: "ravi@iitb.ac.in",
      passwordHash,
      name: "Ravi Nair",
      verified: true,
      primaryRole: "AIML",
      bio: "Applied ML. RAG pipelines, evals, and occasionally robotics.",
      skills: tags("Python", "PyTorch", "LangChain", "FastAPI"),
      githubUrl: "https://github.com/ravi",
      availability: "BUSY",
    },
  });

  // Organizer account — owns the internal hackathons + the draft.
  const organizer = await prisma.user.create({
    data: {
      email: "priya@bits-pilani.ac.in",
      passwordHash,
      name: "Priya Sharma",
      verified: true,
      role: "ORGANIZER",
      primaryRole: "PITCH",
      bio: "Hackathon organizer at BITS Pilani. I run the campus league events.",
      skills: tags("Community", "Event Ops", "Sponsorship"),
      availability: "AVAILABLE",
    },
  });

  const created = new Map<string, string>();
  for (const h of HACKATHONS) {
    const row = await prisma.hackathon.create({
      data: {
        name: h.name,
        tagline: h.tagline,
        description: h.description,
        mode: h.mode,
        location: h.location,
        orgType: h.orgType,
        prizePool: h.prizePool,
        registrationDeadline: d(h.deadlineInDays),
        startDate: d(h.startInDays),
        endDate: d(h.endInDays),
        techTags: tags(...h.techTags),
        minTeamSize: h.minTeamSize,
        maxTeamSize: h.maxTeamSize,
        status: h.status ?? "PUBLISHED",
        url: h.url ?? null,
        organizerId: h.byOrganizer ? organizer.id : null,
      },
    });
    HACKATHON_IDS[h.name] = row.id;
  }

  const sih = HACKATHON_IDS["Smart India Hackathon 2026"];
  const calhacks = HACKATHON_IDS["CalHacks 11.0"];
  const gdg = HACKATHON_IDS["GDG Solution Challenge 2027"];
  const hackvit = HACKATHON_IDS["HackVIT '26"];

  // Teams recruiting across a few hackathons
  const kernelPanic = await prisma.team.create({
    data: {
      hackathonId: sih,
      createdById: arjun.id,
      name: "Kernel Panic",
      description: "Crop-disease detection for smallholder farmers. Go + Postgres, need design and ML.",
      track: "AgriTech · Impact Track",
      openSlots: 2,
      requiredRoles: tags("UIUX", "AIML"),
      requiredSkills: tags("Figma", "PyTorch"),
      contactChannel: "DISCORD",
      contactValue: "https://discord.gg/kernelpanic",
    },
  });
  await prisma.teamMember.create({
    data: { teamId: kernelPanic.id, userId: arjun.id, role: "BACKEND", isLeader: true },
  });
  await prisma.teamMember.create({
    data: { teamId: kernelPanic.id, userId: maya.id, role: "FRONTEND" },
  });

  const neuroFlow = await prisma.team.create({
    data: {
      hackathonId: calhacks,
      createdById: ravi.id,
      name: "NeuroFlow",
      description: "Local-first EEG agent pipelines. On-device inference, no cloud round-trips.",
      track: "Applied AI · Bio-Sensing Track",
      openSlots: 2,
      requiredRoles: tags("AIML", "UIUX"),
      requiredSkills: tags("PyTorch", "Design"),
      contactChannel: "DISCORD",
      contactValue: "https://discord.gg/neuroflow",
    },
  });
  await prisma.teamMember.create({
    data: { teamId: neuroFlow.id, userId: ravi.id, role: "AIML", isLeader: true },
  });

  const zkVote = await prisma.team.create({
    data: {
      hackathonId: calhacks,
      createdById: maya.id,
      name: "ZeroKnowledge Vote",
      description: "Private verifiable campus governance. Rust circuits + a frontend people trust.",
      track: "Privacy & Web3 Infrastructure",
      openSlots: 1,
      requiredRoles: tags("BACKEND"),
      requiredSkills: tags("Rust"),
      contactChannel: "EMAIL",
      contactValue: "zkvote@hackmatch.dev",
    },
  });
  await prisma.teamMember.create({
    data: { teamId: zkVote.id, userId: maya.id, role: "FRONTEND", isLeader: true },
  });

  const ecoGrid = await prisma.team.create({
    data: {
      hackathonId: hackvit,
      createdById: arjun.id,
      name: "EcoGrid",
      description: "Decentralized mesh power monitor for campus hostels.",
      track: "Climate · Hardware Track",
      openSlots: 2,
      requiredRoles: tags("DEVOPS", "FRONTEND"),
      requiredSkills: tags("Hardware", "Swift"),
      contactChannel: "WHATSAPP",
      contactValue: "+919812345678",
    },
  });
  await prisma.teamMember.create({
    data: { teamId: ecoGrid.id, userId: arjun.id, role: "DEVOPS", isLeader: true },
  });

  // A full (closed) squad — verifies the board's "squad complete" state + openOnly filter.
  const pixelPirates = await prisma.team.create({
    data: {
      hackathonId: hackvit,
      createdById: maya.id,
      name: "Pixel Pirates",
      description: "Game-jam energy: a 48h multiplayer roguelike with a hand-drawn art pass.",
      track: "Games · Open Track",
      openSlots: 0,
      isRecruiting: false,
      requiredRoles: tags("AIML"),
      requiredSkills: tags("Unity", "TypeScript"),
      contactChannel: "DISCORD",
      contactValue: "https://discord.gg/pixelpirates",
    },
  });
  await prisma.teamMember.create({
    data: { teamId: pixelPirates.id, userId: maya.id, role: "UIUX", isLeader: true },
  });
  await prisma.teamMember.create({
    data: { teamId: pixelPirates.id, userId: ravi.id, role: "AIML" },
  });

  // Application history: accepted (Maya → Kernel Panic), pending (Ravi → Kernel Panic),
  // pending (Maya → EcoGrid) and declined (Arjun → ZeroKnowledge Vote).
  await prisma.joinRequest.create({
    data: {
      teamId: kernelPanic.id,
      requesterId: maya.id,
      type: "JOIN",
      role: "UIUX",
      message: "I can own the whole design system and the dashboard UI. Portfolio in my profile.",
      portfolioUrl: "https://maya.design",
      commitment: "FULL_SPRINT",
      status: "ACCEPTED",
      reviewedAt: new Date(),
    },
  });
  await prisma.joinRequest.create({
    data: {
      teamId: kernelPanic.id,
      requesterId: ravi.id,
      type: "JOIN",
      role: "AIML",
      message: "RAG + evals background, happy to own the ML pipeline and the offline model.",
      commitment: "PARTIAL",
      status: "PENDING",
    },
  });
  await prisma.joinRequest.create({
    data: {
      teamId: ecoGrid.id,
      requesterId: maya.id,
      type: "JOIN",
      role: "FRONTEND",
      message: "Would love to build the monitoring dashboard. I have a Swift + charts prototype ready.",
      commitment: "FLEXIBLE",
      status: "PENDING",
    },
  });
  await prisma.joinRequest.create({
    data: {
      teamId: zkVote.id,
      requesterId: arjun.id,
      type: "JOIN",
      role: "BACKEND",
      message: "Go backend engineer — I can wire the API and the circuits glue.",
      commitment: "FULL_SPRINT",
      status: "DECLINED",
      reviewedAt: new Date(),
    },
  });

  // Solo builders
  await prisma.soloPost.create({
    data: {
      hackathonId: gdg,
      userId: maya.id,
      pitch: "UI/UX + frontend looking for a backend buddy and an ML friend for the Solution Challenge.",
    },
  });
  await prisma.soloPost.create({
    data: {
      hackathonId: calhacks,
      userId: ravi.id,
      pitch: "ML engineer, RAG + evals. Want to build something that actually ships.",
    },
  });
  await prisma.soloPost.create({
    data: {
      hackathonId: sih,
      userId: maya.id,
      pitch: "Designer with a working prototype. Need two more builders who like deadlines.",
    },
  });
  await prisma.soloPost.create({
    data: {
      hackathonId: hackvit,
      userId: arjun.id,
      pitch: "Backend/infra generalist looking for a hardware + frontend squad for HackVIT. I'll own the API.",
    },
  });

  // Bookmark / reminder state
  await prisma.bookmark.create({
    data: { userId: arjun.id, hackathonId: gdg, remindAt: d(27) },
  });
  await prisma.bookmark.create({ data: { userId: arjun.id, hackathonId: calhacks } });
  await prisma.bookmark.create({ data: { userId: maya.id, hackathonId: hackvit } });

  console.log(
    `Seeded ${[arjun, maya, ravi, organizer].length} users, ${HACKATHONS.length} hackathons, ` +
      `5 teams, 4 solo posts, 4 join requests, 3 bookmarks.`,
  );
  console.log(`Student login:    arjun@iiit.ac.in / password123`);
  console.log(`Organizer login:  priya@bits-pilani.ac.in / password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
