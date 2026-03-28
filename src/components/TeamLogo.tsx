import React from 'react';
import type { Team } from '../data/teams';

interface TeamLogoProps {
  team: Team | null | undefined;
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}

export const TeamLogo = ({ team, size = 24, style, className }: TeamLogoProps) => {
  if (!team) return <div style={{ width: size, height: size, background: 'rgba(255,255,255,0.05)', borderRadius: '4px', ...style }} />;

  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [team.domain, team.id]);

  // Authentic National Flag (No external dependencies for logic, using reliable FlagCDN)
  if (team.isNational && team.countryCode && !hasError) {
    const isoMapping: Record<string, string> = {
      'GBR': 'gb', 'NED': 'nl', 'MON': 'mc', 'ESP': 'es', 'FRA': 'fr', 'GER': 'de',
      'AUS': 'au', 'MEX': 'mx', 'JPN': 'jp', 'USA': 'us', 'CAN': 'ca', 'FIN': 'fi',
      'DEN': 'dk', 'CHN': 'cn', 'THA': 'th', 'IND': 'in', 'POL': 'pl', 'BRA': 'br',
      'SWE': 'se', 'ARG': 'ar', 'CHE': 'ch', 'POR': 'pt', 'BEL': 'be', 'IRE': 'ie',
      'CZE': 'cz', 'IDN': 'id', 'MYS': 'my', 'SGP': 'sg', 'RSA': 'za', 'TUR': 'tr',
      'NZL': 'nz', 'HUN': 'hu', 'GRC': 'gr', 'PHL': 'ph', 'CHL': 'cl', 'PAK': 'pk',
      'BGD': 'bd', 'IRN': 'ir', 'ARE': 'ae', 'LBN': 'lb', 'EGY': 'eg', 'KEN': 'ke',
      'NGA': 'ng', 'PER': 'pe', 'COL': 'co', 'VNM': 'vn', 'ROU': 'ro', 'BGR': 'bg',
      'MAR': 'ma', 'SVK': 'sk'
    };

    const code2 = isoMapping[team.countryCode.toUpperCase()] || team.countryCode.substring(0, 2).toLowerCase();

    return (
      <img
        key={team.countryCode}
        src={`https://flagcdn.com/w80/${code2}.png`}
        style={{
          width: size,
          height: size,
          objectFit: 'cover',
          borderRadius: size > 40 ? '8px' : '2px',
          border: '1px solid rgba(255,255,255,0.1)',
          ...style
        }}
        alt={team.name}
        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
          setHasError(true);
        }}
      />
    );
  }

  // Use img.logo.dev for normal teams
  const logoUrl = team.domain
    ? `https://img.logo.dev/${team.domain}?token=pk_ZVmDvGFfSJqFVJK38WqTgg&retina=true`
    : null;

  if (logoUrl && !hasError) {
    return (
      <img
        key={team.domain}
        src={logoUrl}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          borderRadius: '4px',
          ...style
        }}
        alt={team.name}
        onError={() => setHasError(true)}
        referrerPolicy="no-referrer"
      />
    );
  }

  // "Make it yourself" Fallback: Geometric Procedural Logo
  const initials = team.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${team.color || 'var(--primary)'} 0%, ${team.color + 'aa' || 'var(--primary)'} 100%)`,
        borderRadius: size > 40 ? '12px' : '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 900,
        fontSize: Math.max(8, size * 0.45),
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        boxShadow: `0 4px 10px rgba(0,0,0,0.3), inset 0 0 ${size / 2}px rgba(0,0,0,0.2)`,
        border: '1px solid rgba(255,255,255,0.2)',
        overflow: 'hidden',
        position: 'relative',
        ...style
      }}
    >
      {/* Carbon fiber pattern overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.1,
        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
        backgroundSize: '4px 4px',
        pointerEvents: 'none'
      }} />

      {/* Speed streaks */}
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '-20%',
        width: '140%',
        height: '2px',
        background: 'rgba(255,255,255,0.3)',
        transform: 'rotate(-5deg)',
        boxShadow: '0 0 10px white',
        pointerEvents: 'none'
      }} />

      <span style={{
        position: 'relative',
        zIndex: 1,
        letterSpacing: '-0.05em',
        fontStyle: 'italic',
        color: (() => {
          const hex = team.color || '#fff';
          if (hex.length < 7) return '#fff';
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
          return yiq >= 128 ? '#000' : '#fff';
        })()
      }}>
        {initials}
      </span>
    </div>
  );
};
