/* ============ reno · vision — APP / ROUTER ============ */
import React, { useState, useCallback } from "react";
import { roomById, furnitureById } from "./data.jsx";
import { Home } from "./Home.jsx";
import { Materiales } from "./Materiales.jsx";
import { BuildingSection } from "./BuildingSection.jsx";
import { RoomView } from "./RoomView.jsx";
import { StudioScreen } from "./Studio3D.jsx";

/* ---- estado en la URL (link compartible) ---- */
function readUrl(){
  const p = new URLSearchParams(window.location.search);
  return {
    view: p.get("view") || "home",
    room: p.get("room") || null,
    m:    p.get("m") || null,
    w:    p.get("w") ? parseInt(p.get("w"), 10) : null,
    mel:  p.get("mel") || null,
  };
}
function writeUrl(next){
  const p = new URLSearchParams();
  if(next.view && next.view !== "home") p.set("view", next.view);
  if(next.room) p.set("room", next.room);
  if(next.m)    p.set("m", next.m);
  if(next.w)    p.set("w", String(next.w));
  if(next.mel)  p.set("mel", next.mel);
  const qs = p.toString();
  const url = qs ? `?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

/* normaliza un deep link inválido antes de inicializar el estado:
   si pide studio/room sin un ambiente válido, cae a home (sin parpadeo, sin setState en render) */
function normalizeInit(init){
  const room = init.room ? roomById(init.room) : null;
  const needsRoom = init.view === "studio" || init.view === "room";
  const view = (needsRoom && !room) ? "home" : init.view;
  return { ...init, view, room };
}

function App(){
  const init = normalizeInit(readUrl());
  const [view, setView] = useState(init.view);
  const [room, setRoom] = useState(init.room);
  const [furnId, setFurnId] = useState(init.m);
  const [zoom, setZoom] = useState(null);
  const [flash, setFlash] = useState(false);

  // cinematic: building -> room
  const enterRoom = (r, center)=>{
    setZoom(center);
    setTimeout(()=>setFlash(true), 240);
    setTimeout(()=>{
      setRoom(r); setView("room");
      writeUrl({ view:"room", room:r.id });
      setZoom(null);
      setTimeout(()=>setFlash(false), 60);
    }, 720);
  };

  const goHome      = ()=>{ setView("home"); setZoom(null); setFlash(false); writeUrl({ view:"home" }); };
  const goMateriales= ()=>{ setView("materiales"); setZoom(null); writeUrl({ view:"materiales" }); };
  const goBuilding  = ()=>{ setView("building"); setZoom(null); writeUrl({ view:"building" }); };
  const goStudioDirect = ()=>{
    const r = roomById("sala");
    setRoom(r); setFurnId("mesatv"); setView("studio");
    writeUrl({ view:"studio", room:r.id, m:"mesatv" });
  };
  const pickFurniture = (id)=>{
    setFurnId(id); setView("studio");
    writeUrl({ view:"studio", room:room?.id, m:id });
  };

  // Studio informa su config para reflejarla en la URL
  const onStudioConfig = useCallback((cfg)=>{
    writeUrl({ view:"studio", room:room?.id, m:cfg.furnId, w:cfg.width, mel:cfg.matId });
  }, [room]);

  const initialFurniture = furnId && furnitureById(furnId) ? furnId : "mesatv";

  return (
    <div className="app">
      {view==="home" && (
        <Home onExplore={goBuilding} onStudio={goStudioDirect} onHome={goHome} onMateriales={goMateriales}/>
      )}

      {view==="materiales" && (
        <Materiales onHome={goHome} onExplore={goBuilding} onMateriales={goMateriales} onStudio={goStudioDirect}/>
      )}

      {view==="building" && (
        <BuildingSection onSelect={enterRoom} onHome={goHome} onMateriales={goMateriales} onStudio={goStudioDirect} zoom={zoom}/>
      )}

      {view==="room" && room && (
        <RoomView room={room} onBack={goBuilding} onPick={pickFurniture} onHome={goHome} onMateriales={goMateriales} onStudio={goStudioDirect}/>
      )}

      {view==="studio" && room && (
        <StudioScreen room={room} initialFurnitureId={initialFurniture}
          initialWidth={init.w} initialMatId={init.mel}
          onConfig={onStudioConfig}
          onBack={()=>{ setView("room"); writeUrl({ view:"room", room:room.id }); }}
          onHome={goHome} onMateriales={goMateriales}/>
      )}

      {/* cinematic black flash overlay */}
      <div className="zoomer">
        <div className={"zoom-flash"+(flash?" on":"")}></div>
      </div>
    </div>
  );
}

export default App;
