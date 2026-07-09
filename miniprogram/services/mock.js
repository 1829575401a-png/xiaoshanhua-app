// services/mock.js — MVP 演示用本地语料与用户数据
// 说明：语料为示例内容，正式上线前需由语言学顾问 + 发音人审定
// 音频地址为占位符，实际由发音人录制后替换

const SCENES = [
  {
    id: 'scene_market',
    name: '菜市场',
    icon: '🥬',
    order: 1,
    sentences: [
      { id: 'm1', xiaoshan: '个菜新鲜弗新鲜？', pinyin: 'geʔ tsʰɛ ɕiɲɕiɛ fəʔ', mandarin: '这个菜新鲜吗？', difficulty: 2 },
      { id: 'm2', xiaoshan: '来两斤', pinyin: 'lɛ liã tɕiŋ', mandarin: '来两斤', difficulty: 1 },
      { id: 'm3', xiaoshan: '多少钱？', pinyin: 'tuo ʑiɔ tsʰiã', mandarin: '多少钱？', difficulty: 1 },
      { id: 'm4', xiaoshan: '太贵了，便宜点', pinyin: 'tʰɛ kuei lɛ, bɛ ɲi ti', mandarin: '太贵了，便宜点', difficulty: 2 },
      { id: 'm5', xiaoshan: '有葱弗？', pinyin: 'ɦiəu tsʰoŋ fəʔ', mandarin: '有葱吗？', difficulty: 2 },
      { id: 'm6', xiaoshan: '五块两', pinyin: 'ŋ kʰuɛ liã', mandarin: '五块二', difficulty: 1 },
    ],
  },
  {
    id: 'scene_hospital',
    name: '看病就医',
    icon: '🏥',
    order: 2,
    sentences: [
      { id: 'h1', xiaoshan: '挂个号', pinyin: 'ko ka ɦɔ', mandarin: '挂个号', difficulty: 1 },
      { id: 'h2', xiaoshan: '我头疼', pinyin: 'ŋ dɤ dɤ', mandarin: '我头疼', difficulty: 1 },
      { id: 'h3', xiaoshan: '在哪里取药？', pinyin: 'zɛ nɑ lɪ tɕʰyøʔ', mandarin: '在哪里取药？', difficulty: 2 },
      { id: 'h4', xiaoshan: '要排队弗？', pinyin: 'iɔ dʑiɛ dɤ fəʔ', mandarin: '要排队吗？', difficulty: 2 },
      { id: 'h5', xiaoshan: '几楼看？', pinyin: 'tɕi lɤ kʰø̃', mandarin: '几楼看？', difficulty: 1 },
    ],
  },
  {
    id: 'scene_traffic',
    name: '交通出行',
    icon: '🚌',
    order: 3,
    sentences: [
      { id: 't1', xiaoshan: '去人民路哪亨走？', pinyin: 'tɕʰyø ʐiəŋ lɤ na ɦã tsɤ', mandarin: '去人民路怎么走？', difficulty: 3 },
      { id: 't2', xiaoshan: '勒此地落车', pinyin: 'ləʔ tsʰɪ di loʔ tsʰo', mandarin: '在这里下车', difficulty: 2 },
      { id: 't3', xiaoshan: '一位几钿？', pinyin: 'iəʔ uei tɕi dʑi', mandarin: '一位多少钱？', difficulty: 2 },
      { id: 't4', xiaoshan: '末班车几点？', pinyin: 'məʔ pæ tsʰø ti tɕi', mandarin: '末班车几点？', difficulty: 3 },
    ],
  },
  {
    id: 'scene_office',
    name: '办事大厅',
    icon: '🏢',
    order: 4,
    sentences: [
      { id: 'o1', xiaoshan: '勒几楼？', pinyin: 'ləʔ tɕi lɤ', mandarin: '在几楼？', difficulty: 1 },
      { id: 'o2', xiaoshan: '带点啥材料？', pinyin: 'ta tiã sa dzɛ liɔ', mandarin: '带什么材料？', difficulty: 2 },
      { id: 'o3', xiaoshan: '要排队弗？', pinyin: 'iɔ dʑiɛ dɤ fəʔ', mandarin: '要排队吗？', difficulty: 2 },
      { id: 'o4', xiaoshan: '啥辰光好办？', pinyin: 'sa zəŋ kuã ɦɔ bɛ', mandarin: '什么时候好办？', difficulty: 3 },
    ],
  },
  {
    id: 'scene_family',
    name: '家庭交流',
    icon: '👨‍👩‍👧',
    order: 5,
    sentences: [
      { id: 'f1', xiaoshan: '饭吃了弗？', pinyin: 'vɛ tɕʰiəʔ lɛ fəʔ', mandarin: '吃饭了吗？', difficulty: 1 },
      { id: 'f2', xiaoshan: '今朝菜弗错', pinyin: 'tɕiŋ tsɔ tsʰɛ fəʔ tsʰu', mandarin: '今天菜不错', difficulty: 2 },
      { id: 'f3', xiaoshan: '倷身体好弗？', pinyin: 'nɔŋ sɛn tʰi ɦɔ fəʔ', mandarin: '你身体好吗？', difficulty: 2 },
      { id: 'f4', xiaoshan: '姆妈勒屋里', pinyin: 'm̩ ma ləʔ oʔ lɪ', mandarin: '妈妈在家里', difficulty: 2 },
      { id: 'f5', xiaoshan: '囡囡困着了', pinyin: 'nɔ nɔ kʰuəŋ dʑʰa lɛ', mandarin: '小孩睡着了', difficulty: 3 },
    ],
  },
  {
    id: 'scene_work',
    name: '职场寒暄',
    icon: '💼',
    order: 6,
    sentences: [
      { id: 'w1', xiaoshan: '今朝忙弗忙？', pinyin: 'tɕiŋ tsɔ mã fəʔ mã', mandarin: '今天忙不忙？', difficulty: 2 },
      { id: 'w2', xiaoshan: '吃饭了弗？', pinyin: 'tɕʰiəʔ vɛ lɛ fəʔ', mandarin: '吃饭了吗？', difficulty: 1 },
      { id: 'w3', xiaoshan: '周末去何里？', pinyin: 'tsɤ muɪ tɕʰyø ɦa lɪ', mandarin: '周末去哪里？', difficulty: 3 },
      { id: 'w4', xiaoshan: '多谢侬', pinyin: 'tu ʑia nɔŋ', mandarin: '多谢你', difficulty: 1 },
    ],
  },
];

