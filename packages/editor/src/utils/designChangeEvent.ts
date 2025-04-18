/**
 * Utility to dispatch design change events
 * This is used to trigger auto-save when the design changes
 */

// Debounce function to limit event dispatches with leading edge control
const debounce = (func: Function, wait: number, immediate = false) => {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: any[] | null = null;
  let lastCallTime = 0;

  return function executedFunction(...args: any[]) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    // Store the latest arguments
    lastArgs = args;
    lastCallTime = now;

    // If we're within the cooldown period, don't schedule a new timeout
    if (timeSinceLastCall < 200 && !immediate) {
      return;
    }

    // Execute immediately if requested and no timeout is pending
    if (immediate && !timeout) {
      func(...args);
    }

    // Clear existing timeout
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }

    // Schedule new timeout
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate && lastArgs) {
        func(...lastArgs);
        lastArgs = null;
      }
    }, wait);
  };
};

// Track changes to avoid duplicate events
let lastChangeHash = "";

// Create a custom event for design changes
export const dispatchDesignChangeEvent = () => {
  // Generate a simple hash of the current time to track changes
  const currentHash = Date.now().toString();

  // Only dispatch if this is a new change (at least 500ms since last change)
  if (currentHash !== lastChangeHash) {
    lastChangeHash = currentHash;
    window.dispatchEvent(new CustomEvent("design-changed"));
    console.log("Design change event dispatched");
  }
};

// Debounced version to avoid too many events (1000ms delay, no immediate execution)
export const debouncedDispatchDesignChangeEvent = debounce(
  dispatchDesignChangeEvent,
  1000,
  false
);

// Function to set up listeners for common design change actions
export const setupDesignChangeListeners = () => {
  // Listen for history changes (undo/redo)
  window.addEventListener(
    "history-changed",
    debouncedDispatchDesignChangeEvent
  );

  // Listen for layer changes
  window.addEventListener("layer-changed", debouncedDispatchDesignChangeEvent);

  // Listen for text changes
  window.addEventListener("text-changed", debouncedDispatchDesignChangeEvent);

  // Listen for page changes
  window.addEventListener("page-changed", debouncedDispatchDesignChangeEvent);
};

// Function to clean up listeners
export const cleanupDesignChangeListeners = () => {
  window.removeEventListener(
    "history-changed",
    debouncedDispatchDesignChangeEvent
  );
  window.removeEventListener(
    "layer-changed",
    debouncedDispatchDesignChangeEvent
  );
  window.removeEventListener(
    "text-changed",
    debouncedDispatchDesignChangeEvent
  );
  window.removeEventListener(
    "page-changed",
    debouncedDispatchDesignChangeEvent
  );
};

export default {
  dispatchDesignChangeEvent,
  debouncedDispatchDesignChangeEvent,
  setupDesignChangeListeners,
  cleanupDesignChangeListeners,
};
