// =================================================================
//  AANAND KUMAR - Code-DNA 3D Portfolio (Ultra-Premium + Hand Tracking)
//  Single-file React + R3F + MediaPipe Tasks-Vision
// =================================================================
import React, { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Billboard, useCursor } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

const PERSONAL = {
  name: "AANAND KUMAR",
  role: "B.Tech CSE (3rd Year) | Android & Web Developer",
  bio: "Passionate developer crafting seamless Android and Web applications. Expertise in backend (Java) and cross-platform mobile development (Kotlin, Flutter, Dart). My mission is to build fine, high-performance software solutions.",
  github: "Aanand251",
  email: "choudharyaanandkumar251@gmail.com",
};

const SKILLS = [
  { name: "Java", pct: 95, color: "#00eaff" },
  { name: "Kotlin", pct: 90, color: "#44bbff" },
  { name: "Dart", pct: 85, color: "#00ffd5" },
  { name: "MongoDB", pct: 78, color: "#22cccc" },
  { name: "React", pct: 80, color: "#00aaff" },
  { name: "HTML", pct: 92, color: "#55ddff" },
];

const PROJECTS = [
  { title: "Personal Expense Tracker", tech: ["Kotlin", "Firebase"], desc: "A sleek Android app to track personal finances with Firebase backend and Material You design.", url: "https://github.com/Aanand251/personal-expense-tracker", icon: "\uD83D\uDCB0" },
  { title: "Zenith", tech: ["Kotlin Multiplatform", "SQL"], desc: "Cross-platform music application built with Kotlin Multiplatform and local SQL database.", url: "https://github.com/Aanand251/Zenith", icon: "\uD83C\uDFB5" },
  { title: "Talknest", tech: ["Kotlin", "Firebase"], desc: "Real-time chat application with Firebase Realtime Database and push notifications.", url: "https://github.com/Aanand251/Talknest", icon: "\uD83D\uDCAC" },
  { title: "NEON", tech: ["Kotlin"], desc: "Personal voice assistant powered by speech recognition and NLP for hands-free device control.", url: "https://github.com/Aanand251/personal-voice-assistant", icon: "\uD83E\uDD16" },
];
const BG = "#00020a";
const DNA_R = 4.2;
const DNA_H = 48;
const DNA_TURNS = 5;
const DNA_SEG = 400;
const DNA_RUNGS = 55;
const UP = new THREE.Vector3(0, 1, 0);

