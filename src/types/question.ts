import type { Anchor } from './tutoring';

export type QuestionType = 'single' | 'multiple' | 'analysis';

export interface QuestionOption {
    id: string;
    label: string; // A, B, C, D
    content: string;
}

export interface QuestionMaterial {
    id: string;
    type: QuestionType; // New field
    title: string;
    stem: string;
    options?: QuestionOption[]; // Optional for Analysis questions
    anchors: Anchor[];
    analysis?: string; // Reference analysis for essay questions
    referenceAnswer?: string; // Standard answer for essay
}
