// ╔══════════════════════════════════════════════════════════════════════════════════╗
// ║  AANAND KUMAR — 3D HOLOGRAPHIC CYBERPUNK PORTFOLIO                              ║
// ║  Single-file React + R3F + AI Hand Tracking + Particle Physics                  ║
// ║                                                                                  ║
// ║  npm install react react-dom three @react-three/fiber @react-three/drei          ║
// ║            @react-three/postprocessing @mediapipe/hands @mediapipe/camera_utils   ║
// ╚══════════════════════════════════════════════════════════════════════════════════╝
import React, {
  useState, useRef, useMemo, useCallback, useEffect, memo,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, useCursor, Float } from "@react-three/drei";
import {
  EffectComposer, Bloom, Vignette,
} from "@react-three/postprocessing";

/* ───────── colour constants ───────── */
const BG = "#00020a";
const CYAN = "#00eaff";
const DEEP = "#003366";

/* ═══════════════════════════════════════
   1. PERSONAL DATA
   ═══════════════════════════════════════ */
const PERSONAL = {
  name: "AANAND KUMAR",
  role: "B.Tech CSE (3rd Year) | Android & Web Developer",
  bio:
    "Passionate developer crafting seamless Android and Web applications. Expertise in backend (Java) and cross-platform mobile development (Kotlin, Flutter, Dart). My mission is to build fine, high-performance software solutions.",
  github: "Aanand251",
  email: "choudharyaanandkumar251@gmail.com",
};

const SKILLS = [
  { name: "Java",         pct: 95, color: "#00eaff",
    desc: "Core language for Spring Boot backends, Android apps & data-structure mastery." },
  { name: "Kotlin",       pct: 90, color: "#a855f7",
    desc: "Primary Android language — Coroutines, Jetpack Compose, Multiplatform." },
  { name: "Dart / Flutter",pct: 85, color: "#00ffd5",
    desc: "Cross-platform mobile UI — beautiful, natively compiled apps from one codebase." },
  { name: "MongoDB",      pct: 78, color: "#22cccc",
    desc: "NoSQL document DB — schema-less design, aggregation pipelines, Atlas Cloud." },
  { name: "React",        pct: 80, color: "#61dafb",
    desc: "Component-driven SPAs, hooks, state management, React Three Fiber 3D." },
  { name: "HTML",         pct: 92, color: "#ff6644",
    desc: "Semantic markup, accessibility, Canvas API, SVG — the foundation of the web." },
];

const PROJECTS_3D = [
  { name: "Expense Tracker", color: "#00ff88", url: "https://github.com/Aanand251/personal-expense-tracker", tech: "Kotlin · Firebase", desc: "Smart expense tracking with Firebase sync." },
  { name: "Zenith", color: "#aa88ff", url: "https://github.com/Aanand251/Zenith", tech: "Kotlin Multiplatform · SQL", desc: "Cross-platform music streaming with offline playlists." },
  { name: "Talknest", color: "#ff8844", url: "https://github.com/Aanand251/Talknest", tech: "Kotlin · Firebase · FCM", desc: "Real-time chat with push notifications." },
  { name: "NEON", color: "#ff44aa", url: "https://github.com/Aanand251/personal-voice-assistant", tech: "Kotlin · NLP · Speech", desc: "Personal voice assistant with NLU." },
  { name: "Contact Me", color: "#00ffee", url: "mailto:choudharyaanandkumar251@gmail.com", tech: "GitHub: Aanand251", desc: "Email: choudharyaanandkumar251@gmail.com", isContact: true },
];

const PROJECTS = [
  {
    title: "Personal Expense Tracker",
    tech: ["Kotlin", "Firebase", "Android", "Material You"],
    desc:
      "Track daily expenses with smart categorisation, Firebase real-time sync, and beautiful Material You charts.",
    url: "https://github.com/Aanand251/personal-expense-tracker",
    icon: "\uD83D\uDCB0",
  },
  {
    title: "Zenith",
    tech: ["Kotlin Multiplatform", "SQL", "iOS", "Android"],
    desc:
      "Cross-platform music streaming app with offline playlists, equaliser, and KMP shared logic.",
    url: "https://github.com/Aanand251/Zenith",
    icon: "\uD83C\uDFB5",
  },
  {
    title: "Talknest",
    tech: ["Kotlin", "Firebase", "Realtime DB", "FCM"],
    desc:
      "Real-time chat application with push notifications, media sharing, and end-to-end encryption layer.",
    url: "https://github.com/Aanand251/Talknest",
    icon: "\uD83D\uDCAC",
  },
  {
    title: "NEON \u2014 Voice Assistant",
    tech: ["Kotlin", "Speech Recognition", "NLP", "Android"],
    desc:
      "Personal voice assistant with natural-language understanding, app control, and smart replies.",
    url: "https://github.com/Aanand251/personal-voice-assistant",
    icon: "\uD83E\uDD16",
  },
];

