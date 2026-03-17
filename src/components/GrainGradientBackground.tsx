import { GrainGradient } from '@paper-design/shaders-react';

export const GrainGradientBackground = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <GrainGradient
        speed={1}
        scale={1}
        rotation={0}
        offsetX={0}
        offsetY={0}
        softness={0.5}
        intensity={0.5}
        noise={0.25}
        shape="corners"
        colors={['#7300FF', '#EBA8FF', '#00BFFF', '#2A00FF']}
        colorBack="#111111FF"
        className="w-full h-full"
      />
    </div>
  );
};
