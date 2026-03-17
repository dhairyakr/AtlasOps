import React, { useEffect, useRef, useState } from 'react';

interface VoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ 
  isListening, 
  isSpeaking, 
  isProcessing 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const wavePointsRef = useRef<any[]>([]);
  const orbitingParticlesRef = useRef<any[]>([]);
  const energyParticlesRef = useRef<any[]>([]);

  // Neo-tech color palette
  const colors = {
    neoTechAuroraPink: 'rgba(255, 105, 180, ',
    neoTechNeonViolet: 'rgba(138, 43, 226, ',
    neoTechQuantumCyan: 'rgba(0, 206, 209, ',
    neoTechPlasmaBlue: 'rgba(0, 191, 255, ',
    neoTechVaporLilac: 'rgba(176, 168, 185, ',
    neoTechCrystalWhite: 'rgba(248, 248, 255, '
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = 300;
    const height = canvas.height = 300;
    const centerX = width / 2;
    const centerY = height / 2;

    // Initialize wave points for speaking animation
    const initializeWavePoints = () => {
      wavePointsRef.current = [];
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2;
        wavePointsRef.current.push({
          angle,
          baseRadius: 80 + Math.random() * 20,
          amplitude: Math.random() * 30 + 10,
          frequency: Math.random() * 0.02 + 0.01,
          phase: Math.random() * Math.PI * 2
        });
      }
    };

    // Initialize orbiting particles for speaking state
    const initializeOrbitingParticles = () => {
      orbitingParticlesRef.current = [];
      for (let i = 0; i < 12; i++) {
        orbitingParticlesRef.current.push({
          angle: (i / 12) * Math.PI * 2,
          radius: 60 + Math.random() * 40,
          speed: 0.01 + Math.random() * 0.02,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          pulsePhase: Math.random() * Math.PI * 2,
          colorIndex: Math.floor(Math.random() * 3) // 0: pink, 1: violet, 2: cyan
        });
      }
    };

    // Initialize energy particles for processing state
    const initializeEnergyParticles = () => {
      energyParticlesRef.current = [];
      for (let i = 0; i < 24; i++) {
        energyParticlesRef.current.push({
          angle: (i / 24) * Math.PI * 2,
          distance: 0,
          speed: 0.6 + Math.random() * 0.8,
          size: Math.random() * 3 + 1.5,
          opacity: 0.8,
          life: 1.0,
          colorIndex: Math.floor(Math.random() * 4),
          trail: [],
          curve: Math.random() * 0.02 - 0.01
        });
      }
    };

    initializeWavePoints();
    initializeOrbitingParticles();
    initializeEnergyParticles();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const time = Date.now() * 0.001;

      // Set global composite operation for enhanced glow effects
      ctx.globalCompositeOperation = 'screen';

      if (isListening) {
        drawListeningState(ctx, centerX, centerY, time);
      } else if (isSpeaking) {
        drawSpeakingState(ctx, centerX, centerY, time);
      } else if (isProcessing) {
        drawProcessingState(ctx, centerX, centerY, time);
      } else {
        drawInactiveState(ctx, centerX, centerY, time);
      }

      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';
      
      animationRef.current = requestAnimationFrame(draw);
    };

    const drawInactiveState = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
      // Subtle pulsing central orb
      const pulseIntensity = Math.sin(time * 2) * 0.3 + 0.7;
      
      // Outer glow
      const outerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60);
      outerGradient.addColorStop(0, `${colors.neoTechNeonViolet}${0.1 * pulseIntensity})`);
      outerGradient.addColorStop(0.5, `${colors.neoTechNeonViolet}${0.05 * pulseIntensity})`);
      outerGradient.addColorStop(1, `${colors.neoTechNeonViolet}0)`);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
      ctx.fillStyle = outerGradient;
      ctx.fill();

      // Central orb
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 25);
      coreGradient.addColorStop(0, `${colors.neoTechCrystalWhite}${0.8 * pulseIntensity})`);
      coreGradient.addColorStop(0.3, `${colors.neoTechNeonViolet}${0.6 * pulseIntensity})`);
      coreGradient.addColorStop(1, `${colors.neoTechNeonViolet}${0.2 * pulseIntensity})`);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 25 * pulseIntensity, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      // Subtle ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
      ctx.strokeStyle = `${colors.neoTechNeonViolet}${0.3 * pulseIntensity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const drawListeningState = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
      // Enhanced Central Listening Core with Multi-Layered Pulsing
      const coreIntensity = Math.sin(time * 2.5) * 0.4 + 0.8;
      const breathingRadius = 35 + Math.sin(time * 1.8) * 8;
      
      // Multi-layered central core with liquid breathing effect
      for (let layer = 0; layer < 4; layer++) {
        const layerRadius = breathingRadius * (0.3 + layer * 0.2);
        const layerIntensity = coreIntensity * (1 - layer * 0.2);
        const layerPulse = Math.sin(time * 3 + layer * 0.5) * 0.3 + 0.7;
        
        const layerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, layerRadius);
        
        if (layer === 0) {
          layerGradient.addColorStop(0, `${colors.neoTechCrystalWhite}${layerIntensity * layerPulse})`);
          layerGradient.addColorStop(0.4, `${colors.neoTechQuantumCyan}${layerIntensity * layerPulse * 0.9})`);
          layerGradient.addColorStop(1, `${colors.neoTechQuantumCyan}${layerIntensity * layerPulse * 0.4})`);
        } else if (layer === 1) {
          layerGradient.addColorStop(0, `${colors.neoTechQuantumCyan}${layerIntensity * layerPulse * 0.8})`);
          layerGradient.addColorStop(0.5, `${colors.neoTechPlasmaBlue}${layerIntensity * layerPulse * 0.7})`);
          layerGradient.addColorStop(1, `${colors.neoTechPlasmaBlue}${layerIntensity * layerPulse * 0.3})`);
        } else if (layer === 2) {
          layerGradient.addColorStop(0, `${colors.neoTechPlasmaBlue}${layerIntensity * layerPulse * 0.6})`);
          layerGradient.addColorStop(0.6, `${colors.neoTechNeonViolet}${layerIntensity * layerPulse * 0.5})`);
          layerGradient.addColorStop(1, `${colors.neoTechNeonViolet}${layerIntensity * layerPulse * 0.2})`);
        } else {
          layerGradient.addColorStop(0, `${colors.neoTechNeonViolet}${layerIntensity * layerPulse * 0.5})`);
          layerGradient.addColorStop(0.7, `${colors.neoTechVaporLilac}${layerIntensity * layerPulse * 0.4})`);
          layerGradient.addColorStop(1, `${colors.neoTechVaporLilac}${layerIntensity * layerPulse * 0.1})`);
        }
        
        ctx.shadowBlur = 15 + layer * 3;
        ctx.shadowColor = layer === 0 ? `${colors.neoTechQuantumCyan}${layerIntensity * 0.8})` : 
                         layer === 1 ? `${colors.neoTechPlasmaBlue}${layerIntensity * 0.6})` :
                         layer === 2 ? `${colors.neoTechNeonViolet}${layerIntensity * 0.5})` :
                         `${colors.neoTechVaporLilac}${layerIntensity * 0.4})`;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, layerRadius, 0, Math.PI * 2);
        ctx.fillStyle = layerGradient;
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;

      // Enhanced Neural Wave Rings - Fluid and Organic
      for (let i = 0; i < 8; i++) {
        const ringTime = time * 1.5 + i * 0.4;
        const baseRadius = 50 + i * 18;
        const ringOpacity = (Math.sin(ringTime * 1.8) * 0.4 + 0.7) * (1 - i * 0.12) * coreIntensity;
        const wobbleIntensity = 6 + i * 1.5;
        const lineWidth = 2.5 - i * 0.2;
        
        // Create fluid, organic neural wave with complex distortion
        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 2; angle += 0.04) {
          const primaryWobble = Math.sin(angle * 4 + ringTime * 2) * wobbleIntensity;
          const secondaryWobble = Math.sin(angle * 8 + ringTime * 3) * (wobbleIntensity * 0.3);
          const tertiaryWobble = Math.sin(angle * 12 + ringTime * 1.5) * (wobbleIntensity * 0.15);
          const totalDistortion = primaryWobble + secondaryWobble + tertiaryWobble;
          
          const radius = baseRadius + totalDistortion + Math.sin(ringTime) * 12;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          if (angle === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        
        // Multi-color gradient for neural waves
        const neuralGradient = ctx.createLinearGradient(
          centerX - baseRadius, centerY - baseRadius,
          centerX + baseRadius, centerY + baseRadius
        );
        
        const colorPhase = (time * 0.8 + i * 0.3) % 4;
        if (colorPhase < 1) {
          neuralGradient.addColorStop(0, `${colors.neoTechQuantumCyan}${ringOpacity})`);
          neuralGradient.addColorStop(0.5, `${colors.neoTechPlasmaBlue}${ringOpacity * 0.8})`);
          neuralGradient.addColorStop(1, `${colors.neoTechNeonViolet}${ringOpacity * 0.6})`);
        } else if (colorPhase < 2) {
          neuralGradient.addColorStop(0, `${colors.neoTechPlasmaBlue}${ringOpacity})`);
          neuralGradient.addColorStop(0.5, `${colors.neoTechNeonViolet}${ringOpacity * 0.8})`);
          neuralGradient.addColorStop(1, `${colors.neoTechAuroraPink}${ringOpacity * 0.6})`);
        } else if (colorPhase < 3) {
          neuralGradient.addColorStop(0, `${colors.neoTechNeonViolet}${ringOpacity})`);
          neuralGradient.addColorStop(0.5, `${colors.neoTechAuroraPink}${ringOpacity * 0.8})`);
          neuralGradient.addColorStop(1, `${colors.neoTechQuantumCyan}${ringOpacity * 0.6})`);
        } else {
          neuralGradient.addColorStop(0, `${colors.neoTechAuroraPink}${ringOpacity})`);
          neuralGradient.addColorStop(0.5, `${colors.neoTechQuantumCyan}${ringOpacity * 0.8})`);
          neuralGradient.addColorStop(1, `${colors.neoTechPlasmaBlue}${ringOpacity * 0.6})`);
        }
        
        ctx.shadowBlur = 8 + i;
        ctx.shadowColor = `${colors.neoTechQuantumCyan}${ringOpacity * 0.6})`;
        
        ctx.strokeStyle = neuralGradient;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
      
      ctx.shadowBlur = 0;

      // Enhanced Inward Data Streams - Numerous flowing particles
      const streamCount = 24;
      const streamRadius = 120;
      
      for (let i = 0; i < streamCount; i++) {
        const streamAngle = (i / streamCount) * Math.PI * 2 + time * 0.5;
        const streamProgress = (time * 2 + i * 0.1) % 3; // 0 to 3 cycle
        
        // Calculate stream position flowing inward
        const startDistance = streamRadius + Math.sin(time * 2 + i) * 15;
        const endDistance = breathingRadius + 10;
        const currentDistance = startDistance - (startDistance - endDistance) * (streamProgress / 3);
        
        // Add curve to the stream path
        const curvature = Math.sin(streamProgress * Math.PI) * 20;
        const curvedAngle = streamAngle + (curvature / currentDistance) * 0.5;
        
        const x = centerX + Math.cos(curvedAngle) * currentDistance;
        const y = centerY + Math.sin(curvedAngle) * currentDistance;
        
        // Particle opacity based on progress (fade in and out)
        let particleOpacity;
        if (streamProgress < 0.3) {
          particleOpacity = streamProgress / 0.3; // Fade in
        } else if (streamProgress > 2.7) {
          particleOpacity = (3 - streamProgress) / 0.3; // Fade out
        } else {
          particleOpacity = 1; // Full opacity
        }
        
        particleOpacity *= 0.8 * coreIntensity;
        
        // Particle size varies with progress
        const particleSize = 2 + Math.sin(streamProgress * Math.PI) * 2;
        
        // Color cycling for variety
        const colorIndex = i % 4;
        let streamColor;
        switch (colorIndex) {
          case 0:
            streamColor = colors.neoTechQuantumCyan;
            break;
          case 1:
            streamColor = colors.neoTechPlasmaBlue;
            break;
          case 2:
            streamColor = colors.neoTechNeonViolet;
            break;
          case 3:
            streamColor = colors.neoTechAuroraPink;
            break;
          default:
            streamColor = colors.neoTechCrystalWhite;
        }
        
        // Create particle with enhanced glow and trail effect
        const particleGradient = ctx.createRadialGradient(x, y, 0, x, y, particleSize * 6);
        particleGradient.addColorStop(0, `${streamColor}${particleOpacity})`);
        particleGradient.addColorStop(0.3, `${streamColor}${particleOpacity * 0.8})`);
        particleGradient.addColorStop(0.6, `${streamColor}${particleOpacity * 0.4})`);
        particleGradient.addColorStop(1, `${streamColor}0)`);
        
        ctx.shadowBlur = 6;
        ctx.shadowColor = `${streamColor}${particleOpacity * 0.8})`;
        
        ctx.beginPath();
        ctx.arc(x, y, particleSize, 0, Math.PI * 2);
        ctx.fillStyle = particleGradient;
        ctx.fill();
        
        // Add subtle trail effect for some particles
        if (i % 3 === 0 && streamProgress > 0.5) {
          const trailDistance = currentDistance + 15;
          const trailX = centerX + Math.cos(curvedAngle) * trailDistance;
          const trailY = centerY + Math.sin(curvedAngle) * trailDistance;
          
          const trailGradient = ctx.createLinearGradient(trailX, trailY, x, y);
          trailGradient.addColorStop(0, `${streamColor}0)`);
          trailGradient.addColorStop(1, `${streamColor}${particleOpacity * 0.3})`);
          
          ctx.beginPath();
          ctx.moveTo(trailX, trailY);
          ctx.lineTo(x, y);
          ctx.strokeStyle = trailGradient;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      
      ctx.shadowBlur = 0;
      
      // Subtle Outer Aura - Encompassing ethereal glow
      const auraIntensity = Math.sin(time * 1.2) * 0.3 + 0.7;
      const auraRadius = 140 + Math.sin(time * 0.8) * 20;
      
      const auraGradient = ctx.createRadialGradient(centerX, centerY, breathingRadius * 2, centerX, centerY, auraRadius);
      auraGradient.addColorStop(0, `${colors.neoTechQuantumCyan}${coreIntensity * auraIntensity * 0.08})`);
      auraGradient.addColorStop(0.3, `${colors.neoTechPlasmaBlue}${coreIntensity * auraIntensity * 0.06})`);
      auraGradient.addColorStop(0.6, `${colors.neoTechNeonViolet}${coreIntensity * auraIntensity * 0.04})`);
      auraGradient.addColorStop(0.8, `${colors.neoTechAuroraPink}${coreIntensity * auraIntensity * 0.02})`);
      auraGradient.addColorStop(1, `${colors.neoTechVaporLilac}0)`);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
      ctx.fillStyle = auraGradient;
      ctx.fill();
      
      // Enhanced Global Composite Operation for final ethereal effect
      ctx.globalCompositeOperation = 'lighter';
      
      // Pulsing energy waves from center
      for (let wave = 0; wave < 3; wave++) {
        const waveTime = time * 1.8 + wave * 1.5;
        const waveRadius = 30 + (waveTime % 4) * 25;
        const waveOpacity = Math.max(0, 1 - (waveTime % 4) / 4) * 0.4;
        
        const waveGradient = ctx.createRadialGradient(centerX, centerY, waveRadius - 8, centerX, centerY, waveRadius + 8);
        waveGradient.addColorStop(0, `${colors.neoTechCrystalWhite}0)`);
        waveGradient.addColorStop(0.5, `${colors.neoTechQuantumCyan}${waveOpacity})`);
        waveGradient.addColorStop(1, `${colors.neoTechQuantumCyan}0)`);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = waveGradient;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      ctx.globalCompositeOperation = 'source-over';
    };

    const drawSpeakingState = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
      // Enhanced Central Orb (The Voice Core) with multi-layered liquid effect
      const coreIntensity = Math.sin(time * 3) * 0.2 + 0.8;
      const liquidDistortion = Math.sin(time * 2) * 3;
      
      // Innermost core - bright white center
      const innerCoreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 15);
      innerCoreGradient.addColorStop(0, `${colors.neoTechCrystalWhite}${coreIntensity})`);
      innerCoreGradient.addColorStop(0.4, `${colors.neoTechAuroraPink}${coreIntensity * 0.9})`);
      innerCoreGradient.addColorStop(1, `${colors.neoTechAuroraPink}${coreIntensity * 0.6})`);
      
      ctx.shadowBlur = 20;
      ctx.shadowColor = `${colors.neoTechAuroraPink}0.8)`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 15 + liquidDistortion, 0, Math.PI * 2);
      ctx.fillStyle = innerCoreGradient;
      ctx.fill();
      
      // Middle layer - neon violet
      const middleCoreGradient = ctx.createRadialGradient(centerX, centerY, 15, centerX, centerY, 30);
      middleCoreGradient.addColorStop(0, `${colors.neoTechNeonViolet}${coreIntensity * 0.8})`);
      middleCoreGradient.addColorStop(0.6, `${colors.neoTechNeonViolet}${coreIntensity * 0.5})`);
      middleCoreGradient.addColorStop(1, `${colors.neoTechNeonViolet}${coreIntensity * 0.2})`);
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = `${colors.neoTechNeonViolet}0.6)`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30 + liquidDistortion * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = middleCoreGradient;
      ctx.fill();
      
      // Outer layer - quantum cyan
      const outerCoreGradient = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, 45);
      outerCoreGradient.addColorStop(0, `${colors.neoTechQuantumCyan}${coreIntensity * 0.6})`);
      outerCoreGradient.addColorStop(0.7, `${colors.neoTechQuantumCyan}${coreIntensity * 0.3})`);
      outerCoreGradient.addColorStop(1, `${colors.neoTechQuantumCyan}0)`);
      
      ctx.shadowBlur = 10;
      ctx.shadowColor = `${colors.neoTechQuantumCyan}0.4)`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 45 + liquidDistortion * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = outerCoreGradient;
      ctx.fill();
      
      // Reset shadow
      ctx.shadowBlur = 0;

      // Fluid Ripple Rings (Outward Energy Waves)
      for (let i = 0; i < 4; i++) {
        const waveRadius = 60 + i * 25 + Math.sin(time * 2.5 - i * 0.8) * 15;
        const waveOpacity = (Math.sin(time * 1.8 - i * 0.6) * 0.4 + 0.6) * (1 - i * 0.25);
        const waveWidth = 3 - i * 0.5;
        
        // Create gradient for each ring
        const ringGradient = ctx.createLinearGradient(
          centerX - waveRadius, centerY - waveRadius,
          centerX + waveRadius, centerY + waveRadius
        );
        ringGradient.addColorStop(0, `${colors.neoTechAuroraPink}${waveOpacity})`);
        ringGradient.addColorStop(0.5, `${colors.neoTechNeonViolet}${waveOpacity * 0.8})`);
        ringGradient.addColorStop(1, `${colors.neoTechQuantumCyan}${waveOpacity * 0.6})`);
        
        ctx.shadowBlur = 8;
        ctx.shadowColor = `${colors.neoTechAuroraPink}${waveOpacity * 0.5})`;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = ringGradient;
        ctx.lineWidth = waveWidth;
        ctx.stroke();
      }
      
      ctx.shadowBlur = 0;

      // Circular Waveform Ring
      const waveformRadius = 70;
      const waveformIntensity = Math.sin(time * 4) * 0.3 + 0.7;
      
      ctx.beginPath();
      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        const waveHeight = Math.sin(angle * 8 + time * 6) * 10 * waveformIntensity;
        const radius = waveformRadius + waveHeight;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (angle === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      
      ctx.shadowBlur = 12;
      ctx.shadowColor = `${colors.neoTechQuantumCyan}0.8)`;
      ctx.strokeStyle = `${colors.neoTechQuantumCyan}${waveformIntensity})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.shadowBlur = 0;

      // Orbiting Luminous Particles
      orbitingParticlesRef.current.forEach((particle, index) => {
        // Update particle position
        particle.angle += particle.speed * (isSpeaking ? 2 : 1); // Accelerate when speaking
        
        // Calculate position with slight orbital variation
        const orbitVariation = Math.sin(time * 2 + particle.pulsePhase) * 10;
        const x = centerX + Math.cos(particle.angle) * (particle.radius + orbitVariation);
        const y = centerY + Math.sin(particle.angle) * (particle.radius + orbitVariation);
        
        // Particle pulsing effect
        const pulseIntensity = Math.sin(time * 3 + particle.pulsePhase) * 0.4 + 0.6;
        
        // Choose color based on particle type
        let particleColor;
        switch (particle.colorIndex) {
          case 0:
            particleColor = colors.neoTechAuroraPink;
            break;
          case 1:
            particleColor = colors.neoTechNeonViolet;
            break;
          case 2:
            particleColor = colors.neoTechQuantumCyan;
            break;
          default:
            particleColor = colors.neoTechVaporLilac;
        }
        
        // Create particle with soft glow
        const particleGradient = ctx.createRadialGradient(x, y, 0, x, y, particle.size * 4);
        particleGradient.addColorStop(0, `${particleColor}${particle.opacity * pulseIntensity})`);
        particleGradient.addColorStop(0.5, `${particleColor}${particle.opacity * pulseIntensity * 0.6})`);
        particleGradient.addColorStop(1, `${particleColor}0)`);
        
        ctx.beginPath();
        ctx.arc(x, y, particle.size * pulseIntensity, 0, Math.PI * 2);
        ctx.fillStyle = particleGradient;
        ctx.fill();
        
        // Create trailing light effect for some particles
        if (index % 3 === 0) {
          const trailLength = 15;
          const prevX = centerX + Math.cos(particle.angle - 0.3) * (particle.radius + orbitVariation);
          const prevY = centerY + Math.sin(particle.angle - 0.3) * (particle.radius + orbitVariation);
          
          const trailGradient = ctx.createLinearGradient(prevX, prevY, x, y);
          trailGradient.addColorStop(0, `${particleColor}0)`);
          trailGradient.addColorStop(1, `${particleColor}${particle.opacity * 0.3})`);
          
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, y);
          ctx.strokeStyle = trailGradient;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Enhanced Global Composite Operation for final glow
      ctx.globalCompositeOperation = 'lighter';
      
      // Final ethereal glow around the entire speaking core
      const finalGlowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100);
      finalGlowGradient.addColorStop(0, `${colors.neoTechCrystalWhite}0.1)`);
      finalGlowGradient.addColorStop(0.3, `${colors.neoTechAuroraPink}0.05)`);
      finalGlowGradient.addColorStop(0.6, `${colors.neoTechNeonViolet}0.03)`);
      finalGlowGradient.addColorStop(1, `${colors.neoTechQuantumCyan}0)`);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
      ctx.fillStyle = finalGlowGradient;
      ctx.fill();
      
      ctx.globalCompositeOperation = 'source-over';
    };

    const drawProcessingState = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, time: number) => {
      // Enhanced Central Plasma Vortex Core
      const coreIntensity = Math.sin(time * 3) * 0.4 + 0.8;
      const breathingRadius = 30 + Math.sin(time * 2.2) * 12;
      const vortexRotation = time * 0.8;
      
      // Innermost plasma core with swirling effect
      for (let layer = 0; layer < 5; layer++) {
        const layerRadius = breathingRadius * (0.2 + layer * 0.15);
        const layerIntensity = coreIntensity * (1 - layer * 0.15);
        const layerRotation = vortexRotation * (1 + layer * 0.3);
        
        const swirlingGradient = ctx.createRadialGradient(
          centerX + Math.cos(layerRotation) * 2, 
          centerY + Math.sin(layerRotation) * 2, 
          0,
          centerX, centerY, layerRadius
        );
        
        if (layer === 0) {
          swirlingGradient.addColorStop(0, `${colors.neoTechCrystalWhite}${layerIntensity})`);
          swirlingGradient.addColorStop(0.3, `${colors.neoTechNeonViolet}${layerIntensity * 0.9})`);
          swirlingGradient.addColorStop(1, `${colors.neoTechNeonViolet}${layerIntensity * 0.3})`);
        } else if (layer === 1) {
          swirlingGradient.addColorStop(0, `${colors.neoTechNeonViolet}${layerIntensity * 0.8})`);
          swirlingGradient.addColorStop(0.5, `${colors.neoTechAuroraPink}${layerIntensity * 0.7})`);
          swirlingGradient.addColorStop(1, `${colors.neoTechAuroraPink}${layerIntensity * 0.2})`);
        } else if (layer === 2) {
          swirlingGradient.addColorStop(0, `${colors.neoTechAuroraPink}${layerIntensity * 0.7})`);
          swirlingGradient.addColorStop(0.6, `${colors.neoTechQuantumCyan}${layerIntensity * 0.6})`);
          swirlingGradient.addColorStop(1, `${colors.neoTechQuantumCyan}${layerIntensity * 0.15})`);
        } else if (layer === 3) {
          swirlingGradient.addColorStop(0, `${colors.neoTechQuantumCyan}${layerIntensity * 0.6})`);
          swirlingGradient.addColorStop(0.7, `${colors.neoTechPlasmaBlue}${layerIntensity * 0.5})`);
          swirlingGradient.addColorStop(1, `${colors.neoTechPlasmaBlue}${layerIntensity * 0.1})`);
        } else {
          swirlingGradient.addColorStop(0, `${colors.neoTechPlasmaBlue}${layerIntensity * 0.5})`);
          swirlingGradient.addColorStop(0.8, `${colors.neoTechVaporLilac}${layerIntensity * 0.4})`);
          swirlingGradient.addColorStop(1, `${colors.neoTechVaporLilac}${layerIntensity * 0.05})`);
        }
        
        ctx.shadowBlur = 20 + layer * 5;
        ctx.shadowColor = layer === 0 ? `${colors.neoTechCrystalWhite}${layerIntensity * 0.8})` : 
                         layer === 1 ? `${colors.neoTechNeonViolet}${layerIntensity * 0.6})` :
                         layer === 2 ? `${colors.neoTechAuroraPink}${layerIntensity * 0.5})` :
                         layer === 3 ? `${colors.neoTechQuantumCyan}${layerIntensity * 0.4})` :
                         `${colors.neoTechPlasmaBlue}${layerIntensity * 0.3})`;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, layerRadius, 0, Math.PI * 2);
        ctx.fillStyle = swirlingGradient;
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
      
      // Enhanced Dynamic Expanding Rings with Distortion
      for (let i = 0; i < 6; i++) {
        const ringTime = time * 2 + i * 0.8;
        const baseRadius = 60 + i * 25;
        const ringOpacity = (Math.sin(ringTime * 1.2) * 0.5 + 0.7) * (1 - i * 0.15) * coreIntensity;
        const wobbleIntensity = 8 + i * 2;
        const lineWidth = 3 - i * 0.3;
        
        // Create distorted ring with wobble effect
        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
          const wobble = Math.sin(angle * 6 + ringTime * 2) * wobbleIntensity;
          const radius = baseRadius + wobble + Math.sin(ringTime) * 15;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          if (angle === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        
        // Multi-color gradient for each ring
        const ringGradient = ctx.createLinearGradient(
          centerX - baseRadius, centerY - baseRadius,
          centerX + baseRadius, centerY + baseRadius
        );
        
        const colorPhase = (time + i * 0.5) % 3;
        if (colorPhase < 1) {
          ringGradient.addColorStop(0, `${colors.neoTechNeonViolet}${ringOpacity})`);
          ringGradient.addColorStop(0.5, `${colors.neoTechAuroraPink}${ringOpacity * 0.8})`);
          ringGradient.addColorStop(1, `${colors.neoTechQuantumCyan}${ringOpacity * 0.6})`);
        } else if (colorPhase < 2) {
          ringGradient.addColorStop(0, `${colors.neoTechAuroraPink}${ringOpacity})`);
          ringGradient.addColorStop(0.5, `${colors.neoTechQuantumCyan}${ringOpacity * 0.8})`);
          ringGradient.addColorStop(1, `${colors.neoTechPlasmaBlue}${ringOpacity * 0.6})`);
        } else {
          ringGradient.addColorStop(0, `${colors.neoTechQuantumCyan}${ringOpacity})`);
          ringGradient.addColorStop(0.5, `${colors.neoTechPlasmaBlue}${ringOpacity * 0.8})`);
          ringGradient.addColorStop(1, `${colors.neoTechNeonViolet}${ringOpacity * 0.6})`);
        }
        
        ctx.shadowBlur = 12 + i * 2;
        ctx.shadowColor = `${colors.neoTechAuroraPink}${ringOpacity * 0.6})`;
        
        ctx.strokeStyle = ringGradient;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
      
      ctx.shadowBlur = 0;
      
      // Neural Network Connections - Dynamic interconnected lines
      const neuralNodes = 12;
      const neuralRadius = 90;
      
      for (let i = 0; i < neuralNodes; i++) {
        const nodeAngle = (i / neuralNodes) * Math.PI * 2 + time * 0.3;
        const nodeX = centerX + Math.cos(nodeAngle) * neuralRadius;
        const nodeY = centerY + Math.sin(nodeAngle) * neuralRadius;
        
        // Connect to nearby nodes
        for (let j = i + 1; j < Math.min(i + 3, neuralNodes); j++) {
          const targetAngle = (j / neuralNodes) * Math.PI * 2 + time * 0.3;
          const targetX = centerX + Math.cos(targetAngle) * neuralRadius;
          const targetY = centerY + Math.sin(targetAngle) * neuralRadius;
          
          const connectionOpacity = (Math.sin(time * 3 + i * 0.5) * 0.3 + 0.7) * 0.4;
          const connectionPulse = Math.sin(time * 4 + i + j) * 0.5 + 0.5;
          
          // Create connection line with gradient
          const connectionGradient = ctx.createLinearGradient(nodeX, nodeY, targetX, targetY);
          connectionGradient.addColorStop(0, `${colors.neoTechQuantumCyan}${connectionOpacity * connectionPulse})`);
          connectionGradient.addColorStop(0.5, `${colors.neoTechCrystalWhite}${connectionOpacity * connectionPulse * 0.8})`);
          connectionGradient.addColorStop(1, `${colors.neoTechNeonViolet}${connectionOpacity * connectionPulse})`);
          
          ctx.beginPath();
          ctx.moveTo(nodeX, nodeY);
          ctx.lineTo(targetX, targetY);
          ctx.strokeStyle = connectionGradient;
          ctx.lineWidth = 1 + connectionPulse * 0.5;
          ctx.stroke();
          
          // Add data flow particles along connections
          if (Math.random() < 0.02) {
            const flowProgress = Math.random();
            const flowX = nodeX + (targetX - nodeX) * flowProgress;
            const flowY = nodeY + (targetY - nodeY) * flowProgress;
            
            ctx.beginPath();
            ctx.arc(flowX, flowY, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `${colors.neoTechCrystalWhite}${connectionOpacity * 2})`;
            ctx.fill();
          }
        }
        
        // Draw neural nodes
        const nodeOpacity = (Math.sin(time * 2.5 + i * 0.3) * 0.4 + 0.8) * 0.6;
        const nodeGradient = ctx.createRadialGradient(nodeX, nodeY, 0, nodeX, nodeY, 4);
        nodeGradient.addColorStop(0, `${colors.neoTechCrystalWhite}${nodeOpacity})`);
        nodeGradient.addColorStop(0.5, `${colors.neoTechQuantumCyan}${nodeOpacity * 0.8})`);
        nodeGradient.addColorStop(1, `${colors.neoTechQuantumCyan}0)`);
        
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, 2, 0, Math.PI * 2);
        ctx.fillStyle = nodeGradient;
        ctx.fill();
      }

      // Enhanced Emanating Energy Particles with Trails
      energyParticlesRef.current.forEach((particle, index) => {
        // Update particle lifecycle with curve
        particle.distance += particle.speed;
        particle.life -= 0.006;
        particle.angle += particle.curve;
        
        // Add current position to trail
        const currentDistance = particle.distance * 80;
        const x = centerX + Math.cos(particle.angle) * currentDistance;
        const y = centerY + Math.sin(particle.angle) * currentDistance;
        
        particle.trail.push({ x, y, life: particle.life });
        if (particle.trail.length > 8) {
          particle.trail.shift();
        }
        
        // Reset particle when it fades out
        if (particle.life <= 0) {
          particle.distance = 0;
          particle.life = 1.0;
          particle.angle = (index / energyParticlesRef.current.length) * Math.PI * 2 + Math.random() * 1.0;
          particle.curve = Math.random() * 0.02 - 0.01;
          particle.trail = [];
        }
        
        // Draw particle trail
        particle.trail.forEach((trailPoint, trailIndex) => {
          const trailOpacity = (trailPoint.life * 0.6) * (trailIndex / particle.trail.length);
          const trailSize = particle.size * (trailIndex / particle.trail.length) * 0.5;
          
          if (trailOpacity > 0.1) {
            const trailGradient = ctx.createRadialGradient(trailPoint.x, trailPoint.y, 0, trailPoint.x, trailPoint.y, trailSize * 3);
            
            let trailColor;
            switch (particle.colorIndex) {
              case 0:
                trailColor = colors.neoTechAuroraPink;
                break;
              case 1:
                trailColor = colors.neoTechNeonViolet;
                break;
              case 2:
                trailColor = colors.neoTechQuantumCyan;
                break;
              case 3:
                trailColor = colors.neoTechPlasmaBlue;
                break;
              default:
                trailColor = colors.neoTechVaporLilac;
            }
            
            trailGradient.addColorStop(0, `${trailColor}${trailOpacity})`);
            trailGradient.addColorStop(1, `${trailColor}0)`);
            
            ctx.beginPath();
            ctx.arc(trailPoint.x, trailPoint.y, trailSize, 0, Math.PI * 2);
            ctx.fillStyle = trailGradient;
            ctx.fill();
          }
        });
        
        // Particle appearance with life-based fading
        const particleOpacity = particle.opacity * particle.life * coreIntensity;
        const particleSize = particle.size * (0.3 + particle.life * 0.7);
        
        // Choose color based on particle type
        let particleColor;
        switch (particle.colorIndex) {
          case 0:
            particleColor = colors.neoTechAuroraPink;
            break;
          case 1:
            particleColor = colors.neoTechNeonViolet;
            break;
          case 2:
            particleColor = colors.neoTechQuantumCyan;
            break;
          case 3:
            particleColor = colors.neoTechPlasmaBlue;
            break;
          default:
            particleColor = colors.neoTechVaporLilac;
        }
        
        // Draw main particle with enhanced glow
        const particleGradient = ctx.createRadialGradient(x, y, 0, x, y, particleSize * 8);
        particleGradient.addColorStop(0, `${particleColor}${particleOpacity})`);
        particleGradient.addColorStop(0.3, `${particleColor}${particleOpacity * 0.8})`);
        particleGradient.addColorStop(0.6, `${particleColor}${particleOpacity * 0.4})`);
        particleGradient.addColorStop(1, `${particleColor}0)`);
        
        ctx.shadowBlur = 8;
        ctx.shadowColor = `${particleColor}${particleOpacity * 0.8})`;
        
        ctx.beginPath();
        ctx.arc(x, y, particleSize, 0, Math.PI * 2);
        ctx.fillStyle = particleGradient;
        ctx.fill();
      });
      
      ctx.shadowBlur = 0;

      // Enhanced Rotating Accent Rings with Multiple Layers
      for (let ring = 0; ring < 3; ring++) {
        const accentRadius = 100 + ring * 20;
        const rotationSpeed = time * (0.4 + ring * 0.1);
        const dotCount = 8 + ring * 2;
        
        for (let i = 0; i < dotCount; i++) {
          const angle = (i / dotCount) * Math.PI * 2 + rotationSpeed;
          const x = centerX + Math.cos(angle) * accentRadius;
          const y = centerY + Math.sin(angle) * accentRadius;
          
          const dotOpacity = (Math.sin(time * 3 + i * 0.3 + ring) * 0.4 + 0.8) * coreIntensity * (0.8 - ring * 0.2);
          const dotSize = 2 - ring * 0.3;
          
          const dotGradient = ctx.createRadialGradient(x, y, 0, x, y, dotSize * 4);
          
          const ringColorPhase = (time + ring) % 3;
          let dotColor;
          if (ringColorPhase < 1) {
            dotColor = colors.neoTechQuantumCyan;
          } else if (ringColorPhase < 2) {
            dotColor = colors.neoTechAuroraPink;
          } else {
            dotColor = colors.neoTechNeonViolet;
          }
          
          dotGradient.addColorStop(0, `${dotColor}${dotOpacity})`);
          dotGradient.addColorStop(0.5, `${dotColor}${dotOpacity * 0.6})`);
          dotGradient.addColorStop(1, `${dotColor}0)`);
          
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = dotGradient;
          ctx.fill();
        }
      }

      // Spectacular Outer Aura with Breathing Effect
      const auraIntensity = Math.sin(time * 1.5) * 0.3 + 0.7;
      const auraRadius = 140 + Math.sin(time * 1.2) * 20;
      
      const auraGradient = ctx.createRadialGradient(centerX, centerY, breathingRadius * 2, centerX, centerY, auraRadius);
      auraGradient.addColorStop(0, `${colors.neoTechCrystalWhite}${coreIntensity * 0.1})`);
      auraGradient.addColorStop(0.2, `${colors.neoTechNeonViolet}${coreIntensity * 0.08})`);
      auraGradient.addColorStop(0.4, `${colors.neoTechAuroraPink}${coreIntensity * 0.06})`);
      auraGradient.addColorStop(0.6, `${colors.neoTechQuantumCyan}${coreIntensity * 0.04})`);
      auraGradient.addColorStop(0.8, `${colors.neoTechPlasmaBlue}${coreIntensity * 0.02})`);
      auraGradient.addColorStop(1, `${colors.neoTechVaporLilac}0)`);
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
      ctx.fillStyle = auraGradient;
      ctx.fill();

      // Final Spectacular Composite Effect
      ctx.globalCompositeOperation = 'lighter';
      
      // Pulsing energy waves
      for (let wave = 0; wave < 3; wave++) {
        const waveTime = time * 2 + wave * 2;
        const waveRadius = 40 + (waveTime % 6) * 30;
        const waveOpacity = Math.max(0, 1 - (waveTime % 6) / 6) * 0.3;
        
        const waveGradient = ctx.createRadialGradient(centerX, centerY, waveRadius - 10, centerX, centerY, waveRadius + 10);
        waveGradient.addColorStop(0, `${colors.neoTechCrystalWhite}0)`);
        waveGradient.addColorStop(0.5, `${colors.neoTechNeonViolet}${waveOpacity})`);
        waveGradient.addColorStop(1, `${colors.neoTechNeonViolet}0)`);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = waveGradient;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      ctx.globalCompositeOperation = 'source-over';
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening, isSpeaking, isProcessing]);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="rounded-full w-64 h-64 sm:w-80 sm:h-80"
        style={{ filter: 'blur(0.5px)' }}
      />
      
      {/* Additional glow effects */}
      <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
        isListening ? 'shadow-[0_0_60px_rgba(0,206,209,0.4)]' :
        isSpeaking ? 'shadow-[0_0_100px_rgba(255,105,180,0.6),0_0_150px_rgba(138,43,226,0.4),0_0_200px_rgba(0,206,209,0.3)] animate-pulse' :
        isProcessing ? 'shadow-[0_0_80px_rgba(138,43,226,0.5),0_0_120px_rgba(255,105,180,0.3)] animate-pulse' :
        'shadow-[0_0_40px_rgba(138,43,226,0.2)]'
      }`} />
    </div>
  );
};