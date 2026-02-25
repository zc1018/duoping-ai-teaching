import type { QuestionMaterial } from '../types/question';

export const mockQuestion: QuestionMaterial = {
    id: "q_001",
    type: 'single',
    title: "马克思主义政治经济学 - 剩余价值",
    stem: "在资本主义生产过程中，劳动力商品的使用价值是价值的源泉。资本家购买劳动力后，通过消费劳动力，不仅生产出劳动力自身的价值，而且生产出超过劳动力自身价值的剩余价值。这说明（ ）。",
    options: [
        { id: "opt_A", label: "A", content: "剩余价值是由流通领域产生的" },
        { id: "opt_B", label: "B", content: "资本家在等价交换中获得了剩余价值" },
        { id: "opt_C", label: "C", content: "劳动力成为商品是货币转化为资本的前提" },
        { id: "opt_D", label: "D", content: "剩余价值的产生违反了价值规律" }
    ],
    anchors: [
        {
            id: "anchor_q1",
            range: { start: 0, end: 0 },
            content: "剩余价值是由流通领域产生的",
            type: "error_prone",
            description: "【错误解析】流通领域（买卖）只能实现价值，不能创造价值。剩余价值必须在“生产领域”中，即劳动力被使用的过程中产生。\n【命题陷阱】混淆了价值产生和价值实现的领域。",
            teachingPrompt: "为什么说这个选项是错的？如果通过低买高卖能赚钱，那整个社会总财富增加了吗？"
        },
        {
            id: "anchor_q2",
            range: { start: 0, end: 0 },
            content: "资本家在等价交换中获得了剩余价值",
            type: "important",
            description: "【正确解析】这是资本总公式的矛盾。表面上，资本家按劳动力价值支付工资（等价交换）；实际上，劳动力创造的价值 > 劳动力价值（剩余价值）。\n【核心考点】劳动力商品的使用价值的特殊性。",
            teachingPrompt: "这个选项看起来很矛盾（既等价交换，又获得了额外价值），这究竟是怎么做到的？秘密在于什么商品？"
        },
        {
            id: "anchor_q3",
            range: { start: 0, end: 0 },
            content: "劳动力成为商品",
            type: "important",
            description: "【深度辨析】只有劳动力成为商品，货币才能转化为资本。因为只有劳动力能创造出比自身价值更大的价值。",
            teachingPrompt: "为什么说劳动力成为商品是关键？如果资本家买来的是机器和棉花，放在那里不使用劳动力，能自动生钱吗？"
        }
    ]
};
