/*
 * AANAND KUMAR - Cyberpunk DNA Portfolio
 * React 19 + Three.js r183 + R3F 9 + Drei 10 + PostProcessing 3
 * Hand Tracking: @mediapipe/hands + @mediapipe/camera_utils
 */

import React, {
  useRef, useMemo, useState, useEffect, useCallback,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Billboard, useCursor } from "@react-three/drei";
import {
  EffectComposer, Bloom, Vignette,
} from "@react-three/postprocessing";
import * as THREE from "three";

/* ============= DATA ============= */

const PERSONAL = {
  name: "AANAND KUMAR",
  role: "B.Tech CSE (3rd Year) | Android & Web Developer",
  bio:
    "Passionate developer crafting seamless Android and Web applications. " +
    "Expertise in backend (Java) and cross-platform mobile development " +
    "(Kotlin, Flutter, Dart). My mission is to build fine, high-performance " +
    "software solutions.",
  email: "choudharyaanandkumar251@gmail.com",
  github: "Aanand251",
};

const SKILLS = [
  { name: "Java",       pct: 90, color: "#ff6600" },
  { name: "Kotlin",     pct: 82, color: "#cc44ff" },
  { name: "Dart",       pct: 78, color: "#00bbff" },
  { name: "MongoDB",    pct: 72, color: "#55cc44" },
  { name: "React",      pct: 75, color: "#00ddff" },
  { name: "HTML",       pct: 88, color: "#ff4422" },
];

const PROJECTS = [
  {
    title: "Personal Expense Tracker",
    desc: "Track daily expenses with categorization, budgets, and Firebase sync.",
    tech: ["Kotlin", "Firebase"],
    url: "https://github.com/Aanand251/personal-expense-tracker",
  },
  {
    title: "Zenith",
    desc: "Cross-platform music application with offline support and SQL storage.",
    tech: ["Kotlin Multiplatform", "SQL"],
    url: "https://github.com/Aanand251/Zenith",
  },
  {
    title: "Talknest",
    desc: "Real-time chat application with Firebase backend and push notifications.",
    tech: ["Kotlin", "Firebase"],
    url: "https://github.com/Aanand251/Talknest",
  },
  {
    title: "NEON",
    desc: "Personal voice assistant powered by Kotlin speech recognition engine.",
    tech: ["Kotlin"],
    url: "https://github.com/Aanand251/personal-voice-assistant",
  },
];

/* ============= CONSTANTS ============= */
const DNA_RADIUS   = 5.5;
const DNA_HEIGHT   = 38;
const DNA_TURNS    = 5;
const DNA_SEGMENTS = 400;
const DNA_RUNGS    = 70;
const BG           = "#000510";
const RAIN_COUNT   = 3000;
const DUST_COUNT   = 800;

