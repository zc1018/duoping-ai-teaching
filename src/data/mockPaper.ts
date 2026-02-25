import type { QuestionMaterial } from '../types/question';
import { mockQuestion } from './mockQuestion';

// Question 2: Single Choice
const mockQuestion2: QuestionMaterial = {
    id: "q_002",
    type: 'single',
    title: "马克思主义哲学 - 辩证法",
    stem: "“沉舟侧畔千帆过，病树前头万木春。”这两句诗包含的哲学道理是（ ）。",
    options: [
        { id: "opt_2A", label: "A", content: "矛盾是事物发展的动力" },
        { id: "opt_2B", label: "B", content: "事物是本质和现象的统一" },
        { id: "opt_2C", label: "C", content: "新事物代替旧事物是事物发展的趋势" },
        { id: "opt_2D", label: "D", content: "事物的发展是量变和质变的统一" }
    ],
    anchors: [
        {
            id: "a_q2_1",
            range: { start: 0, end: 0 },
            content: "沉舟侧畔千帆过",
            type: "important",
            description: "意喻新事物蓬勃发展。",
            teachingPrompt: "如何理解“沉舟”与“千帆”的关系？"
        }
    ]
};

// Question 6: Multiple Choice (New)
const mockQuestion6: QuestionMaterial = {
    id: "q_006",
    type: 'multiple',
    title: "马克思主义原理 - 唯物史观",
    stem: "马克思认为：“在没有任何前提的地方，是没有什么历史的。”这里的“前提”包括（ ）。",
    options: [
        { id: "opt_6A", label: "A", content: "从事实际活动的人" },
        { id: "opt_6B", label: "B", content: "通过实践创造出来的物质生活条件" },
        { id: "opt_6C", label: "C", content: "进行物质生产所必需的自然条件" },
        { id: "opt_6D", label: "D", content: "人们的意识形态" }
    ],
    anchors: [
        {
            id: "a_q6_1",
            range: { start: 0, end: 0 },
            content: "没有任何前提的地方",
            type: "important",
            description: "历史唯物主义认为历史的前提是现实的人及其活动。",
            teachingPrompt: "唯物史观的出发点是什么？是观念还是现实的人？"
        }
    ]
};

// Question 7: Analysis Question (New)
const mockQuestion7: QuestionMaterial = {
    id: "q_007",
    type: 'analysis',
    title: "毛中特 - 共同富裕",
    stem: "结合材料，分析为什么说“共同富裕是社会主义的本质要求”，并说明如何扎实推动共同富裕。",
    referenceAnswer: "（1）共同富裕是社会主义的本质要求。解放生产力，发展生产力，消灭剥削，消除两极分化，最终达到共同富裕。\n（2）推动共同富裕，要鼓励勤劳创新致富，坚持基本经济制度，尽力而为量力而行，坚持循序渐进。",
    anchors: [
        {
            id: "a_q7_1",
            range: { start: 0, end: 0 },
            content: "社会主义的本质要求",
            type: "important",
            description: "本质要求是邓小平理论的核心概括。",
            teachingPrompt: "回顾一下邓小平关于社会主义本质的论述，五个短语分别是什么？"
        },
        {
            id: "a_q7_2",
            range: { start: 0, end: 0 },
            content: "扎实推动共同富裕",
            type: "important",
            description: "这是一个长期的历史过程，不能一蹴而就。",
            teachingPrompt: "为什么说共同富裕不是整齐划一的平均主义？"
        }
    ]
};

export const mockPaper: QuestionMaterial[] = [
    mockQuestion,
    mockQuestion2,
    mockQuestion6,
    mockQuestion7
];
