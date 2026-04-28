import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './api';
import { collection, onSnapshot, addDoc, updateDoc, doc, setDoc, getDocs } from 'firebase/firestore';

const StoreContext = createContext();

const DUMMY_NEEDS = [
  { id: 'n1',  title: 'Medical Supplies for Relief Camp',   description: 'Need basic first aid, bandages, and immediate care staff for the downstream flood relief camp in North Zone.',          skills_required: ['Medical', 'First Aid'],          urgency: 'critical', location: 'North India',     when_needed: 'Anytime',  status: 'open', created_at: Date.now() },
  { id: 'n2',  title: 'Food Distribution Coordination',     description: 'Need organizers to pack and distribute 2000 meal packets for affected villages.',                                     skills_required: ['Logistics', 'Physical Work'],    urgency: 'medium',   location: 'East India',     when_needed: 'Weekday',  status: 'open', created_at: Date.now() - 100000 },
  { id: 'n3',  title: 'Data Entry for Displaced Families',  description: 'Log family details into the central database for government compensation tracking.',                                 skills_required: ['Data Entry', 'Computer Skills'], urgency: 'low',      location: 'Central India',  when_needed: 'Weekday',  status: 'open', created_at: Date.now() - 200000 },
  { id: 'n4',  title: 'Cyclone Shelter Setup',              description: 'Assist in setting up temporary high-capacity shelters in coastal Odisha.',                                           skills_required: ['Construction', 'Physical Work'], urgency: 'critical', location: 'East India',     when_needed: 'Anytime',  status: 'open', created_at: Date.now() - 300000 },
  { id: 'n5',  title: 'Multilingual Crisis Support',        description: 'Translate safety instruction broadcasts into Bengali and Assamese dialects.',                                        skills_required: ['Translation', 'Communication'],  urgency: 'medium',   location: 'Northeast India',when_needed: 'Weekday',  status: 'open', created_at: Date.now() - 400000 },
  { id: 'n6',  title: 'Aerial Damage Assessment',           description: 'Need licensed drone pilots to map flooded areas and identify stranded individuals.',                                  skills_required: ['Technical', 'Navigation'],       urgency: 'critical', location: 'South India',    when_needed: 'Anytime',  status: 'open', created_at: Date.now() - 500000 },
  { id: 'n7',  title: 'Trauma Counseling for Children',     description: 'Provide psychological first aid to affected children in relief camps.',                                             skills_required: ['Counseling', 'Medical'],         urgency: 'critical', location: 'West India',     when_needed: 'Anytime',  status: 'open', created_at: Date.now() - 600000 },
  { id: 'n8',  title: 'Heavy Vehicle Evacuation',           description: 'Licensed truck drivers needed for immediate transport of equipment to the disaster site.',                          skills_required: ['Driving', 'Logistics'],          urgency: 'critical', location: 'North India',    when_needed: 'Anytime',  status: 'open', created_at: Date.now() - 700000 },
  { id: 'n9',  title: 'Ham Radio Communication',            description: 'Establish communications in remote zones where all cell towers are destroyed.',                                      skills_required: ['Communication', 'Technical'],    urgency: 'critical', location: 'Remote',         when_needed: 'Anytime',  status: 'open', created_at: Date.now() - 800000 },
  { id: 'n10', title: 'Vaccine Cold-Chain Management',      description: 'Logistics specialists to manage temperature-controlled vaccine transport to camps.',                                 skills_required: ['Logistics', 'Medical'],          urgency: 'medium',   location: 'Central India',  when_needed: 'Weekday',  status: 'open', created_at: Date.now() - 900000 },
  { id: 'n11', title: 'Urban Search and Rescue',            description: 'Trained personnel needed for debris clearance and building structural assessment.',                                  skills_required: ['Rescue', 'Construction'],        urgency: 'critical', location: 'West India',     when_needed: 'Anytime',  status: 'open', created_at: Date.now() - 950000 },
  { id: 'n12', title: 'Sanitation & Hygiene Training',      description: 'Educate camp residents on hygiene to prevent post-disaster disease outbreaks.',                                     skills_required: ['Medical', 'Communication'],      urgency: 'low',      location: 'South India',    when_needed: 'Weekend',  status: 'open', created_at: Date.now() - 1000000 },
];