/* Hand Tracking Hook - MediaPipe Tasks-Vision */
function useHandTracking(handRef, enabled) {
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let landmarker = null;
    let animId = 0;
    let videoEl = null;

    (async () => {
      try {
        const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
        if (!alive) return;
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        if (!alive) return;
        landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });
        if (!alive) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
        });
        if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }
        videoEl = document.createElement("video");
        videoEl.srcObject = stream;
        videoEl.setAttribute("playsinline", "");
        videoEl.muted = true;
        Object.assign(videoEl.style, {
          position: "fixed", bottom: "16px", left: "16px", width: "160px",
          height: "120px", borderRadius: "12px", border: "1px solid #00aaff44",
          zIndex: "999", objectFit: "cover", opacity: "0.75",
          boxShadow: "0 0 20px #00448844",
        });
        document.body.appendChild(videoEl);
        await videoEl.play();
        const tick = () => {
          if (!alive || !landmarker || !videoEl || videoEl.readyState < 2) {
            animId = requestAnimationFrame(tick); return;
          }
          const result = landmarker.detectForVideo(videoEl, performance.now());
          if (result.landmarks && result.landmarks.length > 0) {
            const lm = result.landmarks[0];
            const wrist = lm[0]; const thumb = lm[4]; const index = lm[8];
            const pinch = Math.sqrt((thumb.x - index.x) ** 2 + (thumb.y - index.y) ** 2 + (thumb.z - index.z) ** 2);
            handRef.current = { active: true, x: wrist.x, y: wrist.y, pinch, landmarks: lm };
          } else {
            if (handRef.current) handRef.current.active = false;
          }
          animId = requestAnimationFrame(tick);
        };
        animId = requestAnimationFrame(tick);
      } catch (err) { console.warn("Hand tracking init error:", err); }
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(animId);
      if (landmarker) landmarker.close();
      if (videoEl) {
        const s = videoEl.srcObject;
        if (s) s.getTracks().forEach((t) => t.stop());
        videoEl.remove();
      }
    };
  }, [enabled, handRef]);
}
/* DNA Double-Helix (Smooth Molecular Style) */
function DNAHelix({ onNodeClick, rotRef, handRef }) {
  const grpRef = useRef();
  const { curve1, curve2, rungData } = useMemo(() => {
    const pts1 = [], pts2 = [];
    for (let i = 0; i <= DNA_SEG; i++) {
      const t = i / DNA_SEG;
      const a = t * DNA_TURNS * Math.PI * 2;
      const y = t * DNA_H - DNA_H / 2;
      pts1.push(new THREE.Vector3(Math.cos(a) * DNA_R, y, Math.sin(a) * DNA_R));
      pts2.push(new THREE.Vector3(Math.cos(a + Math.PI) * DNA_R, y, Math.sin(a + Math.PI) * DNA_R));
    }
    const c1 = new THREE.CatmullRomCurve3(pts1);
    const c2 = new THREE.CatmullRomCurve3(pts2);
    const rungs = [];
    for (let i = 0; i < DNA_RUNGS; i++) {
      const t = i / (DNA_RUNGS - 1);
      const p1 = c1.getPoint(t); const p2 = c2.getPoint(t);
      const dir = new THREE.Vector3().subVectors(p2, p1);
      const len = dir.length();
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
      rungs.push({ mid, quat, len, p1: p1.clone(), p2: p2.clone(), t });
    }
    return { curve1: c1, curve2: c2, rungData: rungs };
  }, []);

  const tube1 = useMemo(() => new THREE.TubeGeometry(curve1, DNA_SEG, 0.18, 16, false), [curve1]);
  const tube2 = useMemo(() => new THREE.TubeGeometry(curve2, DNA_SEG, 0.18, 16, false), [curve2]);
  const glow1 = useMemo(() => new THREE.TubeGeometry(curve1, 200, 0.42, 10, false), [curve1]);
  const glow2 = useMemo(() => new THREE.TubeGeometry(curve2, 200, 0.42, 10, false), [curve2]);
  const rungColors = useMemo(() => [0x00ffcc, 0x0088ff, 0xff6688, 0xffcc00], []);
  const rungGeos = useMemo(() => rungData.map((r) => new THREE.CylinderGeometry(0.04, 0.04, r.len, 8)), [rungData]);
  const capGeo = useMemo(() => new THREE.SphereGeometry(0.12, 12, 10), []);
  const dragState = useRef({ dragging: false, lastX: 0, velY: 0 });
  const BASE_ROT = 0.12;

  useFrame((_, delta) => {
    if (!grpRef.current) return;
    const ds = dragState.current;
    if (handRef && handRef.current && handRef.current.active) {
      const targetY = (handRef.current.x - 0.5) * Math.PI * 2;
      grpRef.current.rotation.y += (targetY - grpRef.current.rotation.y) * 0.06;
    } else if (ds.dragging) {
      grpRef.current.rotation.y += ds.velY;
      ds.velY *= 0.92;
    } else {
      ds.velY *= 0.92;
      grpRef.current.rotation.y += BASE_ROT * delta + ds.velY;
    }
    if (rotRef) rotRef.current = grpRef.current.rotation;
  });

  const onDown = useCallback((e) => {
    e.stopPropagation();
    dragState.current.dragging = true;
    dragState.current.lastX = e.clientX || 0;
  }, []);
  const onMove = useCallback((e) => {
    const ds = dragState.current;
    if (!ds.dragging) return;
    const x = e.clientX || 0;
    ds.velY = (x - ds.lastX) * 0.004;
    ds.lastX = x;
  }, []);
  const onUp = useCallback(() => { dragState.current.dragging = false; }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [onMove, onUp]);

  return (
    <group ref={grpRef} rotation={[0.12, 0, 0]} onPointerDown={onDown}>
      <mesh geometry={tube1}>
        <meshPhysicalMaterial color={0x00aaff} emissive={0x004488} emissiveIntensity={1.0} metalness={0.6} roughness={0.08} clearcoat={1} clearcoatRoughness={0.02} transparent opacity={0.94} />
      </mesh>
      <mesh geometry={tube2}>
        <meshPhysicalMaterial color={0x00ffcc} emissive={0x004422} emissiveIntensity={1.0} metalness={0.6} roughness={0.08} clearcoat={1} clearcoatRoughness={0.02} transparent opacity={0.94} />
      </mesh>
      <mesh geometry={glow1}>
        <meshBasicMaterial color={0x0066cc} side={THREE.BackSide} transparent opacity={0.045} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh geometry={glow2}>
        <meshBasicMaterial color={0x00cc88} side={THREE.BackSide} transparent opacity={0.045} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {rungData.map((r, i) => (
        <React.Fragment key={"r" + i}>
          <mesh position={r.mid} quaternion={r.quat} geometry={rungGeos[i]}>
            <meshPhysicalMaterial color={rungColors[i % 4]} emissive={rungColors[i % 4]} emissiveIntensity={0.45} metalness={0.3} roughness={0.2} clearcoat={0.5} transparent opacity={0.8} />
          </mesh>
          <mesh position={r.p1} geometry={capGeo}>
            <meshPhysicalMaterial color={rungColors[i % 4]} emissive={rungColors[i % 4]} emissiveIntensity={0.35} />
          </mesh>
          <mesh position={r.p2} geometry={capGeo}>
            <meshPhysicalMaterial color={rungColors[(i + 2) % 4]} emissive={rungColors[(i + 2) % 4]} emissiveIntensity={0.35} />
          </mesh>
        </React.Fragment>
      ))}
      {SKILLS.map((sk, idx) => {
        const t = (idx + 0.5) / SKILLS.length;
        const a = t * DNA_TURNS * Math.PI * 2;
        const y = t * DNA_H - DNA_H / 2;
        const strand = idx % 2 === 0;
        const pos = strand
          ? [Math.cos(a) * DNA_R, y, Math.sin(a) * DNA_R]
          : [Math.cos(a + Math.PI) * DNA_R, y, Math.sin(a + Math.PI) * DNA_R];
        return <SkillOrb key={sk.name} skill={sk} position={pos} onClick={() => onNodeClick && onNodeClick(sk)} />;
      })}
    </group>
  );
}
/* Skill Orb - Clean Volumetric Glass Bubble */
function SkillOrb({ skill, position, onClick }) {
  const grpRef = useRef();
  const coreRef = useRef();
  const [hov, setHov] = useState(false);
  useCursor(hov);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const speed = useMemo(() => 0.6 + Math.random() * 0.6, []);
  const sz = 0.32 + (skill.pct / 100) * 0.28;
  const col = useMemo(() => new THREE.Color(skill.color), [skill.color]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = Math.sin(t * speed + phase);
    if (coreRef.current) coreRef.current.material.emissiveIntensity = 1.8 + pulse * 0.8;
    if (grpRef.current) grpRef.current.scale.setScalar(1 + pulse * 0.05);
  });

  const labelOff = useMemo(() => {
    const pv = new THREE.Vector3(...position);
    const rd = pv.clone().setY(0).normalize();
    return [rd.x * 2.5, 0.7, rd.z * 2.5];
  }, [position]);

  return (
    <group ref={grpRef} position={position}>
      <mesh onClick={(e) => { e.stopPropagation(); onClick && onClick(); }} onPointerOver={() => setHov(true)} onPointerOut={() => setHov(false)}>
        <sphereGeometry args={[sz * 3.5, 8, 8]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[sz, 32, 32]} />
        <meshPhysicalMaterial color={col} emissive={col} emissiveIntensity={1.8} metalness={0.0} roughness={0.05} clearcoat={1} clearcoatRoughness={0.0} transmission={0.6} thickness={1.2} ior={1.45} transparent opacity={0.88} envMapIntensity={0.5} />
      </mesh>
      <mesh>
        <sphereGeometry args={[sz * 0.25, 12, 12]} />
        <meshBasicMaterial color="white" transparent opacity={0.55} />
      </mesh>
      <mesh>
        <sphereGeometry args={[sz * 1.6, 16, 16]} />
        <meshBasicMaterial color={skill.color} side={THREE.BackSide} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[sz * 2.8, 12, 12]} />
        <meshBasicMaterial color={skill.color} side={THREE.BackSide} transparent opacity={0.04} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Billboard position={labelOff}>
        <Text fontSize={0.36} color={skill.color} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000a18" font="https://fonts.gstatic.com/s/orbitron/v31/yMJRMIlzdpvBhQQL_Qq7dy0.woff2">
          {skill.name.toUpperCase()}
        </Text>
        <Text position={[0, -0.32, 0]} fontSize={0.2} color="#88ddff" anchorX="center" anchorY="middle">
          {skill.pct + "%"}
        </Text>
      </Billboard>
    </group>
  );
}
/* Matrix Binary Rain - Subtle, Distant, InstancedMesh */
const BIN_COUNT = 2000;
function MatrixRain() {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { positions, velocities, scales } = useMemo(() => {
    const p = [], v = [], s = [];
    for (let i = 0; i < BIN_COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 18 + Math.random() * 55;
      p.push(new THREE.Vector3(Math.cos(a) * d, (Math.random() - 0.5) * DNA_H * 2.5, Math.sin(a) * d - 10));
      v.push(-(0.015 + Math.random() * 0.04));
      s.push(0.2 + Math.random() * 0.35);
    }
    return { positions: p, velocities: v, scales: s };
  }, []);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64; c.height = 64;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 64, 64);
    ctx.fillStyle = "#003388";
    ctx.font = "bold 38px monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(Math.random() > 0.5 ? "1" : "0", 32, 32);
    return new THREE.CanvasTexture(c);
  }, []);
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useFrame(() => {
    if (!meshRef.current) return;
    const hBound = DNA_H * 1.3;
    for (let i = 0; i < BIN_COUNT; i++) {
      const p = positions[i];
      p.y += velocities[i];
      if (p.y < -hBound) {
        p.y = hBound;
        const a = Math.random() * Math.PI * 2;
        const d = 18 + Math.random() * 55;
        p.x = Math.cos(a) * d;
        p.z = Math.sin(a) * d - 10;
      }
      dummy.position.copy(p);
      const sc = scales[i];
      dummy.scale.set(sc, sc, 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[geo, null, BIN_COUNT]}>
      <meshBasicMaterial map={tex} transparent opacity={0.25} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}
/* Particle System - Hand Gesture Physics */
const PART_COUNT = 600;
function ParticleSystem({ handRef }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { homes, positions, velocities } = useMemo(() => {
    const h = [], p = [], v = [];
    for (let i = 0; i < PART_COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 14;
      const y = (Math.random() - 0.5) * DNA_H * 0.8;
      const home = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      h.push(home.clone()); p.push(home.clone()); v.push(new THREE.Vector3());
    }
    return { homes: h, positions: p, velocities: v };
  }, []);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 6, 6), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const hand = handRef && handRef.current;
    const active = hand && hand.active;
    const pinch = hand ? hand.pinch : 1;
    for (let i = 0; i < PART_COUNT; i++) {
      const pos = positions[i];
      const vel = velocities[i];
      const home = homes[i];
      if (active && pinch < 0.12) {
        vel.x += (0 - pos.x) * 0.015;
        vel.y += (0 - pos.y) * 0.015;
        vel.z += (0 - pos.z) * 0.015;
      } else if (active && pinch > 0.18) {
        const dir = pos.clone().normalize();
        if (dir.lengthSq() < 0.001) dir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        vel.add(dir.multiplyScalar(0.12));
      } else {
        vel.x += (home.x - pos.x) * 0.008;
        vel.y += (home.y - pos.y) * 0.008;
        vel.z += (home.z - pos.z) * 0.008;
        vel.x += Math.sin(t * 0.7 + i * 0.1) * 0.002;
        vel.y += Math.cos(t * 0.5 + i * 0.15) * 0.002;
      }
      vel.multiplyScalar(0.94);
      pos.add(vel);
      const sc = 0.04 + Math.sin(t * 1.2 + i * 0.5) * 0.015;
      dummy.position.copy(pos);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[geo, null, PART_COUNT]}>
      <meshBasicMaterial color={0x00ccff} transparent opacity={0.65} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}
/* Sparkle Swarm - Ambient Dust, Mouse Repulsion */
const SPARK_COUNT = 300;
function SparkleSwarm() {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { camera } = useThree();
  const pointer3D = useRef(new THREE.Vector3(-9999, 0, 0));
  const { homes, positions, velocities, phases, speeds, sizes } = useMemo(() => {
    const h = [], p = [], v = [], ph = [], sp = [], sz = [];
    for (let i = 0; i < SPARK_COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = DNA_R + (Math.random() - 0.5) * 8;
      const y = (Math.random() - 0.5) * DNA_H;
      const home = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      h.push(home.clone()); p.push(home.clone());
      v.push(new THREE.Vector3());
      ph.push(Math.random() * Math.PI * 2);
      sp.push(1.5 + Math.random() * 2.5);
      sz.push(0.04 + Math.random() * 0.1);
    }
    return { homes: h, positions: p, velocities: v, phases: ph, speeds: sp, sizes: sz };
  }, []);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 5, 5), []);
  useFrame(({ pointer, clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const vec = new THREE.Vector3(pointer.x, pointer.y, 0.5).unproject(camera);
    const dir = vec.sub(camera.position).normalize();
    const dist = -camera.position.z / dir.z;
    pointer3D.current.copy(camera.position).addScaledVector(dir, dist);
    const mw = pointer3D.current;
    for (let i = 0; i < SPARK_COUNT; i++) {
      const pos = positions[i]; const vel = velocities[i]; const home = homes[i];
      const dx = pos.x - mw.x, dy = pos.y - mw.y, dz = pos.z - mw.z;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 7 && d > 0.01) {
        const f = 0.06 * (1 - d / 7);
        vel.x += (dx / d) * f; vel.y += (dy / d) * f; vel.z += (dz / d) * f;
      }
      vel.x += (home.x - pos.x) * 0.012; vel.y += (home.y - pos.y) * 0.012; vel.z += (home.z - pos.z) * 0.012;
      vel.multiplyScalar(0.88); pos.add(vel);
      const sc = sizes[i] * (0.7 + 0.3 * Math.sin(t * speeds[i] + phases[i]));
      dummy.position.copy(pos); dummy.scale.setScalar(sc); dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[geo, null, SPARK_COUNT]}>
      <meshBasicMaterial color={0x00ddff} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}

/* Orbiting Lights */
function Lights() {
  const k = useRef(), f = useRef(), r = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (k.current) k.current.position.set(Math.cos(t * 0.25) * 20, Math.sin(t * 0.18) * 12, Math.sin(t * 0.25) * 20);
    if (f.current) f.current.position.set(Math.cos(t * 0.3 + 2) * 16, Math.sin(t * 0.22) * 10, Math.sin(t * 0.3 + 2) * 16);
    if (r.current) r.current.position.set(Math.cos(t * 0.19 + 4) * 12, Math.cos(t * 0.28) * 8, Math.sin(t * 0.19 + 4) * 12);
  });
  return (
    <>
      <ambientLight intensity={0.5} color={0x001122} />
      <pointLight ref={k} color={0x00bbff} intensity={20} distance={140} />
      <pointLight ref={f} color={0x0033dd} intensity={12} distance={100} />
      <pointLight ref={r} color={0x00ffcc} intensity={8} distance={80} />
    </>
  );
}

