import { useEffect, useMemo, useState } from "react";

const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
const PLATES_LB = [45, 35, 25, 10, 5, 2.5];
const BAR_KG = 20;
const BAR_LB = 45;
const STORAGE_KEY = "warmup-calc-session";

const WARMUP_SCHEME = [
  { pct: 0, reps: 10, label: "Bar Only" },
  { pct: 0.4, reps: 5, label: "40%" },
  { pct: 0.6, reps: 3, label: "60%" },
  { pct: 0.75, reps: 2, label: "75%" },
  { pct: 0.85, reps: 1, label: "85%" },
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

function clampToBar(value, barWeight) {
  return Math.max(barWeight, value);
}

function parseWorkingWeight(value, barWeight) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed <= 0) return barWeight;
  return clampToBar(parsed, barWeight);
}

function convertWeightString(value, fromUnit, newBarWeight) {
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed <= 0) return String(newBarWeight);
  const converted = fromUnit === "kg" ? Math.round(parsed * 2.205) : Math.round(parsed / 2.205);
  return String(clampToBar(converted, newBarWeight));
}

function loadStoredSession() {
  if (typeof window === "undefined") {
    return {
      unit: "kg",
      lift: "squat",
      liftWeights: { squat: "100", bench: "100", deadlift: "100" },
    };
  }

  const fallback = {
    unit: "kg",
    lift: "squat",
    liftWeights: { squat: "100", bench: "100", deadlift: "100" },
  };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    return {
      unit: parsed.unit === "lb" ? "lb" : "kg",
      lift: ["squat", "bench", "deadlift"].includes(parsed.lift) ? parsed.lift : "squat",
      liftWeights: {
        squat: String(parsed.liftWeights?.squat ?? fallback.liftWeights.squat),
        bench: String(parsed.liftWeights?.bench ?? fallback.liftWeights.bench),
        deadlift: String(parsed.liftWeights?.deadlift ?? fallback.liftWeights.deadlift),
      },
    };
  } catch {
    return fallback;
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
  const [{ unit, lift, liftWeights }, setSession] = useState(loadStoredSession);

  const barWeight = unit === "kg" ? BAR_KG : BAR_LB;
  const plates = unit === "kg" ? PLATES_KG : PLATES_LB;
  const increment = unit === "kg" ? 2.5 : 5;
  const workingWeight = parseWorkingWeight(liftWeights[lift], barWeight);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        unit,
        lift,
        liftWeights,
      }),
    );
  }, [unit, lift, liftWeights]);

  const warmupSets = useMemo(() => {
    return WARMUP_SCHEME.map((s) => {
      const raw = s.pct === 0 ? barWeight : workingWeight * s.pct;
      const weight = s.pct === 0 ? barWeight : Math.max(barWeight, roundToNearest(raw, increment));
      const plateMath = calcPlates(weight, barWeight, plates);
      return { ...s, weight, plates: plateMath };
    }).filter((s, i, arr) => {
      if (i === 0) return true;
      return s.weight > arr[i - 1].weight;
    });
  }, [workingWeight, unit, barWeight, plates, increment]);

  const handleInput = (liftName, value) => {
    setSession((current) => ({
      ...current,
      liftWeights: {
        ...current.liftWeights,
        [liftName]: value,
      },
    }));
  };

  const adjustSelectedLift = (delta) => {
    const nextWeight = clampToBar(workingWeight + delta, barWeight);
    handleInput(lift, String(nextWeight));
  };

  const toggleUnit = () => {
    const newUnit = unit === "kg" ? "lb" : "kg";
    const newBar = newUnit === "kg" ? BAR_KG : BAR_LB;
    setSession((current) => ({
      ...current,
      unit: newUnit,
      liftWeights: Object.fromEntries(
        Object.entries(current.liftWeights).map(([liftName, value]) => [
          liftName,
          convertWeightString(value, current.unit, newBar),
        ]),
      ),
    }));
  };

  const liftEmoji = { squat: "🏋️", bench: "💪", deadlift: "🔥" };

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
          {/* Lift selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["squat", "bench", "deadlift"].map((l) => (
              <button
                key={l}
                onClick={() => setSession((current) => ({ ...current, lift: l }))}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: lift === l ? "var(--accent)" : "#222",
                  color: lift === l ? "#fff" : "var(--muted)",
                  border: lift === l ? "1px solid var(--accent)" : "1px solid var(--border)",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  transition: "all 0.15s",
                }}
              >
                {liftEmoji[l]} {l}
              </button>
            ))}
          </div>

          {/* Weight inputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))",
                gap: 10,
              }}
            >
              {["squat", "bench", "deadlift"].map((liftName) => {
                const isActive = lift === liftName;

                return (
                  <label
                    key={liftName}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      padding: 10,
                      background: isActive ? "#21110f" : "#151515",
                      border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: isActive ? "var(--accent2)" : "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                      }}
                    >
                      {liftName}
                    </span>
                    <input
                      type="number"
                      value={liftWeights[liftName]}
                      onChange={(e) => handleInput(liftName, e.target.value)}
                      onFocus={() => setSession((current) => ({ ...current, lift: liftName }))}
                      style={{
                        background: "#111",
                        border: `2px solid ${isActive ? "var(--accent)" : "#222"}`,
                        borderRadius: 6,
                        padding: "10px 12px",
                        color: "#fff",
                        fontFamily: "'Oswald', sans-serif",
                        fontSize: 26,
                        fontWeight: 700,
                        textAlign: "center",
                        outline: "none",
                        width: "100%",
                      }}
                    />
                  </label>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
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
                  Adjust {lift}
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => adjustSelectedLift(-increment)}
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
                  <div
                    style={{
                      flex: 1,
                      height: 44,
                      background: "#111",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--muted)",
                      fontSize: 12,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    Saved in this browser
                  </div>
                  <button
                    onClick={() => adjustSelectedLift(increment)}
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
              Warmup Sets
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
