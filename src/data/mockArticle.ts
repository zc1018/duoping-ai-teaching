import type { Article } from '../types/tutoring';

export const mockArticle: Article = {
    id: "article_001",
    title: "马克思主义基本原理概论 - 物质与意识",
    content: `世界是物质的，物质是标志客观实在的哲学范畴。这种客观实在是人通过感觉感知的，它不依赖于我们的感觉而存在，为我们的感觉所复写、摄影、反映。

**物质的唯一特性是客观实在性。** 物质的根本属性是运动。

意识是物质世界长期发展的产物，是人脑的机能和属性，是客观世界的主观映象。意识从其本质来看是物质世界的主观映象，是客观内容和主观形式的统一。

我们必须坚持一切从实际出发，使主观符合客观，坚持主观和客观具体的历史的统一。`,
    anchors: [
        {
            id: "anchor_1",
            range: { start: 0, end: 6 }, // "世界是物质的" (approx)
            content: "世界是物质的",
            type: "important",
            description: "这是唯物主义的基石。强调世界的本原是物质，而不是意识或神。",
            teachingPrompt: "为什么说'世界是物质的'是唯物主义的基石？这和唯心主义有什么本质区别？"
        },
        {
            id: "anchor_2",
            range: { start: 29, end: 41 }, // "它不依赖于我们的感觉而存在"
            content: "它不依赖于我们的感觉而存在",
            type: "error_prone",
            description: "易错点：不要混淆'客观实在'和'客观存在'。这里强调独立于意识之外。",
            teachingPrompt: "很多同学容易混淆'客观实在'和'客观存在'。你能试着说出它们的区别吗？"
        },
        {
            id: "anchor_3",
            range: { start: 95, end: 104 }, // "客观内容和主观形式"
            content: "客观内容和主观形式",
            type: "important",
            description: "意识的内容是客观的（来源于现实），但形式是主观的（个人的感知、理解）。",
            teachingPrompt: "意识为什么是'客观内容'和'主观形式'的统一？能不能举个例子说明？"
        }
    ]
};
