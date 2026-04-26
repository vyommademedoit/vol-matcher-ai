import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './api';
import { collection, onSnapshot, addDoc, updateDoc, doc, setDoc, getDocs } from 'firebase/firestore';

const StoreContext = createContext();

const DUMMY_NEEDS = [
  { id: 'n1', title: 'Medical Supplies for Relief Camp', description: 'Need basic first aid, bandages, and immediate care staff for the downstream flood relief camp.', skills_required: ['Medical', 'First Aid'], urgency: 'critical', location: 'North Zone', status: 'open', created_at: Date.now() },
  { id: 'n2', title: 'Food Distribution Coordination', description: 'Need organizers to pack and distribute 500 meal packets.', skills_required: ['Logistics', 'Physical Work'], urgency: 'medium', location: 'East Zone', status: 'open', created_at: Date.now() - 100000 },
  { id: 'n3', title: 'Data Entry for Displaced Families', description: 'Log family details into the central database for government compensation.', skills_required: ['Data Entry', 'Computer Skills'], urgency: 'low', location: 'Central Zone', status: 'open', created_at: Date.now() - 200000 },
  { id: 'n4', title: 'Rescue Boat Operator', description: 'Need experienced personnel to help navigate flooded streets.', skills_required: ['Navigation', 'Rescue'], urgency: 'critical', location: 'North Zone', status: 'matched', created_at: Date.now() - 500000 },
  { id: 'n5', title: 'Translation Services - Regional', description: 'Translate safety instruction broadcasts into local dialects.', skills_required: ['Translation', 'Communication'], urgency: 'medium', location: 'Remote', status: 'fulfilled', created_at: Date.now() - 800000 },
  { id: 'n6', title: 'Temporary Shelter Construction', description: 'Need able-bodied volunteers to help assemble emergency tents in the stadium.', skills_required: ['Construction', 'Physical Work'], urgency: 'critical', location: 'West Zone', status: 'open', created_at: Date.now() - 300000 },
  { id: 'n7', title: 'Trauma Counseling Specialist', description: 'Provide psychological first aid to affected children and families.', skills_required: ['Counseling', 'Medical'], urgency: 'critical', location: 'South Zone', status: 'open', created_at: Date.now() - 400000 },
  { id: 'n8', title: 'Transport Drivers for Evacuation', description: 'Need licensed heavy vehicle drivers for immediate coastal evacuation.', skills_required: ['Driving', 'Logistics'], urgency: 'critical', location: 'East Zone', status: 'open', created_at: Date.now() - 600000 },
  { id: 'n9', title: 'Emergency Radio Operator', description: 'Maintain communications with remote camps where cell networks are down.', skills_required: ['Communication', 'Technical'], urgency: 'medium', location: 'Remote', status: 'open', created_at: Date.now() - 900000 },
  { id: 'n10', title: 'Clean Water Distribution', description: 'Coordinate the delivery of 2000 liters of fresh water to isolated neighborhoods.', skills_required: ['Logistics', 'Driving'], urgency: 'medium', location: 'South Zone', status: 'open', created_at: Date.now() - 150000 },
];

const DUMMY_VOLUNTEERS = [
  { id: 'v1', name: 'Dr. Priya Sharma', skills: ['Medical', 'First Aid', 'Triage'], availability: 'Weekends', zone: 'North Zone', is_available: true },
  { id: 'v2', name: 'Rahul Desai', skills: ['Logistics', 'Driving', 'Physical Work'], availability: 'Evenings', zone: 'East Zone', is_available: true },
  { id: 'v3', name: 'Amina Khan', skills: ['Data Entry', 'Translation', 'Communication'], availability: 'Flexible', zone: 'Central Zone', is_available: true },
  { id: 'v4', name: 'Commander Singh (Retd.)', skills: ['Rescue', 'Navigation', 'Logistics'], availability: 'Anytime', zone: 'North Zone', is_available: false },
  { id: 'v5', name: 'Anita Patel', skills: ['Counseling', 'Communication'], availability: 'Weekdays', zone: 'South Zone', is_available: true },
  { id: 'v6', name: 'James Wilson', skills: ['First Aid', 'Cooking'], availability: 'Weekends', zone: 'East Zone', is_available: true },
  { id: 'v7', name: 'Sarah Lee', skills: ['Data Entry', 'Computer Skills', 'Writing'], availability: 'Remote', zone: 'Remote', is_available: true },
  { id: 'v8', name: 'David Kim', skills: ['Construction', 'Physical Work'], availability: 'Weekends', zone: 'West Zone', is_available: true },
  { id: 'v9', name: 'Dr. Arjun Mehta', skills: ['Medical', 'Counseling'], availability: 'Anytime', zone: 'South Zone', is_available: true },
  { id: 'v10', name: 'Sunita Rao', skills: ['Logistics', 'Cooking', 'Physical Work'], availability: 'Weekdays', zone: 'Central Zone', is_available: true },
  { id: 'v11', name: 'Rajiv Kumar', skills: ['Driving', 'Navigation', 'Logistics'], availability: 'Nights', zone: 'East Zone', is_available: true },
  { id: 'v12', name: 'Maria Garcia', skills: ['Translation', 'Data Entry'], availability: 'Flexible', zone: 'West Zone', is_available: true },
  { id: 'v13', name: 'Lt. John Davis', skills: ['Rescue', 'Technical', 'Navigation'], availability: 'Anytime', zone: 'North Zone', is_available: true },
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
        if (vSnap.docs.length < 10) { // Force seed if we have fewer than 10 docs to ensure new data is added
          console.log("Seeding Firebase with additional dummy data...");
          for (const v of DUMMY_VOLUNTEERS) await setDoc(doc(db, 'volunteers', v.id), v);
          for (const n of DUMMY_NEEDS) await setDoc(doc(db, 'needs', n.id), n);
          for (const m of DUMMY_MATCHES) await setDoc(doc(db, 'matches', m.id), m);
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

  const confirmMatch = async (matchId, needId) => {
    await updateDoc(doc(db, 'needs', needId), { status: 'matched' });
  };

  return (
    <StoreContext.Provider value={{
      needs, addNeed, updateNeedStatus,
      volunteers, addVolunteer,
      matches, addMatch, confirmMatch,
      loading
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