function useHandTracking(handRef, enabled) {
  const landmarkerRef = useRef(null);
  const vidRef        = useRef(null);
  const streamRef     = useRef(null);
  const rafRef        = useRef(null);

  useEffect(() => {
    if (!enabled) {
      // tear-down
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (landmarkerRef.current) { try { landmarkerRef.current.close(); } catch(e){} landmarkerRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
      if (vidRef.current) { vidRef.current.remove(); vidRef.current = null; }
      if (handRef.current) handRef.current.active = false;
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const vision = await import('@mediapipe/tasks-vision');
        const { FilesetResolver, HandLandmarker } = vision;

        if (cancelled) return;

        const wasmFileset = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm'
        );

        if (cancelled) return;

        const landmarker = await HandLandmarker.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minTrackingConfidence: 0.5,
        });
        landmarkerRef.current = landmarker;

        if (cancelled) return;

        // create video element + webcam preview
        const video = document.createElement('video');
        video.setAttribute('playsinline', 'true');
        video.autoplay = true;
        video.muted = true;
        video.style.cssText =
          'position:fixed;bottom:80px;left:16px;width:160px;height:120px;' +
          'border-radius:12px;border:2px solid #00aaff44;z-index:999;' +
          'object-fit:cover;opacity:0.85;pointer-events:none;';
        document.body.appendChild(video);
        vidRef.current = video;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
        });
        streamRef.current = stream;
        video.srcObject = stream;

        await new Promise((resolve) => { video.onloadeddata = resolve; });

        if (cancelled) return;

        // detection loop
        var lastTime = -1;
        function detect() {
          if (cancelled) return;
          rafRef.current = requestAnimationFrame(detect);
          if (!video || video.readyState < 2) return;
          var now = performance.now();
          if (now - lastTime < 50) return; // ~20fps detection cap
          lastTime = now;
          try {
            var result = landmarker.detectForVideo(video, now);
            if (!result.landmarks || !result.landmarks.length) {
              if (handRef.current) handRef.current.active = false;
              return;
            }
            var lm    = result.landmarks[0];
            var wrist  = lm[0];
            var thumb   = lm[4];
            var indexTip = lm[8];
            var pinch   = Math.hypot(
              thumb.x - indexTip.x, thumb.y - indexTip.y, (thumb.z || 0) - (indexTip.z || 0)
            );
            handRef.current = { active: true, x: wrist.x, y: wrist.y, pinch: pinch };
          } catch (err) {
            // skip frame
          }
        }
        detect();

      } catch (err) {
        console.warn('Hand tracking init failed:', err);
        if (handRef.current) handRef.current.active = false;
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (landmarkerRef.current) { try { landmarkerRef.current.close(); } catch(e){} landmarkerRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
      if (vidRef.current) { vidRef.current.remove(); vidRef.current = null; }
      if (handRef.current) handRef.current.active = false;
    };
  }, [enabled, handRef]);
}
/* ============= DNA HELIX ============= */
function DNAHelix({ onNodeClick, rotRef, handRef }) {
  const grp = useRef();

  const { tube1, tube2, glow1, glow2 } = useMemo(() => {
    const p1 = [], p2 = [];
    for (let i = 0; i <= DNA_SEGMENTS; i++) {
      const t = i / DNA_SEGMENTS;
      const a = t * DNA_TURNS * Math.PI * 2;
      const y = (t - 0.5) * DNA_HEIGHT;
      p1.push(new THREE.Vector3(Math.cos(a) * DNA_RADIUS, y, Math.sin(a) * DNA_RADIUS));
      p2.push(new THREE.Vector3(Math.cos(a + Math.PI) * DNA_RADIUS, y, Math.sin(a + Math.PI) * DNA_RADIUS));
    }
    const c1 = new THREE.CatmullRomCurve3(p1);
    const c2 = new THREE.CatmullRomCurve3(p2);
    return {
      tube1: new THREE.TubeGeometry(c1, DNA_SEGMENTS, 0.10, 14, false),
      tube2: new THREE.TubeGeometry(c2, DNA_SEGMENTS, 0.10, 14, false),
      glow1: new THREE.TubeGeometry(c1, 100, 0.32, 10, false),
      glow2: new THREE.TubeGeometry(c2, 100, 0.32, 10, false),
    };
  }, []);

  const rungs = useMemo(() => {
    const arr = [];
    for (let i = 0; i < DNA_RUNGS; i++) {
      const t = i / (DNA_RUNGS - 1);
      const a = t * DNA_TURNS * Math.PI * 2;
      const y = (t - 0.5) * DNA_HEIGHT;
      const ax = Math.cos(a) * DNA_RADIUS, az = Math.sin(a) * DNA_RADIUS;
      const bx = Math.cos(a + Math.PI) * DNA_RADIUS, bz = Math.sin(a + Math.PI) * DNA_RADIUS;
      const mx = (ax + bx) / 2, mz = (az + bz) / 2;
      const len = Math.sqrt((bx - ax) ** 2 + (bz - az) ** 2);
      const rot = Math.atan2(bz - az, bx - ax);
      arr.push({ pos: [mx, y, mz], len: len, rot: rot });
    }
    return arr;
  }, []);

  const skillNodes = useMemo(() =>
    SKILLS.map((sk, i) => {
      const t = i / (SKILLS.length - 1 || 1);
      const a = t * DNA_TURNS * Math.PI * 2;
      const y = (t - 0.5) * DNA_HEIGHT;
      const strand = i % 2 === 0 ? 0 : Math.PI;
      return {
        ...sk,
        position: [
          Math.cos(a + strand) * DNA_RADIUS,
          y,
          Math.sin(a + strand) * DNA_RADIUS,
        ],
      };
    }),
  []);

  useFrame(function dnaFrame(_, delta) {
    if (!grp.current) return;
    var dt = Math.min(delta, 0.05);
    if (handRef && handRef.current && handRef.current.active) {
      var target = (handRef.current.x - 0.5) * Math.PI * 2;
      grp.current.rotation.y += (target - grp.current.rotation.y) * 0.06;
    }
    if (rotRef && rotRef.current) {
      var r = rotRef.current;
      if (!r.dragging) r.dy += 0.15 * dt;
      grp.current.rotation.y += r.dy * 0.012 + r.scroll * 0.025;
      grp.current.rotation.x += r.dx * 0.003;
      r.dy *= 0.88; r.dx *= 0.88; r.scroll *= 0.88;
      if (!r.dragging && Math.abs(r.dx) < 0.08) {
        grp.current.rotation.x += (0.1 - grp.current.rotation.x) * 0.03;
      }
    }
  });

  return (
    <group ref={grp} rotation={[0.1, 0, 0]}>
      <mesh geometry={tube1}>
        <meshPhysicalMaterial
          color="#0088cc" emissive={0x004466}
          emissiveIntensity={0.9} metalness={0.6} roughness={0.08}
          clearcoat={1} transparent={true} opacity={0.92}
        />
      </mesh>
      <mesh geometry={tube2}>
        <meshPhysicalMaterial
          color="#00ccaa" emissive={0x004433}
          emissiveIntensity={0.9} metalness={0.6} roughness={0.08}
          clearcoat={1} transparent={true} opacity={0.92}
        />
      </mesh>
      <mesh geometry={glow1}>
        <meshBasicMaterial color={0x0077bb} transparent={true} opacity={0.05}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh geometry={glow2}>
        <meshBasicMaterial color={0x00bb77} transparent={true} opacity={0.05}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {rungs.map(function(r, i) {
        return (
          <group key={i} position={r.pos} rotation={[0, -r.rot, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.028, 0.028, r.len, 8]} />
              <meshPhysicalMaterial
                color="#005577" emissive={0x0066aa}
                emissiveIntensity={0.5} transparent={true} opacity={0.8}
              />
            </mesh>
            <mesh position={[-r.len / 2, 0, 0]}>
              <sphereGeometry args={[0.09, 10, 8]} />
              <meshStandardMaterial color="#00aaff" emissive={0x0088cc} emissiveIntensity={1.2} />
            </mesh>
            <mesh position={[r.len / 2, 0, 0]}>
              <sphereGeometry args={[0.09, 10, 8]} />
              <meshStandardMaterial color="#00ffaa" emissive={0x00cc88} emissiveIntensity={1.2} />
            </mesh>
          </group>
        );
      })}
      {skillNodes.map(function(sk) {
        return (
          <SkillOrb key={sk.name} skill={sk} onClick={function() { onNodeClick(sk); }} />
        );
      })}
    </group>
  );
}

