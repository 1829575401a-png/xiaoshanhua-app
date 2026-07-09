// components/score-modal/score-modal.js
Component({
  properties: {
    // 是否可见
    visible: { type: Boolean, value: false },
    // 评分对象 { score, grade, weak_regions, highlight }
    result: { type: Object, value: null },
    // 是否为场景最后一句
    isLast: { type: Boolean, value: false },
  },

  data: {
    displayScore: 0,
    grade: 'good',
    emoji: '🙂',
    gradeText: '',
    weakRegions: [],
    highlight: '',
    _animTimer: null,
  },

  observers: {
    'visible, result': function (visible, result) {
      if (visible && result) {
        this.prepareDisplay(result);
      }
      if (!visible) {
        this.clearAnim();
      }
    },
  },

  methods: {
    prepareDisplay(result) {
      const score = result.score || 0;
      const { grade, emoji, gradeText } = this.classify(score);

      // 薄弱区域展示（最多展示前 3 条，避免过长）
      const weakRegions = (result.weak_regions || []).slice(0, 3).map((r, i) => ({
        label: this.severityLabel(r.severity),
        reason: r.reason || '发音偏差',
        idx: i,
      }));

      this.setData({
        grade, emoji, gradeText,
        weakRegions,
        highlight: result.highlight || '',
      });
      this.animateScore(score);
    },

    classify(score) {
      if (score >= 80) return { grade: 'excellent', emoji: '🎉', gradeText: '发音很棒！' };
      if (score >= 60) return { grade: 'good', emoji: '🙂', gradeText: '还不错，继续练' };
      return { grade: 'poor', emoji: '💪', gradeText: '多练几次会更好' };
    },

    severityLabel(severity) {
      const s = severity || 0;
      if (s >= 70) return '✗ 明显偏差';
      if (s >= 40) return '⚠ 略有偏差';
      return '◔ 轻微偏差';
    },

    // 得分从 0 跳动到实际分数（弹性动画）
    animateScore(target) {
      this.clearAnim();
      let cur = 0;
      const step = Math.max(1, Math.ceil(target / 20));
      const timer = setInterval(() => {
        cur += step;
        if (cur >= target) {
          cur = target;
          this.setData({ displayScore: cur });
          clearInterval(timer);
          return;
        }
        this.setData({ displayScore: cur });
      }, 20);
      this.setData({ _animTimer: timer });
    },

    clearAnim() {
      if (this.data._animTimer) {
        clearInterval(this.data._animTimer);
        this.setData({ _animTimer: null });
      }
    },

    onRetry() {
      this.triggerEvent('retry');
    },
    onNext() {
      this.triggerEvent('next');
    },
    noop() {},
  },
});
