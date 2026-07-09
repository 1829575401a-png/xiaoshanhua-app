// utils/audio.js — 标准发音播放管理
// 统一封装 InnerAudioContext，避免重复创建与内存泄漏

let currentAudio = null;

/**
 * 播放标准发音
 * @param {string} url 音频地址
 * @param {Object} callbacks { onPlay, onEnd, onError }
 */
function playStandard(url, callbacks = {}) {
  // 停止上一个播放
  stopCurrent();

  if (!url) {
    wx.showToast({ title: '暂无音频', icon: 'none' });
    return;
  }

  const audio = wx.createInnerAudioContext();
  audio.src = url;
  currentAudio = audio;

  audio.onPlay(() => {
    callbacks.onPlay && callbacks.onPlay();
  });

  audio.onEnded(() => {
    callbacks.onEnd && callbacks.onEnd();
    currentAudio = null;
  });

  audio.onError((err) => {
    console.error('音频播放失败', err);
    callbacks.onError && callbacks.onError(err);
    wx.showToast({ title: '音频加载失败', icon: 'none' });
    currentAudio = null;
  });

  audio.play();
}

/**
 * 停止当前播放
 */
function stopCurrent() {
  if (currentAudio) {
    try {
      currentAudio.stop();
    } catch (e) {}
    currentAudio = null;
  }
}

module.exports = { playStandard, stopCurrent };