/* ============= SKILL ORB ============= */
function SkillOrb({ skill, onClick }) {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const sz = 0.28 + (skill.pct / 100) * 0.22;

  useFrame(function orbFrame({ clock }) {
    if (!ref.current) return;
    var t = clock.getElapsedTime();
    ref.current.position.y =
      skill.position[1] + Math.sin(t * 1.1 + skill.pct) * 0.35;
    ref.current.rotation.y = t * 0.4;
  });

  return (
    <group ref={ref} position={skill.position}>
      <mesh
        onClick={onClick}
        onPointerOver={function() { setHovered(true); }}
        onPointerOut={function() { setHovered(false); }}
      >
        <sphereGeometry args={[sz * 3, 12, 8]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[sz, 2]} />
        <meshPhysicalMaterial
          color={skill.color} emissive={skill.color}
          emissiveIntensity={hovered ? 4 : 2.2}
          metalness={0.35} roughness={0.1}
          clearcoat={1} clearcoatRoughness={0.03}
          transmission={0.35} thickness={0.6}
          transparent={true} opacity={0.92}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[sz * 2, 16, 12]} />
        <meshBasicMaterial color={skill.color} transparent={true}
          opacity={hovered ? 0.3 : 0.18}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[sz * 3.5, 12, 8]} />
        <meshBasicMaterial color={skill.color} transparent={true} opacity={0.07}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <Billboard>
        <Text
          fontSize={0.32} color={skill.color}
          anchorY={-1.8}
          outlineWidth={0.025} outlineColor="#000000"
        >
          {skill.name}
        </Text>
        <Text fontSize={0.2} color="#88bbcc" anchorY={-3}>
          {skill.pct + "%"}
        </Text>
      </Billboard>
    </group>
  );
}

