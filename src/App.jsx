import { useEffect, useMemo, useState } from "react";

const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATES_LB = [45, 35, 25, 10, 5, 2.5];
const BAR_KG = 20;
const BAR_LB = 45;
const STORAGE_KEY = "warmup-calc:state";
const DEFAULT_LIFT = "squat";
const DEFAULT_UNIT = "kg";
const DEFAULT_WEIGHTS = {
  squat: 100,
  bench: 100,
  deadlift: 100,
};

const WARMUP_SCHEME = [
  { pct: 0, reps: 8, label: "Bar Only" },
  { pct: 0.5, reps: 5, label: "50%" },
  { pct: 0.7, reps: 2, label: "70%" },
  { pct: 0.9, reps: 1, label: "90%" },
];

function calcPlates(totalWeight, barWeight, availablePlates) {
  let remaining = (totalWeight - barWeight) / 2;
  if (remaining <= 0) return [];
  const plates = [];
  for (const plate of availablePlates) {
    while (remaining >= plate - 0.01) {
      plates.push(plate);
      remaining -= plate;
    }
  }
  return plates;
}

function roundToNearest(value, increment) {
  return Math.round(value / increment) * increment;
}

function formatWeight(value) {
  if (!Number.isFinite(value)) return "";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/\.0+$/, "");
}

function sanitizeLift(lift) {
  return ["squat", "bench", "deadlift"].includes(lift) ? lift : DEFAULT_LIFT;
}

function sanitizeUnit(unit) {
  return unit === "lb" ? "lb" : DEFAULT_UNIT;
}

function sanitizeWeights(weights, unit) {
  const minimum = unit === "kg" ? BAR_KG : BAR_LB;

  return {
    squat: Math.max(minimum, Number(weights?.squat) || DEFAULT_WEIGHTS.squat),
    bench: Math.max(minimum, Number(weights?.bench) || DEFAULT_WEIGHTS.bench),
    deadlift: Math.max(minimum, Number(weights?.deadlift) || DEFAULT_WEIGHTS.deadlift),
  };
}

function loadInitialState() {
  if (typeof window === "undefined") {
    return {
      unit: DEFAULT_UNIT,
      lift: DEFAULT_LIFT,
      liftWeights: DEFAULT_WEIGHTS,
      liftInputs: Object.fromEntries(Object.entries(DEFAULT_WEIGHTS).map(([name, value]) => [name, formatWeight(value)])),
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        unit: DEFAULT_UNIT,
        lift: DEFAULT_LIFT,
        liftWeights: DEFAULT_WEIGHTS,
        liftInputs: Object.fromEntries(Object.entries(DEFAULT_WEIGHTS).map(([name, value]) => [name, formatWeight(value)])),
      };
    }

    const parsed = JSON.parse(raw);
    const unit = sanitizeUnit(parsed?.unit);
    const lift = sanitizeLift(parsed?.lift);
    const liftWeights = sanitizeWeights(parsed?.liftWeights, unit);

    return {
      unit,
      lift,
      liftWeights,
      liftInputs: {
        squat: typeof parsed?.liftInputs?.squat === "string" ? parsed.liftInputs.squat : formatWeight(liftWeights.squat),
        bench: typeof parsed?.liftInputs?.bench === "string" ? parsed.liftInputs.bench : formatWeight(liftWeights.bench),
        deadlift: typeof parsed?.liftInputs?.deadlift === "string" ? parsed.liftInputs.deadlift : formatWeight(liftWeights.deadlift),
      },
    };
  } catch {
    return {
      unit: DEFAULT_UNIT,
      lift: DEFAULT_LIFT,
      liftWeights: DEFAULT_WEIGHTS,
      liftInputs: Object.fromEntries(Object.entries(DEFAULT_WEIGHTS).map(([name, value]) => [name, formatWeight(value)])),
    };
  }
}

const PLATE_COLORS = {
  25: "#e74c3c",
  20: "#3498db",
  15: "#f1c40f",
  10: "#2ecc71",
  5: "#f0f0f0",
  2.5: "#e74c3c",
  1.25: "#888",
  45: "#e74c3c",
  35: "#f1c40f",
  "25lb": "#2ecc71",
  "10lb": "#f0f0f0",
  "5lb": "#3498db",
  "2.5lb": "#888",
};

function getPlateColor(plate, unit) {
  if (unit === "kg") return PLATE_COLORS[plate] || "#888";
  const key = `${plate}lb`;
  return PLATE_COLORS[key] || PLATE_COLORS[plate] || "#888";
}

function getPlateHeight(plate, unit) {
  const max = unit === "kg" ? 25 : 45;
  const ratio = plate / max;
  return Math.max(24, Math.round(ratio * 60));
}

