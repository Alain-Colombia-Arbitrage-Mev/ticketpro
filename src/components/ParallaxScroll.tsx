import { ReactNode, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";

interface ParallaxScrollProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxScroll({ children, speed = 0.5, className = "" }: ParallaxScrollProps) {
  const [mounted, setMounted] = useState(false);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 1000 * speed]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className={className}>{children}</div>;

  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
