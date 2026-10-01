import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// Attente des elements asynchrones : marge pour les machines chargees (tests en parallele).
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});