function PlateStack({ plates, unit }) {
  if (!plates.length) return <span style={{ color: "var(--muted)", fontStyle: "italic", fontSize: 13 }}>Empty bar</span>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
      {plates.map((p, i) => {
        const h = getPlateHeight(p, unit);
        return (
          <div
            key={i}
            style={{
              width: 22,
              height: h,
              background: getPlateColor(p, unit),
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 800,
              color: p === 5 || p === 10 ? "#111" : "#fff",
              letterSpacing: "-0.5px",
              border: "1px solid rgba(0,0,0,0.3)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            {p}
          </div>
        );
      })}
      <div style={{ width: 60, height: 6, background: "#666", borderRadius: 3, marginLeft: 2 }} />
      {[...plates].reverse().map((p, i) => {
        const h = getPlateHeight(p, unit);
        return (
          <div
            key={`r${i}`}
            style={{
              width: 22,
              height: h,
              background: getPlateColor(p, unit),
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 800,
              color: p === 5 || p === 10 ? "#111" : "#fff",
              letterSpacing: "-0.5px",
              border: "1px solid rgba(0,0,0,0.3)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            {p}
          </div>
        );
      })}
    </div>
  );
}

export default function WarmupCalculator() {
  const initialState = loadInitialState();
  const [unit, setUnit] = useState(initialState.unit);
  const [lift, setLift] = useState(initialState.lift);
  const [liftWeights, setLiftWeights] = useState(initialState.liftWeights);
  const [liftInputs, setLiftInputs] = useState(initialState.liftInputs);

  const barWeight = unit === "kg" ? BAR_KG : BAR_LB;
  const plates = unit === "kg" ? PLATES_KG : PLATES_LB;
  const increment = unit === "kg" ? 2.5 : 5;
  const workingWeight = liftWeights[lift];

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          unit,
          lift,
          liftWeights,
          liftInputs,
        }),
      );
    } catch {
      // Ignore storage failures so the calculator remains usable.
    }
  }, [unit, lift, liftWeights, liftInputs]);

  const warmupSets = useMemo(() => {
    return WARMUP_SCHEME.map((s) => {
      const raw = s.pct === 0 ? barWeight : liftWeights[lift] * s.pct;
      const weight = s.pct === 0 ? barWeight : Math.max(barWeight, roundToNearest(raw, increment));
      const plateMath = calcPlates(weight, barWeight, plates);
      return { ...s, weight, plates: plateMath };
    }).filter((s, i, arr) => {
      if (i === 0) return true;
      return s.weight > arr[i - 1].weight;
    });
  }, [barWeight, increment, lift, liftWeights, plates]);

  const handleInput = (targetLift, val) => {
    setLift(targetLift);
    setLiftInputs((current) => ({ ...current, [targetLift]: val }));

    const num = parseFloat(val);
    if (!Number.isNaN(num) && num > 0) {
      setLiftWeights((current) => ({
        ...current,
        [targetLift]: Math.max(barWeight, num),
      }));
    }
  };

  const adjustWeight = (targetLift, direction) => {
    const nextWeight = Math.max(barWeight, liftWeights[targetLift] + increment * direction);
    setLift(targetLift);
    setLiftWeights((current) => ({ ...current, [targetLift]: nextWeight }));
    setLiftInputs((current) => ({ ...current, [targetLift]: formatWeight(nextWeight) }));
  };

  const toggleUnit = () => {
    const newUnit = unit === "kg" ? "lb" : "kg";
    const newBar = newUnit === "kg" ? BAR_KG : BAR_LB;
    const convertedWeights = Object.fromEntries(
      Object.entries(liftWeights).map(([name, value]) => {
        const converted = unit === "kg" ? value * 2.20462 : value / 2.20462;
        const rounded = Math.max(newBar, roundToNearest(converted, newUnit === "kg" ? 2.5 : 5));
        return [name, rounded];
      }),
    );

    setUnit(newUnit);
    setLiftWeights(convertedWeights);
    setLiftInputs(
      Object.fromEntries(Object.entries(convertedWeights).map(([name, value]) => [name, formatWeight(value)])),
    );
  };

  const liftEmoji = { squat: "🏋️", bench: "💪", deadlift: "🔥" };
  const liftLabels = { squat: "Squat", bench: "Bench", deadlift: "Deadlift" };

  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
        background: "#0d0d0d",
        color: "#e8e8e8",
        minHeight: "100vh",
        padding: "24px 16px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Oswald:wght@500;700&display=swap');
        :root {
          --accent: #e74c3c;
          --accent2: #f39c12;
          --bg: #0d0d0d;
          --card: #1a1a1a;
          --border: #2a2a2a;
          --muted: #666;
          --text: #e8e8e8;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 28,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 4,
              color: "var(--accent)",
              marginBottom: 4,
            }}
          >
            Warmup Calc
          </h1>
          <p style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase" }}>
            Plate Math • Progressive Loading
          </p>
        </div>

        {/* Controls */}
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {["squat", "bench", "deadlift"].map((name) => {
              const selected = lift === name;

              return (
                <div
                  key={name}
                  onClick={() => setLift(name)}
                  style={{
                    border: selected ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: selected ? "#171010" : "#151515",
                    borderRadius: 8,
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontFamily: "'Oswald', sans-serif",
                        fontSize: 16,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 1.4,
                        color: selected ? "var(--accent)" : "#fff",
                      }}
                    >
                      {liftEmoji[name]} {liftLabels[name]}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: selected ? "var(--accent2)" : "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                      }}
                    >
                      {selected ? "Showing warmups" : "Tap to view"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        adjustWeight(name, -1);
                      }}
                      style={{
                        width: 36,
                        height: 44,
                        background: "#222",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        color: "#fff",
                        fontSize: 20,
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={liftInputs[name]}
                      onClick={(event) => {
                        event.stopPropagation();
                        setLift(name);
                      }}
                      onChange={(event) => handleInput(name, event.target.value)}
                      style={{
                        flex: 1,
                        background: "#111",
                        border: selected ? "2px solid var(--accent)" : "2px solid #242424",
                        borderRadius: 6,
                        padding: "10px 12px",
                        color: "#fff",
                        fontFamily: "'Oswald', sans-serif",
                        fontSize: 24,
                        fontWeight: 700,
                        textAlign: "center",
                        outline: "none",
                        width: "100%",
                      }}
                    />
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        adjustWeight(name, 1);
                      }}
                      style={{
                        width: 36,
                        height: 44,
                        background: "#222",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        color: "#fff",
                        fontSize: 20,
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10 }}>
            <div>
              <label
                style={{
                  fontSize: 10,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Browser Memory
              </label>
              <p style={{ fontSize: 12, color: "#9a9a9a", lineHeight: 1.4 }}>
                Inputs and unit stay saved on this device.
              </p>
            </div>
            <div>
              <label
                style={{
                  fontSize: 10,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Unit
              </label>
              <button
                onClick={toggleUnit}
                style={{
                  padding: "10px 16px",
                  height: 44,
                  background: "var(--accent2)",
                  border: "none",
                  borderRadius: 6,
                  color: "#000",
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                {unit}
              </button>
            </div>
          </div>
        </div>

        {/* Warmup Sets */}
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h2
              style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 2,
                color: "var(--accent)",
              }}
            >
              {liftLabels[lift]} Warmup Sets
            </h2>
            <span style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 1 }}>
              BAR = {barWeight}
              {unit}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {warmupSets.map((set, i) => (
              <div
                key={i}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span
                      style={{
                        fontFamily: "'Oswald', sans-serif",
                        fontSize: 11,
                        fontWeight: 500,
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        minWidth: 50,
                      }}
                    >
                      {set.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Oswald', sans-serif",
                        fontSize: 26,
                        fontWeight: 700,
                        color: "#fff",
                        lineHeight: 1,
                      }}
                    >
                      {set.weight}
                      <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 2 }}>{unit}</span>
                    </span>
                  </div>
                  <div
                    style={{
                      background: i === warmupSets.length - 1 ? "var(--accent)" : "#222",
                      border: `1px solid ${i === warmupSets.length - 1 ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: 20,
                      padding: "4px 14px",
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "'Oswald', sans-serif",
                      color: i === warmupSets.length - 1 ? "#fff" : "var(--accent2)",
                    }}
                  >
                    ×{set.reps}
                  </div>
                </div>
                <PlateStack plates={set.plates} unit={unit} />
              </div>
            ))}

            {/* Working set */}
            <div
              style={{
                background: "linear-gradient(135deg, #1c0a0a 0%, #2a1010 100%)",
                border: "2px solid var(--accent)",
                borderRadius: 8,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: "'Oswald', sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--accent)",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      minWidth: 50,
                    }}
                  >
                    Work
                  </span>
                  <span
                    style={{
                      fontFamily: "'Oswald', sans-serif",
                      fontSize: 26,
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1,
                    }}
                  >
                    {workingWeight}
                    <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 2 }}>{unit}</span>
                  </span>
                </div>
                <div
                  style={{
                    background: "var(--accent)",
                    borderRadius: 20,
                    padding: "4px 14px",
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "'Oswald', sans-serif",
                    color: "#fff",
                  }}
                >
                  GO
                </div>
              </div>
              <PlateStack plates={calcPlates(workingWeight, barWeight, plates)} unit={unit} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontSize: 10,
            color: "#333",
            marginTop: 20,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Plates shown per side • Rest 1-2 min between warmups
        </p>
      </div>
    </div>
  );
}