/* ============= MATRIX RAIN ============= */
function MatrixRain() {
  const ref = useRef();
  const dummy = useMemo(function() { return new THREE.Object3D(); }, []);
  const geo   = useMemo(function() { return new THREE.BoxGeometry(0.04, 0.25, 0.04); }, []);

  const data = useMemo(function() {
    var d = [];
    for (var i = 0; i < RAIN_COUNT; i++) {
      var a = Math.random() * Math.PI * 2;
      var r = 14 + Math.random() * 50;
      d.push({
        x: Math.cos(a) * r,
        y: (Math.random() - 0.5) * 100,
        z: Math.sin(a) * r - 20,
        speed: 0.4 + Math.random() * 1.2,
      });
    }
    return d;
  }, []);

  useFrame(function rainFrame() {
    if (!ref.current) return;
    for (var i = 0; i < RAIN_COUNT; i++) {
      var p = data[i];
      p.y -= p.speed * 0.1;
      if (p.y < -50) p.y = 50;
      dummy.position.set(p.x, p.y, p.z);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geo, null, RAIN_COUNT]}>
      <meshBasicMaterial color="#003366" transparent={true} opacity={0.3}
        blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}

/* ============= DUST PARTICLES ============= */
function DustParticles({ handRef }) {
  const ref = useRef();
  const dummy = useMemo(function() { return new THREE.Object3D(); }, []);
  const geo   = useMemo(function() { return new THREE.SphereGeometry(1, 6, 6); }, []);

  const data = useMemo(function() {
    var arr = [];
    for (var i = 0; i < DUST_COUNT; i++) {
      var a = Math.random() * Math.PI * 2;
      var r = 2 + Math.random() * 14;
      var y = (Math.random() - 0.5) * DNA_HEIGHT * 0.9;
      var home = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      arr.push({
        home: home.clone(),
        pos: home.clone(),
        vel: new THREE.Vector3(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 2,
        size: 0.04 + Math.random() * 0.10,
      });
    }
    return arr;
  }, []);

  useFrame(function dustFrame({ clock }) {
    if (!ref.current) return;
    var t      = clock.getElapsedTime();
    var active = handRef && handRef.current && handRef.current.active;
    var pinch  = (handRef && handRef.current && handRef.current.pinch != null) ? handRef.current.pinch : 1;

    for (var i = 0; i < DUST_COUNT; i++) {
      var p = data[i];
      var pos = p.pos, vel = p.vel, home = p.home;

      if (active && pinch < 0.10) {
        vel.x += (0 - pos.x) * 0.018;
        vel.y += (0 - pos.y) * 0.018;
        vel.z += (0 - pos.z) * 0.018;
      } else if (active && pinch > 0.20) {
        var dir = pos.clone().normalize();
        if (dir.lengthSq() < 0.001)
          dir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        vel.add(dir.multiplyScalar(0.14));
      } else {
        vel.x += (home.x - pos.x) * 0.007;
        vel.y += (home.y - pos.y) * 0.007;
        vel.z += (home.z - pos.z) * 0.007;
        vel.x += Math.sin(t * 0.6 + i * 0.1) * 0.002;
        vel.y += Math.cos(t * 0.4 + i * 0.12) * 0.002;
      }

      vel.multiplyScalar(0.93);
      pos.add(vel);

      var sc = p.size * (0.6 + 0.4 * Math.sin(t * p.speed + p.phase));
      dummy.position.copy(pos);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geo, null, DUST_COUNT]}>
      <meshBasicMaterial color={0x00ccff} transparent={true} opacity={0.55}
        blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}

/* ============= SPARKLE SWARM ============= */
function SparkleSwarm() {
  const ref   = useRef();
  const dummy = useMemo(function() { return new THREE.Object3D(); }, []);
  const threeCtx = useThree();
  const COUNT = 200;

  const data = useMemo(function() {
    var h = [], p = [], v = [], ph = [], sp = [], sz = [];
    for (var i = 0; i < COUNT; i++) {
      var a = Math.random() * Math.PI * 2;
      var r = DNA_RADIUS + (Math.random() - 0.5) * 8;
      var y = (Math.random() - 0.5) * DNA_HEIGHT;
      var home = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
      h.push(home.clone()); p.push(home.clone());
      v.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.015,
        (Math.random() - 0.5) * 0.02,
      ));
      ph.push(Math.random() * Math.PI * 2);
      sp.push(1.5 + Math.random() * 2.5);
      sz.push(0.05 + Math.random() * 0.15);
    }
    return { h: h, p: p, v: v, ph: ph, sp: sp, sz: sz };
  }, []);

  const geo = useMemo(function() { return new THREE.SphereGeometry(1, 6, 6); }, []);

  useFrame(function sparkleFrame({ pointer, clock }) {
    if (!ref.current) return;
    var t = clock.getElapsedTime();
    var cam = threeCtx.camera;
    var vec = new THREE.Vector3(pointer.x, pointer.y, 0.5).unproject(cam);
    var dir = vec.sub(cam.position).normalize();
    var dist = -cam.position.z / dir.z;
    var mw = cam.position.clone().addScaledVector(dir, dist);

    for (var i = 0; i < COUNT; i++) {
      var pos = data.p[i], vel = data.v[i], home = data.h[i];
      var dx = pos.x - mw.x, dy = pos.y - mw.y, dz = pos.z - mw.z;
      var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 8 && d > 0.01) {
        var f = 0.06 * (1 - d / 8);
        vel.x += (dx / d) * f; vel.y += (dy / d) * f; vel.z += (dz / d) * f;
      }
      vel.x += (home.x - pos.x) * 0.014;
      vel.y += (home.y - pos.y) * 0.014;
      vel.z += (home.z - pos.z) * 0.014;
      vel.multiplyScalar(0.88);
      pos.add(vel);

      var sc = data.sz[i] * (0.7 + 0.3 * Math.sin(t * data.sp[i] + data.ph[i]));
      dummy.position.copy(pos);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geo, null, COUNT]}>
      <meshBasicMaterial color={0x00eeff} transparent={true} opacity={0.6}
        blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}

/* ============= LIGHTS ============= */
function Lights() {
  const a = useRef(), b = useRef(), c = useRef();
  useFrame(function lightsFrame({ clock }) {
    var t = clock.getElapsedTime();
    if (a.current) a.current.position.set(Math.cos(t * 0.25) * 22, Math.sin(t * 0.18) * 14, Math.sin(t * 0.25) * 22);
    if (b.current) b.current.position.set(Math.cos(t * 0.3 + 2) * 18, Math.sin(t * 0.22) * 12, Math.sin(t * 0.3 + 2) * 18);
    if (c.current) c.current.position.set(Math.cos(t * 0.19 + 4) * 14, Math.cos(t * 0.28) * 10, Math.sin(t * 0.19 + 4) * 14);
  });
  return (
    <>
      <ambientLight intensity={0.5} color={0x001122} />
      <pointLight ref={a} color={0x00aaff} intensity={16} distance={150} />
      <pointLight ref={b} color={0x0033cc} intensity={9}  distance={110} />
      <pointLight ref={c} color={0x00ffcc} intensity={5}  distance={80}  />
    </>
  );
}

/* ============= POST-PROCESSING ============= */
function FX() {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.12}
        luminanceSmoothing={0.7}
        intensity={1.8}
        radius={0.9}
      />
      <Vignette offset={0.3} darkness={0.7} />
    </EffectComposer>
  );
}