const DUMMY_VOLUNTEERS = [
  { id: 'v1', name: 'Dr. Priya Sharma', skills: ['Medical', 'First Aid', 'Triage'], availability: 'Anytime', zone: 'North India', is_available: true },
  { id: 'v2', name: 'Rahul Desai', skills: ['Logistics', 'Driving', 'Physical Work'], availability: 'Weekends', zone: 'East India', is_available: true },
  { id: 'v3', name: 'Amina Khan', skills: ['Data Entry', 'Translation', 'Communication'], availability: 'Flexible', zone: 'Central India', is_available: true },
  { id: 'v4', name: 'Commander Singh (Retd.)', skills: ['Rescue', 'Navigation', 'Logistics'], availability: 'Anytime', zone: 'North India', is_available: true },
  { id: 'v5', name: 'Anita Patel', skills: ['Counseling', 'Communication'], availability: 'Weekdays', zone: 'South India', is_available: true },
  { id: 'v6', name: 'James Wilson', skills: ['First Aid', 'Cooking'], availability: 'Weekends', zone: 'East India', is_available: true },
  { id: 'v7', name: 'Sarah Lee', skills: ['Data Entry', 'Computer Skills', 'Technical'], availability: 'Remote', zone: 'Remote', is_available: true },
  { id: 'v8', name: 'David Kim', skills: ['Construction', 'Physical Work'], availability: 'Anytime', zone: 'West India', is_available: true },
  { id: 'v9', name: 'Dr. Arjun Mehta', skills: ['Medical', 'Counseling', 'Triage'], availability: 'Anytime', zone: 'South India', is_available: true },
  { id: 'v10', name: 'Sunita Rao', skills: ['Logistics', 'Cooking', 'Physical Work'], availability: 'Weekdays', zone: 'Central India', is_available: true },
  { id: 'v11', name: 'Rajiv Kumar', skills: ['Driving', 'Navigation', 'Logistics'], availability: 'Nights', zone: 'East India', is_available: true },
  { id: 'v12', name: 'Sanjay Gupta', skills: ['Ham Radio', 'Technical', 'Communication'], availability: 'Anytime', zone: 'Remote', is_available: true },
  { id: 'v13', name: 'Meera Reddy', skills: ['Medical', 'Nursing', 'First Aid'], availability: 'Weekdays', zone: 'South India', is_available: true },
  { id: 'v14', name: 'Vikram Malhotra', skills: ['Construction', 'Engineering', 'Rescue'], availability: 'Anytime', zone: 'North India', is_available: true },
  { id: 'v15', name: 'Kavita Iyer', skills: ['Translation', 'Communication', 'Writing'], availability: 'Flexible', zone: 'South India', is_available: true },
  { id: 'v16', name: 'Zaid Ahmed', skills: ['Physical Work', 'Driving', 'Navigation'], availability: 'Nights', zone: 'West India', is_available: true },
  { id: 'v17', name: 'Deepa Mukherji', skills: ['Logistics', 'Data Entry', 'Computer Skills'], availability: 'Flexible', zone: 'East India', is_available: true },
  { id: 'v18', name: 'Lt. John Davis', skills: ['Rescue', 'Technical', 'Navigation'], availability: 'Anytime', zone: 'North India', is_available: true },
  { id: 'v19', name: 'Rohit Verma', skills: ['Driving', 'Construction', 'Logistics'], availability: 'Weekends', zone: 'North India', is_available: true },
  { id: 'v20', name: 'Neha Joshi', skills: ['Medical', 'Triage', 'First Aid'], availability: 'Anytime', zone: 'West India', is_available: true },
  { id: 'v21', name: 'Suresh Menon', skills: ['Rescue', 'Navigation', 'Physical Work'], availability: 'Anytime', zone: 'South India', is_available: true },
  { id: 'v22', name: 'Aditi Bose', skills: ['Counseling', 'Psychology', 'Communication'], availability: 'Flexible', zone: 'East India', is_available: true },
  { id: 'v23', name: 'Kartik Aryan', skills: ['Technical', 'Drones', 'Navigation'], availability: 'Anytime', zone: 'South India', is_available: true },
  { id: 'v24', name: 'Priya Mani', skills: ['Translation', 'Data Entry', 'Communication'], availability: 'Weekdays', zone: 'Central India', is_available: true },
  { id: 'v25', name: 'Abhishek Roy', skills: ['First Aid', 'Nursing', 'Medical'], availability: 'Anytime', zone: 'East India', is_available: true }
];

