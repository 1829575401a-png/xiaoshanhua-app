// utils/share.js — 分享文案与深链构造（微信社交分发）
//
// 分享回流路径统一指向首页，好友点击即进入小程序，形成获客闭环。
// SHARE_POSTER：朋友圈分享所需的海报图（须为 https 网络地址）。
//   填空后朋友圈分享自动启用；留空则仅启用"发送给朋友"（快照分享，无需图片）。

const SHARE_POSTER = ''; // 例：'https://cdn.xiaoshanhua.app/share/poster.png'

const DEEPLINK = '/pages/home/home';

/**
 * 打卡分享（我的页）
 * @param {number} streakDays 连续打卡天数
 * @param {number} learnedCount 已学句数
 */
function buildCheckInShare(streakDays, learnedCount) {
  const title = streakDays >= 3
    ? `我在萧山话学堂连续打卡 ${streakDays} 天，新萧山人一起学方言～`
    : `我在萧山话学堂学了 ${learnedCount} 句萧山话，你也来试试？`;
  return {
    title,
    path: DEEPLINK,
    imageUrl: SHARE_POSTER || undefined,
  };
}

/**
 * 成就分享（成就页）
 * @param {number} unlockedCount 已解锁成就数
 * @param {string} topName 最新解锁成就名（可选）
 */
function buildAchievementShare(unlockedCount, topName) {
  const title = topName
    ? `我解锁了「${topName}」成就，萧山话越说越溜！`
    : `我在萧山话学堂已解锁 ${unlockedCount} 个成就，一起来攒徽章～`;
  return {
    title,
    path: DEEPLINK,
    imageUrl: SHARE_POSTER || undefined,
  };
}

/**
 * 是否启用朋友圈分享（需配置海报图）
 */
function timelineEnabled() {
  return !!SHARE_POSTER;
}

module.exports = {
  SHARE_POSTER,
  DEEPLINK,
  buildCheckInShare,
  buildAchievementShare,
  timelineEnabled,
};
