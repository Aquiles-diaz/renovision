/* ============ reno · vision — ROOM VIEW ============ */
import React from "react";
import { RenoNav } from "./Nav.jsx";
import { FIcon } from "./Studio3D.jsx";
import { furnitureForRoom, computeQuote, fmtAR } from "./data.jsx";

export function RoomView({ room, onBack, onPick, onHome, onMateriales, onStudio }){
  const list = furnitureForRoom(room.id);
  // stable hotspot positions per room
  const spots = [
    { x:"32%", y:"58%" }, { x:"58%", y:"46%" }, { x:"73%", y:"64%" },
    { x:"44%", y:"38%" }, { x:"22%", y:"44%" },
  ];

  return (
    <div className="room fade-in">
      <RenoNav onHome={onHome} onExplore={onBack} onMateriales={onMateriales} onStudio={onStudio} active="" />

      <div className="room__stage">
        <div className="room__img"></div>
        <div className="room__ph">
          render del ambiente — {room.name}
          <small>[ foto / render 360° reemplazable ]</small>
        </div>

        <button className="room__back" onClick={onBack}>← Volver al edificio</button>

        {list.map((f,i)=>(
          <button key={f.id} className="hotspot"
            style={{ left:spots[i%spots.length].x, top:spots[i%spots.length].y }}
            title={f.name} onClick={()=>onPick(f.id)} />
        ))}

        <div className="room__title">
          <span className="tag">{room.struct==="casa"?"Casa":"Edificio"} · ambiente</span>
          <h2>{room.name}</h2>
          <p>{list.length} muebles disponibles · tocá un punto o elegí a la derecha</p>
        </div>
      </div>

      <aside className="room__panel">
        <span className="tag">Elegí un mueble</span>
        <h3>{room.name}</h3>
        <p className="lead">{room.sub}. Seleccioná una pieza para verla en 3D, ajustar medidas y obtener su cotización.</p>

        {list.map(f=>{
          const multi = f.widths.length>1;
          const q = computeQuote({ furniture:f, line:"BASE", width:f.widths[0], material:"tribal", legs:"sin" });
          return (
            <button key={f.id} className="fcard" onClick={()=>onPick(f.id)}>
              <span className="fcard__thumb"><FIcon type={f.icon}/></span>
              <span style={{minWidth:0}}>
                <div className="fcard__name">{f.name}</div>
                <div className="fcard__meta">{multi?`${f.widths.join(" / ")} mm`:`${f.widths[0]} mm · estándar`}</div>
                <div className="fcard__price">{multi?"desde ":""}<b>{fmtAR(q.total)}</b></div>
              </span>
              <span className="fcard__go">Ver 3D →</span>
            </button>
          );
        })}
      </aside>
    </div>
  );
}
