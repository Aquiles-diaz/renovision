/* ============ reno · vision — BUILDING SECTION (corte) ============ */
import React from "react";
import { RenoNav } from "./Nav.jsx";
import { ROOMS } from "./data.jsx";

/* geometry per room: room rect + leader label + furniture hint key */
const GEO = {
  cabina:    { x:360, y:160, w:240, h:110, lx:300, ly:212, side:"left",  furn:"closet" },
  estudio:   { x:360, y:270, w:120, h:120, lx:300, ly:332, side:"left",  furn:"desk" },
  comedor:   { x:480, y:270, w:120, h:120, lx:660, ly:332, side:"right", furn:"dining" },
  sala:      { x:360, y:390, w:240, h:150, lx:660, ly:466, side:"right", furn:"sofa" },
  lavanderia:{ x:360, y:560, w:120, h:110, lx:300, ly:612, side:"left",  furn:"laundry" },
  garaje:    { x:480, y:560, w:120, h:110, lx:660, ly:612, side:"right", furn:"garage" },
  dormitorio:{ x:1120,y:360, w:300, h:130, lx:1060,ly:426, side:"left",  furn:"bed" },
  recibidor: { x:1120,y:490, w:300, h:150, lx:1060,ly:566, side:"left",  furn:"console" },
};

function FurnHint({ kind, g }){
  const cx = g.x + g.w/2, cy = g.y + g.h/2;
  switch(kind){
    case "closet": return <g className="furn">
      {[0,1,2,3].map(i=><line key={i} x1={g.x+20+i*((g.w-40)/3)} y1={g.y+14} x2={g.x+20+i*((g.w-40)/3)} y2={g.y+g.h-14}/>)}
      <line x1={g.x+16} y1={g.y+g.h*0.55} x2={g.x+g.w-16} y2={g.y+g.h*0.55}/>
    </g>;
    case "desk": return <g className="furn">
      <rect x={g.x+18} y={g.y+g.h-44} width={g.w-36} height={10}/>
      <line x1={g.x+22} y1={g.y+g.h-34} x2={g.x+22} y2={g.y+g.h-14}/>
      <line x1={g.x+g.w-22} y1={g.y+g.h-34} x2={g.x+g.w-22} y2={g.y+g.h-14}/>
      <line x1={g.x+18} y1={g.y+20} x2={g.x+g.w-18} y2={g.y+20}/>
    </g>;
    case "dining": return <g className="furn">
      <rect x={g.x+22} y={g.y+g.h-50} width={g.w-44} height={12}/>
      {[0,1,2].map(i=><rect key={i} x={g.x+26+i*22} y={g.y+g.h-30} width={10} height={16}/>)}
      <line x1={cx} y1={g.y+14} x2={cx} y2={g.y+34}/><line x1={cx-14} y1={g.y+34} x2={cx+14} y2={g.y+34}/>
    </g>;
    case "sofa": return <g className="furn">
      <rect x={g.x+24} y={g.y+g.h-58} width={g.w-90} height={36} rx="6"/>
      <rect x={g.x+24} y={g.y+g.h-72} width={26} height="14" rx="4"/>
      <rect x={g.x+g.w-54} y={g.y+g.h-50} width={30} height={24}/>
    </g>;
    case "laundry": return <g className="furn">
      <circle cx={g.x+34} cy={g.y+g.h-34} r="13"/>
      <rect x={g.x+58} y={g.y+g.h-50} width={g.w-78} height={30}/>
    </g>;
    case "garage": return <g className="furn">
      {[0,1,2].map(i=><line key={i} x1={g.x+16} y1={g.y+24+i*22} x2={g.x+g.w-50} y2={g.y+24+i*22}/>)}
      <rect x={g.x+g.w-46} y={g.y+g.h-44} width={34} height={28} rx="4"/>
    </g>;
    case "bed": return <g className="furn">
      <rect x={g.x+30} y={g.y+g.h-58} width={130} height={42} rx="5"/>
      <rect x={g.x+30} y={g.y+g.h-72} width={130} height={14} rx="4"/>
      {[0,1,2].map(i=><line key={i} x1={g.x+200+i*30} y1={g.y+16} x2={g.x+200+i*30} y2={g.y+g.h-16}/>)}
    </g>;
    case "console": return <g className="furn">
      <rect x={g.x+30} y={g.y+g.h-56} width={120} height={28}/>
      <rect x={g.x+g.w-90} y={g.y+g.h-40} width={14} height={24}/>
    </g>;
    default: return null;
  }
}

