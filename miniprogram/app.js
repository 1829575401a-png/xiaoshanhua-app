// app.js — 小程序全局逻辑
const auth = require('./utils/auth.js');

App({
  globalData: {
    userInfo: null,
    openid: null,
    // 后端服务地址（开发期可切换为本地/测试环境）
    baseUrl: 'https://your-api-domain.com/api/v1',
    // 标记是否已登录
    isLogin: false,
  },

  onLaunch() {
    // 启动时检查登录态
    const token = wx.getStorageSync('access_token');
    if (token) {
      this.globalData.isLogin = true;
      this.globalData.openid = wx.getStorageSync('openid');
    }
    console.log('萧山话学堂小程序启动');
  },

  onShow() {
    // 可在此做数据上报、分享来源统计等
  },

  onHide() {
    // 小程序进入后台
  },

  // 全局登录方法，供各页面调用
  async ensureLogin() {
    if (this.globalData.isLogin) return true;
    try {
      const user = await auth.login();
      this.globalData.userInfo = user;
      this.globalData.openid = user.openid;
      this.globalData.isLogin = true;
      return true;
    } catch (err) {
      console.error('登录失败', err);
      return false;
    }
  },
});
