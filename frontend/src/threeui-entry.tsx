import { createRoot } from "react-dom/client";
import type { ReactNode } from "react";
import { StructureFlowCollection } from "./StructureFlowCollection";

function OrbitalSphereScene() {
  return (
    <div className="shader-frame">
      <StructureFlowCollection
        variant="orbital-sphere"
        speed={1.0}
        particleSize={0.015}
        particleOpacity={0.8}
        orbitOpacity={0.25}
        hue={0}
        scale={1.0}
        haloOpacity={0.2}
      />
    </div>
  );
}

function NebulaScene() {
  return (
    <div className="shader-frame">
      <StructureFlowCollection
        variant="nebula"
        hue={0}
        saturation={1.0}
        brightness={1.0}
      />
    </div>
  );
}

function mount(id: string, scene: ReactNode) {
  const mount = document.getElementById(id);
  if (!mount) return;
  createRoot(mount).render(scene);
}

mount("orbitalSphereMount", <OrbitalSphereScene />);
mount("nebulaMount", <NebulaScene />);
mount("closingNebulaMount", <NebulaScene />);
