import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Tests share one jsdom document, so unmount between them.
afterEach(() => cleanup());
