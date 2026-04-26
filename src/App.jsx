import React, { useState } from 'react';
import { StoreProvider, useStore } from './store';
import { runGeminiMatch } from './api';
import { LayoutDashboard, AlertCircle, Sparkles, Check, X, Clock, HelpCircle, Users, UserPlus, MapPin, Heart, Home, BarChart2, Map as MapIcon } from 'lucide-react';
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

const ZONE_COORDS = {
  'North Zone': [28.7041, 77.1025],
  'South Zone': [13.0827, 80.2707],
  'East Zone': [22.5726, 88.3639],
  'West Zone': [19.0760, 72.8777],
  'Central Zone': [21.1458, 79.0882],
  'Remote': [24.524, 93.936]
};

const needIcon = new L.divIcon({ className: 'bg-red-500 w-4 h-4 rounded-full border-2 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse', iconSize: [16, 16] });
const volunteerIcon = new L.divIcon({ className: 'bg-blue-400 w-3 h-3 rounded-full border border-blue-200 shadow-[0_0_10px_rgba(96,165,250,0.5)]', iconSize: [12, 12] });

const URGENCY_STYLES = {
  low: 'bg-green-900/30 text-green-400 border-green-800/50',
  medium: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50',
  critical: 'bg-red-900/30 text-red-400 border-red-800/50'
};

// --- MODALS ---

