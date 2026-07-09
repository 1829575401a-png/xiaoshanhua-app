// pages/review/review.js — 待巩固（错题本）
const { getReviewList } = require('../../services/user.js');
const mock = require('../../services/mock.js');

Page({
  data: {
    list: [],
    count: 0,
    loading: true,
  },

  onShow() {
    this.loadList();
  },

  onPullDownRefresh() {
    this.loadList().then(() => wx.stopPullDownRefresh());
  },

  async loadList() {
    this.setData({ loading: true });
    let list = null;
    try {
      list = await getReviewList();
    } catch (e) {
      list = mock.mockReviewList();
    }
    if (list) {
      this.setData({ list, count: list.length, loading: false });
    } else {
      this.setData({ loading: false });
    }
  },

  onItemTap(e) {
    const { id, scene } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/learn/learn?sceneId=${scene}&sentenceId=${id}&idx=0`,
    });
  },
});
