import { PiSignInButton } from '@/components/pi/PiSignInButton';

/**
 * Page d'accueil provisoire — TopLuxe.
 * Placeholder de fondation : aucune fonctionnalité de catalogue/marketplace n'est implémentée à
 * ce stade. Le bouton de connexion Pi (TLX-006) est affiché ici à titre de point d'entrée
 * visible, conformément à l'exigence explicite d'un déclenchement manuel de l'authentification.
 */
export default function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>TopLuxe</h1>
      <p>Fondation technique en cours de construction.</p>
      <PiSignInButton />
    </main>
  );
}