/* ═══════════════════════════════════════
   2. LIGHTS
   ═══════════════════════════════════════ */
function Lights() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[8, 12, 10]} intensity={0.7} color="#88ccff" />
      <pointLight position={[-6, -8, 6]} intensity={0.9} color="#00eaff" distance={60} />
      <pointLight position={[6, 8, -4]} intensity={0.5} color="#a855f7" distance={50} />
    </>
  );
}

/* ═══════════════════════════════════════
   3. DNA DOUBLE-HELIX (TubeGeometry)
   ═══════════════════════════════════════ */
const HELIX_RUNGS = 55;
const HELIX_RADIUS = 4.2;
const HELIX_HEIGHT = 48;
const HELIX_TURNS = 5;

function DNAHelix({ onNodeClick, rotRef, handRef, onContactClick }) {
  const grpRef = useRef();

  /* smooth backbone curves */
  const { curve1, curve2, rungPairs } = useMemo(() => {
    const pts1 = [], pts2 = [], rungs = [];
    for (let i = 0; i <= 300; i++) {
      const t = i / 300;
      const y = t * HELIX_HEIGHT - HELIX_HEIGHT / 2;
      const angle = t * Math.PI * 2 * HELIX_TURNS;
      pts1.push(new THREE.Vector3(Math.cos(angle) * HELIX_RADIUS, y, Math.sin(angle) * HELIX_RADIUS));
      pts2.push(new THREE.Vector3(Math.cos(angle + Math.PI) * HELIX_RADIUS, y, Math.sin(angle + Math.PI) * HELIX_RADIUS));
    }
    for (let i = 0; i < HELIX_RUNGS; i++) {
      const t = (i + 0.5) / HELIX_RUNGS;
      const y = t * HELIX_HEIGHT - HELIX_HEIGHT / 2;
      const angle = t * Math.PI * 2 * HELIX_TURNS;
      const a = new THREE.Vector3(Math.cos(angle) * HELIX_RADIUS, y, Math.sin(angle) * HELIX_RADIUS);
      const b = new THREE.Vector3(Math.cos(angle + Math.PI) * HELIX_RADIUS, y, Math.sin(angle + Math.PI) * HELIX_RADIUS);
      rungs.push({ a, b, mid: a.clone().lerp(b, 0.5), t });
    }
    return {
      curve1: new THREE.CatmullRomCurve3(pts1),
      curve2: new THREE.CatmullRomCurve3(pts2),
      rungPairs: rungs,
    };
  }, []);

  const tube1 = useMemo(() => new THREE.TubeGeometry(curve1, 256, 0.18, 8, false), [curve1]);
  const tube2 = useMemo(() => new THREE.TubeGeometry(curve2, 256, 0.18, 8, false), [curve2]);

  const BASE_X = 0.12;

  useFrame((_, dt) => {
    if (!grpRef.current) return;
    const g = grpRef.current;

    /* hand tracking rotation override */
    if (handRef?.current?.active) {
      const targetY = (handRef.current.x - 0.5) * Math.PI * 2;
      g.rotation.y += (targetY - g.rotation.y) * 0.08;
    } else {
      /* auto-spin + manual drag/scroll */
      g.rotation.y += 0.12 * dt + rotRef.current.dy * 0.01 + rotRef.current.scroll * 0.002;
    }
    rotRef.current.dy *= 0.92;
    rotRef.current.scroll *= 0.9;

    /* X drag + spring-back */
    g.rotation.x += rotRef.current.dx * 0.01;
    rotRef.current.dx *= 0.92;
    if (!rotRef.current.dragging) {
      g.rotation.x += (BASE_X - g.rotation.x) * 0.03;
    }
  });

  return (
    <group ref={grpRef} rotation={[BASE_X, 0, 0]}>
      {/* backbone strands */}
      <mesh geometry={tube1}>
        <meshStandardMaterial color="#00aaff" emissive="#003366" emissiveIntensity={1.4} transparent opacity={0.6} roughness={0.3} />
      </mesh>
      <mesh geometry={tube2}>
        <meshStandardMaterial color="#8855ff" emissive="#220055" emissiveIntensity={1.4} transparent opacity={0.6} roughness={0.3} />
      </mesh>

      {/* rungs (bars between strands) */}
      {rungPairs.map((r, i) => {
        const dir = r.b.clone().sub(r.a);
        const len = dir.length();
        const mid = r.a.clone().lerp(r.b, 0.5);
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0), dir.clone().normalize()
        );
        return (
          <mesh key={`rung-${i}`} position={mid} quaternion={quat}>
            <cylinderGeometry args={[0.04, 0.04, len, 6]} />
            <meshStandardMaterial color="#00ddff" emissive="#004466" emissiveIntensity={0.8} transparent opacity={0.35} />
          </mesh>
        );
      })}

      {/* skill nodes mapped to rungs — alternating strands */}
      {SKILLS.map((sk, idx) => {
        const rIdx = Math.floor((idx / SKILLS.length) * HELIX_RUNGS * 0.7) + 3;
        const r = rungPairs[rIdx];
        if (!r) return null;
        const strand = idx % 2 === 0 ? r.a : r.b;
        const pos = [strand.x, strand.y, strand.z];
        return <SkillNode key={sk.name} skill={sk} position={pos} onClick={() => onNodeClick(sk)} />;
      })}

      {/* project diamond orbs on DNA */}
      {PROJECTS_3D.map((proj, idx) => {
        const rIdx = Math.floor(((idx + SKILLS.length) / (SKILLS.length + PROJECTS_3D.length)) * HELIX_RUNGS * 0.8) + 3;
        const r = rungPairs[Math.min(rIdx, rungPairs.length - 1)];
        if (!r) return null;
        const strand = idx % 2 === 0 ? r.b : r.a;
        const pos = [strand.x, strand.y, strand.z];
        return <ProjectOrb key={proj.name} project={proj} position={pos} onContactClick={onContactClick} />;
      })}
    </group>
  );
}

