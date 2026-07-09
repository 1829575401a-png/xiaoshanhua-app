// services/course.js — 课程相关 API

const { get, post } = require('../utils/request.js');

/**
 * 获取全部场景课程列表（含进度）
 */
function getScenes() {
  return get('/scenes', {}, { needAuth: true });
}

/**
 * 获取单个场景详情与句子列表
 * @param {string} sceneId
 */
function getSceneDetail(sceneId) {
  return get(`/scenes/${sceneId}`, {}, { needAuth: true });
}

/**
 * 获取单句学习详情（含拼音、释义、音频）
 * @param {string} sentenceId
 */
function getSentence(sentenceId) {
  return get(`/sentences/${sentenceId}`, {}, { needAuth: true });
}

/**
 * 上报学习完成（用于进度/积分/打卡/成就触发）
 * @param {Object} payload { sentenceId, sceneId, score }
 */
function reportLearning(payload) {
  return post('/learning/record', payload, { needAuth: true });
}

module.exports = { getScenes, getSceneDetail, getSentence, reportLearning };
