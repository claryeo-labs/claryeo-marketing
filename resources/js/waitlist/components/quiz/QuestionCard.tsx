import type { Question } from '@/waitlist/lib/types';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { FeatureIcon } from '@/waitlist/components/Brand';
import { Button } from '@/waitlist/components/ui/button';

const KEYS = ['a', 'b', 'c', 'd'];

export interface QuestionCardProps {
    question: Question;
    value: string | readonly string[] | undefined;
    onChange: (value: string | string[]) => void;
    onNext: () => void;
}

export const QuestionCard = ({ question, value, onChange, onNext }: QuestionCardProps) => {
    const heading = useRef<HTMLHeadingElement>(null);
    const selected = question.multiple ? (Array.isArray(value) ? value : []) : value;
    const picks: readonly string[] = question.multiple ? (selected as readonly string[]) : [];
    const maxChoices = question.max_choices ?? 0;
    const valid = question.multiple ? picks.length > 0 : !!selected;

    const choose = (id: string) => {
        if (!question.multiple) return onChange(id);
        if (picks.includes(id)) return onChange(picks.filter((v) => v !== id));
        if (picks.length < maxChoices) onChange([...picks, id]);
    };

    // Move focus to the new question's heading so a keyboard/screen-reader user lands on it
    // rather than at the top of the document.
    useEffect(() => {
        heading.current?.focus({ preventScroll: true });
    }, [question.id]);

    // Re-registered every render on purpose: `choose`/`valid` close over the current
    // selection, and the original does the same.
    useEffect(() => {
        const handle = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const tag = target?.tagName ?? '';
            if (e.ctrlKey || e.metaKey || e.altKey || ['INPUT', 'TEXTAREA'].includes(tag)) return;
            const index = KEYS.indexOf(e.key.toLowerCase());
            const option = index >= 0 ? question.options[index] : undefined;
            if (option) {
                e.preventDefault();
                choose(option.id);
            }
            if (e.key === 'Enter' && valid && !['BUTTON', 'A'].includes(tag)) {
                e.preventDefault();
                onNext();
            }
        };
        window.addEventListener('keydown', handle);
        return () => window.removeEventListener('keydown', handle);
    });

    return (
        <div>
            <span className="question-eyebrow" data-testid="question-eyebrow">
                {question.eyebrow}
            </span>
            <h1 className="question-title" data-testid="question-title" ref={heading} tabIndex={-1}>
                {question.title}
            </h1>
            <p className="question-description" data-testid="question-description">
                {question.description}
            </p>
            <div className="question-options" role="group" aria-label={question.title}>
                {question.options.map((option, i) => {
                    const isSelected = question.multiple ? picks.includes(option.id) : selected === option.id;
                    const atLimit = question.multiple && picks.length >= maxChoices && !isSelected;
                    return (
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.988 }}
                            className={`question-option ${isSelected ? 'selected' : ''}`}
                            aria-pressed={isSelected}
                            disabled={atLimit}
                            onClick={() => choose(option.id)}
                            key={option.id}
                            data-testid={`option-${question.id}-${option.id}`}
                        >
                            <span className="option-icon">
                                <FeatureIcon name={option.icon} size={21} />
                            </span>
                            <span className="option-copy">
                                <strong>{option.label}</strong>
                                <span>{option.detail}</span>
                            </span>
                            <span className={`option-key ${question.multiple ? 'square' : ''}`}>
                                {/* A ranked question shows the rank, not a tick: the order these were
                                        clicked is the answer, so it has to be visible and correctable. */}
                                {isSelected ? (
                                    question.multiple ? picks.indexOf(option.id) + 1 : <Check size={13} />
                                ) : (
                                    String.fromCharCode(65 + i)
                                )}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
            <div className="question-action-row">
                <Button
                    className="pill-button continue-button"
                    data-testid="quiz-continue"
                    disabled={!valid}
                    onClick={onNext}
                >
                    Continue{' '}
                    <span className="button-arrow">
                        <ArrowRight size={18} />
                    </span>
                </Button>
                <span className="keyboard-note" data-testid="selection-hint">
                    {question.multiple
                        ? `${picks.length} OF ${maxChoices} RANKED — TAP AGAIN TO REMOVE`
                        : 'PICK ONE TO CONTINUE'}
                </span>
            </div>
        </div>
    );
};
