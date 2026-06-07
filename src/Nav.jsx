/* ============ reno · vision — NAV ============ */
import React from "react";

export function RenoNav({ onHome, onExplore, onStudio, onMateriales, active }){
  const go = (fn)=>fn && fn();
  return (
    <nav className="nav">
      <div className="nav__logo" onClick={()=>go(onHome)}>reno</div>
      <div className="nav__links">
        <button className={"nav__link"+(active==="coleccion"?" is-active":"")} onClick={()=>go(onExplore)}>Colección</button>
        <button className={"nav__link"+(active==="materiales"?" is-active":"")} onClick={()=>go(onMateriales||onExplore)}>Materiales</button>
        <button className={"nav__cta"} onClick={()=>go(onStudio||onExplore)}>Studio</button>
      </div>
    </nav>
  );
}
