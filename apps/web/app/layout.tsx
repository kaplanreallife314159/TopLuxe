import type { Metadata } from 'next';
import Script from 'next/script';
import { PiAuthProvider } from '@/components/pi/PiAuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'TopLuxe',
  description: 'Marketplace premium sur Pi Network.',
};

/**
 * Layout racine — TopLuxe.
 *
 * TLX-006 / TLX-006.5 (décision finale) : chargement du script Pi SDK fondamental et activation
 * de PiAuthProvider, qui déclenche automatiquement l'authentification Pi au chargement de
 * l'application via un appel direct à window.Pi.init() puis window.Pi.authenticate(['username'], ...)
 * — voir components/pi/PiConnectionBridge.tsx et docs/adr/0002 (addendum 4) pour l'historique
 * complet de cette décision, prise après vérification que pi-sdk-react/pi-sdk-nextjs/pi-sdk-js
 * ne sont trouvables comme paquets npm publiés sur aucune source consultée.
 *
 * `strategy="beforeInteractive"` et le placement du script sont conformes à l'exemple officiel
 * documenté (pi-sdk-docs, page "Pi SDK Next.js", script de la vidéo d'intégration) : le script
 * doit être disponible avant toute interaction, donc chargé au niveau du layout racine.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="beforeInteractive" />
        <PiAuthProvider>{children}</PiAuthProvider>
      </body>
    </html>
  );
}
