// pages/home/home.js
const { getScenes } = require('../../services/course.js');
const { getUserProfile } = require('../../services/user.js');
const mock = require('../../services/mock.js');

const DEFAULT_AVATAR = 'https://via.placeholder.com/88';

Page({
  data: {
    defaultAvatar: DEFAULT_AVATAR,
    userInfo: {},
    streakDays: 0,
    learnedCount: 0,
    avgScore: 0,
    totalPoints: 0,
    checkedInToday: false,
    scenes: [],
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    // 拉取用户概览
    let profile = null;
    try {
      profile = await getUserProfile();
    } catch (e) {
      profile = mock.mockUserProfile();
    }
    if (profile) {
      this.setData({
        userInfo: profile.userInfo || {},
        streakDays: profile.streakDays || 0,
        learnedCount: profile.learnedCount || 0,
        avgScore: profile.avgScore || 0,
        totalPoints: profile.totalPoints || 0,
        checkedInToday: !!profile.checkedInToday,
      });
    }

    // 拉取场景课程列表
    let scenes = [];
    try {
      scenes = await getScenes();
    } catch (e) {
      scenes = mock.mockScenes();
    }
    this.setData({ scenes });
  },

  onSceneTap(e) {
    const { id, locked } = e.currentTarget.dataset;
    if (locked) {
      wx.showToast({ title: '先完成上一场景吧～', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: `/pages/scene/scene?id=${id}` });
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },
});
