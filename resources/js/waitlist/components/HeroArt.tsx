import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { Check, ArrowDownLeft, ArrowUpRight, Sparkles, MoveUpRight } from 'lucide-react';

export const HeroArt = () => {
    const reduced = useReducedMotion();
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useSpring(y, { stiffness: 90, damping: 20 });
    const rotateY = useSpring(x, { stiffness: 90, damping: 20 });
    const move = (e: React.PointerEvent<HTMLDivElement>) => {
        if (reduced || e.pointerType === 'touch') return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set(((e.clientX - r.left) / r.width - 0.5) * 8);
        y.set(-((e.clientY - r.top) / r.height - 0.5) * 8);
    };
    return (
        <motion.div
            className="hero-art"
            onPointerMove={move}
            onPointerLeave={() => {
                x.set(0);
                y.set(0);
            }}
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 1.2 }}
        >
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-coordinates" data-testid="hero-art-caption">
                <span>LESS ADMIN.</span>
                <span>MORE POSSIBILITY. ↗</span>
            </div>
            <motion.div className="art-scene" style={{ rotateX, rotateY, transformPerspective: 1000 }}>
                <div className="portrait-frame">
                    <img
                        src="/images/waitlist/founder.jpg"
                        alt="A creative entrepreneur working comfortably on her laptop"
                        fetchPriority="high"
                    />
                    <div className="portrait-shade" />
                    <span className="photo-cross" aria-hidden="true">
                        +
                    </span>
                </div>
                <div className="art-human-caption" data-testid="portrait-caption">
                    Your business. <em>Your life. In balance.</em>
                </div>
                <motion.div
                    className="floating-card balance-card"
                    animate={reduced ? {} : { y: [0, -7, 0] }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                    data-testid="balance-preview"
                >
                    <div className="card-topline">
                        <span>
                            <span className="tiny-dot" /> YOUR MONEY, IN SYNC
                        </span>
                        <ArrowUpRight size={15} />
                    </div>
                    <div className="balance-figure">
                        ₦4,082,650<span>.00</span>
                    </div>
                    <div className="balance-sub">
                        <span>Estimated balance</span>
                        <span className="positive">↗ Looking up</span>
                    </div>
                    <div className="mini-chart" aria-hidden="true">
                        {[22, 35, 28, 44, 39, 55, 47, 64, 57, 72, 64, 86, 77, 96, 87, 100].map((v, i) => (
                            <div key={i} style={{ height: `${v}%`, opacity: 0.3 + i * 0.043 }} />
                        ))}
                    </div>
                    <div className="chart-bottom">
                        <span>ONE CLEAR PICTURE</span>
                        <span>LESS GUESSWORK</span>
                    </div>
                </motion.div>
                <motion.div
                    className="floating-card payment-card"
                    animate={reduced ? {} : { y: [0, 6, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    data-testid="payment-preview"
                >
                    <div className="payment-icon">
                        <ArrowDownLeft size={19} />
                    </div>
                    <div>
                        <strong>That payment? Matched.</strong>
                        <p>₦45,000 · Invoice #014</p>
                    </div>
                    <span className="payment-check">
                        <Check size={13} />
                    </span>
                </motion.div>
                <div className="time-sticker" aria-hidden="true">
                    <Sparkles size={20} />
                    <span>Goodbye, busywork.</span>
                    <MoveUpRight size={15} />
                </div>
            </motion.div>
            <div className="art-bottom">
                <span className="art-line" />
                <span data-testid="product-preview-label">A LITTLE LOOK AT WHAT’S COMING · ILLUSTRATIVE PREVIEW</span>
            </div>
        </motion.div>
    );
};
