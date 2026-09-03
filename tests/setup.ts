import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

/**
 * Fichier de setup global Vitest.
 *
 * 1. `@testing-library/jest-dom/vitest` enregistre les matchers utilisés par
 *    tests/unit/components/pi-auth-provider.test.tsx (toBeInTheDocument, toBeDisabled, etc.).
 *    Sans cet import, ces assertions échouent avec "X is not a function" — ce n'est pas une
 *    option facultative, le fichier de test en dépend directement.
 * 2. `cleanup()` après chaque test démonte les composants React montés par le test précédent.
 *    `@testing-library/react` ne l'enregistre automatiquement que si `test.globals: true` est
 *    activé dans la config Vitest, ce qui n'est pas le cas ici (les tests importent `afterEach`
 *    explicitement depuis 'vitest' plutôt que d'utiliser un global) : sans cet appel explicite,
 *    le DOM d'un test fuiterait vers le suivant (ex. plusieurs éléments `data-testid` identiques
 *    trouvés par `getByTestId`).
 */
afterEach(() => {
  cleanup();
});
