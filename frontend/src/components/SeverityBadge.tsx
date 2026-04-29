'use client';

export function SeverityBadge({ severity }: { severity: string }) {
  const className = {
    CRITICAL: 'badge-critical',
    MEDIUM: 'badge-medium',
    LOW: 'badge-low',
    CONFIG: 'badge-config',
  }[severity] || 'badge bg-gray-100 text-gray-700';

  return <span className={className}>{severity}</span>;
}

export function DifficultyBadge({ level }: { level: string }) {
  const className = {
    BASIC: 'badge bg-green-100 text-green-700',
    INTERMEDIATE: 'badge bg-orange-100 text-orange-700',
    ADVANCED: 'badge bg-red-100 text-red-700',
  }[level] || 'badge bg-gray-100 text-gray-700';

  return <span className={className}>{level}</span>;
}
