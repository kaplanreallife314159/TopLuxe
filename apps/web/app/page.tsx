'use client';

import { useState } from 'react';

export function PiSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePiLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Vérifier si Pi SDK est disponible
      if (!window.Pi) {
        setError('Pi SDK not available. Please refresh the page.');
        setIsLoading(false);
        return;
      }

      // Initialiser Pi SDK
      await window.Pi.init({ version: '2.0' });

      // Récupérer l'authentification
      const auth = await window.Pi.authenticate();

      if (auth?.accessToken) {
        // Envoyer le token au backend
        const response = await fetch('/api/auth/pi-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: auth.accessToken,
          }),
        });

        if (response.ok) {
          // Rediriger vers dashboard
          window.location.href = '/dashboard';
        } else {
          const data = await response.json();
          setError(data.message || 'Login failed');
        }
      } else {
        setError('Failed to get access token from Pi');
      }
    } catch (err) {
      console.error('Pi login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <button
        onClick={handlePiLogin}
        disabled={isLoading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#6C63FF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        {isLoading ? 'Connexion en cours...' : 'Se connecter avec Pi'}
      </button>

      {error && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <strong>Erreur :</strong> {error}
        </div>
      )}
    </div>
  );
}