/* ═══════════════════════════════════════
   4. SKILL NODE — Bulletproof Hitbox
   ═══════════════════════════════════════ */
function SkillNode({ skill, position, onClick }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const coreRef = useRef();
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const col = useMemo(() => new THREE.Color(skill.color), [skill.color]);
  const sz = 0.25 + (skill.pct / 100) * 0.3;

  useFrame(({ clock }) => {
    if (!coreRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 2 + phase) * 0.12;
    const s = hovered ? sz * 1.35 * pulse : sz * pulse;
    coreRef.current.scale.setScalar(s);
    coreRef.current.material.emissiveIntensity = hovered ? 3.5 : 1.8 + Math.sin(t * 3 + phase) * 0.5;
  });

  return (
    <group position={position}>
      {/* visible glowing sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial
          color={skill.color}
          emissive={skill.color}
          emissiveIntensity={2}
          transparent
          opacity={0.85}
          roughness={0.15}
          metalness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* INVISIBLE large hitbox sphere for bulletproof clicking */}
      <mesh
        visible={false}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshBasicMaterial />
      </mesh>

      {/* skill label */}
      <Text
        position={[0, 1.1, 0]}
        fontSize={0.38}
        color={hovered ? "#ffffff" : skill.color}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
        font={undefined}
      >
        {skill.name}
      </Text>
    </group>
  );
}

/* ═══════════════════════════════════════
   4b. PROJECT ORB — Diamond/Octahedron
   ═══════════════════════════════════════ */
