// pages/login/login.js
const auth = require('../../utils/auth.js');

Page({
  data: {
    loading: false,
    avatarUrl: '',
    nickname: '',
    canLogin: false,
  },

  // 点击头像（开发期用普通选择图片）
  onTapAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ avatarUrl: res.tempFiles[0].tempFilePath });
      },
      fail: () => {
        // 用户取消或拒绝，使用默认
        this.setData({ avatarUrl: '' });
      }
    });
  },

  // 输入昵称
  onInputNickname(e) {
    this.setData({ nickname: e.detail.value.trim() });
    this.checkCanLogin();
  },

  // 检查是否可以登录
  checkCanLogin() {
    const { nickname } = this.data;
    this.setData({ canLogin: !!nickname });
  },

  // 执行登录
  async doLogin() {
    if (!this.data.canLogin || this.data.loading) return;

    this.setData({ loading: true });
    try {
      // 微信登录（获取 code → 后端换 token）
      await auth.login();

      // 保存用户信息到本地
      wx.setStorageSync('userInfo', {
        avatarUrl: this.data.avatarUrl,
        nickname: this.data.nickname || '萧山学习者',
      });

      this.setData({ loading: false });
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/home/home' });
      }, 600);
    } catch (err) {
      this.setData({ loading: false });
      console.error('登录失败', err);

      // 开发期 mock 兜底：即使后端不可用也允许进入
      wx.setStorageSync('userInfo', {
        avatarUrl: this.data.avatarUrl,
        nickname: this.data.nickname || '萧山学习者',
      });
      wx.setStorageSync('access_token', 'mock-token');
      getApp().globalData.isLogin = true;

      wx.showToast({ title: '已进入体验模式', icon: 'none' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/home/home' });
      }, 800);
    }
  },
});
