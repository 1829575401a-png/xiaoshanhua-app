// utils/auth.js — 微信登录与令牌管理

/**
 * 执行微信登录流程：
 * 1. wx.login 获取 code
 * 2. 调用后端 /auth/wechat-login 用 code 换取 token + 用户资料
 * 3. 持久化 token/openid/userInfo
 * @returns {Promise<Object>} 用户信息
 */
function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: async (res) => {
        if (!res.code) {
          reject({ code: 'NO_CODE', message: '微信登录失败：未获取到 code' });
          return;
        }
        try {
          const { request } = require('./request.js');
          const resp = await request({
            url: '/auth/wechat-login',
            method: 'POST',
            data: { code: res.code },
            needAuth: false,
          });
          // 持久化登录态
          wx.setStorageSync('access_token', resp.access_token);
          wx.setStorageSync('refresh_token', resp.refresh_token);
          wx.setStorageSync('openid', resp.user.openid);
          wx.setStorageSync('userInfo', resp.user);
          const app = getApp();
          if (app) {
            app.globalData.isLogin = true;
            app.globalData.openid = resp.user.openid;
            app.globalData.userInfo = resp.user;
          }
          resolve(resp.user);
        } catch (err) {
          reject(err);
        }
      },
      fail: (err) => {
        reject({ code: 'LOGIN_FAIL', message: '微信登录接口调用失败', detail: err });
      },
    });
  });
}

/**
 * 获取已登录用户资料（优先缓存）
 */
function getStoredUser() {
  return wx.getStorageSync('userInfo') || null;
}

/**
 * 退出登录（清理本地态）
 */
function logout() {
  wx.removeStorageSync('access_token');
  wx.removeStorageSync('refresh_token');
  wx.removeStorageSync('openid');
  wx.removeStorageSync('userInfo');
  const app = getApp();
  if (app) {
    app.globalData.isLogin = false;
    app.globalData.openid = null;
    app.globalData.userInfo = null;
  }
}

/**
 * 静默检查登录态（不弹窗）
 */
function isLoggedIn() {
  return !!wx.getStorageSync('access_token');
}

module.exports = { login, getStoredUser, logout, isLoggedIn };
