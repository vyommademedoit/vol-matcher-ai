import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBFJnF29jR0gPrGp0Mxuyx8OK9vHuEGwkY",
  authDomain: "volunteer-matcherai.firebaseapp.com",
  projectId: "volunteer-matcherai",
  storageBucket: "volunteer-matcherai.firebasestorage.app",
  messagingSenderId: "1037058744489",
  appId: "1:1037058744489:web:312c3f310fcefebdaa89b8",
  measurementId: "G-36GMHNG427"
};

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const db = getFirestore(app);
export const auth = getAuth(app);

// --- Availability compatibility scoring ---
// "Anytime"/"Flexible" volunteers are universally available.
// For critical needs, prefer those available right now vs. weekends-only.
const AVAILABILITY_SCORE = {
  'Anytime':   3,
  'Flexible':  2.5,
  'Weekdays':  2,
  'Weekends':  1.5,
  'Evenings':  1.5,
  'Nights':    1,
  'Remote':    1,
};

// Zone adjacency map — partial credit when a volunteer is in a neighbouring zone
const ZONE_ADJACENCY = {
  'North India':     ['Northeast India', 'Central India'],
  'Northeast India': ['North India', 'East India'],
  'East India':      ['Northeast India', 'Central India'],
  'South India':     ['Central India', 'West India'],
  'West India':      ['North India', 'Central India', 'South India'],
  'Central India':   ['North India', 'East India', 'South India', 'West India'],
  'Remote':          [],
};

// Schedule compatibility: does need's when_needed align with volunteer's availability?
// 1.0 = full match, 0.5 = partial, 0.0 = hard mismatch
const SCHEDULE_COMPAT = {
  'Anytime': { 'Anytime': 1.0, 'Weekdays': 1.0, 'Weekends': 1.0, 'Evenings': 1.0, 'Nights': 1.0, 'Flexible': 1.0, 'Remote': 1.0 },
  'Weekday': { 'Anytime': 1.0, 'Weekdays': 1.0, 'Flexible': 1.0, 'Evenings': 0.5, 'Remote': 0.5, 'Nights': 0.3, 'Weekends': 0.0 },
  'Weekend': { 'Anytime': 1.0, 'Weekends': 1.0, 'Flexible': 1.0, 'Evenings': 0.5, 'Remote': 0.5, 'Nights': 0.3, 'Weekdays': 0.0 },
  'Evening': { 'Anytime': 1.0, 'Evenings': 1.0, 'Flexible': 1.0, 'Nights': 0.7, 'Weekdays': 0.5, 'Weekends': 0.5, 'Remote': 0.5 },
  'Night':   { 'Anytime': 1.0, 'Nights': 1.0, 'Flexible': 1.0, 'Evenings': 0.7, 'Weekdays': 0.3, 'Weekends': 0.3, 'Remote': 0.5 },
};

/**
 * Deterministic local scoring — mirrors the rubric sent to Gemini.
 * Factors (all normalised to 0–10):
 *  1. Skills overlap ratio        → up to 4 pts
 *  2. Zone match (exact/adjacent) → up to 2 pts
 *  3. Availability compatibility  → up to 2 pts (urgency-weighted)
 *  4. Skill depth bonus           → up to 1 pt  (more skills = wider capability)
 *  5. Specialisation bonus        → up to 1 pt  (rare/critical skills rewarded)
 */
const scoreVolunteer = (v, need) => {
  const required = need.skills_required || [];
  const volSkills = v.skills || [];

  // 1. Skills overlap ratio (0–4)
  const matchedSkills = volSkills.filter(s => required.includes(s));
  const overlapRatio = required.length > 0 ? matchedSkills.length / required.length : 0;
  const skillScore = overlapRatio * 4;

  // 2. Zone match (0–2): exact = 2, adjacent = 1, else 0
  let zoneScore = 0;
  if (v.zone === need.location) {
    zoneScore = 2;
  } else if ((ZONE_ADJACENCY[need.location] || []).includes(v.zone)) {
    zoneScore = 1;
  }

  // 3. Schedule & Availability Compatibility (0–2)
  // a) Base availability level
  const baseAvail = AVAILABILITY_SCORE[v.availability] ?? 1;
  const urgencyMult = need.urgency === 'critical' ? 1 : need.urgency === 'medium' ? 0.8 : 0.6;
  // b) Schedule compatibility: volunteer's window vs. when the need occurs
  const whenNeeded = need.when_needed || 'Anytime';
  const schedCompatMap = SCHEDULE_COMPAT[whenNeeded] || {};
  let scheduleCompat = schedCompatMap[v.availability] ?? 0.5;
  // Critical needs: always give a floor of 0.4 so no one is fully excluded
  if (need.urgency === 'critical') scheduleCompat = Math.max(scheduleCompat, 0.4);
  const availScore = (baseAvail / 3) * 2 * urgencyMult * scheduleCompat;

  // 4. Skill depth bonus (0–1)
  const extraSkills = volSkills.length - matchedSkills.length;
  const depthScore = Math.min(1, extraSkills * 0.2);

  // 5. Specialisation bonus (0–1)
  const CRITICAL_SKILLS = ['Medical', 'Triage', 'Rescue', 'Technical', 'Ham Radio', 'Drones', 'Engineering'];
  const hasSpecialism = matchedSkills.some(s => CRITICAL_SKILLS.includes(s));
  const specialScore = hasSpecialism ? 1 : 0;

  const total = skillScore + zoneScore + availScore + depthScore + specialScore;
  return {
    raw: total,
    score: Math.min(10, Math.round(total * 10) / 10),
    matchedSkills,
    overlapRatio,
    zoneScore,
    availScore,
    scheduleCompat,
    whenNeeded,
  };
};

