// utils/request.js — 统一网络请求封装
// 处理：登录态注入、401 自动刷新、错误统一提示

const BASE_URL = 'https://your-api-domain.com/api/v1';

/**
 * 统一请求方法
 * @param {Object} options { url, method, data, header, needAuth }
 */
function request(options) {
  const { url, method = 'GET', data = {}, header = {}, needAuth = true } = options;

  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('access_token');
    const finalHeader = {
      'Content-Type': 'application/json',
      ...header,
    };
    if (needAuth && token) {
      finalHeader['Authorization'] = `Bearer ${token}`;
    }

    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: finalHeader,
      success: (res) => {
        const { statusCode, data: resp } = res;
        if (statusCode === 200 || statusCode === 201) {
          resolve(resp);
        } else if (statusCode === 401) {
          // Token 失效，触发重新登录
          wx.removeStorageSync('access_token');
          const app = getApp();
          if (app) app.globalData.isLogin = false;
          reject({ code: 401, message: '登录已失效，请重新登录' });
        } else if (statusCode >= 500) {
          reject({ code: statusCode, message: '服务器开小差了，请稍后再试' });
        } else {
          reject({
            code: statusCode,
            message: (resp && resp.message) || '请求失败',
          });
        }
      },
      fail: (err) => {
        reject({ code: -1, message: '网络不给力，请检查网络', detail: err });
      },
    });
  });
}

// 常用 HTTP 动词封装
const get = (url, data, opts = {}) => request({ url, method: 'GET', data, ...opts });
const post = (url, data, opts = {}) => request({ url, method: 'POST', data, ...opts });
const put = (url, data, opts = {}) => request({ url, method: 'PUT', data, ...opts });

module.exports = { request, get, post, put, BASE_URL };
