import { useScrollAnimation, ScrollAnimationType } from '../../hooks/useScrollAnimation';
import { ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  animation?: ScrollAnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
  className?: string;
}

/**
 * ScrollReveal Component
 * Wrapper component que aplica animaciones al hacer scroll
 * 
 * @example
 * <ScrollReveal animation="fade-up" delay={200}>
 *   <div>Contenido que se animará</div>
 * </ScrollReveal>
 */
export function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
  once = true,
  className = '',
}: ScrollRevealProps) {
  const { ref, className: animationClass } = useScrollAnimation({
    animationType: animation,
    delay,
    duration,
    threshold,
    once,
  });

  return (
    <div ref={ref} className={`${animationClass} ${className}`}>
      {children}
    </div>
  );
}

