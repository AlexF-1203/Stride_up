export const COLORS = {
    background: '#1A1B1E',       // Fond principal très sombre
    surface: '#2A2D36',         // Surface des cartes et conteneurs
    primary: '#3e62d4',         // Bleu principal pour les actions importantes
    secondary: '#6366F1',       // Violet-bleu pour les actions secondaires
    accent: '#0EA5E9',         // Bleu clair pour les accents
    success: '#22C55E',        // Vert pour les actions positives
    danger: '#EF4444',         // Rouge pour les actions dangereuses
    warning: '#F59E0B',        // Orange pour les modifications
    text: {
      primary: '#F3F4F6',      // Texte principal presque blanc
      secondary: '#9CA3AF',    // Texte secondaire gris clair
      muted: '#6B7280',        // Texte atténué gris moyen
    }
  };
  
  export const globalStyles = {
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
      padding: 20,
    },
    card: {
      backgroundColor: COLORS.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: COLORS.text.primary,
      letterSpacing: 0.5,
      marginBottom: 20,
    },
    input: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: 15,
      color: COLORS.text.primary,
      fontSize: 16,
      marginBottom: 15,
    },
    button: {
      backgroundColor: COLORS.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginVertical: 10,
    },
    buttonText: {
      color: COLORS.text.primary,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
  }; 