/* Post-Processing FX */
function FX() {
  return (
    <EffectComposer>
      <Bloom luminanceThreshold={0.12} luminanceSmoothing={0.65} intensity={1.8} radius={0.9} />
      <Vignette offset={0.3} darkness={0.7} />
    </EffectComposer>
  );
}
/* Hand Status Indicator */
function HandStatus({ handRef }) {
  const [status, setStatus] = useState({ active: false, pinch: 0 });
  useEffect(() => {
    const iv = setInterval(() => {
      if (handRef.current) setStatus({ active: handRef.current.active, pinch: handRef.current.pinch || 0 });
    }, 300);
    return () => clearInterval(iv);
  }, [handRef]);
  if (!status.active) return null;
  const gesture = status.pinch < 0.12 ? "PINCH" : status.pinch > 0.18 ? "SPREAD" : "IDLE";
  return (
    <div style={{ position: "fixed", bottom: 146, left: 16, zIndex: 1000, background: "rgba(0,20,40,0.8)", backdropFilter: "blur(8px)", border: "1px solid #00aaff55", borderRadius: 10, padding: "8px 14px", color: "#00eeff", fontSize: 11, letterSpacing: ".12em", fontFamily: "monospace" }}>
      HAND ACTIVE | {gesture} | {(status.pinch * 100).toFixed(0)}%
    </div>
  );
}