/** Build a human-readable reason sentence from the scored factors */
const buildReason = (v, need, scored) => {
  const { matchedSkills, overlapRatio, zoneScore, scheduleCompat, whenNeeded } = scored;
  const skillPart = matchedSkills.length > 0
    ? `matches ${Math.round(overlapRatio * 100)}% of required skills (${matchedSkills.join(', ')})`
    : 'has complementary skills that may support the operation';
  const zonePart = zoneScore === 2
    ? `is located directly in ${v.zone}`
    : zoneScore === 1
    ? `is in the adjacent zone (${v.zone}), enabling rapid deployment`
    : `can deploy remotely from ${v.zone}`;
  let schedPart;
  if (scheduleCompat === 1.0) {
    schedPart = `Schedule is a full match (${v.availability} vs ${whenNeeded} need)`;
  } else if (scheduleCompat >= 0.5) {
    schedPart = `Partial schedule overlap — available ${v.availability}, need is ${whenNeeded}`;
  } else {
    schedPart = `⚠ Schedule mismatch: volunteer is ${v.availability} only but need is ${whenNeeded} — special coordination required`;
  }
  const urgencyNote = need.urgency === 'critical' ? ' Critical priority.' : '';
  return `${v.name} ${skillPart}, ${zonePart}. ${schedPart}.${urgencyNote}`;
};

/** Pre-filter: return the top N volunteers ranked by the local rubric before sending to Gemini */
const preFilterVolunteers = (need, volunteers, topN = 10) => {
  return volunteers
    .map(v => ({ v, scored: scoreVolunteer(v, need) }))
    .sort((a, b) => b.scored.raw - a.scored.raw)
    .slice(0, topN)
    .map(({ v }) => v);
};

export const runAIVolunteerMatch = async (need, volunteers) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // --- Improved deterministic fallback ---
  const fallbackMatch = async (need, volunteers) => {
    console.log("Using improved local fallback matching logic...");
    await new Promise(resolve => setTimeout(resolve, 1000));

    return volunteers
      .map(v => {
        const scored = scoreVolunteer(v, need);
        return {
          volunteer_id: v.id,
          score: scored.score,
          reason: buildReason(v, need, scored),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  if (!apiKey) {
    return fallbackMatch(need, volunteers);
  }

  // Pre-filter to the most relevant candidates before calling Gemini
  const candidates = preFilterVolunteers(need, volunteers, 10);

  const prompt = `You are an expert disaster-relief volunteer coordinator AI.

## Community Need
${JSON.stringify({ ...need, id: undefined }, null, 2)}

## Available Volunteers (pre-ranked by relevance)
${JSON.stringify(candidates.map(v => ({
  id: v.id,
  name: v.name,
  skills: v.skills,
  zone: v.zone,
  availability: v.availability,
})), null, 2)}

## Matching Rubric (use this exact scoring framework)
Score each volunteer out of 10 using these weighted criteria:
1. **Skills Overlap (40%)** — What % of the need's required skills does the volunteer cover? Full coverage = 4 pts.
2. **Zone Proximity (20%)** — Exact zone match = 2 pts. Adjacent zone = 1 pt. Remote/distant = 0 pts.
3. **Schedule & Availability Fit (20%)** — Compare the need's "when_needed" field to the volunteer's "availability". Exact match (e.g. Weekday need + Weekdays volunteer) or Anytime/Flexible = 2 pts. Partial overlap = 1 pt. Hard mismatch (e.g. Weekday need + Weekends-only volunteer) = 0 pts. For CRITICAL urgency apply a floor of 0.5 pts even on mismatches. Mention any mismatch clearly in the reason.
4. **Skill Depth (10%)** — Volunteer has additional relevant skills beyond the minimum required. More versatility = up to 1 pt.
5. **Specialisation Bonus (10%)** — Volunteer has rare/high-value skills (Medical, Triage, Rescue, Engineering, Technical, Ham Radio, Drones) that directly match the need = 1 pt.

## Output Requirements
Return a JSON array of the TOP 3 volunteers, ranked best-to-worst.
Each item MUST have:
- "volunteer_id": string (the volunteer's id field)
- "score": number (1–10, one decimal place, e.g. 8.5)
- "reason": string (2 sentences MAX — first sentence names the key matched skills and zone fit, second sentence explains why they are the best choice for THIS specific need given its urgency)

Return ONLY the raw JSON array. No markdown fences, no extra text.`;

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, topP: 0.8 }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.warn("Gemini API Error, switching to fallback:", err);
      return fallbackMatch(need, volunteers);
    }

    const data = await response.json();
    const textContent = data.candidates[0].content.parts[0].text;
    const cleaned = textContent.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Validate and ensure scores are numbers
    return parsed.map(m => ({
      ...m,
      score: typeof m.score === 'number' ? m.score : parseFloat(m.score) || 0,
    }));
  } catch (e) {
    console.error("Critical Match Error, using safety fallback:", e);
    return fallbackMatch(need, volunteers);
  }
};
