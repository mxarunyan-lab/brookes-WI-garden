import React from 'react';
import { Sprout } from 'lucide-react';

export function WisconsinLandscape() {
  return (
    <svg className="wisconsin-landscape" viewBox="0 0 480 215" aria-hidden="true">
      <defs>
        <linearGradient id="lake" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#9cbcc0"/><stop offset="1" stopColor="#6e9ba0"/></linearGradient>
        <linearGradient id="hill" x1="0" x2="1"><stop offset="0" stopColor="#335f35"/><stop offset="1" stopColor="#71853b"/></linearGradient>
      </defs>
      <circle cx="62" cy="48" r="22" fill="#efb52b" opacity=".9"/>
      <path d="M0 115C90 84 135 111 200 94c74-20 105-8 170 5 48 10 77 8 110-3v119H0Z" fill="#284f31"/>
      <path d="M0 133c67-9 113-7 172 1 72 10 136 12 202-1 37-7 72-7 106-2v84H0Z" fill="url(#lake)"/>
      <path d="M0 145c92 13 163 14 239 3 90-13 164-13 241-3" fill="none" stroke="#dbe7df" strokeWidth="4" opacity=".75"/>
      <path d="M0 164c92 13 163 14 239 3 90-13 164-13 241-3" fill="none" stroke="#dbe7df" strokeWidth="3" opacity=".55"/>
      <path d="M0 181c92 13 163 14 239 3 90-13 164-13 241-3" fill="none" stroke="#dbe7df" strokeWidth="3" opacity=".45"/>
      <path d="M0 155c44-27 79-32 126-22l48 82H0Z" fill="url(#hill)"/>
      <path d="M324 142c46-28 103-31 156-7v80H291Z" fill="#71853b"/>
      <g transform="translate(345 72)">
        <path d="M16 29 56 0l42 29v63H16Z" fill="#a53c2d"/>
        <path d="M5 32 56-7l53 39" fill="none" stroke="#f1eadb" strokeWidth="5"/>
        <rect x="50" y="55" width="26" height="37" fill="#5c2b20"/>
        <path d="M50 55 76 92M76 55 50 92" stroke="#f1eadb" strokeWidth="3"/>
        <rect x="26" y="39" width="15" height="15" fill="#f1eadb"/>
        <path d="M26 46h15M33.5 39v15" stroke="#6d2c23" strokeWidth="2"/>
        <rect x="101" y="15" width="17" height="77" rx="4" fill="#8d9187"/>
        <path d="m100 15 10-12 9 12" fill="#d7ddd6"/>
      </g>
      {[20,44,82,111,421,446].map((x, index) => <Pine key={x} x={x} y={index % 2 ? 69 : 82} scale={index % 3 === 0 ? 1.12 : .9} />)}
      <path d="M281 179c36-22 73-23 112-4" stroke="#d5bb56" strokeWidth="4" fill="none"/>
      <path d="M283 188c36-22 73-23 112-4" stroke="#d5bb56" strokeWidth="4" fill="none"/>
      <path d="M289 198c36-22 73-23 112-4" stroke="#d5bb56" strokeWidth="4" fill="none"/>
    </svg>
  );
}

function Pine({ x, y, scale }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><rect x="-2" y="30" width="4" height="27" fill="#70462c"/><path d="M0 0-16 30h32ZM0 13-21 43h42ZM0 26-24 55h48Z" fill="#123e2b"/></g>;
}

export function SeedPacket() {
  return <svg viewBox="0 0 82 84" aria-hidden="true"><path d="m18 8 52 10-9 59-52-10Z" fill="#d9b879" stroke="#7e5727" strokeWidth="2"/><path d="m18 8 52 10-10 9-50-10Z" fill="#f0d29b"/><path d="M33 42c7-15 20-16 25-13-1 12-8 23-25 13Z" fill="#4b7b3b"/><path d="M37 43c7-3 12-8 17-13" stroke="#f2e8c7" strokeWidth="2"/><circle cx="14" cy="23" r="3" fill="#c28c34"/><circle cx="9" cy="32" r="3" fill="#c28c34"/><circle cx="18" cy="35" r="3" fill="#c28c34"/></svg>;
}

