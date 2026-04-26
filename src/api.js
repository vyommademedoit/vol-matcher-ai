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

export const runGeminiMatch = async (need, volunteers) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key is required in .env');

  const prompt = `You are a volunteer coordinator AI expert. 
Given this community need:
${JSON.stringify({ ...need, id: undefined })}

And these available volunteers:
${JSON.stringify(volunteers.map(v => ({...v, id: v.id, name: v.name, skills: v.skills, zone: v.zone, availability: v.availability})))}

Return a JSON array of the top 3 best volunteer matches, ranked by fit.
Each item should have: "volunteer_id", "score" (1-10), "reason" (1 concise sentence explaining exactly why they fit the need's skills and location).

Return ONLY valid JSON array. No markdown, no explanation outside the array.`;

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

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
    throw new Error(err.error?.message || 'Failed to fetch from Gemini');
  }

  const data = await response.json();
  const textContent = data.candidates[0].content.parts[0].text;
  try {
    const cleaned = textContent.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error("Failed to parse Gemini output as JSON");
  }
};