function ProjectOrb({ project, position, onContactClick }) {
  const grpRef = useRef();
  const coreRef = useRef();
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const col = useMemo(() => new THREE.Color(project.color), [project.color]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.8 + phase;
      coreRef.current.rotation.x = Math.sin(t * 0.5 + phase) * 0.3;
      const pulse = 1 + Math.sin(t * 2.5 + phase) * 0.15;
      const s = hovered ? 0.55 * pulse : 0.4 * pulse;
      coreRef.current.scale.setScalar(s);
      coreRef.current.material.emissiveIntensity = hovered ? 4 : 2 + Math.sin(t * 3 + phase) * 0.6;
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (project.isContact) {
      onContactClick && onContactClick();
    } else {
      window.open(project.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <group ref={grpRef} position={position}>
      <mesh ref={coreRef}>
        <octahedronGeometry args={[1, 0]} />
        <meshPhysicalMaterial
          color={project.color}
          emissive={project.color}
          emissiveIntensity={2.5}
          transparent
          opacity={0.9}
          roughness={0.1}
          metalness={0.5}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>
      {/* invisible hitbox */}
      <mesh
        visible={false}
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshBasicMaterial />
      </mesh>
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.32}
        color={hovered ? "#ffffff" : project.color}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {project.name}
      </Text>
    </group>
  );
}

/* ═══════════════════════════════════════
   5. MATRIX BINARY RAIN (InstancedMesh)
   ═══════════════════════════════════════ */
const RAIN_COUNT = 800;
function MatrixRain() {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    const arr = [];
    for (let i = 0; i < RAIN_COUNT; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 120,
        y: Math.random() * 80 - 40,
        z: -20 - Math.random() * 60,
        speed: 1.5 + Math.random() * 4,
        char: Math.random() > 0.5 ? "1" : "0",
      });
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    if (!meshRef.current) return;
    for (let i = 0; i < RAIN_COUNT; i++) {
      const d = data[i];
      d.y -= d.speed * dt * 3;
      if (d.y < -40) d.y = 40 + Math.random() * 10;
      dummy.position.set(d.x, d.y, d.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(0.15 + Math.random() * 0.05);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, RAIN_COUNT]}>
      <planeGeometry args={[0.6, 0.6]} />
      <meshBasicMaterial color="#00ff66" transparent opacity={0.18} side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════
   6. PARTICLE PHYSICS SYSTEM (InstancedMesh)
      Converge/Diverge with hand pinch
   ═══════════════════════════════════════ */
const PARTICLE_COUNT = 600;
function ParticleSystem({ handRef }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const origX = (Math.random() - 0.5) * 50;
      const origY = (Math.random() - 0.5) * 50;
      const origZ = (Math.random() - 0.5) * 50;
      arr.push({
        ox: origX, oy: origY, oz: origZ,
        x: origX, y: origY, z: origZ,
        vx: 0, vy: 0, vz: 0,
      });
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const pinch = handRef?.current?.pinch ?? 1;
    const active = !!handRef?.current?.active;
    const t = clock.getElapsedTime();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];

      if (active && pinch < 0.12) {
        /* CONVERGE — fingers pinched: strong gravity toward centre */
        const strength = 0.06 * (1 - pinch / 0.12);
        p.x += (0 - p.x) * strength;
        p.y += (0 - p.y) * strength;
        p.z += (0 - p.z) * strength;
      } else if (active && pinch > 0.18) {
        /* DIVERGE — fingers spread: explode outward beyond original positions */
        const force = Math.min(pinch * 3, 1.5);
        const dx = p.ox * 1.5 - p.x, dy = p.oy * 1.5 - p.y, dz = p.oz * 1.5 - p.z;
        p.x += dx * 0.04 * force;
        p.y += dy * 0.04 * force;
        p.z += dz * 0.04 * force;
      } else {
        /* idle: gentle floating motion around original position */
        const phase = i * 0.1 + t * 0.3;
        const tx = p.ox + Math.sin(phase) * 2;
        const ty = p.oy + Math.cos(phase * 0.7) * 2;
        const tz = p.oz + Math.sin(phase * 0.5 + 1) * 2;
        p.x += (tx - p.x) * 0.01;
        p.y += (ty - p.y) * 0.01;
        p.z += (tz - p.z) * 0.01;
      }

      dummy.position.set(p.x, p.y, p.z);
      const sc = 0.08 + Math.sin(t * 2 + i) * 0.02;
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#00eaff" transparent opacity={0.35} />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════
   7. SPARKLE SWARM (ambient floating dust)
   ═══════════════════════════════════════ */
const SPARKLE_COUNT = 250;
function SparkleSwarm() {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const sparks = useMemo(() => {
    const a = [];
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      a.push({
        x: (Math.random() - 0.5) * 80,
        y: (Math.random() - 0.5) * 60,
        z: (Math.random() - 0.5) * 80,
        s: 0.03 + Math.random() * 0.06,
        sp: 0.3 + Math.random() * 0.8,
        ph: Math.random() * Math.PI * 2,
      });
    }
    return a;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      const p = sparks[i];
      dummy.position.set(
        p.x + Math.sin(t * p.sp + p.ph) * 1.5,
        p.y + Math.cos(t * p.sp * 0.7 + p.ph) * 1.2,
        p.z + Math.sin(t * p.sp * 0.5 + p.ph + 1) * 1.5
      );
      const sc = p.s * (0.7 + Math.sin(t * 3 + p.ph) * 0.3);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, SPARKLE_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#88ddff" transparent opacity={0.4} />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════
   8. POSTPROCESSING FX
   ═══════════════════════════════════════ */
function FX() {
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.15} luminanceSmoothing={0.7} intensity={1.6} radius={0.85} />
      <Vignette eskil={false} offset={0.25} darkness={0.65} />
    </EffectComposer>
  );
}

/* ═══════════════════════════════════════
   9. DETAIL PANEL (Skill info on click)
   ═══════════════════════════════════════ */
function DetailPanel({ skill, onClose }) {
  if (!skill) return null;
  return (
    <div
      style={{
        position: "fixed", top: "50%", right: 40, transform: "translateY(-50%)",
        zIndex: 100, background: "rgba(0,8,28,0.88)", backdropFilter: "blur(24px)",
        border: "1px solid rgba(0,220,255,0.25)", borderRadius: 18, padding: "28px 36px",
        maxWidth: 340, color: "#c0f8ff", fontFamily: "'Segoe UI',sans-serif",
        pointerEvents: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 20, color: skill.color, letterSpacing: ".12em" }}>{skill.name}</h3>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "#00ccff", fontSize: 22, cursor: "pointer" }}
        >\u2715</button>
      </div>
      <div style={{
        margin: "14px 0", height: 6, borderRadius: 3, background: "rgba(0,200,255,0.1)",
        overflow: "hidden",
      }}>
        <div style={{
          width: `${skill.pct}%`, height: "100%", borderRadius: 3,
          background: `linear-gradient(90deg,${skill.color},#00ffee)`,
          boxShadow: `0 0 12px ${skill.color}`,
        }} />
      </div>
      <span style={{ fontSize: 12, color: "#55aacc" }}>{skill.pct}% proficiency</span>
      <p style={{ marginTop: 14, fontSize: 13, lineHeight: 1.7, color: "#88ccdd" }}>{skill.desc}</p>
    </div>
  );
}

