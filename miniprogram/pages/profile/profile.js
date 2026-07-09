// pages/profile/profile.js
const { getLearningStats } = require('../../services/user.js');
const mock = require('../../services/mock.js');
const share = require('../../utils/share.js');
const subscribe = require('../../utils/subscribe.js');

const DEFAULT_AVATAR = 'https://via.placeholder.com/100';

Page({
  data: {
    defaultAvatar: DEFAULT_AVATAR,
    userInfo: {},
    streakDays: 0,
    learnedCount: 0,
    avgScore: 0,
    totalPoints: 0,
    lastLearnedText: '',
    heatWeeks: [],
    subscribeEnabled: !!subscribe.REMIND_TMPL_ID,
  },

  onShow() {
    this.loadStats();
  },

  onLoad() {
    // 启用右上角分享菜单（朋友圈需配置海报图）
    const menus = share.timelineEnabled()
      ? ['shareAppMessage', 'shareTimeline']
      : ['shareAppMessage'];
    wx.showShareMenu({ menus, success() {}, fail() {} });
  },

  // 分享给朋友：打卡进度卡片
  onShareAppMessage() {
    const { streakDays, learnedCount } = this.data;
    return share.buildCheckInShare(streakDays, learnedCount);
  },

  // 分享到朋友圈（需 SHARE_POSTER 配置）
  onShareTimeline() {
    if (!share.timelineEnabled()) return undefined;
    const { streakDays } = this.data;
    return {
      title: `连续打卡 ${streakDays} 天 · 萧山话学堂`,
      query: '',
      imageUrl: share.SHARE_POSTER || undefined,
    };
  },

  async loadStats() {
    let stats = null;
    try {
      stats = await getLearningStats();
    } catch (e) {
      stats = this.buildMockStats();
    }
    if (stats) {
      this.setData({
        userInfo: stats.userInfo || {},
        streakDays: stats.streakDays || 0,
        learnedCount: stats.learnedCount || 0,
        avgScore: stats.avgScore || 0,
        totalPoints: stats.totalPoints || 0,
        lastLearnedText: stats.lastLearnedText || '',
        heatWeeks: stats.heatWeeks || this.buildMockStats().heatWeeks,
      });
    }
  },

  // 本地生成 30 天打卡热力（演示用）
  buildMockStats() {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      // 简单伪随机：周末概率高
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const r = (d.getDate() * 7 + d.getMonth()) % 10;
      let level = 0;
      if (isWeekend) level = r > 5 ? 3 : 2;
      else level = r > 7 ? 1 : (r > 3 ? 2 : 0);
      days.push({ d: i, level });
    }
    // 按 7 天一组分周
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return {
      userInfo: { nickName: '新萧山人', avatarUrl: '' },
      streakDays: 3,
      learnedCount: 12,
      avgScore: 78,
      totalPoints: 240,
      lastLearnedText: '今天学了「个菜新鲜弗新鲜？」得分 85',
      heatWeeks: weeks,
    };
  },

  // 订阅开关：点击触发一次性订阅授权
  onToggleSubscribe() {
    if (!subscribe.REMIND_TMPL_ID) {
      wx.showToast({ title: '订阅功能即将开放', icon: 'none' });
      return;
    }
    subscribe.requestReminder().then((accepted) => {
      if (accepted.length) {
        wx.showToast({ title: '已开启每日提醒 ✅', icon: 'none' });
      }
    });
  },
});
