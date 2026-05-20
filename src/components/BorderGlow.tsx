"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import clsx from "clsx";
import styles from "./BorderGlow.module.css";

type CSSVariableStyle = CSSProperties & Record<`--${string}`, string | number>;

type BorderGlowProps = {
  children: ReactNode;
  className?: string;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  coneSpread?: number;
  animated?: boolean;
  colors?: string[];
  fillOpacity?: number;
};

type HslValues = {
  h: number;
  s: number;
  l: number;
};

const GRADIENT_POSITIONS = [
  "80% 55%",
  "69% 34%",
  "8% 6%",
  "41% 38%",
  "86% 85%",
  "82% 18%",
  "51% 4%",
];

const GRADIENT_KEYS = [
  "--gradient-one",
  "--gradient-two",
  "--gradient-three",
  "--gradient-four",
  "--gradient-five",
  "--gradient-six",
  "--gradient-seven",
] as const;

const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function parseHSL(hslStr: string): HslValues {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);

  if (!match) {
    return { h: 40, s: 80, l: 80 };
  }

  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3]),
  };
}

function buildGlowVars(glowColor: string, intensity: number): CSSVariableStyle {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const keys = ["", "-60", "-50", "-40", "-30", "-20", "-10"];

  return opacities.reduce<CSSVariableStyle>((vars, opacity, index) => {
    vars[`--glow-color${keys[index]}`] = `hsl(${base} / ${Math.min(opacity * intensity, 100)}%)`;
    return vars;
  }, {});
}

function buildGradientVars(colors: string[]): CSSVariableStyle {
  const safeColors = colors.length ? colors : ["#f0b287"];
  const vars = GRADIENT_KEYS.reduce<CSSVariableStyle>((acc, key, index) => {
    const colorIndex = Math.min(COLOR_MAP[index], safeColors.length - 1);
    acc[key] = `radial-gradient(at ${GRADIENT_POSITIONS[index]}, ${safeColors[colorIndex]} 0px, transparent 50%)`;
    return acc;
  }, {});

  vars["--gradient-base"] = `linear-gradient(${safeColors[0]} 0 100%)`;
  return vars;
}

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

function easeInCubic(x: number) {
  return x * x * x;
}

function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: {
  start?: number;
  end?: number;
  duration?: number;
  delay?: number;
  ease?: (value: number) => number;
  onUpdate: (value: number) => void;
  onEnd?: () => void;
}) {
  const t0 = performance.now() + delay;

  function tick() {
    const elapsed = performance.now() - t0;
    const t = Math.min(elapsed / duration, 1);
    onUpdate(start + (end - start) * ease(t));

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      onEnd?.();
    }
  }

  window.setTimeout(() => requestAnimationFrame(tick), delay);
}

export default function BorderGlow({
  children,
  className,
  edgeSensitivity = 30,
  glowColor = "24 82 70",
  backgroundColor = "#F6EFE7",
  borderRadius = 32,
  glowRadius = 36,
  glowIntensity = 0.78,
  coneSpread = 25,
  animated = false,
  colors = ["#f0b287", "#c8d1bf", "#7fb7d7"],
  fillOpacity = 0.34,
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const getCenterOfElement = useCallback((el: HTMLElement) => {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2] as const;
  }, []);

  const getEdgeProximity = useCallback((el: HTMLElement, x: number, y: number) => {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;

    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);

    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }, [getCenterOfElement]);

  const getCursorAngle = useCallback((el: HTMLElement, x: number, y: number) => {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;

    if (dx === 0 && dy === 0) return 0;

    const radians = Math.atan2(dy, dx);
    const degrees = radians * (180 / Math.PI) + 90;
    return degrees < 0 ? degrees + 360 : degrees;
  }, [getCenterOfElement]);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const edge = getEdgeProximity(card, x, y);
    const angle = getCursorAngle(card, x, y);
    const edgePercent = Math.max(edge * 100, 36);

    card.style.setProperty("--edge-proximity", `${edgePercent.toFixed(3)}`);
    card.style.setProperty("--edge-opacity", `${Math.min(edgePercent, 100).toFixed(2)}%`);
    card.style.setProperty("--edge-opacity-strong", `${Math.min(edgePercent * 0.82, 100).toFixed(2)}%`);
    card.style.setProperty("--edge-opacity-soft", `${Math.min(edgePercent * 0.45, 100).toFixed(2)}%`);
    card.style.setProperty("--edge-opacity-faint", `${Math.min(edgePercent * 0.28, 100).toFixed(2)}%`);
    card.style.setProperty("--edge-opacity-halo", `${Math.min(edgePercent * 0.34, 100).toFixed(2)}%`);
    card.style.setProperty("--cursor-angle", `${angle.toFixed(3)}deg`);
    card.style.setProperty("--glow-x", `${x.toFixed(1)}px`);
    card.style.setProperty("--glow-y", `${y.toFixed(1)}px`);
  }, [getCursorAngle, getEdgeProximity]);

  const handlePointerLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;

    card.style.setProperty("--edge-proximity", "0");
    card.style.setProperty("--edge-opacity", "0%");
    card.style.setProperty("--edge-opacity-strong", "0%");
    card.style.setProperty("--edge-opacity-soft", "0%");
    card.style.setProperty("--edge-opacity-faint", "0%");
    card.style.setProperty("--edge-opacity-halo", "0%");
    card.style.setProperty("--glow-x", "50%");
    card.style.setProperty("--glow-y", "50%");
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!animated || !card) return;

    const angleStart = 110;
    const angleEnd = 465;
    card.classList.add(styles.sweepActive);
    card.style.setProperty("--cursor-angle", `${angleStart}deg`);

    animateValue({
      duration: 500,
      onUpdate: (value) => card.style.setProperty("--edge-proximity", `${value}`),
    });
    animateValue({
      ease: easeInCubic,
      duration: 1500,
      end: 50,
      onUpdate: (value) => {
        card.style.setProperty("--cursor-angle", `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`);
      },
    });
    animateValue({
      ease: easeOutCubic,
      delay: 1500,
      duration: 2250,
      start: 50,
      end: 100,
      onUpdate: (value) => {
        card.style.setProperty("--cursor-angle", `${(angleEnd - angleStart) * (value / 100) + angleStart}deg`);
      },
    });
    animateValue({
      ease: easeInCubic,
      delay: 2500,
      duration: 1500,
      start: 100,
      end: 0,
      onUpdate: (value) => card.style.setProperty("--edge-proximity", `${value}`),
      onEnd: () => card.classList.remove(styles.sweepActive),
    });
  }, [animated]);

  const style: CSSVariableStyle = {
    "--card-bg": backgroundColor,
    "--edge-sensitivity": edgeSensitivity,
    "--border-radius": `${borderRadius}px`,
    "--glow-padding": `${glowRadius}px`,
    "--glow-x": "50%",
    "--glow-y": "50%",
    "--edge-opacity": "0%",
    "--edge-opacity-strong": "0%",
    "--edge-opacity-soft": "0%",
    "--edge-opacity-faint": "0%",
    "--edge-opacity-halo": "0%",
    "--cone-spread": coneSpread,
    "--fill-opacity": fillOpacity,
    ...buildGlowVars(glowColor, glowIntensity),
    ...buildGradientVars(colors),
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={clsx(styles.card, className)}
      style={style}
    >
      <span className={styles.edgeLight} />
      <div className={styles.inner}>{children}</div>
    </div>
  );
}
