// utils/subscribe.js — 订阅消息管理（微信小程序一次性订阅）
//
// 使用方式：
//   learn.js → 学完一句后调 requestReminder() 弹出授权
//   profile.js → 提供"开启提醒"开关
//
// 注意：tmplIds 需在微信公众平台「订阅消息」中申请，
// 上线前替换为真实模板 ID。当前使用演示 ID（不会真推送，但授权流程可走通）。

// TODO: 上线前替换为真实模板 ID
// 在 微信公众平台 → 功能 → 订阅消息 → 选用模板
const REMIND_TMPL_ID = ''; // 例：'aBcDeFgHiJkLmNoPqRsTuVwXyZ1234'

// 订阅时机（仅在这些页面触发，避免骚扰）
const SUBSCRIBE_SCENES = ['learn'];

/**
 * 请求订阅每日打卡提醒
 * @returns {Promise<string[]>} 用户同意的模板 ID 列表
 */
function requestReminder() {
  if (!REMIND_TMPL_ID) {
    console.log('[subscribe] 未配置模板 ID，跳过订阅请求');
    return Promise.resolve([]);
  }
  return new Promise((resolve) => {
    wx.requestSubscribeMessage({
      tmplIds: [REMIND_TMPL_ID],
      success(res) {
        const accepted = REMIND_TMPL_ID in res && res[REMIND_TMPL_ID] === 'accept'
          ? [REMIND_TMPL_ID]
          : [];
        console.log('[subscribe] 授权结果:', accepted.length ? '同意' : '拒绝/忽略');
        resolve(accepted);
      },
      fail(err) {
        console.log('[subscribe] 授权失败:', err.errMsg);
        resolve([]);
      },
    });
  });
}

/**
 * 是否应该在当前页面触发订阅
 * @param {string} pageRoute 当前页面路径
 */
function shouldPrompt(pageRoute) {
  if (!REMIND_TMPL_ID) return false;
  return SUBSCRIBE_SCENES.some(s => pageRoute.indexOf(s) !== -1);
}

module.exports = {
  REMIND_TMPL_ID,
  requestReminder,
  shouldPrompt,
};
