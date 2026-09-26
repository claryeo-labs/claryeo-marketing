import type { ComponentProps } from 'react';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

/**
 * The shadcn button, flattened: only the `default` variant and `default` size were ever
 * used, so class-variance-authority bought nothing. The class list is byte-identical to
 * what `buttonVariants()` emitted (Tailwind 4 names: `shadow` is now `shadow-sm`,
 * `outline-none` is `outline-hidden`) — `[&_svg]:size-4` in particular is load-bearing, it
 * overrides the `size=` attribute lucide puts on every icon inside a button.
 */
const BUTTON_CLASS =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 h-9 px-4 py-2';

export type ButtonProps = ComponentProps<'button'> & {
    /** Render the single child instead of a <button>, keeping the classes. */
    asChild?: boolean;
};

export function Button({ className, asChild = false, ...props }: ButtonProps) {
    const Comp = asChild ? Slot.Root : 'button';
    return <Comp className={cn(BUTTON_CLASS, className)} {...props} />;
}