const DUMMY_MATCHES = [
  { id: 'm1', need_id: 'n4', volunteer_id: 'v4', ai_justification: 'Commander Singh possesses critical Rescue and Navigation skills required for boat operation, and is located in the North Zone where the alert was raised.', confirmed: true, created_at: Date.now() - 400000 }
];

export const StoreProvider = ({ children }) => {
  const [needs, setNeeds] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const seedDatabase = async () => {
      try {
        const vSnap = await getDocs(collection(db, 'volunteers'));
        const nSnap = await getDocs(collection(db, 'needs'));
        const hasGoldData = vSnap.docs.some(d => d.id === 'v25');
        const hasScheduleField = nSnap.docs.some(d => d.data().when_needed);

        if (!hasGoldData) {
          console.log("Seeding Firebase with the High-Fidelity Gold Dataset...");
          for (const v of DUMMY_VOLUNTEERS) await setDoc(doc(db, 'volunteers', v.id), v);
          for (const n of DUMMY_NEEDS) await setDoc(doc(db, 'needs', n.id), n);
          for (const m of DUMMY_MATCHES) await setDoc(doc(db, 'matches', m.id), m);
          console.log("Full seeding complete!");
        } else if (!hasScheduleField) {
          console.log("Patching needs with when_needed field...");
          for (const n of DUMMY_NEEDS) await setDoc(doc(db, 'needs', n.id), n);
          console.log("Needs patch complete!");
        }
      } catch (err) {
        console.error("Error seeding DB:", err);
      }
    };
    seedDatabase();
  }, []);

  useEffect(() => {
    const unsubNeeds = onSnapshot(collection(db, 'needs'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNeeds(data.sort((a, b) => b.created_at - a.created_at));
    });

    const unsubVolunteers = onSnapshot(collection(db, 'volunteers'), (snapshot) => {
      setVolunteers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMatches = onSnapshot(collection(db, 'matches'), (snapshot) => {
      setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubNeeds();
      unsubVolunteers();
      unsubMatches();
    };
  }, []);

  const addNeed = async (need) => {
    await addDoc(collection(db, 'needs'), {
      ...need,
      created_at: Date.now(),
      status: 'open'
    });
  };

  const updateNeedStatus = async (needId, status) => {
    await updateDoc(doc(db, 'needs', needId), { status });
  };

  const addVolunteer = async (volunteer) => {
    await addDoc(collection(db, 'volunteers'), {
      ...volunteer,
      is_available: true
    });
  };

  const addMatch = async (match) => {
    await addDoc(collection(db, 'matches'), {
      ...match,
      created_at: Date.now(),
      confirmed: false
    });
  };

  const confirmMatch = async (volunteerId, needId, justification) => {
    // 1. Record the match
    await addDoc(collection(db, 'matches'), {
      volunteer_id: volunteerId,
      need_id: needId,
      ai_justification: justification,
      confirmed: true,
      status: 'deployed',
      created_at: Date.now()
    });

    // 2. Update Need status
    await updateDoc(doc(db, 'needs', needId), { status: 'matched' });

    // 3. Update Volunteer status (busy)
    await updateDoc(doc(db, 'volunteers', volunteerId), { is_available: false });
  };

  const completeMatch = async (matchId, volunteerId, needId) => {
    // 1. Update Match status
    await updateDoc(doc(db, 'matches', matchId), { status: 'completed' });

    // 2. Update Need status to fulfilled
    await updateDoc(doc(db, 'needs', needId), { status: 'fulfilled' });

    // 3. Make Volunteer available again
    await updateDoc(doc(db, 'volunteers', volunteerId), { is_available: true });
  };

  return (
    <StoreContext.Provider value={{
      needs, addNeed, updateNeedStatus,
      volunteers, addVolunteer,
      matches, addMatch, confirmMatch, completeMatch,
      loading
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
