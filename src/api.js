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

export const runAIVolunteerMatch = async (need, volunteers) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  // Fallback function for local matching
  const fallbackMatch = async (need, volunteers) => {
    console.log("Using local fallback matching logic...");
    // Simulate a bit of AI thinking time for the demo feel
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return volunteers
      .map(v => {
        const overlap = v.skills.filter(s => need.skills_required.includes(s)).length;
        const zoneMatch = v.zone === need.location ? 2 : 0;
        const score = Math.min(10, overlap * 2 + zoneMatch + 2);
        return {
          volunteer_id: v.id,
          score: score,
          reason: `Highly compatible based on ${overlap} matching skills (${v.skills.slice(0, 2).join(', ')}...) and strategic presence in the ${v.zone}.`
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  if (!apiKey) {
    return fallbackMatch(need, volunteers);
  }

  const prompt = `You are a volunteer coordinator AI expert. 
Given this community need:
${JSON.stringify({ ...need, id: undefined })}

And these available volunteers:
${JSON.stringify(volunteers.map(v => ({...v, id: v.id, name: v.name, skills: v.skills, zone: v.zone, availability: v.availability})))}

Return a JSON array of the top 3 best volunteer matches, ranked by fit.
Each item should have: "volunteer_id", "score" (1-10), "reason" (1 concise sentence explaining exactly why they fit the need's skills and location).

Return ONLY valid JSON array. No markdown, no explanation outside the array.`;

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
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
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Critical Match Error, using safety fallback:", e);
    return fallbackMatch(need, volunteers);
  }
};
