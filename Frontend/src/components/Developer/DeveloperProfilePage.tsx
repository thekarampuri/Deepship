import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const DeveloperProfilePage: React.FC = () => {
  const { user } = useAuth();

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Popular skill suggestions for developers
  const skillSuggestions = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
    'Go', 'Rust', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'PostgreSQL',
    'MongoDB', 'Redis', 'GraphQL', 'REST API', 'gRPC',
    'Machine Learning', 'DevOps', 'CI/CD', 'Testing', 'Security',
    'Microservices', 'System Design', 'Data Engineering', 'Mobile Dev',
    'Vue.js', 'Angular', 'Django', 'FastAPI', 'Spring Boot', '.NET',
  ];

  useEffect(() => {
    // Load current user skills from /auth/me
    const fetchProfile = async () => {
      try {
        const res = await fetch('http://103.127.146.14/auth/me', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSkills(data.skills || []);
        }
      } catch {
        // skills will be empty
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Skill already added', 'error');
      return;
    }
    setSkills([...skills, trimmed]);
    setNewSkill('');
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(newSkill);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateMySkills(skills);
      showToast('Skills updated successfully!', 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const unusedSuggestions = skillSuggestions.filter(
    (s) => !skills.some((sk) => sk.toLowerCase() === s.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="ml-64 flex items-center justify-center h-screen bg-surface">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden min-h-screen">


      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 ml-64 w-[calc(100%-16rem)] bg-surface-container-lowest/80 backdrop-blur-md h-16 border-b border-outline-variant/20">
        <span className="text-lg font-bold text-on-surface tracking-tight">My Profile</span>
      </header>

      <main className="ml-64 p-8 min-h-[calc(100vh-4rem)] bg-surface">
        <div className="max-w-2xl">
          {/* User Info Card */}
          <motion.div {...fadeUp(0)} className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-black text-xl">
                {user?.full_name?.charAt(0) || 'D'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-on-surface">{user?.full_name || 'Developer'}</h2>
                <p className="text-sm text-on-surface-variant">{user?.email || ''}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-tertiary/15 text-tertiary">
                    Developer
                  </span>
                  {user?.organization_name && (
                    <span className="text-[10px] text-on-surface-variant">{user.organization_name}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Skills Section */}
          <motion.div {...fadeUp(0.1)} className="bg-surface-container-low rounded-xl border border-outline-variant/20 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">psychology</span>
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">My Skills</h3>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">save</span>
                    Save Skills
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
              Add your skills so managers can find you when building project teams.
              Managers search by name and skills to invite developers to their projects.
            </p>

            {/* Current Skills */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {skills.map((skill, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-lg border border-primary/20"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(i)}
                      className="hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {skills.length === 0 && (
              <div className="bg-surface-container-high rounded-lg p-6 text-center mb-5 border border-outline-variant/20">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/60 mb-2 block">
                  lightbulb
                </span>
                <p className="text-sm text-on-surface-variant">
                  No skills added yet. Add your skills to be discoverable by managers.
                </p>
              </div>
            )}

            {/* Add Skill Input */}
            <div className="flex gap-2 mb-5">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-sm">
                  add
                </span>
                <input
                  type="text"
                  placeholder="Type a skill and press Enter..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                />
              </div>
              <button
                onClick={() => addSkill(newSkill)}
                disabled={!newSkill.trim()}
                className="px-4 py-2.5 bg-surface-container-highest text-sm font-bold text-on-surface-variant rounded-lg hover:text-on-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>

            {/* Suggestions */}
            {unusedSuggestions.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  Suggested Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {unusedSuggestions.slice(0, 20).map((skill) => (
                    <button
                      key={skill}
                      onClick={() => addSkill(skill)}
                      className="px-2.5 py-1 text-xs text-on-surface-variant bg-surface-container-highest rounded-lg hover:text-on-surface hover:bg-primary/10 hover:text-primary transition-colors border border-outline-variant/20"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold ${
            toast.type === 'success'
              ? 'bg-surface-container-high border-secondary/30 text-secondary'
              : 'bg-surface-container-high border-error/30 text-error'
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DeveloperProfilePage;