/* Detail Panel - Skill Info Popup */
function DetailPanel({ skill, onClose }) {
  if (!skill) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,2,10,0.7)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "rgba(0,12,30,0.85)", border: "1px solid #00aaff44", borderRadius: 20, padding: "36px 44px", maxWidth: 380, textAlign: "center", boxShadow: "0 0 60px #00448833" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", margin: "0 auto 18px", background: "radial-gradient(circle, " + skill.color + "44, " + skill.color + "11)", border: "2px solid " + skill.color + "66", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: skill.color, fontWeight: 900 }}>
          {skill.name[0]}
        </div>
        <h2 style={{ color: skill.color, fontSize: 22, marginBottom: 8, letterSpacing: ".1em" }}>{skill.name}</h2>
        <div style={{ width: "100%", background: "rgba(0,30,60,0.5)", borderRadius: 6, height: 8, overflow: "hidden", marginBottom: 18 }}>
          <div style={{ width: skill.pct + "%", height: "100%", borderRadius: 6, background: "linear-gradient(90deg, #0066ff, " + skill.color + ")", boxShadow: "0 0 12px " + skill.color }} />
        </div>
        <p style={{ color: "#88bbcc", fontSize: 13, lineHeight: 1.7 }}>
          Proficiency: <span style={{ color: skill.color, fontWeight: 700 }}>{skill.pct}%</span>
        </p>
        <button onClick={onClose} style={{ marginTop: 20, padding: "8px 28px", border: "1px solid #00aaff", borderRadius: 6, background: "transparent", color: "#00ccff", cursor: "pointer", fontSize: 12, letterSpacing: ".15em" }}>CLOSE</button>
      </div>
    </div>
  );
}
/* HTML OVERLAY - Glassmorphism Cyberpunk UI */
const glass = {
  background: "rgba(0,8,28,0.55)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(0,180,255,0.18)",
  borderRadius: "16px",
  padding: "28px",
  color: "#c0f0ff",
};

