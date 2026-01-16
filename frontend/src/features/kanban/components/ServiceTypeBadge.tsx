import { cn } from '@/lib/utils';
import type { ServiceType } from '../api/tasks.api';

interface ServiceTypeBadgeProps {
  type: ServiceType;
  size?: 'sm' | 'md';
}

const serviceTypeConfig: Record<ServiceType, { label: string; color: string; bg: string }> = {
  BRANDING: { 
    label: 'Branding', 
    color: 'text-purple-700', 
    bg: 'bg-purple-100' 
  },
  LOGO_DESIGN: { 
    label: 'Logo Design', 
    color: 'text-pink-700', 
    bg: 'bg-pink-100' 
  },
  WEB_DESIGN: { 
    label: 'Web Design', 
    color: 'text-blue-700', 
    bg: 'bg-blue-100' 
  },
  UI_UX: { 
    label: 'UI/UX', 
    color: 'text-indigo-700', 
    bg: 'bg-indigo-100' 
  },
  WEBFLOW_DEV: { 
    label: 'Webflow Dev', 
    color: 'text-cyan-700', 
    bg: 'bg-cyan-100' 
  },
  SOCIAL_MEDIA: { 
    label: 'Social Media', 
    color: 'text-orange-700', 
    bg: 'bg-orange-100' 
  },
  PITCH_DECK: { 
    label: 'Pitch Deck', 
    color: 'text-emerald-700', 
    bg: 'bg-emerald-100' 
  },
  MOTION_GRAPHICS: { 
    label: 'Motion Graphics', 
    color: 'text-red-700', 
    bg: 'bg-red-100' 
  },
  ILLUSTRATIONS: { 
    label: 'Illustrations', 
    color: 'text-amber-700', 
    bg: 'bg-amber-100' 
  },
  PRINT_DESIGN: { 
    label: 'Print Design', 
    color: 'text-slate-700', 
    bg: 'bg-slate-100' 
  },
  OTHER: { 
    label: 'Other', 
    color: 'text-gray-700', 
    bg: 'bg-gray-100' 
  },
};

export function ServiceTypeBadge({ type, size = 'sm' }: ServiceTypeBadgeProps) {
  const config = serviceTypeConfig[type] || serviceTypeConfig.OTHER;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.bg,
        config.color,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
    >
      {config.label}
    </span>
  );
}

export { serviceTypeConfig };
