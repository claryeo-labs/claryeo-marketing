import { Monitor, Moon, Sun } from 'lucide-react';
import type { FC } from 'react';

import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import type { Appearance } from '@/hooks/use-appearance';

type AppearanceToggleProps = {
    className?: string;
};

const CYCLE: { value: Appearance; label: string; Icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', Icon: Sun },
    { value: 'dark', label: 'Dark', Icon: Moon },
    { value: 'system', label: 'System', Icon: Monitor },
];

/**
 * Light → dark → system theme switcher. One button, one click per state --
 * three options don't earn a menu.
 */
const AppearanceToggle: FC<AppearanceToggleProps> = ({ className = '' }) => {
    const [{ appearance }, { updateAppearance }] = useAppearance();

    const index = Math.max(
        CYCLE.findIndex((option) => option.value === appearance),
        0,
    );
    const current = CYCLE[index];
    const next = CYCLE[(index + 1) % CYCLE.length];
    const { Icon } = current;

    return (
        <div className={className}>
            <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`Theme: ${current.label}. Switch to ${next.label}.`}
                title={`Theme: ${current.label}`}
                onClick={() => updateAppearance(next.value)}
            >
                <Icon className="h-5 w-5" />
                <span className="sr-only">
                    Theme: {current.label}. Switch to {next.label}.
                </span>
            </Button>
        </div>
    );
};

export default AppearanceToggle;
