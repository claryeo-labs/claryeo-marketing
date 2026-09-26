import { motion } from 'framer-motion';

// Split out of Brand.tsx so the rest of the brand kit stays server-renderable: this is the
// only piece of it that needs the motion runtime.
export type RevealProps = React.ComponentProps<typeof motion.div> & { delay?: number };

export const Reveal = ({ children, className = '', delay = 0, ...props }: RevealProps) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
        className={className}
        {...props}
    >
        {children}
    </motion.div>
);
