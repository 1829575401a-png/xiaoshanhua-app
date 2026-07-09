// pages/learn/learn.js
const { getSentence, reportLearning } = require('../../services/course.js');
const { scorePronunciation } = require('../../services/score.js');
const audio = require('../../utils/audio.js');
const mock = require('../../services/mock.js');

Page({
  data: {
    sceneId: '',
    sceneName: '',
    sentenceId: '',
    idx: 0,
    total: 1,
    sentence: {},
    showPinyin: false,
    playing: false,
    scoring: false,
    isLast: false,
    lastScore: 0,
    bestScore: 0,
    modalVisible: false,
    scoreResult: null,
  },

  onLoad(options) {
    const { sceneId, sentenceId, idx } = options;
    this.setData({
      sceneId,
      sentenceId,
      idx: parseInt(idx, 10) || 0,
    });
    this.loadSentence(sceneId, sentenceId);
  },

  onUnload() {
    audio.stopCurrent();
  },

  async loadSentence(sceneId, sentenceId) {
    let sent = null;
    try {
      sent = await getSentence(sentenceId);
    } catch (e) {
      // mock 兜底：从本地语料取
      const all = mock.SCENES;
      for (const s of all) {
        const f = s.sentences.find(x => x.id === sentenceId);
        if (f) { sent = f; this.setData({ total: s.sentences.length }); break; }
      }
    }
    if (sent) {
      this.setData({
        sentence: sent,
        sceneName: sent.scene_name || '',
        isLast: this.data.idx >= this.data.total - 1,
      });
    }
  },

  onTogglePinyin() {
    this.setData({ showPinyin: !this.data.showPinyin });
  },

  onPlay() {
    if (this.data.playing) {
      audio.stopCurrent();
      this.setData({ playing: false });
      return;
    }
    audio.playStandard(this.data.sentence.audio_url, {
      onPlay: () => this.setData({ playing: true }),
      onEnd: () => this.setData({ playing: false }),
    });
  },

  onBack() {
    wx.navigateBack();
  },

  // 录音完成 → 调评分 → 弹窗
  async onRecordComplete(e) {
    const { tempFilePath, duration } = e.detail;
    this.setData({ scoring: true });
    // 通知录音按钮进入 processing 态
    const recBtn = this.selectComponent('#recBtn');
    if (recBtn) recBtn.setProcessing();

    try {
      let result;
      try {
        result = await scorePronunciation(this.data.sentenceId, tempFilePath);
      } catch (err) {
        // 后端不可用 → mock 评分（演示）
        result = mock.mockScore();
      }
      this.setData({
        scoring: false,
        modalVisible: true,
        scoreResult: result,
        lastScore: result.score,
        bestScore: Math.max(this.data.bestScore, result.score),
      });
    } catch (err) {
      this.setData({ scoring: false });
      wx.showToast({ title: '评分失败，请重试', icon: 'none' });
    }
  },

  onRecordFail(e) {
    // 录音过短等，已在组件内 toast，这里不重复提示
    console.log('录音失败', e.detail);
  },

  // 弹窗：再试一次
  onModalRetry() {
    this.setData({ modalVisible: false });
  },

  // 弹窗：下一句
  async onModalNext() {
    const isLast = this.data.isLast;
    this.setData({ modalVisible: false });

    // 上报学习完成（进度/积分/打卡/成就），携带薄弱段供复习使用
    try {
      await reportLearning({
        sentence_id: this.data.sentenceId,
        scene_id: this.data.sceneId,
        score: this.data.lastScore,
        weak_regions: (this.data.scoreResult && this.data.scoreResult.weak_regions) || [],
      });
    } catch (e) { /* mock 模式忽略 */ }

    if (isLast) {
      wx.showToast({ title: '🎉 本场景学完啦', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 800);
    } else {
      const nextIdx = this.data.idx + 1;
      // 从本地语料查下一句 ID（后端就绪后改为按 idx 取场景句子列表）
      let nextSentenceId = this.data.sentenceId;
      const scene = mock.SCENES.find(s => s.id === this.data.sceneId);
      if (scene && scene.sentences[nextIdx]) {
        nextSentenceId = scene.sentences[nextIdx].id;
      }
      wx.redirectTo({
        url: `/pages/learn/learn?sceneId=${this.data.sceneId}&sentenceId=${nextSentenceId}&idx=${nextIdx}`,
      });
    }
  },
});