/* ============= HAND STATUS HUD ============= */
function HandStatus({ handRef }) {
  const [status, setStatus] = useState({ active: false, pinch: 0 });
  useEffect(function() {
    var iv = setInterval(function() {
      if (handRef.current)
        setStatus({
          active: handRef.current.active,
          pinch: handRef.current.pinch || 0,
        });
    }, 250);
    return function() { clearInterval(iv); };
  }, [handRef]);

  if (!status.active) return null;
  var gesture =
    status.pinch < 0.10 ? "\u270A PINCH"
    : status.pinch > 0.20 ? "\uD83D\uDD90 SPREAD"
    : "\u270B IDLE";

  return (
    <div style={{
      position: "fixed", bottom: 146, left: 16, zIndex: 1000,
      background: "rgba(0,16,36,0.85)", backdropFilter: "blur(10px)",
      border: "1px solid #00aaff44", borderRadius: 10, padding: "8px 14px",
      color: "#00eeff", fontSize: 11, letterSpacing: ".12em", fontFamily: "monospace",
    }}>
      {"\uD83D\uDD90"} HAND ACTIVE {gesture}
    </div>
  );
}

/* ============= DETAIL PANEL ============= */
var glassStyle = {
  background: "rgba(0,8,28,0.55)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  border: "1px solid rgba(0,180,255,0.18)",
  borderRadius: "16px",
  padding: "28px",
  color: "#c0f0ff",
};

