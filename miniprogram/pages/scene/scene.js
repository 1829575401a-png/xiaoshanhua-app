// pages/scene/scene.js
const { getSceneDetail } = require('../../services/course.js');
const mock = require('../../services/mock.js');

Page({
  data: {
    sceneId: '',
    scene: {},
    sentences: [],
    learned: 0,
    total: 0,
  },

  onLoad(options) {
    const sceneId = options.id || '';
    this.setData({ sceneId });
    this.loadScene(sceneId);
  },

  async loadScene(sceneId) {
    let detail = null;
    try {
      detail = await getSceneDetail(sceneId);
    } catch (e) {
      detail = mock.mockSceneDetail(sceneId);
    }
    if (detail) {
      this.setData({
        scene: { id: detail.id, name: detail.name, icon: detail.icon },
        sentences: detail.sentences.map(s => ({ ...s, done: false, bestScore: 0 })),
        total: detail.sentences.length,
        learned: 0,
      });
      wx.setNavigationBarTitle({ title: detail.name });
    }
  },

  onSentenceTap(e) {
    const { id, idx } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/learn/learn?sceneId=${this.data.sceneId}&sentenceId=${id}&idx=${idx}` });
  },
});