export function CheeseIcon({ className = '' }) {
  return <svg className={className} viewBox="0 0 58 46" aria-hidden="true"><path d="M5 34 18 12l33 8v20H5Z" fill="#efb52b" stroke="#d28a13" strokeWidth="2"/><path d="m18 12 33 8L38 4Z" fill="#ffd968"/><circle cx="19" cy="30" r="4" fill="#d78e18"/><circle cx="37" cy="25" r="3" fill="#d78e18"/><circle cx="45" cy="35" r="4" fill="#d78e18"/></svg>;
}

export function WisconsinStamp() {
  return <div className="wi-stamp"><span>GROWN IN</span><strong>WI</strong><span>WISCONSIN</span></div>;
}

export function cropArt(id) {
  const map = {
    lettuce: <LettuceArt />,
    onions: <OnionArt />,
    garlic: <GarlicArt />,
    spinach: <SpinachArt />,
    peppers: <PepperArt />,
    basil: <BasilArt />,
    marigold: <MarigoldArt />,
  };
  return map[id] || <Sprout size={45} color="#2f7a4e" />;
}

export function LettuceArt({ compact = false }) {
  const size = compact ? 42 : 67;
  return <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="40" cy="46" rx="31" ry="27" fill="#6fa83f"/><ellipse cx="28" cy="43" rx="17" ry="23" fill="#85ba4d" transform="rotate(-25 28 43)"/><ellipse cx="52" cy="43" rx="17" ry="23" fill="#85ba4d" transform="rotate(25 52 43)"/><ellipse cx="40" cy="35" rx="17" ry="26" fill="#a2c75b"/><path d="M40 18v43M24 34l16 27M57 35 40 61" stroke="#527e32" strokeWidth="3" fill="none"/></svg>;
}
function OnionArt() { return <svg viewBox="0 0 88 80" aria-hidden="true"><path d="M19 69 48 17M28 72 55 12M38 72 63 19M46 72 70 25" stroke="#3f8a42" strokeWidth="6" strokeLinecap="round"/><path d="M10 67c21-4 41-1 67 6" stroke="#f5f0d7" strokeWidth="8" strokeLinecap="round"/><path d="M18 65c18-4 36-1 56 5" stroke="#e9e0bf" strokeWidth="3"/></svg>; }
function GarlicArt() { return <svg viewBox="0 0 85 80" aria-hidden="true"><path d="M26 17c7 9 8 16 7 27M55 12c-7 12-7 21-5 31" stroke="#8caa72" strokeWidth="4"/><path d="M13 59c0-15 7-28 19-28s18 14 18 28c-8 9-29 9-37 0Z" fill="#eee2c7" stroke="#cbbf9e"/><path d="M35 60c0-17 8-31 20-31s18 15 18 31c-8 9-29 9-38 0Z" fill="#fbf3df" stroke="#cbbf9e"/><path d="M24 35c-4 10-4 20-2 29M42 34c4 9 5 19 4 30M57 34c-3 10-2 20 1 30" stroke="#d2c4a5" strokeWidth="2"/></svg>; }
function SpinachArt() { return <svg viewBox="0 0 84 80" aria-hidden="true"><path d="M39 69C22 63 10 45 17 27c17-1 32 10 35 27M43 68c5-27 18-42 31-44 5 19-7 39-31 44Z" fill="#3f8d49"/><path d="M40 67C33 42 25 31 18 27M44 65c9-22 18-33 29-40" stroke="#b9d88c" strokeWidth="3"/><path d="M39 67c-11-14-13-30-3-45 16 8 22 27 3 45Z" fill="#69a953"/><path d="M39 65V24" stroke="#cbe1a8" strokeWidth="3"/></svg>; }
export function PepperArt({ compact = false }) { const size = compact ? 42 : 65; return <svg width={size} height={size} viewBox="0 0 76 82" aria-hidden="true"><path d="M38 18c-2-11 4-15 14-15" fill="none" stroke="#477b3f" strokeWidth="6" strokeLinecap="round"/><path d="M37 17c-18-7-29 10-25 34 3 20 15 27 25 21 10 6 22-1 25-21 4-24-7-41-25-34Z" fill="#c94232" stroke="#9f2f28" strokeWidth="2"/><path d="M37 18c-8 15-9 35 0 54M27 20c-6 14-5 35 1 49M48 20c7 14 6 35 0 49" fill="none" stroke="#e26750" strokeWidth="3"/></svg>; }
function BasilArt() { return <svg viewBox="0 0 80 80" aria-hidden="true"><path d="M41 72V18" stroke="#356b3d" strokeWidth="4"/><ellipse cx="28" cy="31" rx="14" ry="21" fill="#5e9a49" transform="rotate(-35 28 31)"/><ellipse cx="53" cy="44" rx="14" ry="21" fill="#4e8b43" transform="rotate(35 53 44)"/><ellipse cx="28" cy="57" rx="13" ry="18" fill="#79a954" transform="rotate(-45 28 57)"/></svg>; }
function MarigoldArt() { return <svg viewBox="0 0 80 80" aria-hidden="true"><path d="M40 73V39" stroke="#4b7b3f" strokeWidth="4"/><path d="M40 54c-10-11-20-10-24 0 7 7 15 8 24 0Zm0 8c10-10 20-8 23 2-8 6-16 6-23-2Z" fill="#5a9147"/><g fill="#efaa1e"><circle cx="40" cy="24" r="14"/><circle cx="27" cy="23" r="9"/><circle cx="53" cy="23" r="9"/><circle cx="34" cy="13" r="9"/><circle cx="47" cy="13" r="9"/><circle cx="34" cy="34" r="9"/><circle cx="48" cy="34" r="9"/></g><circle cx="40" cy="24" r="8" fill="#d37d17"/></svg>; }