function DetailPanel({ skill, onClose }) {
  return (
    <div style={{
      position: "fixed", right: skill ? 20 : -420, top: "50%",
      transform: "translateY(-50%)", width: 340, zIndex: 100,
      pointerEvents: skill ? "auto" : "none",
      transition: "right 0.45s cubic-bezier(0.23,1,0.32,1)",
      ...glassStyle, padding: "30px 26px",
      boxShadow: "0 0 60px rgba(0,100,255,0.25)",
      border: "1px solid " + (skill ? skill.color + "55" : "rgba(0,180,255,0.18)"),
    }}>
      {skill && (
        <>
          <div style={{ fontSize: 11, letterSpacing: ".35em", color: "#006688", marginBottom: 18, textTransform: "uppercase" }}>
            SKILL DATA
          </div>
          <div style={{
            fontSize: 28, fontWeight: 900, color: skill.color,
            textShadow: "0 0 20px " + skill.color, letterSpacing: ".06em", marginBottom: 14,
          }}>
            {skill.name}
          </div>
          <div style={{ fontSize: 11, color: "#446688", letterSpacing: ".2em", marginBottom: 8 }}>
            PROFICIENCY
          </div>
          <div style={{
            background: "rgba(0,20,50,0.7)", borderRadius: 8, height: 10,
            overflow: "hidden", border: "1px solid rgba(0,100,160,0.3)", marginBottom: 8,
          }}>
            <div style={{
              width: skill.pct + "%", height: "100%", borderRadius: 8,
              background: "linear-gradient(90deg, #0066ff, " + skill.color + ")",
              boxShadow: "0 0 16px " + skill.color,
              transition: "width 0.9s ease",
            }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: skill.color, textAlign: "right", marginBottom: 24 }}>
            {skill.pct + "%"}
          </div>
          <button onClick={onClose} style={{
            width: "100%", padding: "10px 0", background: "transparent",
            border: "1px solid " + skill.color + "88", borderRadius: 8,
            color: skill.color, fontSize: 12, letterSpacing: ".25em",
            cursor: "pointer", textTransform: "uppercase",
          }}>
            CLOSE
          </button>
        </>
      )}
    </div>
  );
}

