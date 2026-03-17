import React, { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  type: 'neural' | 'cosmic' | 'quantum';
  pulsePhase: number;
}

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      const particles: Particle[] = [];
      const particleCount = 120; // Increased for more cosmic feel
      
      const particleTypes: Array<'neural' | 'cosmic' | 'quantum'> = ['neural', 'cosmic', 'quantum'];
      const colors = {
        neural: '138, 43, 226', // Neon Violet
        cosmic: '255, 105, 180', // Aurora Pink
        quantum: '0, 206, 209' // Quantum Cyan
      };
      
      for (let i = 0; i < particleCount; i++) {
        const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5, // Slower movement for more ethereal feel
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 0.5, // Smaller, more delicate particles
          opacity: Math.random() * 0.8 + 0.2,
          color: colors[type],
          type,
          pulsePhase: Math.random() * Math.PI * 2
        });
      }
      
      particlesRef.current = particles;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const time = Date.now() * 0.001;
      
      particlesRef.current.forEach((particle, index) => {
        // Enhanced mouse interaction with fluid distortion
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          const force = (150 - distance) / 150;
          const angle = Math.atan2(dy, dx);
          
          // Create fluid, wave-like distortion
          particle.vx += Math.cos(angle + time) * force * 0.02;
          particle.vy += Math.sin(angle + time) * force * 0.02;
        }
        
        // Update position with subtle drift
        particle.x += particle.vx + Math.sin(time + particle.pulsePhase) * 0.1;
        particle.y += particle.vy + Math.cos(time + particle.pulsePhase) * 0.1;
        
        // Add gentle friction for fluid movement
        particle.vx *= 0.995;
        particle.vy *= 0.995;
        
        // Wrap around edges with smooth transition
        if (particle.x < -10) particle.x = canvas.width + 10;
        if (particle.x > canvas.width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = canvas.height + 10;
        if (particle.y > canvas.height + 10) particle.y = -10;
        
        // Enhanced particle rendering with glow effects
        const pulseIntensity = Math.sin(time * 2 + particle.pulsePhase) * 0.3 + 0.7;
        const currentOpacity = particle.opacity * pulseIntensity;
        
        // Create multiple glow layers for depth
        for (let layer = 3; layer >= 0; layer--) {
          const layerSize = particle.size * (1 + layer * 0.5);
          const layerOpacity = currentOpacity / (layer + 1);
          
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, layerSize * 3
          );
          
          if (particle.type === 'neural') {
            gradient.addColorStop(0, `rgba(${particle.color}, ${layerOpacity})`);
            gradient.addColorStop(0.5, `rgba(${particle.color}, ${layerOpacity * 0.5})`);
            gradient.addColorStop(1, `rgba(${particle.color}, 0)`);
          } else if (particle.type === 'cosmic') {
            gradient.addColorStop(0, `rgba(${particle.color}, ${layerOpacity})`);
            gradient.addColorStop(0.3, `rgba(${particle.color}, ${layerOpacity * 0.7})`);
            gradient.addColorStop(1, `rgba(${particle.color}, 0)`);
          } else {
            gradient.addColorStop(0, `rgba(${particle.color}, ${layerOpacity})`);
            gradient.addColorStop(0.4, `rgba(${particle.color}, ${layerOpacity * 0.6})`);
            gradient.addColorStop(1, `rgba(${particle.color}, 0)`);
          }
          
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, layerSize, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
        
        // Enhanced neural network connections
        particlesRef.current.slice(index + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            const opacity = (1 - distance / 100) * 0.15;
            const connectionPulse = Math.sin(time * 3 + distance * 0.01) * 0.5 + 0.5;
            
            // Create gradient connection lines
            const lineGradient = ctx.createLinearGradient(
              particle.x, particle.y,
              otherParticle.x, otherParticle.y
            );
            lineGradient.addColorStop(0, `rgba(${particle.color}, ${opacity * connectionPulse})`);
            lineGradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * connectionPulse * 0.5})`);
            lineGradient.addColorStop(1, `rgba(${otherParticle.color}, ${opacity * connectionPulse})`);
            
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = lineGradient;
            ctx.lineWidth = 1 + connectionPulse * 0.5;
            ctx.stroke();
            
            // Add subtle data flow effect along connections
            if (Math.random() < 0.01) {
              const flowX = particle.x + (otherParticle.x - particle.x) * Math.random();
              const flowY = particle.y + (otherParticle.y - particle.y) * Math.random();
              
              ctx.beginPath();
              ctx.arc(flowX, flowY, 1, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 2})`;
              ctx.fill();
            }
          }
        });
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    createParticles();
    animate();
    
    canvas.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      resizeCanvas();
      createParticles();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
};