# VolunteerMatch AI 🤝

> A smart resource allocation platform built for the Hack2Skill × Google for Developers — Solution Challenge 2026.

VolunteerMatch AI is a web-based artificial intelligence platform that empowers NGO administrators to seamlessly match available personnel with urgent community needs in real-time. By leveraging Google's Gemini AI, we eliminate the need for manual, spreadsheet-based coordination, replacing it with an explainable, data-driven matching engine.

---

## 🛑 Problem Statement
During critical emergencies—such as flood relief, earthquakes, or civil crises—every minute saved on logistics translates directly to **lives saved**. Local social groups and NGOs collect community needs data through paper surveys and fragmented messages. This data is often siloed and scattered. When disaster strikes, it becomes nearly impossible to instantly see a geographic overview of where help is needed most, or to quickly connect the *right* available volunteers to the most urgent tasks.

## 💡 Solution Overview
**VolunteerMatch AI** is a centralized web dashboard that solves this coordination crisis. NGO admins can list "Community Needs" (annotated with urgency, location, and skills) alongside a registry of available volunteers. 

Instead of an admin manually reading hundreds of rows to assign tasks, the system uses the **Google Gemini API** (gemini-2.0-flash-lite) to intelligently reason over unstructured volunteer profiles and community needs. With a single click of "Find AI Match," the engine produces a ranked list of the top 3 best-suited volunteers, evaluated against a strict 5-factor rubric (Skills, Zone, Availability, Skill Depth, and Specialisation), accompanied by natural language justifications for *why* they are the perfect fit.

### Key Features
- **Live Disaster Map:** A real-time geographic visualization mapping urgent needs and volunteer locations.
- **Operational Analytics:** Dynamic charts providing a high-level overview of crisis zones and volunteer deployments.
- **Community Needs Board:** Visualize and prioritize alerts by urgency (Critical/Medium/Low).
- **Volunteer Registry:** Maintain a living database of available help, zoned by location and tagged by skills.
- **AI Matching Engine:** Unbiased, deterministic matching using Gemini AI. Follows a strict 5-factor heuristic rubric to guarantee high-quality matches.
- **Explainable AI:** Gemini provides a human-readable justification for every match it suggests, building trust with NGO workers.
- **Schedule Compatibility:** The engine inherently understands time. It compares "When Needed" parameters against volunteer availability windows, safely handling mismatches or immediate urgency.
- **Mission Control & Deployment Tracking:** A dedicated lifecycle management view to track "En Route" volunteers and mark missions as fulfilled.
- **Fulfilled Requests Archive:** Instantly tracks the history of successfully completed community needs with dynamically updated timestamps.
- **Dynamic Resource Balancing:** Matched volunteers are automatically set to 'Busy' in the database until their mission is complete, ensuring the AI never over-allocates the same personnel.
- **Real-time Synchronization:** Powered by Firebase Firestore, ensuring multiple admins see updates instantly.

## 🚀 Technologies Used
- Frontend: **React** (Single-file simplified UI via Vite)
- Styling: **Tailwind CSS**
- Database & Hosting: **Firebase** (Firestore Database, Firebase Hosting)
- AI Integration: **Google Gemini API** (gemini-2.0-flash-lite)
- Icons: **Lucide React**

## 💻 Running the Prototype Locally

To test this prototype locally, follow these steps:

1. Clone this repository.
2. Ensure you have Node.js installed.
3. Run `npm install` to grab the dependencies.
4. Create a `.env` file in the root directory and add your Gemini API Key: `VITE_GEMINI_API_KEY=your_api_key_here`
5. Run `npm run dev` to start the frontend server.
6. (Optional) If you didn't set up the `.env` file, you can click the "Sparkles" settings icon in the bottom right corner of the dashboard to input your API Key before testing the AI matching!
6. Open `src/App.jsx` to view the entire simplified UI structure in one place.

---
*Built with ❤️ for Solution Challenge 2026.*
