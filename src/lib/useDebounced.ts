import { useEffect, useState } from 'react';

/**
 * Trails a value by `delay`, so a search box fires one request when typing
 * stops rather than one per keystroke. Trimmed, because a trailing space is not
 * a different search.
 */
export function useDebounced(value: string, delay = 250): string {
  const [debounced, setDebounced] = useState(value.trim());

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value.trim()), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
