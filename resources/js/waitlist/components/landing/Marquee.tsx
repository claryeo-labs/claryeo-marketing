const PHRASES = ['Less admin', 'More clarity', 'Your money, connected', 'Your time, back'];

// Static: no state, no motion — the scroll is a CSS keyframe animation, so this stays a
// server component.
export const Marquee = () => (
    <div
        className="marquee"
        data-testid="feature-marquee"
        aria-label="Invoicing. Bank sync. Payment matching. Tax clarity. More life."
    >
        <div className="marquee-track" aria-hidden="true">
            {[0, 1, 2].map((i) => (
                <div className="marquee-group" key={i}>
                    {PHRASES.map((text, j) => (
                        <span key={text} className={j % 2 ? 'marquee-italic' : ''}>
                            {text}
                            <span className="marquee-star">✳</span>
                        </span>
                    ))}
                </div>
            ))}
        </div>
    </div>
);