// 给每个句子挂上音频占位地址
SCENES.forEach(s => {
  s.sentences.forEach((sent, i) => {
    sent.id = `${s.id}_${i + 1}`;
    sent.scene_id = s.id;
    sent.order = i + 1;
    sent.audio_url = `https://cdn.xiaoshanhua.app/audio/${sent.id}.mp3`;
    sent.audio_slow_url = `https://cdn.xiaoshanhua.app/audio/${sent.id}_slow.mp3`;
  });
});

/**
 * 返回场景列表（带进度、锁定状态）
 */
function mockScenes(progressMap = {}) {
  let prevDone = true;
  return SCENES.map(s => {
    const total = s.sentences.length;
    const learned = progressMap[s.id] || 0;
    const progress = Math.round((learned / total) * 100);
    const locked = !prevDone;
    prevDone = progress >= 100;
    return {
      id: s.id,
      name: s.name,
      icon: s.icon,
      order: s.order,
      sentence_count: total,
      learned,
      progress,
      locked,
    };
  });
}

/**
 * 返回单个场景的句子列表
 */
function mockSceneDetail(sceneId) {
  const scene = SCENES.find(s => s.id === sceneId);
  if (!scene) return null;
  return {
    id: scene.id,
    name: scene.name,
    icon: scene.icon,
    sentences: scene.sentences,
  };
}

/**
 * 模拟用户概览
 */
function mockUserProfile() {
  return {
    userInfo: { nickName: '新萧山人', avatarUrl: '' },
    streakDays: 3,
    learnedCount: 12,
    avgScore: 78,
    totalPoints: 240,
    checkedInToday: false,
  };
}

/**
 * 模拟成就列表
 */
function mockAchievements() {
  return [
    { id: 'a1', name: '初次开口', icon: '🗣️', description: '完成第一次跟读', unlocked: true },
    { id: 'a2', name: '坚持3天', icon: '🔥', description: '连续打卡3天', unlocked: true },
    { id: 'a3', name: '坚持7天', icon: '🔥🔥', description: '连续打卡7天', unlocked: false },
    { id: 'a4', name: '学完菜场', icon: '🥬', description: '完成菜市场场景', unlocked: false },
    { id: 'a5', name: '学完看病', icon: '🏥', description: '完成看病场景', unlocked: false },
    { id: 'a6', name: '发音达人', icon: '⭐', description: '单句得分≥90', unlocked: false },
  ];
}

/**
 * 模拟 AI 评分返回
 * @param {number} variance 随机扰动幅度
 */
function mockScore(variance = 15) {
  const score = Math.max(55, Math.min(98, 75 + Math.round((Math.random() * 2 - 1) * variance));
  const weak = score < 85
    ? [{ severity: 60, reason: '入声收尾略拖长' }, { severity: 45, reason: '"鲜"字声调偏平' }]
    : [];
  return {
    score,
    mean_similarity: +(score / 100).toFixed(3),
    weak_regions: weak,
    grade: score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'poor',
    highlight: score >= 85 ? '整体语调自然，浊音到位' : '',
  };
}

module.exports = {
  SCENES,
  mockScenes,
  mockSceneDetail,
  mockUserProfile,
  mockAchievements,
  mockScore,
};
