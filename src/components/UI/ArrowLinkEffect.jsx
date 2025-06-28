import { useEffect } from 'react';

/**
 * Component that adds arrow hover effect to links containing "→"
 * This runs after component mount to add the effect to existing elements
 */
const ArrowLinkEffect = () => {
  useEffect(() => {
    const addArrowEffect = () => {
      // Find all links and buttons that contain the arrow symbol
      const elements = document.querySelectorAll('a, button');
      
      elements.forEach(element => {
        // Check if element text content contains arrow
        if (element.textContent && element.textContent.includes('→')) {
          // Don't add class if it already has it
          if (!element.classList.contains('arrow-link')) {
            element.classList.add('arrow-link');
          }
        }
      });
    };

    // Run initially
    addArrowEffect();

    // Run when DOM changes (for dynamic content)
    const observer = new MutationObserver(addArrowEffect);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ArrowLinkEffect;