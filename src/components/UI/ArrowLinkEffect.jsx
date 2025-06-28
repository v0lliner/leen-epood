import { useEffect } from 'react';

/**
 * Component that adds arrow hover effects to links containing "→"
 * Automatically detects and enhances arrow links on the page
 */
const ArrowLinkEffect = () => {
  useEffect(() => {
    const addArrowEffect = () => {
      // Find all links and buttons that contain the arrow symbol
      const elements = document.querySelectorAll('a, button');
      
      elements.forEach(element => {
        const text = element.textContent || '';
        
        if (text.includes('→')) {
          // Add arrow effect class
          element.classList.add('arrow-link');
          
          // Create or update the pseudo-element positioning
          const updateArrowPosition = () => {
            const textContent = element.textContent || '';
            const arrowIndex = textContent.lastIndexOf('→');
            
            if (arrowIndex !== -1) {
              // Calculate approximate position of the arrow
              const beforeArrow = textContent.substring(0, arrowIndex);
              const elementStyle = window.getComputedStyle(element);
              const fontSize = parseFloat(elementStyle.fontSize);
              
              // Estimate character width (rough approximation)
              const charWidth = fontSize * 0.6;
              const arrowPosition = beforeArrow.length * charWidth;
              
              // Set CSS custom properties for positioning
              element.style.setProperty('--arrow-offset-x', `${arrowPosition + (fontSize * 0.3)}px`);
              element.style.setProperty('--arrow-size', `${fontSize * 1.5}px`);
            }
          };
          
          updateArrowPosition();
          
          // Update position on resize
          const resizeObserver = new ResizeObserver(updateArrowPosition);
          resizeObserver.observe(element);
          
          // Store observer for cleanup
          element._arrowResizeObserver = resizeObserver;
        } else {
          // Remove arrow effect if no arrow present
          element.classList.remove('arrow-link');
          if (element._arrowResizeObserver) {
            element._arrowResizeObserver.disconnect();
            delete element._arrowResizeObserver;
          }
        }
      });
    };
    
    // Initial setup
    addArrowEffect();
    
    // Re-run when DOM changes (for dynamic content)
    const observer = new MutationObserver(addArrowEffect);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    return () => {
      observer.disconnect();
      
      // Cleanup resize observers
      document.querySelectorAll('.arrow-link').forEach(element => {
        if (element._arrowResizeObserver) {
          element._arrowResizeObserver.disconnect();
          delete element._arrowResizeObserver;
        }
      });
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ArrowLinkEffect;