import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const StarBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check reduced-motion preference
    const mm = gsap.matchMedia();
    let preferReducedMotion = false;
    mm.add("(prefers-reduced-motion: reduce)", () => {
      preferReducedMotion = true;
    });

    let stars: Array<{
      x: number;
      y: number;
      size: number;
      alpha: number;
      phase: number;
      speed: number;
    }> = [];

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      if (preferReducedMotion) { stars = []; return; }
      stars = [];
      const density = Math.floor((canvas.width * canvas.height) / 6000);
      const maxCount = Math.min(density, 300);

      for (let i = 0; i < maxCount; i++) {
        const depth = Math.random(); // 0=far, 1=near
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: depth > 0.9 ? Math.random() * 1.8 + 1.0  // large bright stars
                : depth > 0.7 ? Math.random() * 0.8 + 0.3  // medium
                : Math.random() * 0.4 + 0.1,              // tiny distant
          alpha: depth > 0.9 ? Math.random() * 0.3 + 0.7  // bright
                : depth > 0.7 ? Math.random() * 0.4 + 0.4
                : Math.random() * 0.3 + 0.15,              // dim
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.012 + 0.003,
        });
      }
    };

    // GSAP-interpolated mouse position for buttery parallax
    const mouseTarget = { x: 0, y: 0 };
    const mouseCurrent = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      mouseTarget.x = (e.clientX - window.innerWidth / 2) * 0.05;
      mouseTarget.y = (e.clientY - window.innerHeight / 2) * 0.05;
    };

    // Animate mouse interpolation smoothly
    const mouseTween = gsap.to(mouseCurrent, {
      x: 0,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
      paused: true,
    });

    const render = () => {
      if (preferReducedMotion) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }

      // Smoothly chase mouse target
      gsap.to(mouseCurrent, {
        x: mouseTarget.x,
        y: mouseTarget.y,
        duration: 1.2,
        ease: "power2.out",
        overwrite: "auto",
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#020208';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Nebula 1: prominent blue center
      const nebula1 = ctx.createRadialGradient(
        canvas.width * 0.35, canvas.height * 0.35,
        0,
        canvas.width * 0.35, canvas.height * 0.35,
        canvas.width * 0.55
      );
      nebula1.addColorStop(0, 'rgba(40, 80, 180, 0.12)');
      nebula1.addColorStop(0.4, 'rgba(20, 40, 100, 0.06)');
      nebula1.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Nebula 2: purple-red right side
      const nebula2 = ctx.createRadialGradient(
        canvas.width * 0.7, canvas.height * 0.55,
        0,
        canvas.width * 0.7, canvas.height * 0.55,
        canvas.width * 0.45
      );
      nebula2.addColorStop(0, 'rgba(60, 20, 80, 0.1)');
      nebula2.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        star.phase += star.speed;
        const pulse = Math.sin(star.phase) * 0.3 + 0.7;
        const alpha = star.alpha * pulse;

        const dx = mouseCurrent.x * (star.size * 0.3);
        const dy = mouseCurrent.y * (star.size * 0.3);

        let finalX = star.x + dx;
        let finalY = star.y + dy;

        if (finalX < 0) finalX = canvas.width + finalX % canvas.width;
        if (finalX > canvas.width) finalX = finalX % canvas.width;
        if (finalY < 0) finalY = canvas.height + finalY % canvas.height;
        if (finalY > canvas.height) finalY = finalY % canvas.height;

        // Slight color variation for realism
        const r = star.size > 2 ? (Math.random() > 0.5 ? 200 : 235) : 210;
        const g = star.size > 2 ? (Math.random() > 0.5 ? 210 : 215) : 220;
        const b = star.size > 2 ? (Math.random() > 0.5 ? 255 : 210) : 245;
        const starColor = `${r}, ${g}, ${b}`;

        // Glow halo for medium+ stars
        if (star.size > 0.8 && alpha > 0.3) {
          const halo = ctx.createRadialGradient(finalX, finalY, 0, finalX, finalY, star.size * 4);
          halo.addColorStop(0, `rgba(${starColor}, ${alpha * 0.25})`);
          halo.addColorStop(1, 'transparent');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(finalX, finalY, star.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(${starColor}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(finalX, finalY, star.size, 0, Math.PI * 2);
        ctx.fill();

        // Cross flare on brightest stars
        if (star.size > 2 && alpha > 0.7) {
          ctx.strokeStyle = `rgba(${starColor}, ${alpha * 0.25})`;
          ctx.lineWidth = 0.3;
          ctx.beginPath();
          ctx.moveTo(finalX - 4, finalY);
          ctx.lineTo(finalX + 4, finalY);
          ctx.moveTo(finalX, finalY - 4);
          ctx.lineTo(finalX, finalY + 4);
          ctx.stroke();
        }
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    handleResize();
    // Use GSAP ticker for frame-synced rendering
    gsap.ticker.add(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      gsap.ticker.remove(render);
      mouseTween.kill();
      mm.revert();
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full z-0 pointer-events-none" />;
};
