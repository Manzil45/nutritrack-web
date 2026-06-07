import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../api/profile';
import { toast } from '../utils/toast';
import { ProfileShimmer } from '../components/Shimmer';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [tempGoal, setTempGoal] = useState("");
  const [tempName, setTempName] = useState("");
  const [tempBio, setTempBio] = useState("");
  const [tempAvatar, setTempAvatar] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const data = await profileApi.getProfile();
        if (isMounted) {
          setProfile(data);
          setTempGoal(data.dailyGoal.toString());
          setTempName(data.name);
          setTempBio(data.description);
          setTempAvatar(data.avatar);
        }
      } catch (_err) {
        console.error("Error fetching profile", _err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  const handleTogglePreference = async (key) => {
    const newValue = !profile.preferences[key];
    // Optimistic UI toggle
    setProfile(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: newValue }
    }));
    try {
      await profileApi.togglePreference(key, newValue);
      toast(`${key.replace(/([A-Z])/g, ' $1')} updated!`);
    } catch (_err) {
      console.error(_err);
      toast("Failed to update preference", "error");
    }
  };

  const handleUpdateAvatar = () => {
    setTempAvatar(profile.avatar);
    setIsEditingAvatar(true);
  };

  const handleAvatarSubmit = async () => {
    if (!tempAvatar || tempAvatar === profile.avatar) {
      setIsEditingAvatar(false);
      return;
    }

    try {
      await profileApi.updateProfile({ avatar: tempAvatar });
      setProfile(prev => ({ ...prev, avatar: tempAvatar }));
      setIsEditingAvatar(false);
      toast("Profile picture updated!");
    } catch (_err) {
      toast("Failed to update avatar", "error");
      setIsEditingAvatar(false);
    }
  };

  const handleUpdateGoal = () => {
    setTempGoal(profile.dailyGoal.toString());
    setIsEditingGoal(true);
  };

  const handleGoalSubmit = async () => {
    if (!tempGoal || isNaN(tempGoal) || Number(tempGoal) === profile.dailyGoal) {
      setIsEditingGoal(false);
      return;
    }

    try {
      await profileApi.updateProfile({ goals: { calories: Number(tempGoal) } });
      setProfile(prev => ({ ...prev, dailyGoal: Number(tempGoal) }));
      setIsEditingGoal(false);
      toast("Daily goal updated!");
    } catch (_err) {
      toast("Failed to update goal", "error");
      setIsEditingGoal(false);
    }
  };

  const handleUpdateInfo = (field) => {
    if (field === 'name') {
      setTempName(profile.name);
      setIsEditingName(true);
    } else {
      setTempBio(profile.description);
      setIsEditingBio(true);
    }
  };

  const handleInfoSubmit = async (field) => {
    const isName = field === 'name';
    const currentValue = isName ? profile.name : profile.description;
    const newValue = isName ? tempName : tempBio;
    const setter = isName ? setIsEditingName : setIsEditingBio;

    if (!newValue || newValue === currentValue) {
      setter(false);
      return;
    }

    try {
      const updates = isName ? { name: newValue } : { bio: newValue };
      await profileApi.updateProfile(updates);
      setProfile(prev => ({ 
        ...prev, 
        [isName ? 'name' : 'description']: newValue 
      }));
      setter(false);
      toast(`${isName ? 'Name' : 'Bio'} updated!`);
    } catch (_err) {
      toast(`Failed to update ${isName ? 'Name' : 'Bio'}`, "error");
      setter(false);
    }
  };

  const handleSignout = () => {
    navigate('/login');
  };

  if (loading || !profile) {
    return <ProfileShimmer />;
  }

  return (
    <>
      {/* Header Section: Editorial Hero */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[0.75rem] font-medium tracking-[0.02em] uppercase text-primary mb-2 block">Account Dashboard</span>
            {isEditingName ? (
              <input 
                autoFocus
                className="text-[3.5rem] font-bold font-headline leading-[1.1] tracking-[-0.04em] text-on-surface bg-surface-container-high rounded-2xl w-full outline-none px-4 mb-2 focus:ring-4 focus:ring-primary/20 transition-all border-none"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={() => handleInfoSubmit('name')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInfoSubmit('name');
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
              />
            ) : (
              <h1 
                onClick={() => handleUpdateInfo('name')}
                className="text-[3.5rem] font-bold font-headline leading-[1.1] tracking-[-0.04em] text-on-surface cursor-pointer hover:text-primary transition-colors"
              >
                {profile.name}
              </h1>
            )}

            {isEditingBio ? (
              <textarea 
                autoFocus
                className="text-on-surface-variant font-body mt-2 w-full bg-surface-container-high rounded-2xl outline-none px-4 py-2 focus:ring-4 focus:ring-primary/20 transition-all border-none resize-none h-24"
                value={tempBio}
                onChange={(e) => setTempBio(e.target.value)}
                onBlur={() => handleInfoSubmit('bio')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) handleInfoSubmit('bio');
                  if (e.key === 'Escape') setIsEditingBio(false);
                }}
              />
            ) : (
              <p 
                onClick={() => handleUpdateInfo('bio')}
                className="text-on-surface-variant font-body mt-2 max-w-md cursor-pointer hover:text-primary transition-colors"
              >
                {profile.description}
              </p>
            )}
          </div>
          <div className="relative group self-start md:self-auto">
            <div className="w-32 h-32 rounded-[2rem] overflow-hidden bg-surface-container-high shadow-xl ring-4 ring-surface relative">
              <img 
                alt="User Profile" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                src={profile.avatar}
              />
            </div>
            <button 
              onClick={handleUpdateAvatar}
              className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center justify-center z-10"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>

            {isEditingAvatar && (
              <div className="absolute top-full right-0 mt-4 w-64 bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/20 z-[60] animate-in zoom-in-95 fade-in duration-300">
                <p className="text-[10px] font-bold uppercase text-slate-400 mb-2 ml-1 tracking-wider">Image URL</p>
                <input 
                  autoFocus
                  placeholder="https://..."
                  className="w-full px-4 py-2 bg-white border border-outline-variant/30 rounded-xl text-xs outline-none focus:ring-4 focus:ring-primary/10 transition-all mb-2"
                  value={tempAvatar}
                  onChange={(e) => setTempAvatar(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAvatarSubmit();
                    if (e.key === 'Escape') setIsEditingAvatar(false);
                  }}
                />
                <div className="flex gap-2">
                  <button onClick={handleAvatarSubmit} className="flex-1 py-2 bg-primary text-white text-[10px] font-bold uppercase rounded-lg">Save</button>
                  <button onClick={() => setIsEditingAvatar(false)} className="px-3 py-2 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded-lg">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Bento Grid Interface */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">
        {/* Primary Goal Card (Asymmetric Focus) */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-[1.5rem] p-8 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h3 className="text-xl font-headline font-semibold mb-1">Daily Calorie Target</h3>
                <p className="text-sm font-body text-on-surface-variant">Your metabolic baseline for weight maintenance</p>
              </div>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold font-label uppercase tracking-wider">Active Goal</span>
            </div>
            <div className="flex items-baseline gap-4 mb-8">
              {isEditingGoal ? (
                <input 
                  autoFocus
                  type="number"
                  className="text-[4rem] font-bold font-headline tracking-tighter text-on-surface bg-surface-container-high rounded-2xl w-full max-w-[15rem] outline-none px-4 focus:ring-4 focus:ring-primary/20 transition-all border-none"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  onBlur={handleGoalSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGoalSubmit();
                    if (e.key === 'Escape') setIsEditingGoal(false);
                  }}
                />
              ) : (
                <span className="text-[4rem] font-bold font-headline tracking-tighter text-on-surface">
                  {profile.dailyGoal.toLocaleString()}
                </span>
              )}
              <span className="text-xl font-medium font-label text-on-surface-variant uppercase tracking-widest">Kcal</span>
            </div>
            
            <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-primary to-primary-container h-full rounded-full shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all duration-1000" style={{ width: `${profile.goalProgress}%` }}></div>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={handleUpdateGoal}
                className="px-6 py-2 rounded-full border border-outline-variant/30 text-sm font-semibold font-body hover:bg-surface-container-low transition-colors"
              >
                Adjust Goal
              </button>
              <button className="px-6 py-2 rounded-full bg-primary text-white text-sm font-semibold font-body hover:shadow-lg hover:scale-[1.02] transition-all">Quick Log</button>
            </div>
          </div>
          {/* Decorative background element */}
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
        </div>

        {/* Dark Mode Toggle Card */}
        <div className="md:col-span-4 bg-surface-container-low rounded-[1.5rem] p-8 flex flex-col justify-between border border-transparent hover:border-outline-variant/20 transition-all">
          <div>
            <div className="w-12 h-12 bg-surface-container-highest rounded-2xl flex items-center justify-center mb-6 text-primary">
              <span className="material-symbols-outlined">dark_mode</span>
            </div>
            <h3 className="text-xl font-headline font-semibold mb-2">Interface Theme</h3>
            <p className="text-sm font-body text-on-surface-variant">Switch between Light and Dark visual biomes.</p>
          </div>
          
          <div className="mt-8 flex items-center justify-between p-2 bg-surface-container-lowest rounded-2xl">
            <button 
              onClick={() => handleTogglePreference('darkMode')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium shadow-sm transition-transform active:scale-95 ${!profile.preferences.darkMode ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              <span className="material-symbols-outlined text-sm">light_mode</span>
              <span className="font-body text-sm">Light</span>
            </button>
            <button 
              onClick={() => handleTogglePreference('darkMode')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors active:scale-95 ${profile.preferences.darkMode ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-highest'}`}
            >
              <span className="material-symbols-outlined text-sm">dark_mode</span>
              <span className="font-body text-sm">Dark</span>
            </button>
          </div>
        </div>

        {/* Settings List */}
        <div className="md:col-span-12 space-y-4">
          <h2 className="text-2xl font-bold font-headline mt-8 mb-4">Account Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Pref Item 1 */}
            <div 
              onClick={() => handleTogglePreference('emailNotifications')}
              className="bg-surface-container-lowest p-6 rounded-[1.5rem] flex items-center justify-between group cursor-pointer hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center group-hover:bg-white transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">mail</span>
                </div>
                <div>
                  <p className="font-semibold font-body">Email Notifications</p>
                  <p className="text-xs font-body text-on-surface-variant">Weekly digest and AI insights</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full relative p-1 transition-colors flex items-center ${profile.preferences.emailNotifications ? 'bg-primary' : 'bg-surface-container-high'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${profile.preferences.emailNotifications ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
            </div>

            {/* Pref Item 2 */}
            <div 
              onClick={() => handleTogglePreference('appleHealthSync')}
              className="bg-surface-container-lowest p-6 rounded-[1.5rem] flex items-center justify-between group cursor-pointer hover:bg-surface-container transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center group-hover:bg-white transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">sync</span>
                </div>
                <div>
                  <p className="font-semibold font-body">Apple Health Sync</p>
                  <p className="text-xs font-body text-on-surface-variant">Connected since June 2023</p>
                </div>
              </div>
              <span className={`text-sm font-bold font-body ${profile.preferences.appleHealthSync ? 'text-primary' : 'text-slate-400'}`}>
                {profile.preferences.appleHealthSync ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {/* Pref Item 3 */}
            <div className="bg-surface-container-lowest p-6 rounded-[1.5rem] flex items-center justify-between group cursor-pointer hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center group-hover:bg-white transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">language</span>
                </div>
                <div>
                  <p className="font-semibold font-body">Display Language</p>
                  <p className="text-xs font-body text-on-surface-variant">{profile.preferences.language}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
            </div>

            {/* Pref Item 4 */}
            <div className="bg-surface-container-lowest p-6 rounded-[1.5rem] flex items-center justify-between group cursor-pointer hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center group-hover:bg-white transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">lock</span>
                </div>
                <div>
                  <p className="font-semibold font-body">Privacy &amp; Data</p>
                  <p className="text-xs font-body text-on-surface-variant">Manage your tracking permissions</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
            </div>
            
          </div>
        </div>

        {/* Logout / Danger Zone (Asymmetric Width) */}
        <div className="md:col-span-5 md:col-start-4 mt-10">
          <button onClick={handleSignout} className="w-full bg-error-container text-on-error-container font-bold font-body py-4 rounded-[1.5rem] hover:bg-error hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">logout</span>
            Sign Out of NutriTrack
          </button>
          <p className="text-center text-[10px] font-body text-on-surface-variant mt-4 uppercase tracking-[0.1em]">Version 2.4.1 (Stable)</p>
        </div>

      </div>
    </>
  );
}
