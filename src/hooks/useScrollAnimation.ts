import { useEffect, useRef, useState } from 'react';

export type ScrollAnimationType = 
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'slide-left'
  | 'slide-right'
  | 'flip'
  | 'rotate';

interface UseScrollAnimationOptions {
  threshold?: number;
  delay?: number;
  duration?: number;
  once?: boolean;
  animationType?: ScrollAnimationType;
}

/**
 * Hook para añadir animaciones al hacer scroll
 * Usa Intersection Observer para detectar cuando un elemento entra en viewport
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollAnimationOptions = {}
) {
  const {
    threshold = 0.1,
    delay = 0,
    duration = 600,
    once = true,
    animationType = 'fade-up',
  } = options;

  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Si ya animó y once=true, no hacer nada
    if (once && hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
            if (once) {
              setHasAnimated(true);
            }
          }, delay);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, delay, once, hasAnimated]);

  // Generar clases CSS basadas en el tipo de animación
  const getAnimationClasses = () => {
    const baseClasses = 'transition-all';
    const durationClass = `duration-[${duration}ms]`;
    
    if (!isVisible) {
      switch (animationType) {
        case 'fade-up':
          return `${baseClasses} ${durationClass} opacity-0 translate-y-8`;
        case 'fade-down':
          return `${baseClasses} ${durationClass} opacity-0 -translate-y-8`;
        case 'fade-left':
          return `${baseClasses} ${durationClass} opacity-0 translate-x-8`;
        case 'fade-right':
          return `${baseClasses} ${durationClass} opacity-0 -translate-x-8`;
        case 'zoom-in':
          return `${baseClasses} ${durationClass} opacity-0 scale-90`;
        case 'zoom-out':
          return `${baseClasses} ${durationClass} opacity-0 scale-110`;
        case 'slide-left':
          return `${baseClasses} ${durationClass} translate-x-full`;
        case 'slide-right':
          return `${baseClasses} ${durationClass} -translate-x-full`;
        case 'flip':
          return `${baseClasses} ${durationClass} opacity-0 rotate-x-90`;
        case 'rotate':
          return `${baseClasses} ${durationClass} opacity-0 rotate-12`;
        default:
          return `${baseClasses} ${durationClass} opacity-0`;
      }
    }

    return `${baseClasses} ${durationClass} opacity-100 translate-y-0 translate-x-0 scale-100 rotate-0`;
  };

  return {
    ref,
    isVisible,
    className: getAnimationClasses(),
  };
}

