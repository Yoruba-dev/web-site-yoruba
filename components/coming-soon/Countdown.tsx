"use client";

import { useEffect, useState } from "react";

// Fixed future target so the countdown is deterministic on the server render
// (avoids using Date.now() in module scope). Diff is computed client-side.
const TARGET_TIMESTAMP = Date.UTC(2027, 0, 1, 0, 0, 0); // 1 Jan 2027

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function getTimeLeft(): TimeLeft {
  const diff = Math.max(0, TARGET_TIMESTAMP - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const boxStyle: React.CSSProperties = {
  minWidth: 90,
  padding: "18px 10px",
  margin: "0 8px",
  textAlign: "center",
  border: "2px solid #cda557",
  borderRadius: 6,
};

const valueStyle: React.CSSProperties = {
  display: "block",
  fontSize: 36,
  fontWeight: 700,
  lineHeight: 1.1,
  color: "#cda557",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: 1,
  marginTop: 6,
};

export default function Countdown() {
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTime(getTimeLeft());
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const units: Array<[string, number]> = [
    ["Days", time?.days ?? 0],
    ["Hours", time?.hours ?? 0],
    ["Minutes", time?.minutes ?? 0],
    ["Seconds", time?.seconds ?? 0],
  ];

  return (
    <div
      className="DateCountdown"
      style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", marginTop: 30 }}
    >
      {units.map(([label, value]) => (
        <div key={label} style={boxStyle}>
          <span style={valueStyle}>{String(value).padStart(2, "0")}</span>
          <span style={labelStyle}>{label}</span>
        </div>
      ))}
    </div>
  );
}
