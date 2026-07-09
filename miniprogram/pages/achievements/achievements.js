// pages/achievements/achievements.js
const { getAchievements } = require('../../services/user.js');
const mock = require('../../services/mock.js');

Page({
  data: {
    achievements: [],
    unlockedCount: 0,
    total: 0,
  },

  onShow() {
    this.loadAchievements();
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
