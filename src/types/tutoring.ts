export type AnchorType = 'important' | 'error_prone' | 'skip';

export interface Anchor {
    id: string;
    range: { start: number; end: number }; // Character index or selector
    content: string; // The selected text
    type: AnchorType;
    description: string; // Context for AI (e.g., "这里的主语是...")
    teachingPrompt?: string; // Initial question (e.g., "你能找出这句话的主语吗？")
}

export interface Article {
    id: string;
    title: string;
    content: string; // Markdown or HTML
    anchors: Anchor[];
}