export function gardenArt(type) {
  if (type === 'greenhouse') return <svg viewBox="0 0 150 120" aria-hidden="true"><rect width="150" height="120" fill="#91aa75"/><path d="M18 96V46l55-32 58 32v50Z" fill="#cad8bd" stroke="#254d35" strokeWidth="5"/><path d="M73 14v82M18 46h113M46 30v66M101 30v66" stroke="#4b6b55" strokeWidth="3"/><path d="m18 46 55-32 58 32M31 96c12-26 23-33 35-13 12-29 29-31 40 13" fill="none" stroke="#3b7a42" strokeWidth="8"/></svg>;
  if (type === 'hydro') return <svg viewBox="0 0 150 120" aria-hidden="true"><rect width="150" height="120" fill="#d6e4da"/><path d="M12 91h126M19 70h112M27 50h95" stroke="#f8fbf7" strokeWidth="12"/><g fill="#4d8d48">{[[30,45],[57,45],[87,45],[113,45],[25,66],[52,66],[81,66],[109,66],[35,86],[65,86],[95,86],[121,86]].map(([x,y])=><circle key={`${x}-${y}`} cx={x} cy={y} r="9"/>)}</g><path d="M13 101h124" stroke="#728d82" strokeWidth="5"/></svg>;
  return <svg viewBox="0 0 150 120" aria-hidden="true"><rect width="150" height="120" fill="#bac98d"/><path d="m15 80 116-28 6 45-115 15Z" fill="#7b4c2f"/><path d="m15 73 116-28v14L15 88Z" fill="#ad7040"/><path d="m20 71 108-25-3 10L23 80Z" fill="#4d3b2b"/><g fill="#4f8b3c">{[[38,62],[58,57],[78,52],[97,48],[46,76],[68,70],[89,65],[111,60]].map(([x,y])=><circle key={`${x}-${y}`} cx={x} cy={y} r="12"/>)}</g></svg>;
}
