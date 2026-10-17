/** Seed: demo students + sample hackathons + a recruiting team.
 *  Run: npx prisma db seed  (configured in package.json) */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const skills = (...s: string[]) => JSON.stringify(s);

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
  const d = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const arjun = await prisma.user.create({
    data: {
      email: "arjun@iiit.ac.in", passwordHash, name: "Arjun Mehta", verified: true,
      primaryRole: "BACKEND", bio: "Full-stack dev who loves Go and PostgreSQL. 3 hackathons in.",
      skills: skills("Go", "React", "PostgreSQL", "Docker"),
      githubUrl: "https://github.com/arjunm", linkedinUrl: "https://linkedin.com/in/arjunm",
      discordHandle: "arjunm#4412", availability: "AVAILABLE",
    },
  });
  const priya = await prisma.user.create({
    data: {
      email: "priya@nitk.edu.in", passwordHash, name: "Priya Nair", verified: true,
      primaryRole: "UIUX", bio: "Design engineer. Figma + motion. I make pixels behave.",
      skills: skills("Figma", "React", "CSS", "Prototyping"),
      portfolioUrl: "https://priya.design", discordHandle: "priya_n",
      availability: "AVAILABLE",
    },
  });
  const rahul = await prisma.user.create({
    data: {
      email: "rahul@iitm.ac.in", passwordHash, name: "Rahul Iyer", verified: true,
      primaryRole: "AIML", bio: "ML student — PyTorch, RAG, and too much coffee.",
      skills: skills("Python", "PyTorch", "FastAPI", "LangChain"),
      githubUrl: "https://github.com/rahuli", whatsappNo: "+919876543210",
      availability: "BUSY",
    },
  });

  const sih = await prisma.hackathon.create({
    data: {
      name: "Smart India Hackathon 2026",
      tagline: "India's biggest hackathon — innovate for a billion people",
      description:
        "SIH is a nationwide flagship hackathon organized by AICTE. Solve real problems posed by ministries and industries in 36 hours.",
      mode: "HYBRID", location: "Campus nodal centres", orgType: "INTERNAL",
      prizePool: 100000, registrationDeadline: d(12), startDate: d(20), endDate: d(22),
      techTags: skills("React", "Python", "IoT", "AI/ML"), minTeamSize: 4, maxTeamSize: 6,
      url: "https://sih.gov.in",
    },
  });
  const gdg = await prisma.hackathon.create({
    data: {
      name: "GDG Solution Challenge 2027",
      tagline: "Build with Google tech, ship for social impact",
      description:
        "Solution Challenge invites students to build projects using Google technologies (Firebase, Flutter, AI APIs) solving local problems.",
      mode: "ONLINE", orgType: "EXTERNAL", prizePool: 250000,
      registrationDeadline: d(30), startDate: d(35), endDate: d(37),
      techTags: skills("Flutter", "Firebase", "AI/ML", "React"), minTeamSize: 1, maxTeamSize: 4,
      url: "https://developers.google.com/community/gdsc-solution-challenge",
    },
  });
  await prisma.hackathon.create({
    data: {
      name: "HackVIT '26",
      tagline: "48h sprint at VIT Vellore",
      description: "In-person 48-hour hackathon with mentorship from industry engineers and on-the-spot prizes.",
      mode: "OFFLINE", location: "VIT Vellore, TN", orgType: "EXTERNAL",
      prizePool: 200000, registrationDeadline: d(-2), startDate: d(5), endDate: d(7),
      techTags: skills("React", "Node.js", "AI/ML"), minTeamSize: 2, maxTeamSize: 5,
    },
  });

  // Arjun's recruiting team for SIH: needs a UIUX + an AIML
  const team = await prisma.team.create({
    data: {
      hackathonId: sih.id, createdById: arjun.id,
      name: "Kernel Panic", description: "Building a crop-disease detector for farmers. Go + React backend, need design & ML.",
      openSlots: 2, requiredRoles: skills("UIUX", "AIML"), requiredSkills: skills("Figma", "PyTorch"),
      contactChannel: "DISCORD", contactValue: "https://discord.gg/kernelpanic",
    },
  });
  await prisma.teamMember.create({
    data: { teamId: team.id, userId: arjun.id, role: "BACKEND", isLeader: true },
  });

  await prisma.soloPost.create({
    data: {
      hackathonId: gdg.id, userId: priya.id,
      pitch: "UI/UX + frontend, looking for a backend buddy and an ML friend for the Solution Challenge!",
    },
  });
  await prisma.bookmark.create({ data: { userId: arjun.id, hackathonId: gdg.id } });

  console.log(`Seeded 3 students, 3 hackathons, 1 team, 1 solo post.`);
  console.log(`Demo login: arjun@iiit.ac.in / password123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
