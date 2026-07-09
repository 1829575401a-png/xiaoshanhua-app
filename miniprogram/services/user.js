// services/user.js — 用户/学习数据 API

const { get } = require('../utils/request.js');

/**
 * 获取用户概览（积分、连续打卡、已学句数等）
 */
function getUserProfile() {
  return get('/user/profile', {}, { needAuth: true });
}

/**
 * 获取学习记录（近 30 天打卡热力图、已解锁成就）
 */
function getLearningStats() {
  return get('/user/learning-stats', {}, { needAuth: true });
}

/**
 * 获取成就列表（含解锁状态）
 */
function getAchievements() {
  return get('/achievements', {}, { needAuth: true });
}

module.exports = { getUserProfile, getLearningStats, getAchievements };
