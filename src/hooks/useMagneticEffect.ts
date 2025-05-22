import { useRef, useEffect } from 'react';
import { useSpring, useMotionValue } from 'framer-motion';

interface MagneticConfig {
  strength?: number;
  ease?: number;
  triggerDistance?: number;
}

export function useMagneticEffect({ 
  strength = 30, 
  ease = 0.15, 
  triggerDistance = 100 
}: MagneticConfig = {}) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  useEffect(() => {
    if (!ref.current) return;
    
    const element = ref.current;
    const rafId: number | null = null;
    let bounds: DOMRect;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!element) return;
      bounds = element.getBoundingClientRect();
      
      const elementCenterX = bounds.left + bounds.width / 2;
      const elementCenterY = bounds.top + bounds.height / 2;
      
      const distanceX = e.clientX - elementCenterX;
      const distanceY = e.clientY - elementCenterY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      
      if (distance < triggerDistance) {
        const angle = Math.atan2(distanceY, distanceX);
        const force = (triggerDistance - distance) / triggerDistance;
        
        const moveX = Math.cos(angle) * force * strength;
        const moveY = Math.sin(angle) * force * strength;
        
        x.set(moveX);
        y.set(moveY);
      } else {
        x.set(0);
        y.set(0);
      }
    };
    
    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [strength, ease, triggerDistance, x, y]);

  return { ref, x: springX, y: springY };
} 