/* ═══════════════════════════════════════
   10. CONTACT CARD (modal)
   ═══════════════════════════════════════ */
function ContactCard({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(0,8,28,0.92)", backdropFilter: "blur(24px)",
          border: "1px solid rgba(0,220,255,0.35)", borderRadius: 20,
          padding: "36px 48px", textAlign: "center", color: "#c0f8ff",
          fontFamily: "Segoe UI,sans-serif", minWidth: 280,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: ".25em", color: "#007799", marginBottom: 6 }}>GET IN TOUCH</div>
        <h2 style={{ margin: "0 0 24px", fontSize: 22, letterSpacing: ".2em", color: "#00ffee", textShadow: "0 0 18px #00ffe0" }}>
          AANAND KUMAR
        </h2>
        <a
          href={`https://github.com/${PERSONAL.github}`} target="_blank" rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            color: "#00eeff", textDecoration: "none", fontSize: 15, margin: "0 0 14px",
            padding: "10px 20px", border: "1px solid rgba(0,200,255,0.25)", borderRadius: 10,
          }}
        >
          \u2B21 GitHub: {PERSONAL.github}
        </a>
        <a
          href={`mailto:${PERSONAL.email}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            color: "#00eeff", textDecoration: "none", fontSize: 13,
            padding: "10px 20px", border: "1px solid rgba(0,200,255,0.25)", borderRadius: 10,
          }}
        >
          \u2709 {PERSONAL.email}
        </a>
        <button
          onClick={onClose}
          style={{
            marginTop: 24, padding: "8px 32px", border: "1px solid rgba(0,170,255,0.5)",
            borderRadius: 8, background: "transparent", color: "#00ccff",
            cursor: "pointer", fontSize: 12, letterSpacing: ".15em",
          }}
        >CLOSE</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   11. HTML OVERLAY (pointer-events: none)
   ═══════════════════════════════════════ */
function Overlay({ onContactOpen }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 10,
      pointerEvents: "none", fontFamily: "'Segoe UI',sans-serif", color: "#c0f8ff",
    }}>
      {/* ── LEFT HERO PANEL ── */}
      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 340,
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 32px", pointerEvents: "none",
        background: "linear-gradient(90deg,rgba(0,2,10,0.85) 60%,transparent)",
      }}>
        <div style={{ fontSize: 10, letterSpacing: ".3em", color: "#007799", marginBottom: 4 }}>PORTFOLIO</div>
        <h1 style={{
          fontSize: 28, margin: "0 0 6px", letterSpacing: ".25em", color: "#00ffee",
          textShadow: "0 0 18px #00ffe0,0 0 60px #0088ff",
          animation: "tpulse 3s ease-in-out infinite",
        }}>
          {PERSONAL.name}
        </h1>
        <p style={{ margin: "0 0 10px", fontSize: 11, letterSpacing: ".15em", color: "#55aacc" }}>{PERSONAL.role}</p>
        <p style={{ fontSize: 11, lineHeight: 1.6, color: "#448899", maxWidth: 280 }}>{PERSONAL.bio}</p>
        <div style={{ marginTop: 20, fontSize: 10, color: "#335566", letterSpacing: ".15em" }}>
          \u2193 SCROLL TO EXPLORE \u2193
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT (right side) ── */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: 0,
        width: "calc(100% - 360px)", overflowY: "auto",
        pointerEvents: "auto", padding: "100vh 40px 60px 20px",
      }}>
        {/* ABOUT */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={sectionTitle}>\u25C8 ABOUT ME</h2>
          <div style={glassCard}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: "#88ccdd" }}>{PERSONAL.bio}</p>
            <p style={{ marginTop: 12, fontSize: 13, color: "#55aacc" }}>
              \uD83C\uDF93 B.Tech Computer Science Engineering \u2014 3rd Year<br />
              \uD83D\uDCCD India
            </p>
          </div>
        </section>

        {/* SKILLS */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={sectionTitle}>\u25C8 SKILLS</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {SKILLS.map((sk) => (
              <div key={sk.name} style={glassCard}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: sk.color, fontSize: 14, letterSpacing: ".08em" }}>{sk.name}</span>
                  <span style={{ color: "#447788", fontSize: 12 }}>{sk.pct}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(0,200,255,0.08)" }}>
                  <div style={{
                    width: `${sk.pct}%`, height: "100%", borderRadius: 2,
                    background: `linear-gradient(90deg,${sk.color},#00ffee)`,
                    boxShadow: `0 0 8px ${sk.color}`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PROJECTS */}
        <section style={{ marginBottom: 80 }}>
          <h2 style={sectionTitle}>\u25C8 PROJECTS</h2>
          <div style={{ display: "grid", gap: 20 }}>
            {PROJECTS.map((p) => (
              <div key={p.title} style={glassCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: 16, color: "#00eeff" }}>
                    {p.icon} {p.title}
                  </h3>
                  <a
                    href={p.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      fontSize: 11, color: "#00ccff", textDecoration: "none",
                      border: "1px solid rgba(0,200,255,0.3)", padding: "4px 14px",
                      borderRadius: 6, pointerEvents: "auto",
                    }}
                  >GitHub \u2197</a>
                </div>
                <div style={{ margin: "10px 0 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {p.tech.map((t) => (
                    <span key={t} style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 4,
                      background: "rgba(0,200,255,0.08)", color: "#55bbcc", letterSpacing: ".04em",
                    }}>{t}</span>
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.7, color: "#6699aa" }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CONTACT */}
        <section style={{ marginBottom: 60 }}>
          <h2 style={sectionTitle}>\u25C8 CONTACT</h2>
          <div style={{ ...glassCard, textAlign: "center" }}>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "#88ccdd" }}>Let's connect and build something amazing.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href={`https://github.com/${PERSONAL.github}`} target="_blank" rel="noopener noreferrer"
                style={linkBtn}>\u2B21 GitHub</a>
              <button onClick={onContactOpen} style={{ ...linkBtn, cursor: "pointer", background: "rgba(0,200,255,0.08)" }}>
                \u2709 Email Me
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── shared styles ── */
const sectionTitle = {
  fontSize: 14, letterSpacing: ".25em", color: "#00bbdd",
  marginBottom: 20, textShadow: "0 0 14px #0088aa",
};
const glassCard = {
  background: "rgba(0,12,30,0.55)", backdropFilter: "blur(16px)",
  border: "1px solid rgba(0,200,255,0.12)", borderRadius: 14, padding: "20px 24px",
};
const linkBtn = {
  fontSize: 12, color: "#00ccff", textDecoration: "none",
  border: "1px solid rgba(0,200,255,0.3)", padding: "8px 20px",
  borderRadius: 8, pointerEvents: "auto", background: "transparent",
};

