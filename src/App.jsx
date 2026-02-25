import React, { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

/* ─────────────────────── PERSONAL DATA ─────────────────────── */
const PERSONAL = {
  name: "AANAND KUMAR",
  role: "B.Tech CSE (3rd Year) | Android & Web Developer",
  bio: "Passionate developer crafting seamless Android and Web applications. Expert in backend development with Java & Spring Boot, and cross-platform mobile development with Kotlin, Flutter & Dart. I build high-performance, scalable software solutions that solve real problems.",
  github: "Aanand251",
  linkedin: "aanand-kumar-choudhary",
  email: "choudharyaanandkumar251@gmail.com",
  college: "B.Tech Computer Science Engineering — 3rd Year",
  location: "India",
};

const SKILLS = [
  { name: "Java", pct: 95, color: "#00eaff", desc: "Core backend language — deep expertise in OOP, data structures, algorithms, concurrency, and enterprise application development." },
  { name: "Spring Boot", pct: 90, color: "#00c8ff", desc: "Production-grade REST APIs, microservices architecture, Spring Security, JPA/Hibernate, and full-stack web applications." },
  { name: "Kotlin", pct: 88, color: "#7b68ee", desc: "Primary Android development language. Proficient in Coroutines, Jetpack Compose, Kotlin Multiplatform (KMP), and Flow." },
  { name: "Dart / Flutter", pct: 82, color: "#00ffd5", desc: "Cross-platform mobile development with Flutter for both iOS and Android from a single codebase." },
  { name: "MongoDB", pct: 78, color: "#22cccc", desc: "NoSQL database design, complex aggregation pipelines, indexing strategies, and scalable document-based data storage." },
  { name: "React", pct: 80, color: "#61dafb", desc: "Modern frontend with React Hooks, state management, component architecture, and Three.js / R3F 3D integration." },
  { name: "Firebase", pct: 83, color: "#ffca28", desc: "Realtime Database, Firestore, Firebase Auth, Cloud Functions, and push notifications for Android apps." },
  { name: "SQL", pct: 80, color: "#4ecdc4", desc: "Relational database design, complex queries, joins, stored procedures, and local SQLite for mobile apps." },
];

const PROJECTS_3D = [
  { name: "Expense Tracker", color: "#00ff88", url: "https://github.com/Aanand251/personal-expense-tracker", tech: "Kotlin · Firebase", desc: "Android app to track personal finances with Firebase backend and Material You design." },
  { name: "Zenith", color: "#aa88ff", url: "https://github.com/Aanand251/Zenith", tech: "Kotlin Multiplatform · SQL", desc: "Cross-platform music player sharing business logic between Android and iOS." },
  { name: "Talknest", color: "#ff8844", url: "https://github.com/Aanand251/Talknest", tech: "Kotlin · Firebase · FCM", desc: "Real-time chat app with Firebase Realtime Database and push notifications." },
  { name: "NEON", color: "#ff44aa", url: "https://github.com/Aanand251/personal-voice-assistant", tech: "Kotlin · NLP · Speech", desc: "Personal AI voice assistant for hands-free device control and smart commands." },
  { name: "Contact Me", color: "#00ffcc", url: "mailto:choudharyaanandkumar251@gmail.com", tech: "GitHub: Aanand251", desc: "Email: choudharyaanandkumar251@gmail.com", isContact: true },
];

const PROJECTS = [
  {
    title: "Personal Expense Tracker",
    tech: ["Kotlin", "Firebase", "Android", "Material You"],
    desc: "A sleek Android app to track personal finances in real time. Features category-wise expense breakdown, Firebase Realtime Database sync, and Material You dynamic theming.",
    url: "https://github.com/Aanand251/personal-expense-tracker",
    icon: "💰",
  },
  {
    title: "Zenith",
    tech: ["Kotlin Multiplatform", "SQL", "iOS", "Android"],
    desc: "Cross-platform music player built with Kotlin Multiplatform sharing business logic between Android and iOS. Local SQL database for playlists and track metadata.",
    url: "https://github.com/Aanand251/Zenith",
    icon: "🎵",
  },
  {
    title: "Talknest",
    tech: ["Kotlin", "Firebase", "Realtime DB", "FCM"],
    desc: "Real-time chat application with Firebase Realtime Database, end-to-end message delivery, Firebase Cloud Messaging push notifications, and user presence indicators.",
    url: "https://github.com/Aanand251/Talknest",
    icon: "💬",
  },
  {
    title: "NEON — Voice Assistant",
    tech: ["Kotlin", "Speech Recognition", "NLP", "Android"],
    desc: "Personal AI voice assistant powered by Android Speech Recognition and NLP. Supports hands-free device control, custom commands, reminders, and web searches.",
    url: "https://github.com/Aanand251/personal-voice-assistant",
    icon: "🤖",
  },
];

/* ─────────────────── 3D SCENE CONSTANTS ─────────────────── */
const BG = "#00020a";
const DNA_R = 5.0, DNA_H = 32, DNA_TURNS = 4, DNA_SEG = 300, DNA_RUNGS = 55;
const UP = new THREE.Vector3(0, 1, 0);
const BIN_COUNT = 4500, SPARK_COUNT = 280;

/* ══════════════════════════════════════════════════════════
   DNA HELIX
══════════════════════════════════════════════════════════ */
function DNAHelix({ onNodeClick, rotRef, onContactClick }) {
  const grpRef = useRef();

  const { curve1, curve2, rungData } = useMemo(() => {
    const p1 = [], p2 = [];
    for (let i = 0; i <= DNA_SEG; i++) {
      const t = i / DNA_SEG, a = t * DNA_TURNS * Math.PI * 2, y = t * DNA_H - DNA_H / 2;
      p1.push(new THREE.Vector3(Math.cos(a) * DNA_R, y, Math.sin(a) * DNA_R));
      p2.push(new THREE.Vector3(Math.cos(a + Math.PI) * DNA_R, y, Math.sin(a + Math.PI) * DNA_R));
    }
    const c1 = new THREE.CatmullRomCurve3(p1), c2 = new THREE.CatmullRomCurve3(p2);
    const rungs = [];
    for (let i = 0; i < DNA_RUNGS; i++) {
      const t = i / (DNA_RUNGS - 1);
      const a = c1.getPoint(t), b = c2.getPoint(t);
      const dir = new THREE.Vector3().subVectors(b, a);
      const len = dir.length();
      const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
      const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
      rungs.push({ mid, quat, len, p1: a.clone(), p2: b.clone() });
    }
    return { curve1: c1, curve2: c2, rungData: rungs };
  }, []);

  const tube1 = useMemo(() => new THREE.TubeGeometry(curve1, DNA_SEG, 0.09, 12, false), [curve1]);
  const tube2 = useMemo(() => new THREE.TubeGeometry(curve2, DNA_SEG, 0.09, 12, false), [curve2]);
  const glow1 = useMemo(() => new THREE.TubeGeometry(curve1, 80, 0.28, 8, false), [curve1]);
  const glow2 = useMemo(() => new THREE.TubeGeometry(curve2, 80, 0.28, 8, false), [curve2]);
  const rungGeos = useMemo(() => rungData.map(r => new THREE.CylinderGeometry(0.03, 0.03, r.len, 8)), [rungData]);
  const capGeo = useMemo(() => new THREE.SphereGeometry(0.1, 10, 8), []);
  const rc = [0x00ffcc, 0x0088ff, 0xff6688, 0xffcc00];

  useFrame((_, dt) => {
    if (!grpRef.current) return;
    const BASE_X = 0.12;
    if (rotRef) {
      const isDragging = rotRef.current.dragging;
      grpRef.current.rotation.y += rotRef.current.dy * 0.012;
      grpRef.current.rotation.x += rotRef.current.dx * 0.012;
      grpRef.current.rotation.y += rotRef.current.scroll * 0.025;
      rotRef.current.dy *= 0.88;
      rotRef.current.dx *= 0.88;
      rotRef.current.scroll *= 0.88;
      // spring-back X toward default tilt when drag released and velocity gone
      if (!isDragging && Math.abs(rotRef.current.dx) < 0.08) {
        grpRef.current.rotation.x += (BASE_X - grpRef.current.rotation.x) * 0.035;
      }
    }
    const activity = rotRef ? Math.abs(rotRef.current.dy) + Math.abs(rotRef.current.scroll) : 0;
    grpRef.current.rotation.y += 0.18 * dt * Math.max(0, 1 - activity);
  });

  return (
    <group ref={grpRef} rotation={[0.12, 0, 0]}>
      <mesh geometry={tube1}><meshPhysicalMaterial color={0x00aaff} emissive={0x003366} emissiveIntensity={0.8} metalness={0.55} roughness={0.1} clearcoat={1} clearcoatRoughness={0.03} transparent opacity={0.92} /></mesh>
      <mesh geometry={tube2}><meshPhysicalMaterial color={0x00ffcc} emissive={0x003322} emissiveIntensity={0.8} metalness={0.55} roughness={0.1} clearcoat={1} clearcoatRoughness={0.03} transparent opacity={0.92} /></mesh>
      <mesh geometry={glow1}><meshBasicMaterial color={0x0066aa} side={THREE.BackSide} transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <mesh geometry={glow2}><meshBasicMaterial color={0x00aa66} side={THREE.BackSide} transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      {rungData.map((r, i) => (
        <React.Fragment key={i}>
          <mesh position={r.mid} quaternion={r.quat} geometry={rungGeos[i]}><meshPhysicalMaterial color={rc[i%4]} emissive={rc[i%4]} emissiveIntensity={0.5} metalness={0.3} roughness={0.2} clearcoat={0.6} transparent opacity={0.85} /></mesh>
          <mesh position={r.p1} geometry={capGeo}><meshPhysicalMaterial color={rc[i%4]} emissive={rc[i%4]} emissiveIntensity={0.4} /></mesh>
          <mesh position={r.p2} geometry={capGeo}><meshPhysicalMaterial color={rc[(i+2)%4]} emissive={rc[(i+2)%4]} emissiveIntensity={0.4} /></mesh>
        </React.Fragment>
      ))}
      {SKILLS.map((sk, i) => {
        const t = i / (SKILLS.length - 1 || 1);
        const a = t * DNA_TURNS * Math.PI * 2;
        const y = t * DNA_H - DNA_H / 2;
        const pos = i % 2 === 0
          ? [Math.cos(a) * DNA_R, y, Math.sin(a) * DNA_R]
          : [Math.cos(a + Math.PI) * DNA_R, y, Math.sin(a + Math.PI) * DNA_R];
        return <SkillOrb key={sk.name} skill={sk} position={pos} onClick={() => onNodeClick(sk)} />;
      })}
      {PROJECTS_3D.map((proj, i) => {
        const t = i / (PROJECTS_3D.length - 1 || 1);
        const a = t * DNA_TURNS * Math.PI * 2 + Math.PI * 0.5;
        const y = t * DNA_H - DNA_H / 2;
        const r = DNA_R + 4.5;
        const pos = [Math.cos(a) * r, y, Math.sin(a) * r];
        return <ProjectOrb key={proj.name} project={proj} position={pos} onContactClick={onContactClick} />;
      })}
    </group>
  );
}

/* ══════════════════════════════════════════════════════════
   SKILL ORB  (clickable, hoverable)
══════════════════════════════════════════════════════════ */
function SkillOrb({ skill, position, onClick }) {
  const grpRef = useRef();
  const coreRef = useRef();
  const [hovered, setHovered] = useState(false);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const speed = useMemo(() => 0.7 + Math.random() * 0.8, []);
  const sz = 0.22 + (skill.pct / 100) * 0.26;
  const col = useMemo(() => new THREE.Color(skill.color), [skill.color]);
  const posV = useMemo(() => new THREE.Vector3(...position), [position]);

  const labelOff = useMemo(() => {
    const rd = posV.clone().setY(0).normalize();
    const lp = posV.clone().add(rd.multiplyScalar(3.8));
    return [lp.x - position[0], lp.y - position[1] + 0.45, lp.z - position[2]];
  }, [posV, position]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = Math.sin(t * speed + phase);
    if (coreRef.current) coreRef.current.material.emissiveIntensity = hovered ? 5.0 : 2.0 + p * 1.5;
    if (grpRef.current) {
      const s = hovered ? 1.6 : 1 + p * 0.08;
      grpRef.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={grpRef} position={position}>
      <mesh
        ref={coreRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
      >
        <sphereGeometry args={[sz, 28, 28]} />
        <meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={2.4} metalness={0} roughness={0} clearcoat={1} clearcoatRoughness={0} transmission={0.3} transparent opacity={0.95} />
      </mesh>
      <mesh><sphereGeometry args={[sz * 0.32, 12, 12]} /><meshBasicMaterial color="white" transparent opacity={0.65} /></mesh>
      <mesh><sphereGeometry args={[sz * 2.0, 14, 14]} /><meshBasicMaterial color={skill.color} side={THREE.BackSide} transparent opacity={hovered ? 0.35 : 0.22} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <mesh><sphereGeometry args={[sz * 3.8, 10, 10]} /><meshBasicMaterial color={skill.color} side={THREE.BackSide} transparent opacity={0.09} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <Billboard position={labelOff}>
        <Text fontSize={0.36} color={skill.color} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000a14">
          {skill.name.toUpperCase()}
        </Text>
        <Text position={[0, -0.32, 0]} fontSize={0.22} color="#88ddff" anchorX="center" anchorY="middle">
          {skill.pct + "%"}
        </Text>
      </Billboard>
    </group>
  );
}


/* ══════════════════════════════════════════════════════════
   PROJECT ORB  ({project.isContact ? "CLICK TO EMAIL" : "CLICK TO OPEN"} GitHub)
══════════════════════════════════════════════════════════ */
function ProjectOrb({ project, position, onContactClick }) {
  const grpRef = useRef();
  const coreRef = useRef();
  const [hovered, setHovered] = useState(false);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const col = useMemo(() => new THREE.Color(project.color), [project.color]);
  const posV = useMemo(() => new THREE.Vector3(...position), [position]);

  const labelOff = useMemo(() => {
    const rd = posV.clone().setY(0).normalize();
    const lp = posV.clone().add(rd.multiplyScalar(3.2));
    return [lp.x - position[0], lp.y - position[1] + 0.55, lp.z - position[2]];
  }, [posV, position]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const p = Math.sin(t * 1.2 + phase);
    if (coreRef.current) coreRef.current.material.emissiveIntensity = hovered ? 5.5 : 1.8 + p * 1.2;
    if (grpRef.current) {
      const s = hovered ? 1.55 : 1 + p * 0.1;
      grpRef.current.scale.setScalar(s);
    }
  });

  const handleClick = (e) => {
    e.stopPropagation();
    if (project.isContact) {
      onContactClick && onContactClick(project);
    } else {
      window.open(project.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <group ref={grpRef} position={position}>
      {/* Diamond/cube shape to distinguish from skill orbs */}
      <mesh
        ref={coreRef}
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
      >
        <octahedronGeometry args={[0.42, 0]} />
        <meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={1.8} metalness={0.2} roughness={0.05} clearcoat={1} clearcoatRoughness={0} transparent opacity={0.92} />
      </mesh>
      {/* Inner bright core */}
      <mesh><sphereGeometry args={[0.14, 10, 10]} /><meshBasicMaterial color="white" transparent opacity={0.7} /></mesh>
      {/* Outer glow rings */}
      <mesh><octahedronGeometry args={[0.85, 0]} /><meshBasicMaterial color={project.color} side={THREE.BackSide} transparent opacity={hovered ? 0.3 : 0.18} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <mesh><sphereGeometry args={[1.6, 10, 10]} /><meshBasicMaterial color={project.color} side={THREE.BackSide} transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      {/* Label */}
      <Billboard position={labelOff}>
        <Text fontSize={0.34} color={project.color} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000a14">
          {project.name.toUpperCase()}
        </Text>
        <Text position={[0, -0.30, 0]} fontSize={0.19} color="#aaddee" anchorX="center" anchorY="middle">
          {project.tech}
        </Text>
        <Text position={[0, -0.55, 0]} fontSize={0.17} color="#336655" anchorX="center" anchorY="middle">
          {project.isContact ? "CLICK TO EMAIL" : "CLICK TO OPEN"}
        </Text>
      </Billboard>
    </group>
  );
}
/* ══════════════════════════════════════════════════════════
   MATRIX RAIN
══════════════════════════════════════════════════════════ */
function MatrixRain() {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(() => {
    const pos = [], vel = [], sc = [];
    for (let i = 0; i < BIN_COUNT; i++) {
      const a = Math.random() * Math.PI * 2, d = 12 + Math.random() * 50;
      pos.push(new THREE.Vector3(Math.cos(a)*d, (Math.random()-0.5)*DNA_H*2.5, Math.sin(a)*d - 15));
      vel.push(-(0.02 + Math.random() * 0.06));
      sc.push(0.3 + Math.random() * 0.5);
    }
    return { pos, vel, sc };
  }, []);
  const tex = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 64; c.height = 64;
    const ctx = c.getContext("2d"); ctx.clearRect(0,0,64,64);
    ctx.fillStyle = "#0055cc"; ctx.font = "bold 36px monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(Math.random() > 0.5 ? "1" : "0", 32, 32);
    return new THREE.CanvasTexture(c);
  }, []);
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useFrame(() => {
    if (!meshRef.current) return;
    const hB = DNA_H * 1.3;
    for (let i = 0; i < BIN_COUNT; i++) {
      const p = data.pos[i]; p.y += data.vel[i];
      if (p.y < -hB) { p.y = hB; p.x = (Math.random()-0.5)*120; p.z = -15+(Math.random()-0.5)*80; }
      dummy.position.copy(p); const s = data.sc[i]; dummy.scale.set(s, s, 1); dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[geo, null, BIN_COUNT]}>
      <meshBasicMaterial map={tex} transparent opacity={0.4} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}

/* ══════════════════════════════════════════════════════════
   SPARKLE SWARM
══════════════════════════════════════════════════════════ */
function SparkleSwarm() {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { camera } = useThree();
  const data = useMemo(() => {
    const h=[],p=[],v=[],ph=[],sp=[],sz=[];
    for (let i = 0; i < SPARK_COUNT; i++) {
      const a = Math.random()*Math.PI*2, r = DNA_R+(Math.random()-0.5)*7, y = (Math.random()-0.5)*DNA_H;
      const home = new THREE.Vector3(Math.cos(a)*r, y, Math.sin(a)*r);
      h.push(home.clone()); p.push(home.clone());
      v.push(new THREE.Vector3((Math.random()-0.5)*0.02,(Math.random()-0.5)*0.015,(Math.random()-0.5)*0.02));
      ph.push(Math.random()*Math.PI*2); sp.push(1.5+Math.random()*2.5); sz.push(0.06+Math.random()*0.18);
    }
    return {h,p,v,ph,sp,sz};
  }, []);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 6, 6), []);
  useFrame(({ pointer, clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const vec = new THREE.Vector3(pointer.x, pointer.y, 0.5).unproject(camera);
    const dir = vec.sub(camera.position).normalize();
    const dist = -camera.position.z / dir.z;
    const mw = camera.position.clone().addScaledVector(dir, dist);
    for (let i = 0; i < SPARK_COUNT; i++) {
      const pos = data.p[i], vel = data.v[i], home = data.h[i];
      const dx=pos.x-mw.x, dy=pos.y-mw.y, dz=pos.z-mw.z;
      const d = Math.sqrt(dx*dx+dy*dy+dz*dz);
      if (d < 8 && d > 0.01) { const f=0.08*(1-d/8); vel.x+=(dx/d)*f; vel.y+=(dy/d)*f; vel.z+=(dz/d)*f; }
      vel.x+=(home.x-pos.x)*0.016; vel.y+=(home.y-pos.y)*0.016; vel.z+=(home.z-pos.z)*0.016;
      vel.multiplyScalar(0.87); pos.add(vel);
      const sc = data.sz[i]*(0.7+0.3*Math.sin(t*data.sp[i]+data.ph[i]));
      dummy.position.copy(pos); dummy.scale.setScalar(sc); dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[geo, null, SPARK_COUNT]}>
      <meshBasicMaterial color={0x00eeff} transparent opacity={0.75} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}

/* ──────────── LIGHTS ──────────── */
function Lights() {
  const k=useRef(), f=useRef(), r=useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if(k.current) k.current.position.set(Math.cos(t*0.25)*20, Math.sin(t*0.18)*12, Math.sin(t*0.25)*20);
    if(f.current) f.current.position.set(Math.cos(t*0.3+2)*16, Math.sin(t*0.22)*10, Math.sin(t*0.3+2)*16);
    if(r.current) r.current.position.set(Math.cos(t*0.19+4)*12, Math.cos(t*0.28)*8, Math.sin(t*0.19+4)*12);
  });
  return (<>
    <ambientLight intensity={0.6} color={0x001122} />
    <pointLight ref={k} color={0x00aaff} intensity={18} distance={140} />
    <pointLight ref={f} color={0x0022cc} intensity={10} distance={100} />
    <pointLight ref={r} color={0x00ffcc} intensity={6} distance={70} />
  </>);
}

/* ──────────── FX ──────────── */
function FX() {
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.15} luminanceSmoothing={0.7} intensity={1.6} radius={0.85} />
      <Vignette offset={0.3} darkness={0.75} />
    </EffectComposer>
  );
}

/* ══════════════════════════════════════════════════════════
   GLASS STYLE
══════════════════════════════════════════════════════════ */
const glass = {
  background: "rgba(0,8,28,0.6)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(0,180,255,0.2)",
  borderRadius: "16px",
  padding: "28px",
  color: "#c0f0ff",
};

/* ══════════════════════════════════════════════════════════
   DETAIL PANEL — slides in from right when orb is clicked
══════════════════════════════════════════════════════════ */
function DetailPanel({ skill, onClose }) {
  return (
    <div style={{
      position: "fixed",
      right: skill ? 20 : -400,
      top: "50%",
      transform: "translateY(-50%)",
      width: 320,
      zIndex: 100,
      pointerEvents: skill ? "auto" : "none",
      transition: "right 0.45s cubic-bezier(0.23,1,0.32,1)",
      ...glass,
      padding: "30px 26px",
      boxShadow: "0 0 60px rgba(0,100,255,0.3), 0 0 120px rgba(0,60,180,0.15)",
      border: `1px solid ${skill ? skill.color + "55" : "rgba(0,180,255,0.2)"}`,
    }}>
      {skill && (<>
        <div style={{ fontSize: 11, letterSpacing: ".35em", color: "#006688", marginBottom: 18, textTransform: "uppercase" }}>
          ◈ SKILL SEQUENCE
        </div>
        <div style={{
          fontSize: 26, fontWeight: 900, color: skill.color, marginBottom: 10,
          textShadow: `0 0 20px ${skill.color}`,
          letterSpacing: ".08em",
        }}>
          {skill.name}
        </div>
        <p style={{ fontSize: 13, color: "#90c4d8", lineHeight: 1.75, marginBottom: 22 }}>
          {skill.desc}
        </p>
        <div style={{ fontSize: 11, color: "#446688", letterSpacing: ".2em", marginBottom: 8 }}>PROFICIENCY LEVEL</div>
        <div style={{ background: "rgba(0,20,50,0.7)", borderRadius: 8, height: 10, marginBottom: 8, overflow: "hidden", border: "1px solid rgba(0,100,160,0.3)" }}>
          <div style={{
            width: skill.pct + "%", height: "100%", borderRadius: 8,
            background: `linear-gradient(90deg, #0066ff, ${skill.color})`,
            boxShadow: `0 0 16px ${skill.color}, 0 0 30px ${skill.color}55`,
            transition: "width 0.9s ease",
          }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: skill.color, marginBottom: 24, textAlign: "right" }}>
          {skill.pct}%
        </div>
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "10px 0", background: "transparent",
            border: `1px solid ${skill.color}88`, borderRadius: 8,
            color: skill.color, fontSize: 12, letterSpacing: ".25em",
            cursor: "pointer", transition: "all .25s", textTransform: "uppercase",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = skill.color + "22"; e.currentTarget.style.boxShadow = `0 0 18px ${skill.color}44`; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
        >
          ✕  Close
        </button>
      </>)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HTML OVERLAY
══════════════════════════════════════════════════════════ */
function Overlay() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10, pointerEvents: "none",
      overflowY: "auto", fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>

      {/* ── HERO: fixed LEFT panel ── */}
      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: "clamp(155px,17vw,230px)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 0 0 20px", zIndex: 12, pointerEvents: "none",
      }}>
        <div style={{
          background: "rgba(0,3,14,0.6)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(0,160,230,0.2)", borderRadius: "14px",
          padding: "16px 18px 14px", marginBottom: 14,
        }}>
          <h1 style={{
            fontSize: "clamp(15px,2vw,26px)", fontWeight: 900, letterSpacing: ".16em", color: "#a0f8ff",
            textShadow: "0 0 14px #00ffff, 0 0 40px #00ccff, 0 0 80px #0088ff",
            animation: "tpulse 3s ease-in-out infinite", margin: "0 0 9px", lineHeight: 1.2,
          }}>
            {PERSONAL.name.split(" ").map((w,i) => <span key={i} style={{display:"block"}}>{w}</span>)}
          </h1>
          <p style={{ fontSize: "clamp(7px,0.7vw,10px)", letterSpacing: ".15em", color: "#00aacc", margin: 0, lineHeight: 1.7 }}>
            {PERSONAL.role.split("|").map((p,i) => <span key={i} style={{display:"block"}}>{p.trim()}</span>)}
          </p>
        </div>
        <div style={{ fontSize: 8.5, color: "#1e3d50", letterSpacing: ".13em", lineHeight: 2.4 }}>
          <div style={{color:"#1e4a5a"}}>⟳ DRAG — ROTATE DNA</div>
          <div style={{color:"#1e4a5a"}}>↕ SCROLL — SPIN DNA</div>
          <div style={{color:"#1e4a5a"}}>● CLICK ORBS — EXPLORE</div>
        </div>
        <div style={{ marginTop: 24, fontSize: 9, color: "#1a3344", letterSpacing: ".22em", animation: "bounce 2.2s infinite" }}>
          ▼ SCROLL DOWN
        </div>
      </div>
      {/* invisible spacer so scroll content still starts below fold */}
      <section style={{ height: "100vh", pointerEvents: "none" }} />

      {/* ── ABOUT ── */}
      <section style={{ maxWidth: 740, margin: "0 auto", padding: "80px 20px 40px", pointerEvents: "auto" }}>
        <div style={glass}>
          <h2 style={{ color: "#00ccff", fontSize: 13, letterSpacing: ".35em", marginBottom: 20, textTransform: "uppercase" }}>
            ◈  About Me
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.9, color: "#a0d8ee", marginBottom: 16 }}>{PERSONAL.bio}</p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
            {[
              { label: "Degree", val: PERSONAL.college },
              { label: "Location", val: PERSONAL.location },
              { label: "Email", val: PERSONAL.email },
            ].map(item => (
              <div key={item.label} style={{ background: "rgba(0,30,70,0.5)", borderRadius: 8, padding: "8px 16px", border: "1px solid rgba(0,120,200,0.2)", fontSize: 12 }}>
                <span style={{ color: "#446688", letterSpacing: ".12em", display: "block", marginBottom: 3 }}>{item.label.toUpperCase()}</span>
                <span style={{ color: "#80d0ee" }}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SKILLS ── */}
      <section style={{ maxWidth: 740, margin: "0 auto", padding: "40px 20px", pointerEvents: "auto" }}>
        <div style={glass}>
          <h2 style={{ color: "#00ccff", fontSize: 13, letterSpacing: ".35em", marginBottom: 24, textTransform: "uppercase" }}>
            ◈  Core Skills  &nbsp;<span style={{ color: "#335566", fontSize: 11, letterSpacing: ".2em" }}>(click orbs in 3D for details)</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
            {SKILLS.map((sk) => (
              <div key={sk.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5, color: sk.color, letterSpacing: ".1em" }}>
                  <span style={{ fontWeight: 600 }}>{sk.name}</span>
                  <span style={{ color: "#669" }}>{sk.pct}%</span>
                </div>
                <div style={{ background: "rgba(0,20,50,0.6)", borderRadius: 6, height: 6, overflow: "hidden" }}>
                  <div style={{
                    width: sk.pct + "%", height: "100%", borderRadius: 6,
                    background: `linear-gradient(90deg, #0055bb, ${sk.color})`,
                    boxShadow: `0 0 8px ${sk.color}`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROJECTS ── */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "40px 20px 80px", pointerEvents: "auto" }}>
        <h2 style={{ color: "#00ccff", fontSize: 13, letterSpacing: ".35em", textTransform: "uppercase", textAlign: "center", marginBottom: 36, textShadow: "0 0 14px #004477" }}>
          ◈  Projects
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {PROJECTS.map((p) => (
            <div key={p.title} style={{
              ...glass, padding: "24px",
              transition: "transform .3s, box-shadow .3s",
              cursor: "default",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,100,200,0.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{p.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#80f0ff", marginBottom: 10, letterSpacing: ".04em" }}>{p.title}</h3>
              <p style={{ fontSize: 13, color: "#8abbcc", lineHeight: 1.75, marginBottom: 14 }}>{p.desc}</p>
              <div style={{ marginBottom: 18, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {p.tech.map((t) => (
                  <span key={t} style={{
                    background: "rgba(0,30,70,0.7)", border: "1px solid rgba(0,100,180,0.35)",
                    borderRadius: 4, padding: "3px 10px", fontSize: 11, color: "#00bbdd", letterSpacing: ".06em",
                  }}>{t}</span>
                ))}
              </div>
              <a href={p.url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "9px 20px", border: "1px solid #0088cc",
                  borderRadius: 7, color: "#00ddff", fontSize: 12, letterSpacing: ".15em",
                  textDecoration: "none", background: "rgba(0,40,80,0.4)", transition: "all .25s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#001840"; e.currentTarget.style.boxShadow = "0 0 20px #0066cc"; e.currentTarget.style.borderColor = "#00ccff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,40,80,0.4)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#0088cc"; }}
              >
                ⬡ VIEW ON GITHUB →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <footer style={{ textAlign: "center", padding: "60px 20px 50px", pointerEvents: "auto" }}>
        <div style={{ ...glass, display: "inline-block", padding: "30px 60px", maxWidth: 480 }}>
          <h2 style={{ color: "#00ccff", fontSize: 13, letterSpacing: ".35em", textTransform: "uppercase", marginBottom: 22 }}>
            ◈  Get In Touch
          </h2>
          <div style={{ fontSize: 14, color: "#88ccdd", lineHeight: 2.6 }}>
            <div>
              <a href={"https://github.com/" + PERSONAL.github} target="_blank" rel="noopener noreferrer"
                style={{ color: "#00eeff", textDecoration: "none", letterSpacing: ".06em" }}>
                ⬡ &nbsp;github.com/{PERSONAL.github}
              </a>
            </div>
            <div>
              <a href={"mailto:" + PERSONAL.email}
                style={{ color: "#00eeff", textDecoration: "none", letterSpacing: ".04em" }}>
                ✉ &nbsp;{PERSONAL.email}
              </a>
            </div>
            <div style={{ color: "#446688", fontSize: 12 }}>
              📍 &nbsp;{PERSONAL.location}
            </div>
          </div>
        </div>
        <p style={{ marginTop: 36, fontSize: 11, color: "#1a3344", letterSpacing: ".25em" }}>
          © 2026 Aanand Kumar · Built with React Three Fiber
        </p>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROOT APP
══════════════════════════════════════════════════════════ */
export default function App() {
  const [activeSkill, setActiveSkill] = useState(null);
  const [contactCard, setContactCard] = useState(false);
  const handleNodeClick = useCallback((sk) => {
    if (sk && sk.isContact) { setContactCard(c => !c); return; }
    setActiveSkill(prev => prev?.name === sk.name ? null : sk);
  }, []);
  const handleClose = useCallback(() => setActiveSkill(null), []);

  // Drag + scroll rotation state
  const rotRef = useRef({ dy: 0, dx: 0, scroll: 0, dragging: false });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });

  const onPointerDown = useCallback((e) => {
    dragRef.current.active = true;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
    rotRef.current.dragging = true;
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    rotRef.current.dy += dx * 0.55;
    rotRef.current.dx += dy * 0.55;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
  }, []);

  const onPointerUp = useCallback(() => { dragRef.current.active = false; rotRef.current.dragging = false; }, []);

  const onWheel = useCallback((e) => {
    rotRef.current.scroll += e.deltaY > 0 ? 2.5 : -2.5;
  }, []);

  return (<>
    <style>{`
      @keyframes tpulse {
        0%,100% { text-shadow:0 0 14px #00ffff,0 0 40px #00ccff,0 0 80px #0088ff,0 0 140px #0044cc; filter:brightness(1.3); }
        50% { text-shadow:0 0 28px #fff,0 0 65px #00ffff,0 0 120px #00aaff,0 0 200px #0077ee; filter:brightness(1.8); }
      }
      @keyframes bounce {
        0%,100% { transform:translateY(0); opacity:.4; }
        50% { transform:translateY(7px); opacity:.9; }
      }
      html,body,#root { margin:0; padding:0; width:100%; height:100%; background:#00020a; overflow-x:hidden; }
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
      <DNAHelix onNodeClick={handleNodeClick} rotRef={rotRef} onContactClick={() => setContactCard(true)} />
      <MatrixRain />
      <SparkleSwarm />
      <FX />
    </Canvas>

    <Overlay />
    <DetailPanel skill={activeSkill} onClose={handleClose} />
    {contactCard && (
      <div onClick={() => setContactCard(false)} style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div onClick={e => e.stopPropagation()} style={{ background:"rgba(0,8,28,0.92)", backdropFilter:"blur(24px)", border:"1px solid rgba(0,220,255,0.35)", borderRadius:20, padding:"36px 48px", textAlign:"center", color:"#c0f8ff", fontFamily:"Segoe UI,sans-serif", minWidth:280 }}>
          <div style={{ fontSize:11, letterSpacing:".25em", color:"#007799", marginBottom:6 }}>GET IN TOUCH</div>
          <h2 style={{ margin:"0 0 24px", fontSize:22, letterSpacing:".2em", color:"#00ffee", textShadow:"0 0 18px #00ffe0" }}>AANAND KUMAR</h2>
          <a href="https://github.com/Aanand251" target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, color:"#00eeff", textDecoration:"none", fontSize:15, margin:"0 0 14px", padding:"10px 20px", border:"1px solid rgba(0,200,255,0.25)", borderRadius:10, transition:"all .2s" }} onMouseEnter={e=>{e.currentTarget.style.background="rgba(0,200,255,0.1)";e.currentTarget.style.borderColor="rgba(0,200,255,0.6)"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="rgba(0,200,255,0.25)"}}>
            <span style={{ fontSize:18 }}>⬡</span> GitHub: Aanand251
          </a>
          <a href="mailto:choudharyaanandkumar251@gmail.com" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, color:"#00eeff", textDecoration:"none", fontSize:13, padding:"10px 20px", border:"1px solid rgba(0,200,255,0.25)", borderRadius:10, transition:"all .2s" }} onMouseEnter={e=>{e.currentTarget.style.background="rgba(0,200,255,0.1)";e.currentTarget.style.borderColor="rgba(0,200,255,0.6)"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor="rgba(0,200,255,0.25)"}}>
            <span style={{ fontSize:16 }}>✉</span> choudharyaanandkumar251@gmail.com
          </a>
          <button onClick={() => setContactCard(false)} style={{ marginTop:24, padding:"8px 32px", border:"1px solid rgba(0,170,255,0.5)", borderRadius:8, background:"transparent", color:"#00ccff", cursor:"pointer", fontSize:12, letterSpacing:".15em" }}>CLOSE</button>
        </div>
      </div>
    )}
  </>);
}