function Overlay() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10, pointerEvents: "none", overflowY: "auto", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 20px" }}>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 72px)", fontWeight: 900, letterSpacing: ".18em", color: "#a0f8ff", textShadow: "0 0 14px #00ffff, 0 0 40px #00ccff, 0 0 80px #0088ff, 0 0 140px #0044cc, 0 0 220px #002288", animation: "tpulse 3s ease-in-out infinite", marginBottom: 12 }}>
          {PERSONAL.name}
        </h1>
        <p style={{ fontSize: "clamp(11px, 1.3vw, 16px)", letterSpacing: ".45em", color: "#00bbdd", textShadow: "0 0 10px #0088cc" }}>
          {PERSONAL.role}
        </p>
        <div style={{ marginTop: 42, fontSize: 13, color: "#336688", letterSpacing: ".25em", animation: "bounce 2s infinite" }}>
          SCROLL DOWN
        </div>
      </section>
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "80px 20px", pointerEvents: "auto" }}>
        <div style={glass}>
          <h2 style={{ color: "#00ccff", fontSize: 14, letterSpacing: ".3em", marginBottom: 18, textTransform: "uppercase" }}>About Me</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "#a0d8ee" }}>{PERSONAL.bio}</p>
        </div>
      </section>
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "20px 20px 80px", pointerEvents: "auto" }}>
        <div style={glass}>
          <h2 style={{ color: "#00ccff", fontSize: 14, letterSpacing: ".3em", marginBottom: 22, textTransform: "uppercase" }}>Core Skills</h2>
          {SKILLS.map((sk) => (
            <div key={sk.name} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, color: sk.color, letterSpacing: ".12em" }}>
                <span>{sk.name}</span><span>{sk.pct}%</span>
              </div>
              <div style={{ background: "rgba(0,30,60,.5)", borderRadius: 6, height: 7, overflow: "hidden" }}>
                <div style={{ width: sk.pct + "%", height: "100%", borderRadius: 6, background: "linear-gradient(90deg, #0088ff, " + sk.color + ")", boxShadow: "0 0 10px " + sk.color, transition: "width 1.2s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "20px 20px 80px", pointerEvents: "auto" }}>
        <h2 style={{ color: "#00ccff", fontSize: 14, letterSpacing: ".3em", textTransform: "uppercase", textAlign: "center", marginBottom: 32, textShadow: "0 0 12px #005599" }}>Projects</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 22 }}>
          {PROJECTS.map((p) => (
            <div key={p.title} style={{ ...glass, padding: 22 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#80f0ff", marginBottom: 8 }}>{p.title}</h3>
              <p style={{ fontSize: 13, color: "#8abbcc", lineHeight: 1.7, marginBottom: 12 }}>{p.desc}</p>
              <div style={{ marginBottom: 14 }}>
                {p.tech.map((t) => (
                  <span key={t} style={{ display: "inline-block", background: "#001840", border: "1px solid #003366", borderRadius: 4, padding: "3px 10px", fontSize: 11, color: "#00aacc", marginRight: 6, marginBottom: 4 }}>{t}</span>
                ))}
              </div>
              <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", padding: "8px 20px", border: "1px solid #00aaff", borderRadius: 6, color: "#00ccff", fontSize: 12, letterSpacing: ".15em", textDecoration: "none", cursor: "pointer", background: "transparent" }}>
                VIEW ON GITHUB
              </a>
            </div>
          ))}
        </div>
      </section>
      <footer style={{ textAlign: "center", padding: "60px 20px 40px", pointerEvents: "auto" }}>
        <div style={{ ...glass, display: "inline-block", padding: "22px 44px" }}>
          <h2 style={{ color: "#00ccff", fontSize: 14, letterSpacing: ".3em", textTransform: "uppercase", marginBottom: 18 }}>Contact</h2>
          <div style={{ fontSize: 14, color: "#88ccdd", lineHeight: 2.2 }}>
            <div><a href={"https://github.com/" + PERSONAL.github} target="_blank" rel="noopener noreferrer" style={{ color: "#00eeff", textDecoration: "none", letterSpacing: ".08em" }}>GitHub: {PERSONAL.github}</a></div>
            <div><a href={"mailto:" + PERSONAL.email} style={{ color: "#00eeff", textDecoration: "none", letterSpacing: ".08em" }}>{PERSONAL.email}</a></div>
          </div>
        </div>
        <p style={{ marginTop: 30, fontSize: 11, color: "#1a3344", letterSpacing: ".25em" }}>2026 Aanand Kumar - Built with React Three Fiber</p>
      </footer>
    </div>
  );
}
/* ROOT APP */
export default function App() {
  const [activeSkill, setActiveSkill] = useState(null);
  const [handEnabled, setHandEnabled] = useState(false);
  const rotRef = useRef(null);
  const handRef = useRef({ active: false, x: 0.5, y: 0.5, pinch: 1 });
  useHandTracking(handRef, handEnabled);

  return (
    <>
      <style>{"\
        @keyframes tpulse { 0%, 100% { text-shadow: 0 0 14px #00ffff, 0 0 40px #00ccff, 0 0 80px #0088ff, 0 0 140px #0044cc, 0 0 220px #002288; filter: brightness(1.35); } 50% { text-shadow: 0 0 28px #ffffff, 0 0 65px #00ffff, 0 0 120px #00aaff, 0 0 200px #0077ee, 0 0 300px #0044bb; filter: brightness(1.75); } }\
        @keyframes bounce { 0%, 100% { transform: translateY(0); opacity: .5; } 50% { transform: translateY(8px); opacity: 1; } }\
        html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; background: #00020a; overflow-x: hidden; }\
        ::-webkit-scrollbar { width: 5px; }\
        ::-webkit-scrollbar-track { background: #000a14; }\
        ::-webkit-scrollbar-thumb { background: #003355; border-radius: 4px; }\
      "}</style>

      <Canvas
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        camera={{ position: [0, 0, 38], fov: 58 }}
        style={{ position: "fixed", inset: 0, zIndex: 0 }}
      >
        <fog attach="fog" args={[BG, 35, 110]} />
        <color attach="background" args={[BG]} />
        <Lights />
        <DNAHelix onNodeClick={setActiveSkill} rotRef={rotRef} handRef={handRef} />
        <MatrixRain />
        <ParticleSystem handRef={handRef} />
        <SparkleSwarm />
        <FX />
      </Canvas>

      <Overlay />
      <DetailPanel skill={activeSkill} onClose={() => setActiveSkill(null)} />
      <HandStatus handRef={handRef} />

      <button
        onClick={() => setHandEnabled((p) => !p)}
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 1000,
          width: 52, height: 52, borderRadius: "50%",
          background: handEnabled ? "radial-gradient(circle, #003355, #001122)" : "radial-gradient(circle, #002244, #000a14)",
          border: handEnabled ? "2px solid #00ccff" : "2px solid #003355",
          color: handEnabled ? "#00eeff" : "#336688",
          fontSize: 22, cursor: "pointer",
          boxShadow: handEnabled ? "0 0 24px #00448888, 0 0 60px #00224444" : "0 0 10px #00112244",
          transition: "all 0.3s ease",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        title={handEnabled ? "Disable Hand Tracking" : "Enable Hand Tracking"}
      >
        {"\uD83D\uDD90\uFE0F"}
      </button>
    </>
  );
}