import { NebulaBackground, type NeuformCraftEffectProps } from "./shaders/neuform-isolated/NeuformCraftEffects";
import { OrbitalSphereBackground, type OrbitalSphereBackgroundProps } from "./shaders/orbital-sphere/OrbitalSphereBackground";

type OrbitalSphereCollectionProps = OrbitalSphereBackgroundProps & {
  variant: "orbital-sphere";
};

type NebulaCollectionProps = NeuformCraftEffectProps & {
  variant: "nebula";
};

export type StructureFlowCollectionProps =
  | OrbitalSphereCollectionProps
  | NebulaCollectionProps;

export function StructureFlowCollection(props: StructureFlowCollectionProps) {
  if (props.variant === "orbital-sphere") {
    const { variant: _variant, ...options } = props;
    return <OrbitalSphereBackground {...options} />;
  }

  const { variant: _variant, ...options } = props;
  return <NebulaBackground {...options} />;
}
