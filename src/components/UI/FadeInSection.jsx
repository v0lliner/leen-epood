import { useEffect, useRef, useState } from 'react';

const FadeInSection = ({ children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    // Skip animation for slow connections or reduced motion preference
    const isSlowConnection = document.documentElement.getAttribute('data-slow-connection') === 'true';
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (isSlowConnection || prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      // Use a smaller rootMargin on mobile to trigger animations earlier
      rootMargin: window.innerWidth <= 768 ? '50px' : '0px'
    });

    const currentRef = domRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`fade-in ${isVisible ? 'visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default FadeInSection;