/* ═══════════════════════════════════════
   12. AI HAND TRACKING (MediaPipe)
   ═══════════════════════════════════════ */
function useHandTracking(handRef, enabled) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const landmarkerRef = useRef(null);

  useEffect(() => {
    /* === CLEANUP when disabled === */
    if (!enabled) {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
      if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.remove(); videoRef.current = null; }
      if (landmarkerRef.current) { landmarkerRef.current.close(); landmarkerRef.current = null; }
      handRef.current = { active: false, x: 0.5, pinch: 1 };
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        /* 1. Import the modern MediaPipe Tasks Vision (npm package — works with Vite) */
        const vision = await import("@mediapipe/tasks-vision");
        const { HandLandmarker, FilesetResolver } = vision;

        if (cancelled) return;

        /* 2. Load WASM runtime from CDN */
        const wasmFileset = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        if (cancelled) return;

        /* 3. Create HandLandmarker */
        const landmarker = await HandLandmarker.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        landmarkerRef.current = landmarker;

        if (cancelled) { landmarker.close(); return; }

        /* 4. Create video + get webcam */
        const video = document.createElement("video");
        video.setAttribute("playsinline", "");
        video.setAttribute("autoplay", "");
        video.muted = true;
        video.style.cssText = "position:fixed;bottom:12px;left:12px;width:180px;height:135px;z-index:9999;border-radius:12px;border:2px solid rgba(0,255,170,0.4);opacity:0.75;transform:scaleX(-1);object-fit:cover;pointer-events:none;";
        document.body.appendChild(video);
        videoRef.current = video;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();

        /* wait until video actually has frames */
        await new Promise((res) => {
          const check = () => {
            if (video.readyState >= 2 && video.videoWidth > 0) res();
            else setTimeout(check, 100);
          };
          check();
        });
        if (cancelled) return;

        console.log("[JARVIS] Hand tracking ready! Video:", video.videoWidth, "x", video.videoHeight);

        /* 5. Frame detection loop */
        let lastTimestamp = -1;
        function detect() {
          if (cancelled) return;
          const now = performance.now();
          if (video.readyState >= 2 && now !== lastTimestamp) {
            lastTimestamp = now;
            try {
              const results = landmarker.detectForVideo(video, now);
              if (results.landmarks && results.landmarks.length > 0) {
                const lm = results.landmarks[0];
                /* landmark indices: 0=wrist, 4=thumb_tip, 8=index_tip, 12=middle_tip */
                const wrist = lm[0];
                const thumbTip = lm[4];
                const indexTip = lm[8];
                const middleTip = lm[12];

                /* rotation: hand X position (0=left, 1=right) */
                const handX = wrist.x;

                /* pinch: average distance thumb-index and thumb-middle */
                const d1 = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
                const d2 = Math.hypot(thumbTip.x - middleTip.x, thumbTip.y - middleTip.y);
                const pinch = (d1 + d2) / 2;

                handRef.current = { active: true, x: handX, pinch: pinch };
              } else {
                handRef.current = { ...handRef.current, active: false };
              }
            } catch (e) {
              /* skip frame on error */
            }
          }
          rafRef.current = requestAnimationFrame(detect);
        }
        detect();

      } catch (err) {
        console.error("[JARVIS] Hand tracking init failed:", err);
        handRef.current = { active: false, x: 0.5, pinch: 1 };
        /* Show error to user */
        const errDiv = document.createElement("div");
        errDiv.style.cssText = "position:fixed;bottom:80px;left:12px;z-index:9999;color:#ff4444;font-size:11px;font-family:monospace;background:rgba(0,0,0,0.8);padding:8px 14px;border-radius:8px;max-width:300px;";
        errDiv.textContent = "Camera error: " + (err.message || err) + ". Try HTTPS or allow camera.";
        document.body.appendChild(errDiv);
        setTimeout(() => errDiv.remove(), 8000);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
      if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.remove(); videoRef.current = null; }
      if (landmarkerRef.current) { try { landmarkerRef.current.close(); } catch(e){} landmarkerRef.current = null; }
    };
  }, [enabled, handRef]);
}

