import React, { useState } from 'react';
import { StoreProvider, useStore } from './store';
// Build ID: 2026-04-26-2026-GOLD-DATA
import { runAIVolunteerMatch as runAIVMatch } from './api';
import { LayoutDashboard, AlertCircle, Sparkles, Check, X, Clock, HelpCircle, Users, UserPlus, MapPin, Heart, Home, BarChart2, Map as MapIcon, Calendar } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const timeAgo = (ts) => {
  if (!ts) return 'Unknown';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const ZONE_COORDS = {
  'North India':     [30.0668, 79.0193],  // Uttarakhand/UP hills
  'Northeast India': [26.2006, 92.9376],  // Assam/Guwahati
  'East India':      [20.9517, 85.0985],  // Odisha/West Bengal
  'South India':     [13.0827, 80.2707],  // Chennai/TN coast
  'West India':      [23.0225, 72.5714],  // Gujarat/Ahmedabad
  'Central India':   [23.2599, 77.4126],  // Bhopal/MP
  'Remote':          [27.5706, 88.4694],  // Sikkim/Isolated
  // Legacy aliases for old Firebase data
  'North Zone':      [30.0668, 79.0193],
  'East Zone':       [20.9517, 85.0985],
  'South Zone':      [13.0827, 80.2707],
  'West Zone':       [23.0225, 72.5714],
  'Central Zone':    [23.2599, 77.4126],
};

const getNeedIcon = (urgency) => {
  let colorClass = 'bg-red-500 border-red-300 shadow-lg';
  if (urgency === 'medium') colorClass = 'bg-brand-gold border-brand-bright/50 shadow-md';
  if (urgency === 'low') colorClass = 'bg-green-500 border-white/50 shadow-sm';
  
  return new L.divIcon({
    className: `${colorClass} w-4 h-4 rounded-full border-2 animate-pulse`,
    iconSize: [16, 16]
  });
};

const getVolunteerIcon = (isAvailable) => {
  const colorClass = isAvailable 
    ? 'bg-brand-gold border-white/50 shadow-md'
    : 'bg-slate-500 border-slate-400 shadow-sm';
    
  return new L.divIcon({
    className: `${colorClass} w-3 h-3 rounded-full border`,
    iconSize: [12, 12]
  });
};

const URGENCY_STYLES = {
  low: 'bg-green-900/30 text-green-400 border-green-800/50',
  medium: 'bg-brand-gold/10 text-brand-gold border-brand-gold/30',
  critical: 'bg-red-900/30 text-red-400 border-red-800/50'
};

// --- MODALS ---

const AddNeedModal = ({ isOpen, onClose }) => {
  const { addNeed } = useStore();
  const [formData, setFormData] = useState({ title: '', description: '', skills: [], urgency: 'low', location: '', when_needed: 'Anytime' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || formData.skills.length === 0 || !formData.location) return;
    addNeed({
      ...formData,
      skills_required: formData.skills
    });
    setFormData({ title: '', description: '', skills: [], urgency: 'low', location: '', when_needed: 'Anytime' });
    onClose();
  };

  const toggleSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill) 
        : [...prev.skills, skill]
    }));
  };

  const selectClass = "w-full px-3 py-2 bg-brand-dark border border-brand-light/20 text-brand-bright rounded-lg focus:ring-2 focus:ring-brand-gold outline-none transition-colors appearance-none cursor-pointer";

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-brand-card border border-brand-light/10 rounded-2xl shadow-2xl shadow-brand-gold/5 w-full max-w-lg overflow-hidden animate-slide-up">
        <div className="px-6 py-4 border-b border-brand-light/5 flex justify-between items-center bg-brand-card/50">
          <h3 className="text-lg font-semibold text-brand-bright flex items-center gap-2">
            <AlertCircle size={20} className="text-brand-gold" />
            Declare Community Need
          </h3>
          <button onClick={onClose} className="text-brand-light hover:text-brand-bright transition-colors">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-brand-light mb-1">Title</label>
            <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 bg-brand-dark border border-brand-light/20 text-brand-bright rounded-lg focus:ring-2 focus:ring-brand-gold outline-none transition-colors" placeholder="e.g., Medical Supplies Needed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-light mb-1">Description</label>
            <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 bg-brand-dark border border-brand-light/20 text-brand-bright rounded-lg focus:ring-2 focus:ring-brand-gold outline-none transition-colors" rows="3" placeholder="Describe the need..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-light mb-2">
              Required Skills <span className="text-brand-light/50 font-normal">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    formData.skills.includes(skill)
                      ? 'bg-brand-gold/20 text-brand-gold border-brand-gold/50 shadow-[0_0_8px_rgba(154,225,157,0.2)]'
                      : 'bg-brand-dark text-brand-light border-brand-light/10 hover:border-brand-gold/50'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
            {formData.skills.length === 0 && <p className="text-xs text-brand-gold/70 mt-1">Please select at least one skill.</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Urgency</label>
              <select value={formData.urgency} onChange={e => setFormData({ ...formData, urgency: e.target.value })} className={selectClass}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Location / Zone</label>
              <select required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className={selectClass}>
                <option value="" disabled>Select Zone...</option>
                {ZONE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">When is help needed?</label>
            <select value={formData.when_needed} onChange={e => setFormData({ ...formData, when_needed: e.target.value })} className={selectClass}>
              {WHEN_NEEDED_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-brand-dark text-brand-light rounded-lg font-medium hover:bg-brand-card transition-colors border border-brand-light/10">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-brand-gold text-brand-dark rounded-lg font-bold hover:bg-brand-gold/90 shadow-xl shadow-black/20 transition-all">Post Need</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SKILL_OPTIONS = ['Medical', 'First Aid', 'Triage', 'Rescue', 'Navigation', 'Logistics', 'Driving', 'Physical Work', 'Data Entry', 'Computer Skills', 'Translation', 'Communication', 'Counseling', 'Construction', 'Cooking', 'Technical', 'Writing'];
const AVAILABILITY_OPTIONS = ['Anytime', 'Weekdays', 'Weekends', 'Evenings', 'Nights', 'Flexible', 'Remote'];
const ZONE_OPTIONS = ['North India', 'Northeast India', 'East India', 'South India', 'West India', 'Central India', 'Remote'];
const WHEN_NEEDED_OPTIONS = ['Anytime', 'Weekday', 'Weekend', 'Evening', 'Night'];

const AddVolunteerModal = ({ isOpen, onClose }) => {
  const { addVolunteer } = useStore();
  const [formData, setFormData] = useState({ name: '', skills: [], availability: '', zone: '' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || formData.skills.length === 0 || !formData.availability || !formData.zone) return;
    addVolunteer({
      ...formData,
      is_available: true
    });
    setFormData({ name: '', skills: [], availability: '', zone: '' });
    onClose();
  };

  const toggleSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill) 
        : [...prev.skills, skill]
    }));
  };

  const selectClass = "w-full px-3 py-2 bg-brand-dark border border-brand-light/20 text-brand-bright rounded-lg focus:ring-2 focus:ring-brand-gold outline-none transition-colors appearance-none cursor-pointer";

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-brand-card border border-brand-light/10 rounded-2xl shadow-2xl shadow-brand-gold/5 w-full max-w-md overflow-hidden animate-slide-up">
        <div className="px-6 py-4 border-b border-brand-light/5 flex justify-between items-center bg-brand-card/50">
          <h3 className="text-lg font-semibold text-brand-bright flex items-center gap-2">
            <UserPlus size={20} className="text-brand-gold" />
            Register Volunteer
          </h3>
          <button onClick={onClose} className="text-brand-light hover:text-brand-bright transition-colors">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-brand-light mb-1">Full Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-brand-dark border border-brand-light/20 text-brand-bright rounded-lg focus:ring-2 focus:ring-brand-gold outline-none transition-colors" placeholder="e.g., Jane Doe" />
          </div>

          {/* Skills — multi-select chip grid */}
          <div>
            <label className="block text-sm font-medium text-brand-light mb-2">
              Skills <span className="text-brand-light/50 font-normal">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    formData.skills.includes(skill)
                      ? 'bg-brand-gold/20 text-brand-gold border-brand-gold/50 shadow-[0_0_8px_rgba(154,225,157,0.2)]'
                      : 'bg-brand-dark text-brand-light border-brand-light/10 hover:border-brand-gold/50'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
            {formData.skills.length === 0 && <p className="text-xs text-brand-gold/70 mt-1">Please select at least one skill.</p>}
          </div>

          {/* Availability & Zone dropdowns */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Availability</label>
              <select required value={formData.availability} onChange={e => setFormData({ ...formData, availability: e.target.value })} className={selectClass}>
                <option value="" disabled>Select...</option>
                {AVAILABILITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Operating Zone</label>
              <select required value={formData.zone} onChange={e => setFormData({ ...formData, zone: e.target.value })} className={selectClass}>
                <option value="" disabled>Select...</option>
                {ZONE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors border border-slate-700">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-brand-gold text-brand-dark rounded-lg font-bold hover:bg-brand-gold/90 shadow-xl shadow-black/20 transition-all">Add Volunteer</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MatchModal = ({ need, isOpen, onClose }) => {
  const { volunteers, confirmMatch } = useStore();
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen && need && !matches) {
      setLoading(true);
      setError('');
      const availableVols = volunteers.filter(v => v.is_available);
      runAIVMatch(need, availableVols)
        .then(res => setMatches(res))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, need]);

  if (!isOpen || !need) return null;

  const handleConfirm = (volunteerId, justification) => {
    const loadingToast = toast.loading('Calculating deployment routes...', {
      style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' }
    });
    setTimeout(() => {
      confirmMatch(volunteerId, need.id, justification);
      toast.success('SMS Dispatch sent to volunteer!', { 
        id: loadingToast, duration: 4000,
        style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' }
      });
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-brand-gold/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between bg-slate-900/50">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-brand-gold" />
            AI Matching Results
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6 bg-slate-800/50 border border-slate-700 p-4 rounded-xl backdrop-blur-sm">
            <h4 className="font-semibold text-white">{need.title}</h4>
            <div className="flex flex-wrap gap-2 mt-2">
               {need.skills_required.map(s => <span key={s} className="bg-slate-700 text-xs px-2 py-1 rounded text-slate-300 font-medium border border-slate-600">{s}</span>)}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><MapPin size={11} className="text-brand-gold/70" /> {need.location}</span>
              {need.when_needed && <span className="flex items-center gap-1"><Calendar size={11} className="text-brand-gold/70" /> Needed: <span className="text-brand-gold font-semibold ml-0.5">{need.when_needed}s</span></span>}
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Sparkles size={40} className="text-brand-gold animate-pulse" />
              <p className="text-slate-400 font-medium animate-pulse text-center">Gemini is analyzing volunteers and finding the best match...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 text-red-400 p-4 rounded-xl border border-red-800/50 flex flex-col items-center justify-center py-8">
               <AlertCircle size={32} className="mb-2" />
               <p className="font-medium text-center">{error}</p>
            </div>
          )}

          {!loading && matches && (
            <div className="space-y-4 animate-slide-up">
              {matches.map((match, idx) => {
                 const v = volunteers.find(v => v.id === match.volunteer_id);
                 if (!v) return null;
                 return (
                  <div key={match.volunteer_id} className={`border rounded-xl p-4 transition-all relative overflow-hidden backdrop-blur-md ${idx === 0 ? 'bg-gradient-to-br from-brand-gold/10 to-slate-800/40 border-brand-gold/30 shadow-xl shadow-black/40' : 'bg-slate-800/30 border-slate-700/50'}`}>
                    {idx === 0 && <div className="absolute top-0 right-0 bg-brand-gold text-brand-dark text-xs font-bold px-3 py-1 rounded-bl-lg shadow-md">Top Match</div>}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-lg text-white">{v.name}</h4>
                        <p className="text-sm text-slate-400 mt-0.5">{v.zone} • {v.availability}</p>
                        
                        <div className="mt-3 bg-slate-900/60 p-3 rounded-lg border border-slate-700 text-sm text-slate-300 italic border-l-4 border-l-brand-gold font-serif">
                          "{match.reason}"
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-black text-brand-gold tracking-tighter">{match.score}<span className="text-xs text-slate-500 font-normal">/10</span></div>
                        <button 
                          onClick={() => handleConfirm(v.id, match.reason)}
                          className={`mt-4 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg ${idx === 0 ? 'bg-brand-gold text-brand-dark hover:scale-105' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                        >
                          Confirm Match
                        </button>
                      </div>
                    </div>
                  </div>
                 );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ActiveDeployments = () => {
  const { matches, volunteers, needs, completeMatch } = useStore();
  const activeMatches = matches.filter(m => m.status === 'deployed');

  if (activeMatches.length === 0) return null;

  return (
    <div className="bg-brand-card/20 backdrop-blur-xl p-6 rounded-2xl border border-brand-light/10 mb-8">
      <h3 className="font-bold text-lg text-brand-bright mb-6 flex items-center gap-2">
        <Sparkles size={20} className="text-brand-gold"/> Active Deployments
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeMatches.map(match => {
          const v = volunteers.find(v => v.id === match.volunteer_id);
          const n = needs.find(n => n.id === match.need_id);
          if (!v || !n) return null;

          return (
            <motion.div 
              key={match.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/50 border border-brand-gold/30 rounded-xl p-4 flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-sm">{v.name}</h4>
                  <p className="text-[10px] text-brand-gold uppercase font-bold mt-0.5 tracking-wider">{n.title}</p>
                </div>
                <div className="bg-brand-gold/20 text-brand-gold text-[9px] px-2 py-0.5 rounded-full font-black border border-brand-gold/30">EN ROUTE</div>
              </div>
              
              <p className="text-[11px] text-slate-400 line-clamp-2 italic">"{match.ai_justification}"</p>
              
              <div className="mt-2 pt-3 border-t border-slate-800 flex justify-between items-center">
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <MapPin size={10}/> {v.zone}
                </div>
                <button 
                  onClick={() => completeMatch(match.id, v.id, n.id)}
                  className="text-[10px] font-bold bg-brand-gold/10 hover:bg-brand-gold text-brand-gold hover:text-brand-dark border border-brand-gold/30 px-3 py-1 rounded-lg transition-all"
                >
                  Complete Mission
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// --- VIEWS ---

const DashboardView = () => {
  const { needs, volunteers, matches } = useStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [matchNeed, setMatchNeed] = useState(null);

  const openNeeds = needs.filter(n => n.status === 'open');
  const activeNeedsList = needs.filter(n => n.status !== 'fulfilled');
  const fulfilledNeedsList = needs.filter(n => n.status === 'fulfilled');
  const fulfilledNeeds = fulfilledNeedsList.length;
  const thisWeekMatches = matches.length;

  // Chart Data
  const needsByUrgency = [
    { name: 'Critical', value: needs.filter(n => n.urgency === 'critical').length },
    { name: 'Medium', value: needs.filter(n => n.urgency === 'medium').length },
    { name: 'Low', value: needs.filter(n => n.urgency === 'low').length }
  ].filter(d => d.value > 0);

  const COLORS = { 'Critical': '#ef4444', 'Medium': '#f5cb5c', 'Low': '#4ade80' };

  const volsByZoneMap = volunteers.reduce((acc, v) => {
    acc[v.zone] = (acc[v.zone] || 0) + 1;
    return acc;
  }, {});
  const volunteersByZone = Object.entries(volsByZoneMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-brand-card/40 backdrop-blur-xl p-6 rounded-2xl shadow-2xl shadow-black/40 border border-brand-light/10 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-2 hover:shadow-black/60 transition-all duration-300">
           <div className="text-brand-light text-sm font-medium mb-1 flex items-center gap-2 relative z-10"><LayoutDashboard size={16}/> Open Needs</div>
           <div className="text-4xl font-bold text-brand-bright drop-shadow-md relative z-10">{openNeeds.length}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-brand-card/40 backdrop-blur-xl p-6 rounded-2xl shadow-2xl shadow-black/40 border border-brand-light/10 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-2 hover:shadow-black/60 transition-all duration-300">
           <div className="text-brand-light text-sm font-medium mb-1 flex items-center gap-2 relative z-10"><Check size={16}/> Active Volunteers</div>
           <div className="text-4xl font-bold text-brand-bright drop-shadow-md relative z-10">{volunteers.length}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-brand-card to-brand-dark backdrop-blur-xl p-6 rounded-2xl shadow-2xl shadow-black/50 border border-brand-gold/20 flex flex-col justify-center text-brand-bright relative overflow-hidden group hover:-translate-y-2 hover:shadow-black/70 transition-all duration-300">
           <div className="text-brand-gold text-sm font-medium mb-1 flex items-center gap-2 relative z-10"><Sparkles size={16}/> AI Matches Made</div>
           <div className="text-4xl font-bold drop-shadow-lg relative z-10">{thisWeekMatches}</div>
        </motion.div>
      </div>

      {/* Analytics & Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-brand-card/40 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-brand-light/10 flex flex-col min-h-[450px]">
          <h3 className="font-bold text-lg text-brand-bright mb-6 flex items-center gap-2"><MapIcon size={20} className="text-brand-gold"/> Live Disaster Map</h3>
          <div className="w-full flex-1 min-h-[350px] rounded-xl overflow-hidden border border-brand-light/10 z-0 relative shadow-inner">
             <MapContainer center={[22.0, 79.0]} zoom={4} style={{ height: '100%', width: '100%', minHeight: '350px' }}>
               <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap" />
               {needs.filter(n => n.status === 'open').map(n => (
                 ZONE_COORDS[n.location] && <Marker key={n.id} position={ZONE_COORDS[n.location]} icon={getNeedIcon(n.urgency)}>
                   <Popup className="dark-popup font-semibold text-brand-dark">
                     <div className="font-bold text-sm mb-1">{n.title}</div>
                     <div className="text-xs text-brand-dark/70 mb-1 capitalize">Urgency: {n.urgency}</div>
                     <div className="text-xs text-brand-dark/70">Skills: {n.skills_required.join(', ')}</div>
                   </Popup>
                 </Marker>
               ))}
               {volunteers.map(v => (
                 ZONE_COORDS[v.zone] && <Marker key={v.id} position={[ZONE_COORDS[v.zone][0] + (Math.random()-0.5)*1.5, ZONE_COORDS[v.zone][1] + (Math.random()-0.5)*1.5]} icon={getVolunteerIcon(v.is_available)}>
                   <Popup className="dark-popup text-brand-dark">
                     <div className="font-bold text-sm mb-1 flex items-center gap-1">{v.name} {v.is_available ? <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> : <span className="w-2 h-2 rounded-full bg-slate-500 inline-block"></span>}</div>
                     <div className="text-xs text-brand-dark/70 mb-1">{v.zone}</div>
                     <div className="text-xs text-brand-dark/70">Skills: {v.skills.join(', ')}</div>
                   </Popup>
                 </Marker>
               ))}
             </MapContainer>
          </div>
          {/* Map Legend */}
          <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs text-brand-light">
             <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 border border-red-300 inline-block animate-pulse"></span> Critical Need</div>
             <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-brand-gold border border-brand-bright/50 inline-block animate-pulse"></span> Medium Need</div>
             <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 border border-green-300 inline-block animate-pulse"></span> Low Need</div>
             <div className="flex items-center gap-1.5 ml-2"><span className="w-2.5 h-2.5 rounded-full bg-brand-gold border border-brand-bright/30 inline-block"></span> Available Vol</div>
             <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-500 border border-slate-400 inline-block"></span> Busy Vol</div>
          </div>
        </div>
        
        <div className="bg-brand-card/40 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-brand-light/10 flex flex-col min-h-[450px]">
          <h3 className="font-bold text-lg text-brand-bright mb-6 flex items-center gap-2"><BarChart2 size={20} className="text-brand-gold"/> Operational Analytics</h3>
          <div className="grid grid-cols-2 gap-4 flex-1 h-full w-full">
             <div className="h-full flex flex-col justify-center items-center w-full min-h-[300px]">
               <ResponsiveContainer width="100%" height={250}>
                 <PieChart>
                   <Pie data={needsByUrgency} innerRadius={50} outerRadius={80} paddingAngle={5} stroke="none" dataKey="value">
                     {needsByUrgency.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />)}
                   </Pie>
                   <Tooltip contentStyle={{ backgroundColor: '#333533', border: '1px solid rgba(207,219,213,0.1)', borderRadius: '8px', color: '#e8eddf' }} />
                 </PieChart>
               </ResponsiveContainer>
               <p className="text-center text-xs font-medium text-brand-light mt-4">Needs by Urgency</p>
             </div>
             <div className="h-full flex flex-col justify-end w-full min-h-[300px]">
               <ResponsiveContainer width="100%" height={250}>
                 <BarChart data={volunteersByZone} margin={{top: 20, right: 0, left: -20, bottom: 0}}>
                   <XAxis dataKey="name" tick={{fontSize: 10, fill: '#cfdbd5'}} interval={0} angle={-45} textAnchor="end" height={60} stroke="rgba(207,219,213,0.1)" />
                   <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#333533', border: '1px solid rgba(207,219,213,0.1)', borderRadius: '8px', color: '#e8eddf' }} />
                   <Bar dataKey="value" fill="#f5cb5c" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
               <p className="text-center text-xs font-medium text-brand-light mt-4">Volunteers by Zone</p>
             </div>
          </div>
        </div>
      </div>

      <ActiveDeployments />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Needs Board */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-brand-bright">Needs Board</h2>
            <button onClick={() => setIsAddOpen(true)} className="bg-brand-gold text-brand-dark px-5 py-2.5 rounded-xl font-bold shadow-xl shadow-black/20 hover:bg-brand-gold/90 transition-all hover:scale-105 active:scale-95">
              + Post Need
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {activeNeedsList.map((need, idx) => (
                <motion.div 
                  key={need.id} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="relative bg-brand-card/40 backdrop-blur-md px-6 pt-4 pb-6 rounded-2xl shadow-2xl shadow-black/50 border border-brand-light/10 flex flex-col gap-3 group hover:border-brand-gold/40 hover:shadow-black/70 transition-all"
                >
                  {/* Badge sits inside the card, top-right corner */}
                  <div className={`self-end px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${URGENCY_STYLES[need.urgency]}`}>
                    {need.urgency}
                  </div>
                  
                  <h3 className="font-bold text-lg text-brand-bright leading-tight -mt-2 group-hover:text-brand-gold transition-colors">{need.title}</h3>
                  <p className="text-brand-light text-sm leading-relaxed line-clamp-2">{need.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-auto pt-3">
                    {need.skills_required.map(s => <span key={s} className="bg-brand-dark/80 text-brand-light border border-brand-light/10 text-xs px-2.5 py-1 rounded-md font-medium">{s}</span>)}
                  </div>

                  {need.when_needed && need.when_needed !== 'Anytime' && (
                    <div className="flex items-center gap-1.5 text-[11px] text-brand-light/60 mt-1">
                      <Calendar size={11} className="text-brand-gold/60" />
                      Needed: <span className="text-brand-light/90 font-semibold ml-0.5">{need.when_needed}s</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-light/10">
                     <div className="text-xs text-brand-light/50 flex items-center gap-1.5"><Clock size={14} className="text-brand-gold/50"/> {timeAgo(need.created_at)}</div>
                     
                     {need.status === 'open' ? (
                       <button onClick={() => setMatchNeed(need)} className="flex items-center gap-1.5 text-sm font-bold bg-brand-gold/10 text-brand-gold border border-brand-gold/30 px-4 py-2 rounded-xl hover:bg-brand-gold hover:text-brand-dark transition-all shadow-md shadow-black/40">
                         <Sparkles size={16} /> Find AI Match
                       </button>
                     ) : need.status === 'matched' ? (
                       <span className="text-sm font-semibold text-green-400 flex items-center gap-1.5 border border-green-500/30 bg-green-500/10 px-4 py-2 rounded-xl"><Check size={16}/> Matched</span>
                     ) : (
                       <span className="text-sm font-semibold text-brand-light/50">Fulfilled</span>
                     )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {activeNeedsList.length === 0 && (
              <div className="col-span-full py-16 text-center text-brand-light/50 bg-brand-card/20 rounded-3xl border border-dashed border-brand-light/10">
                No active needs right now.
              </div>
            )}
          </div>

          {fulfilledNeedsList.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="text-2xl font-bold text-brand-bright flex items-center gap-2">
                <Check size={24} className="text-green-500" /> Fulfilled Requests
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fulfilledNeedsList.map((need) => (
                  <div 
                    key={need.id} 
                    className="relative bg-brand-card/20 px-6 pt-4 pb-6 rounded-2xl border border-brand-light/5 flex flex-col gap-3 opacity-70"
                  >
                    <div className="self-end px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border bg-green-900/30 text-green-400 border-green-800/50">
                      Fulfilled
                    </div>
                    <h3 className="font-bold text-lg text-brand-light leading-tight -mt-2 line-through">{need.title}</h3>
                    <p className="text-brand-light/70 text-sm leading-relaxed line-clamp-2">{need.description}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-light/5">
                       <div className="text-xs text-brand-light/50 flex items-center gap-1.5"><Clock size={14} className="text-brand-gold/30"/> {timeAgo(need.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-brand-card/40 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-brand-light/10">
            <h3 className="font-bold text-lg text-brand-bright mb-5 flex items-center gap-2"><HelpCircle size={20} className="text-brand-gold"/> How it works</h3>
            <ul className="space-y-4 text-sm text-brand-light">
              <li className="flex gap-3 items-start"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center font-bold text-xs border border-brand-gold/30">1</span> Post a critical community need.</li>
              <li className="flex gap-3 items-start"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center font-bold text-xs border border-brand-gold/30">2</span> Our AI engine scans all active volunteer profiles.</li>
              <li className="flex gap-3 items-start"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center font-bold text-xs border border-brand-gold/30">3</span> It correlates skills, location, and urgency in seconds.</li>
              <li className="flex gap-3 items-start"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center font-bold text-xs border border-brand-gold/30">4</span> Review the match reason and dispatch help.</li>
            </ul>
          </div>

          {/* Zone Legend */}
          <div className="bg-brand-card/40 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-brand-light/10">
            <h3 className="font-bold text-lg text-brand-bright mb-1 flex items-center gap-2"><MapPin size={20} className="text-brand-gold"/> Zone Guide</h3>
            <p className="text-xs text-brand-light/50 mb-4">Based on NDMA/NDRF Area of Responsibility (AoR) groupings.</p>
            <ul className="space-y-3 text-sm">
              {[
                { zone: 'North India',     states: 'Delhi, UP, Uttarakhand, J&K, HP, Punjab',         risk: 'Floods, Earthquakes, Landslides',          color: 'text-red-400' },
                { zone: 'Northeast India', states: 'Assam, Meghalaya, Manipur, Sikkim, Arunachal',    risk: 'Earthquakes, Flash Floods, Landslides',     color: 'text-brand-gold' },
                { zone: 'East India',      states: 'West Bengal, Odisha, Bihar, Jharkhand',           risk: 'Cyclones, River Flooding, Storm Surges',    color: 'text-yellow-400' },
                { zone: 'South India',     states: 'Tamil Nadu, Andhra Pradesh, Kerala, Karnataka',   risk: 'Cyclones, Drought, Coastal Flooding',       color: 'text-brand-gold' },
                { zone: 'West India',      states: 'Maharashtra, Gujarat, Rajasthan',                 risk: 'Earthquakes, Droughts, Flash Floods',       color: 'text-teal-400' },
                { zone: 'Central India',   states: 'Madhya Pradesh, Chhattisgarh, Telangana',        risk: 'Drought, Heatwaves, River Flooding',        color: 'text-green-400' },
                { zone: 'Remote',          states: 'Isolated tribal, hill & island territories',     risk: 'All hazards — limited access & comms',     color: 'text-purple-400' },
              ].map(({ zone, states, risk, color }) => (
                <li key={zone} className="flex gap-3 items-start p-2 rounded-lg hover:bg-brand-card/30 transition-colors">
                  <span className={`flex-shrink-0 font-bold text-xs mt-0.5 ${color}`}>●</span>
                  <div>
                    <div className={`font-semibold text-xs ${color} mb-0.5`}>{zone}</div>
                    <div className="text-brand-light/70 text-[11px] leading-relaxed">{states}</div>
                    <div className="text-brand-light/40 text-[10px] mt-0.5 italic">{risk}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      <AddNeedModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <MatchModal need={matchNeed} isOpen={!!matchNeed} onClose={() => setMatchNeed(null)} />
    </div>
  );
};

const RegistryView = () => {
  const { volunteers } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={28} className="text-brand-gold" />
            Volunteer Registry
          </h1>
          <p className="text-slate-400 mt-1">Manage and view all registered volunteers and their skill sets.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-gold hover:bg-brand-gold/90 text-brand-dark px-5 py-2.5 rounded-xl font-bold shadow-xl flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 border border-brand-gold/30"
        >
          <UserPlus size={20} />
          Add Volunteer
        </button>
      </div>

      <div className="bg-brand-card/40 backdrop-blur-xl rounded-2xl shadow-xl border border-brand-light/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-card/50 border-b border-brand-light/5 text-xs tracking-wider text-brand-light uppercase font-bold">
                <th className="px-6 py-5">Volunteer</th>
                <th className="px-6 py-5">Skills</th>
                <th className="px-6 py-5">Zone & Availability</th>
                <th className="px-6 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-light/5">
              {volunteers.map(v => (
                <tr key={v.id} className="hover:bg-brand-light/5 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-bold text-white text-base">{v.name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">ID: {v.id}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-2 list-none">
                      {v.skills.map(skill => (
                        <span key={skill} className="bg-brand-gold/10 text-brand-gold text-xs px-2.5 py-1 rounded-md font-medium border border-brand-gold/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center text-sm text-brand-light mb-1.5 font-medium">
                      <MapPin size={14} className="mr-1.5 text-brand-gold/50" />
                      {v.zone}
                    </div>
                    <div className="text-xs text-brand-light/70 bg-brand-dark/80 inline-block px-2.5 py-1 rounded-md border border-brand-light/10">
                      {v.availability}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {v.is_available ? (
                       <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm">
                         <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-md"></span>
                         Available
                       </span>
                    ) : (
                       <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-800/80 text-slate-400 border border-slate-700">
                         <span className="w-2 h-2 bg-slate-500 rounded-full"></span>
                         Busy
                       </span>
                    )}
                  </td>
                </tr>
              ))}
              {volunteers.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center text-slate-500 font-medium">
                    No volunteers registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <AddVolunteerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

// --- APP LAYOUT ---

const NavButton = ({ isActive, onClick, icon: Icon, children }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-bold text-sm ${isActive ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20 shadow-md shadow-black/20' : 'text-brand-light hover:bg-brand-card/50 hover:text-brand-bright border border-transparent'}`}
  >
    <Icon size={18} className={isActive ? 'text-brand-gold' : 'text-brand-light/50'} />
    {children}
  </button>
);

const AppLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-brand-dark text-brand-bright bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-gold/5 via-brand-dark to-brand-dark">
      <Toaster position="top-right" />
      <nav className="bg-brand-card/50 backdrop-blur-xl border-b border-brand-light/5 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="bg-gradient-to-br from-brand-gold to-brand-gold/60 p-2.5 rounded-xl text-brand-dark shadow-xl border border-brand-bright/50">
                  <Heart size={24} className="drop-shadow-md" />
                </div>
                <span className="text-2xl font-extrabold tracking-tight text-brand-bright drop-shadow-sm">
                  VolunteerMatch <span className="text-brand-gold">AI</span>
                </span>
              </div>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-4 sm:items-center">
                <NavButton isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={Home}>Dashboard</NavButton>
                <NavButton isActive={activeTab === 'registry'} onClick={() => setActiveTab('registry')} icon={Users}>Registry</NavButton>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center gap-3 bg-brand-dark/50 px-4 py-2 rounded-2xl border border-brand-light/10 backdrop-blur-md">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-gold to-brand-gold/60 text-brand-dark flex items-center justify-center font-bold text-sm shadow-inner border border-brand-bright/30">
                  OP
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-bold text-brand-bright">NGO Admin</div>
                  <div className="text-xs text-brand-gold font-medium tracking-wide">Operation Heart</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile nav */}
      <div className="sm:hidden bg-brand-card/80 backdrop-blur-md border-b border-brand-light/5 px-4 py-3 flex gap-2 overflow-x-auto shadow-lg">
         <NavButton isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={Home}>Dashboard</NavButton>
         <NavButton isActive={activeTab === 'registry'} onClick={() => setActiveTab('registry')} icon={Users}>Registry</NavButton>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in relative z-10">
        {activeTab === 'dashboard' ? <DashboardView /> : <RegistryView />}
      </main>

      {/* About Section Footer */}
      <footer className="border-t border-brand-light/5 mt-6 bg-brand-card/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Branding */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-brand-gold to-brand-gold/60 p-2 rounded-xl text-brand-dark shadow-lg border border-brand-bright/50">
                  <Heart size={20} />
                </div>
                <span className="text-xl font-extrabold text-brand-bright">VolunteerMatch <span className="text-brand-gold">AI</span></span>
              </div>
              <p className="text-brand-light/70 text-sm leading-relaxed">
                An AI-powered disaster relief coordination platform that instantly connects the right volunteers to the right crises — at the speed of an emergency.
              </p>
            </div>

            {/* What it does */}
            <div>
              <h4 className="text-white font-bold text-base mb-4 flex items-center gap-2"><Sparkles size={16} className="text-brand-gold" /> What We Do</h4>
              <ul className="space-y-2.5 text-sm text-brand-light/70">
                <li className="flex items-start gap-2"><Check size={14} className="text-green-400 mt-0.5 flex-shrink-0" /> Real-time community needs board for NGOs and relief coordinators.</li>
                <li className="flex items-start gap-2"><Check size={14} className="text-green-400 mt-0.5 flex-shrink-0" /> Gemini AI automatically ranks the best-fit volunteers by skills, zone, and availability.</li>
                <li className="flex items-start gap-2"><Check size={14} className="text-green-400 mt-0.5 flex-shrink-0" /> Live geographic map showing active needs and volunteer positions across India.</li>
                <li className="flex items-start gap-2"><Check size={14} className="text-green-400 mt-0.5 flex-shrink-0" /> Analytics dashboard tracking response rates and urgency distribution.</li>
                <li className="flex items-start gap-2"><Check size={14} className="text-green-400 mt-0.5 flex-shrink-0" /> One-click dispatch with simulated SMS notifications to matched volunteers.</li>
              </ul>
            </div>

            {/* The Problem */}
            <div>
              <h4 className="text-white font-bold text-base mb-4 flex items-center gap-2"><AlertCircle size={16} className="text-red-400" /> The Problem We Solve</h4>
              <p className="text-sm text-brand-light/70 leading-relaxed mb-3">
                During disasters, NGOs waste precious hours manually calling volunteers to check availability and skills. Every minute of delay costs lives.
              </p>
              <p className="text-sm text-brand-light/70 leading-relaxed">
                VolunteerMatch AI eliminates that friction. Our Gemini-powered engine reads a posted need, scans the entire volunteer database, and surfaces the top matches with an AI-generated justification — all in under 3 seconds.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-xs font-semibold px-3 py-1.5 rounded-full">
                <Sparkles size={12} /> Built for Google Solution Challenge 2026
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-brand-light/10 text-center text-xs text-brand-light/50">
            © 2026 VolunteerMatch AI — Built with ❤️ to reduce disaster response time.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppLayout />
    </StoreProvider>
  );
}
