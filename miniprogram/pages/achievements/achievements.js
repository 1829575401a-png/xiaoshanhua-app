// pages/achievements/achievements.js
const { getAchievements } = require('../../services/user.js');
const mock = require('../../services/mock.js');
const share = require('../../utils/share.js');

Page({
  data: {
    achievements: [],
    unlockedCount: 0,
    total: 0,
  },

  onShow() {
    this.loadAchievements();
  },

  onLoad() {
    const menus = share.timelineEnabled()
      ? ['shareAppMessage', 'shareTimeline']
      : ['shareAppMessage'];
    wx.showShareMenu({ menus, success() {}, fail() {} });
  },

  // 分享给朋友：已解锁成就
  onShareAppMessage() {
    const { unlockedCount, achievements } = this.data;
    const top = (achievements || []).find(a => a.unlocked);
    return share.buildAchievementShare(unlockedCount, top ? top.name : '');
  },

  async loadAchievements() {
    let list = null;
    try {
      list = await getAchievements();
    } catch (e) {
      list = mock.mockAchievements();
    }
    if (list) {
      this.setData({
        achievements: list,
        unlockedCount: list.filter(a => a.unlocked).length,
        total: list.length,
      });
    }
  },
});