/* ═══════════════════════════════════════
   13. MAIN APP
   ═══════════════════════════════════════ */
function HandStatus({ handRef }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const id = setInterval(() => { setActive(!!handRef.current?.active); }, 300);
    return () => clearInterval(id);
  }, [handRef]);
  return (
    <div style={{
      position: "fixed", bottom: 60, right: 24, zIndex: 300,
      fontSize: 10, color: active ? "#00ff88" : "#ff6644", letterSpacing: ".1em",
      fontFamily: "Segoe UI,sans-serif", textShadow: active ? "0 0 10px #00ff88" : "none",
    }}>
      {active ? "\u{1F7E2} Hand Detected \u2014 Move hand to rotate DNA \u2022 Pinch to converge particles" : "\u{1F534} Waiting for hand... Show your palm to the camera"}
    </div>
  );
}

export default function App() {
  const [activeSkill, setActiveSkill] = useState(null);
  const [contactCard, setContactCard] = useState(false);
  const [handEnabled, setHandEnabled] = useState(false);

  const handleNodeClick = useCallback((sk) => {
    setActiveSkill((prev) => (prev?.name === sk.name ? null : sk));
  }, []);
  const handleClose = useCallback(() => setActiveSkill(null), []);

  /* drag + scroll rotation */
  const rotRef = useRef({ dy: 0, dx: 0, scroll: 0, dragging: false });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });
  const handRef = useRef({ active: false, x: 0.5, pinch: 1 });

  useHandTracking(handRef, handEnabled);

  const onPointerDown = useCallback((e) => {
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
    rotRef.current.dragging = true;
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.active) return;
    rotRef.current.dy += (e.clientX - dragRef.current.lastX) * 0.55;
    rotRef.current.dx += (e.clientY - dragRef.current.lastY) * 0.55;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current.active = false;
    rotRef.current.dragging = false;
  }, []);

  const onWheel = useCallback((e) => {
    rotRef.current.scroll += e.deltaY > 0 ? 2.5 : -2.5;
  }, []);

  return (
    <>
      <style>{`
        @keyframes tpulse {
          0%,100% { text-shadow:0 0 14px #00ffff,0 0 40px #00ccff,0 0 80px #0088ff; filter:brightness(1.3); }
          50% { text-shadow:0 0 28px #fff,0 0 65px #00ffff,0 0 120px #00aaff; filter:brightness(1.8); }
        }
        html,body,#root { margin:0; padding:0; width:100%; height:100%; background:${BG}; overflow-x:hidden; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#000a14; }
        ::-webkit-scrollbar-thumb { background:#002244; border-radius:4px; }
        * { box-sizing:border-box; }
      `}</style>

      <Canvas
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        camera={{ position: [0, 0, 38], fov: 58 }}
        style={{ position: "fixed", inset: 0, zIndex: 0, cursor: dragRef.current.active ? "grabbing" : "grab" }}
        onPointerMissed={() => setActiveSkill(null)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      >
        <fog attach="fog" args={[BG, 35, 110]} />
        <color attach="background" args={[BG]} />
        <Lights />
        <DNAHelix onNodeClick={handleNodeClick} rotRef={rotRef} handRef={handRef} onContactClick={() => setContactCard(true)} />
        <MatrixRain />
        <ParticleSystem handRef={handRef} />
        <SparkleSwarm />
        <FX />
      </Canvas>

      <Overlay onContactOpen={() => setContactCard(true)} />
      <DetailPanel skill={activeSkill} onClose={handleClose} />
      {contactCard && <ContactCard onClose={() => setContactCard(false)} />}

      {/* JARVIS TOGGLE BUTTON */}
      <button
        onClick={() => setHandEnabled((p) => !p)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 300,
          padding: "10px 22px", borderRadius: 12,
          background: handEnabled ? "rgba(0,255,200,0.15)" : "rgba(0,120,200,0.12)",
          border: `1px solid ${handEnabled ? "#00ffc8" : "rgba(0,200,255,0.3)"}`,
          color: handEnabled ? "#00ffc8" : "#00ccff",
          fontSize: 12, letterSpacing: ".1em", cursor: "pointer",
          fontFamily: "'Segoe UI',sans-serif",
          backdropFilter: "blur(12px)",
          boxShadow: handEnabled ? "0 0 20px rgba(0,255,200,0.3)" : "none",
        }}
      >
        {handEnabled ? "\u{1F916} J.A.R.V.I.S ACTIVE" : "\u{1F4F7} Enable Camera / J.A.R.V.I.S"}
      </button>

      {/* hand tracking status indicator */}
      {handEnabled && (
        <div style={{
          position: "fixed", bottom: 60, right: 24, zIndex: 300,
          fontSize: 10, color: "#00aa88", letterSpacing: ".1em",
          fontFamily: "'Segoe UI',sans-serif",
        }}>
          {handRef.current?.active ? "\u{1F7E2} Hand Detected — Pinch to converge particles" : "\u{1F534} Waiting for hand..."}
        </div>
      )}
    </>
  );
}