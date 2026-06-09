import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import {
  Sparkles,
  Award,
  Zap,
  Lock,
  Unlock,
  Star,
  Eye,
  Settings,
  Compass,
  Check,
  Loader2,
  ChevronRight,
  Sliders,
  HelpCircle
} from 'lucide-react';

import { SkillNode, Constellation, MasteryLevel } from './types';
import { CONSTELLATIONS, SKILL_NODES } from './data';
import { StarBackground } from './components/StarBackground';



export default function App() {
  // 1. Mastery Progress State Tracker (saved to/loaded from LocalStorage)
  const [unlockedSkills, setUnlockedSkills] = useState<Record<string, MasteryLevel>>(() => {
    try {
      const saved = localStorage.getItem('astro_kendama_mastery');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not load local storage", e);
    }
    // Default: 'cup_1' is unlocked as the starter node, rest are locked
    const defaultState: Record<string, MasteryLevel> = {
      cup_1: 'unlocked',
    };
    return defaultState;
  });

  // 2. Navigation State
  const [activeConstellation, setActiveConstellation] = useState<Constellation>(CONSTELLATIONS[0]);
  const [selectedSkill, setSelectedSkill] = useState<SkillNode>(() => {
    // Default to the first skill of the active constellation
    return SKILL_NODES.find(n => n.constellationId === CONSTELLATIONS[0].id) || SKILL_NODES[0];
  });

  // 3. Tab State: 'skills' (Star progress/Simulator) or 'forge' (Customizer)
  const [activeTab, setActiveTab] = useState<'skills' | 'forge'>('skills');

  const [cloudStatus, setCloudStatus] = useState<'idle' | 'saving' | 'saved' | 'loading' | 'error'>('idle');

  // Cloud save: unique user ID
  const userIdRef = useRef<string>('');
  if (!userIdRef.current) {
    let id = localStorage.getItem('kendama_user_id');
    if (!id) { id = 'user_' + Math.random().toString(36).slice(2, 10); localStorage.setItem('kendama_user_id', id); }
    userIdRef.current = id;
  }

  const handleCloudSave = async () => {
    setCloudStatus('saving');
    try {
      const res = await fetch('/api/cloud/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdRef.current,
          data: { unlockedSkills },
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setCloudStatus('saved');
      setTimeout(() => setCloudStatus('idle'), 2000);
    } catch {
      setCloudStatus('error');
      setTimeout(() => setCloudStatus('idle'), 2000);
    }
  };

  const handleCloudLoad = async () => {
    setCloudStatus('loading');
    try {
      const res = await fetch(`/api/cloud/load?userId=${userIdRef.current}`);
      const data = await res.json();
      if (!data.exists) {
        setCloudStatus('error');
        setTimeout(() => setCloudStatus('idle'), 2000);
        return;
      }
      setUnlockedSkills(data.unlockedSkills || { cup_1: 'unlocked' });
      setCloudStatus('saved');
      setTimeout(() => setCloudStatus('idle'), 2000);
    } catch {
      setCloudStatus('error');
      setTimeout(() => setCloudStatus('idle'), 2000);
    }
  };

  // Virtual disk angle ref for smooth GSAP projection animation
  const diskAngleRef = useRef({ value: 0 });

  // Sync mastery updates to local storage
  useEffect(() => {
    localStorage.setItem('astro_kendama_mastery', JSON.stringify(unlockedSkills));
  }, [unlockedSkills]);

  // GSAP global defaults & accessibility
  useEffect(() => {
    gsap.defaults({ duration: 0.6, ease: "power2.out" });

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.defaults({ duration: 0 });
    });

    return () => mm.revert();
  }, []);

  // Global mouse position for constellation parallax
  const mouseRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX - window.innerWidth / 2) / window.innerWidth;
      mouseRef.current.y = (e.clientY - window.innerHeight / 2) / window.innerHeight;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Helper: project constellation positions based on disk angle
  const projectConstellations = (angle: number) => {
    CONSTELLATIONS.forEach((con, i) => {
      const eff = i * 30 + angle;
      const rad = eff * Math.PI / 180;
      const cosVal = Math.cos(rad);
      const sinVal = Math.sin(rad);

      const x = sinVal * 300;
      const cosClamped = Math.max(0, cosVal);
      const scale = 0.1 + 0.9 * Math.pow(cosClamped, 2);
      const opacity = 0.08 + 0.92 * Math.pow(cosClamped, 2.5);
      const blur = (1 - cosClamped) * 3;
      const isFront = Math.abs(eff) < 15;

      // Mouse parallax: depth effect, background constellations move more
      const depth = 1 - cosClamped; // 0=front, 1=back
      const px = mouseRef.current.x * depth * 40;
      const py = mouseRef.current.y * depth * 25;

      const group: HTMLElement | null = document.querySelector(`[data-constellation-group="${con.id}"]`);
      if (group) {
        gsap.set(group, { x: x + px, y: py, scale, opacity, filter: `blur(${blur}px)` });
        group.style.pointerEvents = isFront ? 'auto' : 'none';
      }
    });
  };

  // Initial positioning on mount
  useEffect(() => {
    projectConstellations(0);
  }, []);

  // GSAP projected disk rotation + node style transitions
  useEffect(() => {
    const targetIndex = CONSTELLATIONS.findIndex(c => c.id === activeConstellation.id);
    const targetAngle = -targetIndex * 30;

    gsap.killTweensOf(diskAngleRef.current);

    gsap.to(diskAngleRef.current, {
      value: targetAngle,
      duration: 0.8,
      ease: "power3.inOut",
      onUpdate: () => projectConstellations(diskAngleRef.current.value),
    });

    // Animate node visual mode: background dots ↔ detailed nodes
    CONSTELLATIONS.forEach((con, i) => {
      const isActive = i === targetIndex;
      const group = document.querySelector(`[data-constellation-group="${con.id}"]`);
      if (!group) return;

      const dots = group.querySelectorAll('[data-node-bg-dot]');
      const detailed = group.querySelectorAll('[data-node-detailed]');

      if (isActive) {
        // Fade out background dots, fade in detailed nodes with scale pop
        gsap.to(dots, { opacity: 0, duration: 0.35, ease: "power2.out" });
        gsap.fromTo(detailed, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.4)", stagger: 0.03 });
      } else {
        // Fade in background dots, fade out detailed nodes
        gsap.to(dots, { opacity: 1, duration: 0.35, ease: "power2.out" });
        gsap.to(detailed, { opacity: 0, duration: 0.2, ease: "power2.in" });
      }
    });
  }, [activeConstellation]);

  // Constellation fully-mastered celebration animation
  const prevMasteredRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    CONSTELLATIONS.forEach((con) => {
      const conNodes = SKILL_NODES.filter(n => n.constellationId === con.id);
      const allMastered = conNodes.every(n => unlockedSkills[n.id] === 'mastered');
      const wasMastered = prevMasteredRef.current.has(con.id);

      if (allMastered && !wasMastered && con.id === activeConstellation.id) {
        // Celebration: sequence through nodes + lines
        const timeline = gsap.timeline();
        const group = document.querySelector(`[data-constellation-group="${con.id}"]`);
        if (!group) return;

        const nodeEls = conNodes.map(n => group.querySelector(`[data-star-node="${n.id}"]`));
        const innerSvg = group.querySelector('svg');
        const svgLines = innerSvg ? innerSvg.querySelectorAll('line') : [];

        // Dim all lines initially
        timeline.set(svgLines, { opacity: 0.12 });

        // Light up each node in sequence, with its connecting lines lighting up too
        nodeEls.forEach((el, i) => {
          if (!el) return;
          const node = conNodes[i];
          const svg = el.querySelector('svg');

          // Find lines connected to this node
          const connectedLines = innerSvg ? Array.from(innerSvg.querySelectorAll('line')).filter(line => {
            const parentG = line.closest('g');
            if (!parentG) return false;
            const hasNode = parentG.querySelector(`circle[data-orbit-particle="${node.id}"]`);
            return !!hasNode;
          }) : [];

          // Node pop + glow
          timeline.to(el, { scale: 1.15, duration: 0.06, ease: "power2.out" }, i * 0.08);
          timeline.to(el, { scale: 1, duration: 0.1, ease: "power2.out" });
          if (svg) {
            timeline.to(svg, { filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.9))', duration: 0.06 }, i * 0.08);
            timeline.to(svg, { filter: 'drop-shadow(0 0 0px rgba(255,255,255,0))', duration: 0.1 });
          }

          // Light up connected lines — slower reveal
          timeline.to(connectedLines, { opacity: 1, duration: 0.6, ease: "power2.in" }, i * 0.08 + 0.04);
        });
      }

      if (allMastered) prevMasteredRef.current.add(con.id);
    });
  }, [unlockedSkills, activeConstellation]);

  // GSAP floating — inner wrapper sways so lines and nodes sync; per-node on active only
  useEffect(() => {
    const activeIndex = CONSTELLATIONS.findIndex(c => c.id === activeConstellation.id);

    CONSTELLATIONS.forEach((con, conIdx) => {
      const isActive = conIdx === activeIndex;
      const distance = Math.abs(conIdx - activeIndex);
      const inner = document.querySelector(`[data-constellation-inner="${con.id}"]`);
      if (!inner) return;

      if (isActive) {
        // Active: gentle per-node float
        const nodes = inner.querySelectorAll('[data-star-node]');
        nodes.forEach((node, i) => {
          const angle = (i * 137.5) * Math.PI / 180;
          const dist = 2;
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist;
          gsap.fromTo(node,
            { x: -dx, y: -dy },
            { x: dx, y: dy, duration: 3 + (i % 3) * 0.8, repeat: -1, yoyo: true, ease: "sine.inOut", overwrite: "auto" }
          );
        });
      } else {
        // Background: inner wrapper floats — SVG lines + nodes move together
        const gx = Math.cos(conIdx * 1.1 + distance * 0.6) * (5 + distance * 3);
        const gy = Math.sin(conIdx * 0.8 + 0.4) * (4 + distance * 2);
        gsap.fromTo(inner,
          { x: 0, y: 0 },
          { x: gx, y: gy, duration: 5 + conIdx * 0.8, repeat: -1, yoyo: true, ease: "sine.inOut", overwrite: "auto" }
        );
      }
    });

    return () => {
      gsap.killTweensOf('[data-star-node]');
      gsap.killTweensOf('[data-constellation-inner]');
    };
  }, [activeConstellation]);

  // Total progression calculation
  const totalStarCount = SKILL_NODES.length;
  const masteredCount = Object.values(unlockedSkills).filter(status => status === 'mastered').length;
  const unlockedCount = Object.values(unlockedSkills).filter(status => status !== 'locked').length;

  const totalStarPower = masteredCount * 150 + (unlockedCount - masteredCount) * 50;

  // Render current Master level title based on star level
  const getMasteryRank = (starPower: number) => {
    if (starPower >= 10000) return '奇点 Singularity';
    if (starPower >= 5500) return '引力 Gravity';
    if (starPower >= 2500) return '轨道 Trajectory';
    if (starPower >= 1000) return '环绕 Orbit';
    return '漂浮 Drift';
  };

  // Node helper state check
  const isNodeLocked = (nodeId: string) => {
    return !unlockedSkills[nodeId] || unlockedSkills[nodeId] === 'locked';
  };

  const isNodeCompleted = (nodeId: string) => {
    return unlockedSkills[nodeId] === 'mastered';
  };

  // Checks if dependencies / prerequisites are met for a node
  const checkUnlockable = (node: SkillNode) => {
    if (node.unlockRequirements.length === 0) return true;
    // Unlocks if any of the prerequisite nodes are mastered
    return node.unlockRequirements.every(reqId => unlockedSkills[reqId] === 'mastered');
  };

  // Toggle node unlock status directly
  const handleToggleUnlock = (node: SkillNode) => {
    const isLocked = isNodeLocked(node.id);
    const isCompleted = isNodeCompleted(node.id);

    setUnlockedSkills(prev => {
      const next = { ...prev };
      if (isLocked) {
        next[node.id] = 'unlocked';
      } else if (isCompleted) {
        // Relock item
        next[node.id] = 'locked';
      } else {
        // Practicing -> Mastered!
        next[node.id] = 'mastered';

        // Subtle glow-in when mastered
        setTimeout(() => {
          const el = document.querySelector(`[data-star-node="${node.id}"]`);
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const glow = document.createElement('div');
          glow.style.cssText = `
            position: fixed; z-index: 998; pointer-events: none;
            left: ${rect.left + rect.width / 2 - 25}px; top: ${rect.top + rect.height / 2 - 25}px;
            width: 50px; height: 50px; border-radius: 50%;
            background: radial-gradient(circle, ${activeConstellation.themeColor}33 0%, transparent 60%);
          `;
          document.body.appendChild(glow);
          gsap.fromTo(glow, { opacity: 0, scale: 0.8 }, { opacity: 0.6, scale: 1.1, duration: 0.3, ease: "power2.out" });
          gsap.to(glow, { opacity: 0, duration: 0.5, delay: 0.4, ease: "power2.out", onComplete: () => glow.remove() });
        }, 50);

        // Auto unlock children node requirements to enable continuous exploration tree lines
        SKILL_NODES.filter(n => n.unlockRequirements.includes(node.id)).forEach(child => {
          if (!next[child.id] || next[child.id] === 'locked') {
            next[child.id] = 'unlocked';
          }
        });
      }
      return next;
    });
  };

  const handleSimulatorSuccess = (perfect: boolean) => {
    // Complete selected node
    setUnlockedSkills(prev => {
      const next = { ...prev };
      next[selectedSkill.id] = 'mastered';

      // Auto awaken next child stars
      SKILL_NODES.filter(n => n.unlockRequirements.includes(selectedSkill.id)).forEach(child => {
        if (!next[child.id] || next[child.id] === 'locked') {
          next[child.id] = 'unlocked';
        }
      });
      return next;
    });
  };

  // Request Oracle Astrology Read
  // Selection handler for constellation button clicks
  const selectConstellation = (con: Constellation) => {
    setActiveConstellation(con);
    const firstInCon = SKILL_NODES.find(n => n.constellationId === con.id);
    if (firstInCon) {
      setSelectedSkill(firstInCon);
    }
  };


  return (
    <div className="relative text-slate-100 flex flex-col font-sans overflow-x-hidden antialiased selection:bg-slate-700 selection:text-white">
      {/* 1. Dynamic Parallax Star Backdrop */}
      <StarBackground />

      {/* Deep space nebula glows */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-indigo-500/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[10%] w-[600px] h-[600px] rounded-full bg-violet-500/[0.03] blur-[150px] pointer-events-none" />

      {/* 3. APP HEADER MODULE */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-5 pb-3 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <span className="text-[9px] uppercase font-mono tracking-[0.5em] text-[#E8EDF5]/60 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              ZODIAC GRAPH • KENDAMA SUTRA
            </span>
            <div className="h-1.5 w-1.5 rounded-full bg-[#F5F8FF] shadow-[0_0_8px_#F5F8FF] animate-pulse" />
          </div>
          <h1 className="text-xl md:text-2xl font-extralight font-display tracking-[0.6em] text-[#E8EDF5] mt-3.5 uppercase">
            星曜剑玉航道 <span className="font-light text-[#F5F8FF] tracking-[0.1em] opacity-90">ZODIAC PATH</span>
          </h1>
          <div className="mt-2 w-12 h-[1px] bg-white opacity-20 mx-auto md:mx-0"></div>
        </div>

        {/* Constellation Stat Dashboard */}
        <div className="flex flex-wrap gap-4 items-center bg-black/25 p-3.5 px-5 rounded-2xl border border-[#E8EDF5]/10 backdrop-blur-xl shadow-[0_0_15px_rgba(245,248,255,0.03)]">
          <div className="text-right">
            <span className="text-[8px] font-mono tracking-[0.2em] text-[#F5F8FF]/80 block uppercase opacity-70">
              Current Power 宿命星力
            </span>
            <span className="text-md font-mono text-[#E8EDF5] tracking-widest font-bold">
              {totalStarPower} <span className="text-slate-400 text-xs font-normal">SPS</span>
            </span>
          </div>
          <div className="w-[1px] h-8 bg-white/10" />
          <div className="text-right">
            <span className="text-[8px] font-mono tracking-[0.2em] text-[#F5F8FF]/80 block uppercase opacity-70">
              Mastery Progress 极境点亮
            </span>
            <span className="text-sm font-mono text-[#E8EDF5] tracking-wide">
              <span className="text-white font-bold">{masteredCount}</span> / {totalStarCount} (
              {Math.round((masteredCount / totalStarCount) * 100)}%)
            </span>
          </div>
          <div className="w-[1px] h-8 bg-white/10" />
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-mono tracking-[0.2em] text-[#E8EDF5]/60 uppercase">
              Hale Rank 心流品阶
            </span>
            <span className="text-[9px] text-[#E8EDF5] tracking-wider truncate max-w-[180px] font-light border border-[#E8EDF5]/10 px-2.5 py-0.5 rounded mt-1 bg-white/5">
              {getMasteryRank(totalStarPower)}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-white/10" />
          {/* Cloud save buttons */}
          <div className="flex items-center gap-1.5">
            <button onClick={handleCloudSave} disabled={cloudStatus === 'saving'}
              className="text-[8px] font-mono tracking-wider text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg border border-white/10 transition-colors disabled:opacity-40">
              {cloudStatus === 'saving' ? '...' : cloudStatus === 'saved' ? 'SAVED' : 'SAVE'}
            </button>
            <button onClick={handleCloudLoad} disabled={cloudStatus === 'loading'}
              className="text-[8px] font-mono tracking-wider text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg border border-white/10 transition-colors disabled:opacity-40">
              {cloudStatus === 'loading' ? '...' : cloudStatus === 'error' ? 'ERR' : 'LOAD'}
            </button>
          </div>
        </div>
      </header>

      {/* 4. MAIN LAYOUT GRID */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-4 pb-0 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

        {/* LEFT COLUMN (Zodiac space maps - 7 Units wide) */}
        <section className="lg:col-span-7 flex flex-col justify-between gap-5">

          {/* 1. Constellation Selection Tabs */}
          <div className="w-full flex flex-wrap justify-center gap-2.5 pb-2.5 pt-0.5">
            {CONSTELLATIONS.map((con) => {
              const active = activeConstellation.id === con.id;
              // Compute sign completed ratio
              const conSkills = SKILL_NODES.filter(n => n.constellationId === con.id);
              const conMastered = conSkills.filter(n => unlockedSkills[n.id] === 'mastered').length;
              const ratio = Math.round((conMastered / conSkills.length) * 100);

              return (
                <button
                  key={con.id}
                  onClick={() => selectConstellation(con)}
                  className={`relative px-4 py-3 rounded-xl border transition-all duration-300 flex items-center gap-2.5 cursor-pointer ${active
                    ? 'bg-black border-[#F5F8FF]/30 text-[#F5F8FF] shadow-[0_0_15px_rgba(245,248,255,0.15)] font-medium font-sans'
                    : 'bg-black/15 border-[#E8EDF5]/10 text-[#E8EDF5]/60 hover:border-[#E8EDF5]/20 hover:text-[#E8EDF5]'
                    }`}
                >
                  {/* Miniature element color spot with theme glow */}
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: con.themeColor,
                      boxShadow: active ? `0 0 10px ${con.themeColor}` : 'none'
                    }}
                  />
                  <div className="text-left">
                    <div className="text-[10px] font-mono tracking-widest uppercase font-semibold leading-none">
                      {con.name}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-1 font-light block">
                      {con.chineseName} {conMastered > 0 && `(${conMastered}/${conSkills.length})`}
                    </div>
                  </div>

                  {ratio === 100 && (
                    <span className="absolute -top-1.5 -right-1 bg-[#F5F8FF] text-black w-3.5 h-3.5 flex items-center justify-center rounded-full shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                      <Star size={8} fill="#000" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 2. The Constellation Interactive Map Board */}
          <div
            className="relative w-full aspect-square md:aspect-[4/3] rounded-3xl border border-[#E8EDF5]/10 bg-black/20 backdrop-blur-xl flex flex-col justify-between p-5 overflow-hidden group shadow-[0_0_35px_rgba(245,248,255,0.02)]"
          >
            {/* Background elements (coordinates dials, star indicators) */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              {/* Star grid coordinate dials */}
              <div className="absolute inset-5 border border-dashed border-white/5 rounded-full" />
              <div className="absolute inset-20 border border-dotted border-white/5 rounded-full animate-slow-spin" />
              
              <div className="absolute left-1/2 top-0 bottom-0 w-[0.5px] bg-white/5" />
              <div className="absolute top-1/2 left-0 right-0 h-[0.5px] bg-white/5" />

              {/* Glowing Nebula sign color background */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] aspect-square rounded-full blur-[80px] opacity-15 duration-1000 transition-all"
                style={{ backgroundColor: activeConstellation.themeColor }}
              />

              <div className="absolute top-4 left-4 font-mono text-[9px] text-slate-500 tracking-wider">
                ASTROGRID v4.1.1 // ORBIT RANGE: +1.40xX -0.85yY
              </div>
              <div className="absolute bottom-4 right-4 font-mono text-[9px] text-slate-600">
                ELEMENT_ZODIAC: <span className="uppercase text-slate-400 font-bold">{activeConstellation.element}</span>
              </div>
            </div>

            {/* Constellation Descriptive Overlay */}
            <div className="relative z-10 max-w-md pointer-events-none">
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase flex items-center gap-1.5 leading-none">
                <Compass size={11} /> {activeConstellation.element} Element Nebula
              </span>
              <h2 className="text-md sm:text-lg font-display text-white tracking-widest uppercase mt-1">
                {activeConstellation.chineseName} <span className="font-mono text-xs text-slate-400">({activeConstellation.name} Path)</span>
              </h2>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1 border-l border-white/10 pl-2">
                {activeConstellation.description}
              </p>
            </div>

            {/* Galaxy Disk — constellation cards projected from virtual rotating disk */}
            <div
              className="absolute inset-0 z-20 flex items-center justify-center"
            >
              {CONSTELLATIONS.map((con, i) => {
                const conNodes = SKILL_NODES.filter(n => n.constellationId === con.id);
                const isActive = activeConstellation.id === con.id;

                return (
                  <div
                    key={con.id}
                    data-constellation-group={con.id}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: isActive ? 'auto' : 'none',
                    }}
                  >
                    <div
                      data-constellation-inner={con.id}
                      style={{ position: 'absolute', inset: 0 }}
                    >
                      {/* SVG connection lines for this constellation */}
                      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                        {conNodes.map((node) =>
                          node.unlockRequirements.map((reqId) => {
                            const parentNode = SKILL_NODES.find((item) => item.id === reqId);
                            if (!parentNode) return null;

                            const startX = `${parentNode.x}%`;
                            const startY = `${parentNode.y}%`;
                            const endX = `${node.x}%`;
                            const endY = `${node.y}%`;
                            const bothUnlocked = !isNodeLocked(node.id) && !isNodeLocked(parentNode.id);
                            const bothMastered = isNodeCompleted(node.id) && isNodeCompleted(parentNode.id);
                            const oneMastered = bothUnlocked && !bothMastered && (isNodeCompleted(node.id) || isNodeCompleted(parentNode.id));
                            const neitherMastered = bothUnlocked && !bothMastered && !oneMastered;

                            return (
                              <g key={`${parentNode.id}-${node.id}`}>
                                {isActive && bothMastered ? (
                                  <>
                                    <line x1={startX} y1={startY} x2={endX} y2={endY}
                                      stroke="#C0C0C0" strokeWidth="6"
                                      className="opacity-35 blur-[5px]" />
                                    <line x1={startX} y1={startY} x2={endX} y2={endY}
                                      stroke="#E8EDF5" strokeWidth="3"
                                      className="opacity-70 blur-[2px]" />
                                    <line x1={startX} y1={startY} x2={endX} y2={endY}
                                      stroke="#FFFFFF" strokeWidth="1.5"
                                      style={{ transition: 'stroke 0.5s ease' }} />
                                  </>
                                ) : isActive && oneMastered ? (
                                  <>
                                    <line x1={startX} y1={startY} x2={endX} y2={endY}
                                      stroke="rgba(200,210,230,0.2)" strokeWidth="4"
                                      style={{ filter: 'blur(3px)' }} />
                                    <line x1={startX} y1={startY} x2={endX} y2={endY}
                                      stroke="rgba(235,242,255,0.65)" strokeWidth="0.9"
                                      strokeDasharray="3,5" />
                                  </>
                                ) : isActive && neitherMastered ? (
                                  <line x1={startX} y1={startY} x2={endX} y2={endY}
                                    stroke="rgba(200,210,230,0.2)" strokeWidth="0.6"
                                    strokeDasharray="2,4" />
                                ) : isActive && !bothUnlocked ? (
                                  <line x1={startX} y1={startY} x2={endX} y2={endY}
                                    stroke="rgba(220, 230, 250, 0.42)" strokeWidth="0.8" />
                                ) : bothUnlocked ? (
                                  <>
                                    <line x1={startX} y1={startY} x2={endX} y2={endY}
                                      stroke="rgba(200, 220, 250, 0.12)" strokeWidth="2.5"
                                      style={{ filter: 'blur(1px)' }} />
                                    <line x1={startX} y1={startY} x2={endX} y2={endY}
                                      stroke="rgba(220, 235, 250, 0.35)" strokeWidth="0.6" />
                                  </>
                                ) : (
                                  <line x1={startX} y1={startY} x2={endX} y2={endY}
                                    stroke="rgba(200, 210, 230, 0.25)" strokeWidth="0.5" />
                                )}
                                {bothUnlocked && isActive && (
                                  <circle r="1.5" fill="#FFFFFF"
                                    data-orbit-particle={node.id}
                                    data-start-x={startX} data-start-y={startY}
                                    data-end-x={endX} data-end-y={endY} />
                                )}
                              </g>
                            );
                          })
                        )}
                      </svg>

                      {/* Star nodes — background mode: silver dots; active mode: detailed */}
                      {conNodes.map((node) => {
                        const isLocked = isNodeLocked(node.id);
                        const isCompleted = isNodeCompleted(node.id);
                        const isSelected = selectedSkill.id === node.id;

                        return (
                          <div
                            key={node.id}
                            data-star-node={node.id}
                            data-active-mode={isActive ? 'true' : 'false'}
                            className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 group/star"
                            style={{ left: `${node.x}%`, top: `${node.y}%` }}
                            onClick={() => { if (isActive) { setSelectedSkill(node); setActiveTab('skills'); } }}
                          >
                            {/* Background mode: silver-white glowing dot */}
                            <div
                              data-node-bg-dot
                              className="absolute inset-0 flex items-center justify-center"
                              style={{ opacity: isActive ? 0 : 1 }}
                            >
                              <svg width="5" height="5" viewBox="0 0 24 24" fill="rgba(232,237,245,0.85)" strokeLinejoin="round" className="drop-shadow-[0_0_5px_rgba(232,237,245,0.7)]">
                                <path d="M12 0.5 C12.5 3,12 7,13.5 9.5 C15 10.5,19 10.5,22 12 C19 13.5,15 13.5,13.5 14.5 C12 17,12.5 21,12 23.5 C11.5 21,12 17,10.5 14.5 C9 13.5,5 13.5,2 12 C5 10.5,9 10.5,10.5 9.5 C12 7,11.5 3,12 0.5 Z" />
                              </svg>
                            </div>

                            {/* Active mode: four-pointed star node */}
                            <div data-node-detailed style={{ opacity: isActive ? 1 : 0 }}>
                              {isSelected && (
                                <span className="absolute -inset-4.5 rounded-full border border-white/20 animate-ping opacity-35" />
                              )}
                              <div className="relative w-9 h-9 flex items-center justify-center transition-all duration-300">
                                <svg width="34" height="34" viewBox="0 0 24 24"
                                  strokeLinejoin="round" strokeLinecap="round"
                                >
                                  <path d="M12 1 Q13 5 14.5 9.5 Q17 11 22 12 Q17 13 14.5 14.5 Q13 19 12 23 Q11 19 9.5 14.5 Q7 13 2 12 Q7 11 9.5 9.5 Q11 5 12 1 Z" fill="rgba(0,0,0,0.85)" stroke="none" />
                                  {isCompleted && (
                                    <>
                                      {/* Outer glow halo */}
                                      <path d="M12 1 Q13 5 14.5 9.5 Q17 11 22 12 Q17 13 14.5 14.5 Q13 19 12 23 Q11 19 9.5 14.5 Q7 13 2 12 Q7 11 9.5 9.5 Q11 5 12 1 Z"
                                        fill="none" stroke={activeConstellation.themeColor} strokeWidth="4" opacity="0.3"
                                        style={{ filter: 'blur(2.5px)' }} />
                                      {/* Colored outline — hollow */}
                                      <path d="M12 1 Q13 5 14.5 9.5 Q17 11 22 12 Q17 13 14.5 14.5 Q13 19 12 23 Q11 19 9.5 14.5 Q7 13 2 12 Q7 11 9.5 9.5 Q11 5 12 1 Z"
                                        fill="none" stroke={activeConstellation.themeColor} strokeWidth="0.8"
                                        style={{ filter: `drop-shadow(0 0 4px ${activeConstellation.themeColor})` }} />
                                    </>
                                  )}
                                  {!isCompleted && (
                                    <path d="M12 1 Q13 5 14.5 9.5 Q17 11 22 12 Q17 13 14.5 14.5 Q13 19 12 23 Q11 19 9.5 14.5 Q7 13 2 12 Q7 11 9.5 9.5 Q11 5 12 1 Z"
                                      fill="none"
                                      stroke={isLocked ? 'rgba(160,165,180,0.6)' : 'rgba(232,237,245,0.85)'}
                                      strokeWidth="0.7"
                                      style={{
                                        filter: isSelected
                                          ? 'drop-shadow(0 0 5px rgba(245,248,255,0.5))'
                                          : !isLocked
                                            ? 'drop-shadow(0 0 3px rgba(232,237,245,0.3))'
                                            : undefined
                                      }}
                                    />
                                  )}
                                </svg>
                              </div>
                              <div className="absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-0.5 rounded-md bg-black/80 border border-white/10 pointer-events-none opacity-0 group-hover/star:opacity-100 transition whitespace-nowrap text-[9px] font-scifi tracking-widest uppercase">
                                {node.title}{isLocked && ' (Locked)'}
                              </div>
                              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 text-[9px] font-scifi text-slate-400 group-hover/star:text-slate-100 transition tracking-wider uppercase whitespace-nowrap">
                                {node.subTitle}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    </div>
                  );
                })}
            </div>

            {/* Quick Helper Tips Panel */}
            <div className="relative z-10 flex justify-between items-center bg-black/15 p-2.5 px-4 rounded-xl border border-white/5 backdrop-blur-md">
              <div className="flex gap-4 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(100,100,110,0.5)" strokeWidth="0.8" strokeLinejoin="round"><path d="M12 0.5 C12.5 3,12 7,13.5 9.5 C15 10.5,19 10.5,22 12 C19 13.5,15 13.5,13.5 14.5 C12 17,12.5 21,12 23.5 C11.5 21,12 17,10.5 14.5 C9 13.5,5 13.5,2 12 C5 10.5,9 10.5,10.5 9.5 C12 7,11.5 3,12 0.5 Z" /></svg>
                  Locked
                </div>
                <div className="flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(232,237,245,0.7)" strokeWidth="0.6" strokeLinejoin="round"><path d="M12 0.5 C12.5 3,12 7,13.5 9.5 C15 10.5,19 10.5,22 12 C19 13.5,15 13.5,13.5 14.5 C12 17,12.5 21,12 23.5 C11.5 21,12 17,10.5 14.5 C9 13.5,5 13.5,2 12 C5 10.5,9 10.5,10.5 9.5 C12 7,11.5 3,12 0.5 Z" /></svg>
                  Unlocked
                </div>
                <div className="flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill={activeConstellation.themeColor} stroke={activeConstellation.themeColor} strokeWidth="0.3" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${activeConstellation.themeColor})` }}><path d="M12 0.5 C12.5 3,12 7,13.5 9.5 C15 10.5,19 10.5,22 12 C19 13.5,15 13.5,13.5 14.5 C12 17,12.5 21,12 23.5 C11.5 21,12 17,10.5 14.5 C9 13.5,5 13.5,2 12 C5 10.5,9 10.5,10.5 9.5 C12 7,11.5 3,12 0.5 Z" /></svg>
                  Mastered
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-500 hidden sm:inline">
                Click cosmic star coordinates to inspect or forge training.
              </span>
            </div>
            
          </div>
        </section>

        {/* RIGHT COLUMN (Detailed profiling drawer & Kendama Forge - 5 Units wide) */}
        <section className="lg:col-span-5 flex flex-col justify-between gap-5">

          {/* 1. Header Tab — 天工炉座暂时禁用 */}
          <div className="bg-black/25 p-1.5 rounded-xl border border-[#E8EDF5]/10 shadow-sm">
            <div
              className="py-2.5 rounded-lg font-display text-xs tracking-widest font-semibold text-center bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.05)] border border-white/10"
            >
              <Sparkles size={14} className="inline-block mr-1" /> 星星宿轨 ({selectedSkill.title})
            </div>
          </div>

          {/* 2. Primary Tab Panel Container */}
          <div className="flex-grow flex flex-col justify-between aspect-auto bg-black/20 border border-[#E8EDF5]/10 rounded-3xl p-5 relative overflow-hidden backdrop-blur-2xl shadow-[0_0_25px_rgba(245,248,255,0.02)]">
            <AnimatePresence mode="wait">
              {/* 天工炉座已禁用 — 仅显示技能详情 */}
              <motion.div
                key="skills-tab"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col justify-between h-full gap-5"
                >
                  {/* Skill Badge details */}
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        {/* Element pill */}
                        <div className="flex gap-2 items-center">
                          <span
                            className="text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider text-[#FFECEF] font-medium"
                            style={{ fontFamily: '"SimHei", "PingFang SC", "Microsoft YaHei", sans-serif', backgroundColor: `${activeConstellation.themeColor}33`, border: `0.5px solid ${activeConstellation.themeColor}` }}
                          >
                            {activeConstellation.chineseName} • {selectedSkill.category.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="text-xl font-light font-display tracking-widest text-white mt-1.5 flex items-center gap-2">
                          {selectedSkill.title}
                          <span className="text-xs font-mono font-normal text-slate-400 block sm:inline">({selectedSkill.subTitle})</span>
                        </h3>
                      </div>

                      {/* Difficulty stars */}
                      <div className="flex gap-0.5 text-amber-400 pt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < selectedSkill.difficulty ? 'currentColor' : 'none'}
                            className={i < selectedSkill.difficulty ? 'text-amber-400' : 'text-slate-700'}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mt-3.5 bg-black/20 border border-white/5 p-3 rounded-xl">
                      <p className="text-xs text-slate-300 leading-relaxed font-light">
                        {selectedSkill.description}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex flex-col gap-2">
                      {(() => {
                        const locked = isNodeLocked(selectedSkill.id);
                        const completed = isNodeCompleted(selectedSkill.id);
                        const unlockable = checkUnlockable(selectedSkill);

                        if (locked && !unlockable) {
                          const missingParents = selectedSkill.unlockRequirements
                            .filter(reqId => unlockedSkills[reqId] !== 'mastered')
                            .map(reqId => SKILL_NODES.find(n => n.id === reqId)?.title || reqId);
                          return (
                            <div className="text-[10px] text-slate-500 text-center leading-relaxed">
                              Locked: Master {missingParents.join(', ')} first
                            </div>
                          );
                        }

                        if (locked && unlockable) {
                          return (
                            <button
                              onClick={() => handleToggleUnlock(selectedSkill)}
                              className="py-2.5 px-4 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-display tracking-widest hover:bg-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300"
                              style={{ boxShadow: '0 0 15px rgba(99,102,241,0.15)' }}
                            >
                              Unlock
                            </button>
                          );
                        }

                        if (!locked && !completed) {
                          return (
                            <button
                              onClick={() => handleToggleUnlock(selectedSkill)}
                              className="py-2.5 px-4 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-display tracking-widest hover:bg-amber-500/30 hover:border-amber-400/50 transition-all duration-300"
                              style={{ boxShadow: '0 0 15px rgba(245,158,11,0.15)' }}
                            >
                              Mark Mastered
                            </button>
                          );
                        }

                        if (completed) {
                          return (
                            <button
                              onClick={() => handleToggleUnlock(selectedSkill)}
                              className="py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[10px] font-mono tracking-wider hover:text-slate-200 hover:border-white/20 transition-all duration-200"
                            >
                              Relock
                            </button>
                          );
                        }

                        return null;
                      })()}
                    </div>

                  </div>
                </motion.div>
            </AnimatePresence>
          </div>


        </section>

      </main>

      {/* 5. FOOTER */}
    </div>
  );
}