const AddNeedModal = ({ isOpen, onClose }) => {
  const { addNeed } = useStore();
  const [formData, setFormData] = useState({ title: '', description: '', skills: '', urgency: 'low', location: '' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return;
    addNeed({
      ...formData,
      skills_required: formData.skills.split(',').map(s => s.trim()).filter(Boolean)
    });
    setFormData({ title: '', description: '', skills: '', urgency: 'low', location: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-indigo-500/10 w-full max-w-lg overflow-hidden animate-slide-up">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertCircle size={20} className="text-indigo-400" />
            Declare Community Need
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
            <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" placeholder="e.g., Medical Supplies Needed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" rows="3" placeholder="Describe the need..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Required Skills (Comma separated)</label>
            <input type="text" required value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" placeholder="e.g., Medical, Rescue" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Urgency</label>
              <select value={formData.urgency} onChange={e => setFormData({ ...formData, urgency: e.target.value })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Location / Zone</label>
              <input type="text" required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" placeholder="e.g., North Zone" />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors border border-slate-700">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all">Post Need</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddVolunteerModal = ({ isOpen, onClose }) => {
  const { addVolunteer } = useStore();
  const [formData, setFormData] = useState({ name: '', skills: '', availability: '', zone: '' });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    addVolunteer({
      ...formData,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      is_available: true
    });
    setFormData({ name: '', skills: '', availability: '', zone: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-indigo-500/10 w-full max-w-md overflow-hidden animate-slide-up">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <UserPlus size={20} className="text-indigo-400" />
            Register Volunteer
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" placeholder="e.g., Jane Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Skills (Comma separated)</label>
            <input type="text" required value={formData.skills} onChange={e => setFormData({ ...formData, skills: e.target.value })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" placeholder="e.g., Medical, Driving" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Availability</label>
              <input type="text" required value={formData.availability} onChange={e => setFormData({ ...formData, availability: e.target.value })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" placeholder="e.g., Weekends" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Operating Zone</label>
              <input type="text" required value={formData.zone} onChange={e => setFormData({ ...formData, zone: e.target.value })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" placeholder="e.g., North Zone" />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors border border-slate-700">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all">Add Volunteer</button>
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
      runGeminiMatch(need, availableVols)
        .then(res => setMatches(res))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, need]);

  if (!isOpen || !need) return null;

  const handleConfirm = (volunteerId) => {
    const loadingToast = toast.loading('Calculating deployment routes...', {
      style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' }
    });
    setTimeout(() => {
      confirmMatch(Date.now().toString(), need.id);
      toast.success('SMS Dispatch sent to volunteer!', { 
        id: loadingToast, duration: 4000,
        style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' }
      });
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl shadow-indigo-500/10 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between bg-slate-900/50">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-400" />
            AI Matching Results
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6 bg-slate-800/50 border border-slate-700 p-4 rounded-xl backdrop-blur-md">
            <h4 className="font-semibold text-white">{need.title}</h4>
            <div className="flex gap-2 mt-2">
               {need.skills_required.map(s => <span key={s} className="bg-slate-700 text-xs px-2 py-1 rounded text-slate-300 font-medium border border-slate-600">{s}</span>)}
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Sparkles size={40} className="text-indigo-400 animate-pulse drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]" />
              <p className="text-slate-400 font-medium animate-pulse">Gemini is analyzing volunteers and finding the best match...</p>
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
                  <div key={match.volunteer_id} className={`border rounded-xl p-4 transition-all relative overflow-hidden backdrop-blur-md ${idx === 0 ? 'bg-gradient-to-br from-indigo-900/40 to-slate-800/40 border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.15)]' : 'bg-slate-800/30 border-slate-700/50'}`}>
                    {idx === 0 && <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm">Top Match</div>}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-bold text-lg text-white">{v.name}</h4>
                        <p className="text-sm text-slate-400 mt-0.5">{v.zone} • {v.availability}</p>
                        
                        <div className="mt-3 bg-slate-900/60 p-3 rounded-lg border border-slate-700 text-sm text-slate-300 italic border-l-4 border-l-indigo-400 font-serif">
                          "{match.reason}"
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                         <div className="flex items-center gap-1 font-bold text-xl text-indigo-400">
                           {match.score}<span className="text-sm text-slate-500 font-normal">/10</span>
                         </div>
                         <button onClick={() => handleConfirm(v.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all text-sm whitespace-nowrap border border-indigo-400/50">
                           Confirm Match
                         </button>
                      </div>
                    </div>
                  </div>
                 )
              })}
            </div>
          )}
        </div>
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
  const fulfilledNeeds = needs.filter(n => n.status === 'fulfilled').length;
  const thisWeekMatches = matches.length;

  // Chart Data
  const needsByUrgency = [
    { name: 'Critical', value: needs.filter(n => n.urgency === 'critical').length },
    { name: 'Medium', value: needs.filter(n => n.urgency === 'medium').length },
    { name: 'Low', value: needs.filter(n => n.urgency === 'low').length }
  ].filter(d => d.value > 0);

  const COLORS = { 'Critical': '#f87171', 'Medium': '#fbbf24', 'Low': '#4ade80' };

  const volsByZoneMap = volunteers.reduce((acc, v) => {
    acc[v.zone] = (acc[v.zone] || 0) + 1;
    return acc;
  }, {});
  const volunteersByZone = Object.entries(volsByZoneMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-slate-700/50 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-slate-500 transition-all duration-300">
           <div className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2 relative z-10"><LayoutDashboard size={16}/> Open Needs</div>
           <div className="text-4xl font-bold text-white drop-shadow-md relative z-10">{openNeeds.length}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-slate-700/50 flex flex-col justify-center relative overflow-hidden group hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:border-slate-500 transition-all duration-300">
           <div className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2 relative z-10"><Check size={16}/> Active Volunteers</div>
           <div className="text-4xl font-bold text-white drop-shadow-md relative z-10">{volunteers.length}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-xl p-6 rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.2)] border border-indigo-500/30 flex flex-col justify-center text-white relative overflow-hidden group hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(79,70,229,0.4)] hover:border-indigo-400 transition-all duration-300">
           <div className="text-indigo-200 text-sm font-medium mb-1 flex items-center gap-2 relative z-10"><Sparkles size={16}/> AI Matches Made</div>
           <div className="text-4xl font-bold drop-shadow-lg relative z-10">{thisWeekMatches}</div>
        </motion.div>
      </div>

      {/* Analytics & Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-slate-700/50 flex flex-col min-h-[450px]">
          <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2"><MapIcon size={20} className="text-indigo-400"/> Live Disaster Map</h3>
          <div className="w-full flex-1 min-h-[350px] rounded-xl overflow-hidden border border-slate-700/80 z-0 relative shadow-inner">
             <MapContainer center={[22.0, 79.0]} zoom={4} style={{ height: '100%', width: '100%', minHeight: '350px' }}>
               <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap" />
               {needs.filter(n => n.status === 'open').map(n => (
                 ZONE_COORDS[n.location] && <Marker key={n.id} position={ZONE_COORDS[n.location]} icon={needIcon}><Popup className="dark-popup font-semibold text-slate-800">{n.title}</Popup></Marker>
               ))}
               {volunteers.map(v => (
                 ZONE_COORDS[v.zone] && <Marker key={v.id} position={[ZONE_COORDS[v.zone][0] + (Math.random()-0.5)*1.5, ZONE_COORDS[v.zone][1] + (Math.random()-0.5)*1.5]} icon={volunteerIcon}><Popup className="dark-popup text-slate-800">{v.name}</Popup></Marker>
               ))}
             </MapContainer>
          </div>
        </div>
        
        <div className="bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-slate-700/50 flex flex-col min-h-[450px]">
          <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2"><BarChart2 size={20} className="text-indigo-400"/> Operational Analytics</h3>
          <div className="grid grid-cols-2 gap-4 flex-1 h-full w-full">
             <div className="h-full flex flex-col justify-center items-center w-full min-h-[300px]">
               <ResponsiveContainer width="100%" height={250}>
                 <PieChart>
                   <Pie data={needsByUrgency} innerRadius={50} outerRadius={80} paddingAngle={5} stroke="none" dataKey="value">
                     {needsByUrgency.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />)}
                   </Pie>
                   <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} />
                 </PieChart>
               </ResponsiveContainer>
               <p className="text-center text-xs font-medium text-slate-400 mt-4">Needs by Urgency</p>
             </div>
             <div className="h-full flex flex-col justify-end w-full min-h-[300px]">
               <ResponsiveContainer width="100%" height={250}>
                 <BarChart data={volunteersByZone} margin={{top: 20, right: 0, left: -20, bottom: 0}}>
                   <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} interval={0} angle={-45} textAnchor="end" height={60} stroke="#334155" />
                   <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} />
                   <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
               <p className="text-center text-xs font-medium text-slate-400 mt-4">Volunteers by Zone</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Needs Board */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Needs Board</h2>
            <button onClick={() => setIsAddOpen(true)} className="bg-white text-slate-900 px-5 py-2.5 rounded-xl font-bold shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:bg-slate-200 transition-all hover:scale-105 active:scale-95">
              + Post Need
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {needs.map((need, idx) => (
                <motion.div 
                  key={need.id} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="relative bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-slate-700/50 flex flex-col gap-3 group hover:border-indigo-500/40 hover:shadow-[0_0_25px_rgba(79,70,229,0.15)] transition-all overflow-hidden"
                >
                  <div className={`absolute top-0 right-5 transform -translate-y-1/2 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border backdrop-blur-xl z-10 ${URGENCY_STYLES[need.urgency]}`}>
                    {need.urgency}
                  </div>
                  
                  <h3 className="font-bold text-lg text-white leading-tight pr-4 relative z-10">{need.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 relative z-10">{need.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-auto pt-4 relative z-10">
                    {need.skills_required.map(s => <span key={s} className="bg-slate-900/80 text-slate-300 border border-slate-700 text-xs px-2.5 py-1 rounded-md font-medium">{s}</span>)}
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-700/50 relative z-10">
                     <div className="text-xs text-slate-500 flex items-center gap-1.5"><Clock size={14}/> Just now</div>
                     
                     {need.status === 'open' ? (
                       <button onClick={() => setMatchNeed(need)} className="flex items-center gap-1.5 text-sm font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-xl hover:bg-indigo-500/30 hover:text-indigo-200 transition-all shadow-[0_0_10px_rgba(79,70,229,0.1)] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                         <Sparkles size={16} /> Find AI Match
                       </button>
                     ) : need.status === 'matched' ? (
                       <span className="text-sm font-semibold text-green-400 flex items-center gap-1.5 border border-green-500/30 bg-green-500/10 px-4 py-2 rounded-xl"><Check size={16}/> Matched</span>
                     ) : (
                       <span className="text-sm font-semibold text-slate-500">Fulfilled</span>
                     )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {needs.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
                No active needs right now.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-800/40 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-slate-700/50">
            <h3 className="font-bold text-lg text-white mb-5 flex items-center gap-2"><HelpCircle size={20} className="text-indigo-400"/> How it works</h3>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex gap-3 items-start"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-900/50 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">1</span> Post a critical community need.</li>
              <li className="flex gap-3 items-start"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-900/50 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">2</span> Our AI engine scans all active volunteer profiles.</li>
              <li className="flex gap-3 items-start"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-900/50 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">3</span> It correlates skills, location, and urgency in seconds.</li>
              <li className="flex gap-3 items-start"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-900/50 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">4</span> Review the match reason and dispatch help.</li>
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
            <Users size={28} className="text-indigo-400" />
            Volunteer Registry
          </h1>
          <p className="text-slate-400 mt-1">Manage and view all registered volunteers and their skill sets.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 border border-indigo-400/50"
        >
          <UserPlus size={20} />
          Add Volunteer
        </button>
      </div>

      <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700/50 text-xs tracking-wider text-slate-400 uppercase font-bold">
                <th className="px-6 py-5">Volunteer</th>
                <th className="px-6 py-5">Skills</th>
                <th className="px-6 py-5">Zone & Availability</th>
                <th className="px-6 py-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {volunteers.map(v => (
                <tr key={v.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-bold text-white text-base">{v.name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">ID: {v.id}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-2 list-none">
                      {v.skills.map(skill => (
                        <span key={skill} className="bg-indigo-500/10 text-indigo-300 text-xs px-2.5 py-1 rounded-md font-medium border border-indigo-500/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center text-sm text-slate-300 mb-1.5 font-medium">
                      <MapPin size={14} className="mr-1.5 text-slate-500" />
                      {v.zone}
                    </div>
                    <div className="text-xs text-slate-400 bg-slate-900/80 inline-block px-2.5 py-1 rounded-md border border-slate-700">
                      {v.availability}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {v.is_available ? (
                       <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                         <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
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
    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-bold text-sm ${isActive ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.15)]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'}`}
  >
    <Icon size={18} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
    {children}
  </button>
);

const AppLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950">
      <Toaster position="top-right" />
      <nav className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl text-white shadow-[0_0_20px_rgba(79,70,229,0.5)] border border-indigo-400/50">
                  <Heart size={24} className="drop-shadow-md" />
                </div>
                <span className="text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">
                  VolunteerMatch <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">AI</span>
                </span>
              </div>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-4 sm:items-center">
                <NavButton isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={Home}>Dashboard</NavButton>
                <NavButton isActive={activeTab === 'registry'} onClick={() => setActiveTab('registry')} icon={Users}>Registry</NavButton>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-700/50 backdrop-blur-md">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-inner border border-indigo-400/30">
                  OP
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-bold text-white">NGO Admin</div>
                  <div className="text-xs text-indigo-300 font-medium tracking-wide">Operation Heart</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile nav */}
      <div className="sm:hidden bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex gap-2 overflow-x-auto shadow-lg">
         <NavButton isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={Home}>Dashboard</NavButton>
         <NavButton isActive={activeTab === 'registry'} onClick={() => setActiveTab('registry')} icon={Users}>Registry</NavButton>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in relative z-10">
        {activeTab === 'dashboard' ? <DashboardView /> : <RegistryView />}
      </main>
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