/* ============= HTML OVERLAY ============= */
function Overlay() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10, pointerEvents: "none",
      overflowY: "auto", fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* HERO */}
      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0,
        width: "clamp(150px,16vw,220px)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "0 0 0 18px", zIndex: 12, pointerEvents: "none",
      }}>
        <div style={{
          background: "rgba(0,3,14,0.6)", backdropFilter: "blur(16px)",
          border: "1px solid rgba(0,160,230,0.18)", borderRadius: 14,
          padding: "16px 18px 14px", marginBottom: 14,
        }}>
          <h1 style={{
            fontSize: "clamp(14px,1.8vw,24px)", fontWeight: 900,
            letterSpacing: ".16em", color: "#a0f8ff",
            textShadow: "0 0 14px #00ffff, 0 0 40px #00ccff, 0 0 80px #0088ff",
            animation: "tpulse 3s ease-in-out infinite",
            margin: "0 0 8px", lineHeight: 1.2,
          }}>
            <span style={{ display: "block" }}>AANAND</span>
            <span style={{ display: "block" }}>KUMAR</span>
          </h1>
          <p style={{
            fontSize: "clamp(7px,0.65vw,10px)", letterSpacing: ".15em",
            color: "#00aacc", margin: 0, lineHeight: 1.7,
          }}>
            <span style={{ display: "block" }}>B.Tech CSE (3rd Year)</span>
            <span style={{ display: "block" }}>Android & Web Developer</span>
          </p>
        </div>
        <div style={{ fontSize: 8, color: "#1e4a5a", letterSpacing: ".13em", lineHeight: 2.4 }}>
          <div>DRAG - ROTATE</div>
          <div>SCROLL - SPIN</div>
          <div>CLICK ORBS - DETAILS</div>
        </div>
      </div>

      <section style={{ height: "100vh" }} />

      {/* ABOUT */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "80px 20px 40px", pointerEvents: "auto" }}>
        <div style={glassStyle}>
          <h2 style={{ color: "#00ccff", fontSize: 13, letterSpacing: ".35em", marginBottom: 18, textTransform: "uppercase" }}>
            About Me
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.9, color: "#a0d8ee" }}>
            {PERSONAL.bio}
          </p>
        </div>
      </section>

      {/* SKILLS */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", pointerEvents: "auto" }}>
        <div style={glassStyle}>
          <h2 style={{ color: "#00ccff", fontSize: 13, letterSpacing: ".35em", marginBottom: 22, textTransform: "uppercase" }}>
            Core Skills
            <span style={{ color: "#335566", fontSize: 11, marginLeft: 12 }}>
              (click orbs in 3D for details)
            </span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
            {SKILLS.map(function(sk) {
              return (
                <div key={sk.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, color: sk.color }}>
                    <span style={{ fontWeight: 600 }}>{sk.name}</span>
                    <span style={{ color: "#556" }}>{sk.pct + "%"}</span>
                  </div>
                  <div style={{ background: "rgba(0,20,50,0.6)", borderRadius: 6, height: 6, overflow: "hidden" }}>
                    <div style={{
                      width: sk.pct + "%", height: "100%", borderRadius: 6,
                      background: "linear-gradient(90deg, #0055bb, " + sk.color + ")",
                      boxShadow: "0 0 8px " + sk.color,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section style={{ maxWidth: 940, margin: "0 auto", padding: "40px 20px 80px", pointerEvents: "auto" }}>
        <h2 style={{
          color: "#00ccff", fontSize: 13, letterSpacing: ".35em",
          textTransform: "uppercase", textAlign: "center", marginBottom: 32,
          textShadow: "0 0 14px #004477",
        }}>
          Projects
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 22 }}>
          {PROJECTS.map(function(p) {
            return (
              <div key={p.title} style={{
                ...glassStyle, padding: 22, transition: "transform .3s, box-shadow .3s",
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#80f0ff", marginBottom: 10, letterSpacing: ".04em" }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: 13, color: "#8abbcc", lineHeight: 1.75, marginBottom: 14 }}>
                  {p.desc}
                </p>
                <div style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {p.tech.map(function(t) {
                    return (
                      <span key={t} style={{
                        background: "rgba(0,30,70,0.7)", border: "1px solid rgba(0,100,180,0.35)",
                        borderRadius: 4, padding: "3px 10px", fontSize: 11, color: "#00bbdd",
                      }}>{t}</span>
                    );
                  })}
                </div>
                <a href={p.url} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "9px 18px", border: "1px solid #0088cc", borderRadius: 7,
                  color: "#00ddff", fontSize: 12, letterSpacing: ".14em",
                  textDecoration: "none", background: "rgba(0,40,80,0.4)",
                  transition: "all .25s",
                }}>
                  VIEW ON GITHUB
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* CONTACT */}
      <footer style={{ textAlign: "center", padding: "60px 20px 50px", pointerEvents: "auto" }}>
        <div style={{ ...glassStyle, display: "inline-block", padding: "28px 50px", maxWidth: 420 }}>
          <h2 style={{ color: "#00ccff", fontSize: 13, letterSpacing: ".35em", textTransform: "uppercase", marginBottom: 20 }}>
            Get In Touch
          </h2>
          <div style={{ fontSize: 14, color: "#88ccdd", lineHeight: 2.6 }}>
            <div>
              <a href={"https://github.com/" + PERSONAL.github} target="_blank" rel="noopener noreferrer"
                style={{ color: "#00eeff", textDecoration: "none" }}>
                github.com/{PERSONAL.github}
              </a>
            </div>
            <div>
              <a href={"mailto:" + PERSONAL.email} style={{ color: "#00eeff", textDecoration: "none" }}>
                {PERSONAL.email}
              </a>
            </div>
          </div>
        </div>
        <p style={{ marginTop: 32, fontSize: 11, color: "#1a3344", letterSpacing: ".25em" }}>
          2025 Aanand Kumar - React Three Fiber
        </p>
      </footer>
    </div>
  );
}

/* ============= ROOT APP ============= */
export default function App() {
  const [activeSkill, setActiveSkill] = useState(null);
  const [handEnabled, setHandEnabled] = useState(false);

  const handRef = useRef({ active: false, x: 0.5, y: 0.5, pinch: 1 });
  useHandTracking(handRef, handEnabled);

  const handleNodeClick = useCallback(
    function(sk) { setActiveSkill(function(prev) { return (prev && prev.name === sk.name) ? null : sk; }); },
    [],
  );
  const handleClose = useCallback(function() { setActiveSkill(null); }, []);

  const rotRef  = useRef({ dy: 0, dx: 0, scroll: 0, dragging: false });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });

  var onPointerDown = useCallback(function(e) {
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
    rotRef.current.dragging = true;
  }, []);
  var onPointerMove = useCallback(function(e) {
    if (!dragRef.current.active) return;
    rotRef.current.dy += (e.clientX - dragRef.current.lastX) * 0.55;
    rotRef.current.dx += (e.clientY - dragRef.current.lastY) * 0.55;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
  }, []);
  var onPointerUp = useCallback(function() {
    dragRef.current.active = false;
    rotRef.current.dragging = false;
  }, []);
  var onWheel = useCallback(function(e) {
    rotRef.current.scroll += e.deltaY > 0 ? 2.5 : -2.5;
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: [
        "@keyframes tpulse {",
        "  0%,100%{text-shadow:0 0 14px #00ffff,0 0 40px #00ccff,0 0 80px #0088ff,0 0 140px #0044cc;filter:brightness(1.3)}",
        "  50%{text-shadow:0 0 28px #fff,0 0 65px #00ffff,0 0 120px #00aaff,0 0 200px #0077ee;filter:brightness(1.8)}",
        "}",
        "html,body,#root{margin:0;padding:0;width:100%;height:100%;background:" + BG + ";overflow-x:hidden}",
        "::-webkit-scrollbar{width:4px}",
        "::-webkit-scrollbar-track{background:#000a14}",
        "::-webkit-scrollbar-thumb{background:#002244;border-radius:4px}",
        "*{box-sizing:border-box}",
      ].join("\n") }} />

      <Canvas
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        camera={{ position: [0, 0, 40], fov: 56 }}
        style={{ position: "fixed", inset: 0, zIndex: 0 }}
        onPointerMissed={function() { setActiveSkill(null); }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
      >
        <fog attach="fog" args={[BG, 38, 120]} />
        <color attach="background" args={[BG]} />
        <Lights />
        <DNAHelix onNodeClick={handleNodeClick} rotRef={rotRef} handRef={handRef} />
        <MatrixRain />
        <DustParticles handRef={handRef} />
        <SparkleSwarm />
        <FX />
      </Canvas>

      <Overlay />
      <DetailPanel skill={activeSkill} onClose={handleClose} />
      <HandStatus handRef={handRef} />

      <button
        onClick={function() { setHandEnabled(function(p) { return !p; }); }}
        style={{
          position: "fixed", bottom: 20, right: 20, zIndex: 1000,
          width: 52, height: 52, borderRadius: "50%",
          background: handEnabled
            ? "radial-gradient(circle, #003355, #001122)"
            : "radial-gradient(circle, #002244, #000a14)",
          border: handEnabled ? "2px solid #00ccff" : "2px solid #003355",
          color: handEnabled ? "#00eeff" : "#336688",
          fontSize: 22, cursor: "pointer",
          boxShadow: handEnabled
            ? "0 0 24px #00448888, 0 0 60px #00224444"
            : "0 0 10px #00112244",
          transition: "all 0.3s ease",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
        title={handEnabled ? "Disable Camera" : "Enable Camera"}
      >
        {handEnabled ? "\uD83D\uDCF7" : "\uD83D\uDD90"}
      </button>
    </>
  );
}
