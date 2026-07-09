// pages/launch/launch.js
Page({
  data: {
    _timer: null,
  },

  onLoad() {
    // 2.5 秒后自动跳转
    this.data._timer = setTimeout(() => {
      this.goNext();
    }, 2500);
  },

  onUnload() {
    if (this.data._timer) clearTimeout(this.data._timer);
  },

  onSkip() {
    if (this.data._timer) clearTimeout(this.data._timer);
    this.goNext();
  },

  goNext() {
    const app = getApp();
    // 已登录 → 进首页；未登录 → 登录页
    if (app && app.globalData.isLogin) {
      wx.switchTab({ url: '/pages/home/home' });
    } else {
      wx.redirectTo({ url: '/pages/login/login' });
    }
  },
});