export function BuildingSection({ onSelect, onHome, onMateriales, onStudio, zoom }){
  const { useState } = React;
  const [hover, setHover] = useState(null);
  const pick = (room)=>{
    const g = GEO[room.id];
    onSelect(room, { x:(g.x+g.w/2)/1600*100, y:(g.y+g.h/2)/760*100 });
  };

  const renderRoom = (room)=>{
    const g = GEO[room.id]; if(!g) return null;
    return (
      <g key={room.id} className="room" onMouseEnter={()=>setHover(room.id)} onMouseLeave={()=>setHover(null)}
         onClick={()=>pick(room)}>
        <rect className="room-fill" x={g.x} y={g.y} width={g.w} height={g.h}/>
        <rect className="room-stroke" x={g.x} y={g.y} width={g.w} height={g.h}/>
        <FurnHint kind={g.furn} g={g}/>
      </g>
    );
  };

  const renderLabel = (room)=>{
    const g = GEO[room.id]; if(!g) return null;
    const isRight = g.side==="right";
    const roomEdgeX = isRight ? g.x+g.w : g.x;
    const gapX = isRight ? roomEdgeX+50 : roomEdgeX-50;
    const ly = g.y + g.h/2;
    const textX = g.lx;
    const anchor = isRight ? "start" : "end";
    return (
      <g key={"l"+room.id} className="lbl-grp" onClick={()=>pick(room)}
         onMouseEnter={()=>setHover(room.id)} onMouseLeave={()=>setHover(null)}>
        <line className="leader" x1={roomEdgeX} y1={ly} x2={gapX} y2={ly}/>
        <circle className="lbl-dot" cx={roomEdgeX} cy={ly} r={hover===room.id?6:4.5}/>
        <text className="lbl" x={textX} y={ly-3} textAnchor={anchor}
          style={{fill: hover===room.id ? "var(--red-soft)" : "#fff"}}>{room.name}</text>
        <text className="lbl-sub" x={textX} y={ly+13} textAnchor={anchor}>{room.sub}</text>
      </g>
    );
  };

  return (
    <div className="building fade-in">
      <RenoNav onHome={onHome} onExplore={onHome} onMateriales={onMateriales} onStudio={onStudio} active="coleccion" />
      <div className="building__head">
        <h1>Elegí un <em>ambiente</em></h1>
        <p>Tocá un cuarto del corte para entrar. Adentro vas a poder elegir cada mueble y configurarlo en 3D.</p>
      </div>

      <div className="building__stage" style={zoom?{
          transformOrigin:`${zoom.x}% ${zoom.y}%`,
          transform:"scale(3.8)", opacity:0,
          transition:"transform .72s cubic-bezier(.6,.02,.18,1), opacity .55s ease .18s"
        }:{ transition:"transform .5s ease, opacity .4s ease" }}>
        <svg className="building__svg" viewBox="0 0 1600 760" preserveAspectRatio="xMidYMid meet">
          {/* ground line */}
          <line className="ground" x1="40" y1="640" x2="1560" y2="640"/>

          {/* EDIFICIO roof (mono-pitch) */}
          <polyline className="room-stroke" points="346,186 600,118 614,122" style={{strokeWidth:2}}/>
          <line className="room-stroke" x1="346" y1="186" x2="346" y2="160" style={{strokeWidth:2}}/>

          {/* section center marker */}
          <line x1="810" y1="150" x2="810" y2="640" stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="3 8"/>

          {/* structure captions */}
          <text className="struct-cap" x="480" y="700" textAnchor="middle">Edificio</text>
          <text className="struct-cap" x="1270" y="700" textAnchor="middle">Casa</text>

          {/* casa flat roof + balcony */}
          <line className="room-stroke" x1="1112" y1="360" x2="1428" y2="360" style={{strokeWidth:2}}/>
          <rect className="room-stroke" x="1080" y="430" width="40" height="44"/>
          {[0,1,2,3].map(i=><line key={i} className="furn" x1={1086+i*9} y1="430" x2={1086+i*9} y2="448"/>)}

          {ROOMS.map(renderRoom)}
          {ROOMS.map(renderLabel)}
        </svg>
      </div>
    </div>
  );
}
