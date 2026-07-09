// pages/login/login.js
const auth = require('../../utils/auth.js');

Page({
  data: {
    loading: false,
  },

  // 微信授权获取用户信息（昵称头像）
  onGetUserInfo(e) {
    if (!e.detail.userInfo) {
      // 用户拒绝授权
      wx.showToast({ title: '需要授权才能开始学习哦', icon: 'none' });
      return;
    }
    this.doLogin(e.detail.userInfo);
  },

  async doLogin(userInfo) {
    this.setData({ loading: true });
    try {
      // 先执行微信登录（获取 code → 后端换 token）
      await auth.login();
      // 再把昵称头像补报到后端（如需）
      this.setData({ loading: false });
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/home/home' });
      }, 600);
    } catch (err) {
      this.setData({ loading: false });
      console.error('登录失败', err);
      const msg = (err && err.message) || '登录失败，请稍后再试';
      wx.showToast({ title: msg, icon: 'none' });
    }
  },
});
