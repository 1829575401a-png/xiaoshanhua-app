// services/score.js — AI 语音评分 API

const { post } = require('../utils/request.js');

/**
 * 上传用户录音，获取 AI 发音评分
 * @param {string} sentenceId 当前学习的句子 ID
 * @param {string} tempFilePath 小程序录音临时文件路径（mp3）
 * @param {Function} onProgress 进度回调（可选）
 * @returns {Promise<Object>} { score, mean_similarity, weak_regions, grade }
 */
function scorePronunciation(sentenceId, tempFilePath, onProgress) {
  return new Promise((resolve, reject) => {
    // 读取本地录音文件，转为 base64 上传（小程序无 formData 直传文件，用 base64）
    wx.getFileSystemManager().readFile({
      filePath: tempFilePath,
      encoding: 'base64',
      success: async (res) => {
        try {
          if (onProgress) onProgress(0.3);
          const resp = await post('/score/pronounce', {
            sentence_id: sentenceId,
            audio_base64: res.data,
            format: 'mp3',
          }, { needAuth: true, timeout: 8000 });

          if (onProgress) onProgress(1);
          resolve(resp);
        } catch (err) {
          reject(err);
        }
      },
      fail: (err) => {
        reject({ code: 'READ_FAIL', message: '读取录音失败', detail: err });
      },
    });
  });
}

module.exports = { scorePronunciation };
