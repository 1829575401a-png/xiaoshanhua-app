// components/record-button/record-button.js
// 长按录音按钮组件
// 状态机：idle → recording → processing → idle
// 配置：mp3 / 16kHz / 最长 15s / 单声道（满足 PRD 7.4）

Component({
  properties: {
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false,
    },
    // 最短录音时长（秒），不足则不上传
    minDuration: {
      type: Number,
      value: 1,
    },
    // 最长录音时长（毫秒）
    maxDuration: {
      type: Number,
      value: 15000,
    },
  },

  data: {
    state: 'idle',     // idle | recarding | processing
    tipText: '按住录音跟读',
    seconds: 0,
    _recManager: null,
    _startAt: 0,
    _timer: null,
    _tempFilePath: '',
  },

  lifetimes: {
    attached() {
      this.initRecorder();
    },
    detached() {
      this.clearTimer();
      const mgr = this.data._recManager;
      if (mgr) {
        try { mgr.stop(); } catch (e) {}
      }
    },
  },

  methods: {
    initRecorder() {
      const mgr = wx.getRecorderManager();
      mgr.onStart(() => {
        this.clearTimer();
        const timer = setInterval(() => {
          const elapsed = (Date.now() - this.data._startAt) / 1000;
          this.setData({ seconds: elapsed.toFixed(1) });
        }, 100);
        this.setData({ _timer: timer, state: 'recording', tipText: '松开结束' });
      });
      mgr.onStop((res) => {
        this.clearTimer();
        const duration = (Date.now() - this.data._startAt) / 1000;
        this.setData({ seconds: 0, state: 'idle', tipText: '按住录音跟读' });
        // 时长校验
        if (duration < this.data.minDuration) {
          wx.showToast({ title: '录音太短，请重新录制', icon: 'none' });
          this.triggerEvent('fail', { reason: 'too_short', duration });
          return;
        }
        // 回调父页面（携带临时路径与时长）
        this.triggerEvent('complete', {
          tempFilePath: res.tempFilePath,
          duration: Math.round(duration * 10) / 10,
        });
      });
      mgr.onError((err) => {
        this.clearTimer();
        this.setData({ state: 'idle', seconds: 0, tipText: '按住录音跟读' });
        console.error('录音错误', err);
        this.triggerEvent('error', { err });
      });
      // 录音被打断（来电等）
      mgr.onInterruptionBegin(() => {
        this.clearTimer();
        this.setData({ state: 'idle', seconds: 0, tipText: '录音已取消' });
        wx.showToast({ title: '录音已取消', icon: 'none' });
      });
      this.setData({ _recManager: mgr });
    },

    // 手指按下：请求权限并开始录音
    onPressStart() {
      if (this.data.disabled || this.data.state === 'recording') return;

      // 权限检查
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.record'] === false) {
            // 曾拒绝过 → 引导去设置
            wx.showModal({
              title: '需要麦克风权限',
              content: '请在设置中开启麦克风权限后重试',
              confirmText: '去设置',
              success: (m) => { if (m.confirm) wx.openSetting(); },
            });
            return;
          }
          this.startRecording();
        },
        fail: () => this.startRecording(),
      });
    },

    startRecording() {
      const mgr = this.data._recManager;
      if (!mgr) return;
      this.setData({ _startAt: Date.now() });
      
      try {
        mgr.start({
          duration: this.data.maxDuration,
          format: 'mp3',
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 48000,
          frameSize: 10,
        });
      } catch (err) {
        // 开发期：隐私协议未配置时走 mock
        console.warn('录音API失败，进入模拟模式', err);
        this.mockRecording();
      }
    },

    // 模拟录音（开发期备用）
    mockRecording() {
      this.setData({ state: 'recording', tipText: '松开结束' });
      const timer = setInterval(() => {
        const elapsed = (Date.now() - this.data._startAt) / 1000;
        this.setData({ seconds: elapsed.toFixed(1) });
      }, 100);
      this.setData({ _timer: timer });
    },

    // 手指抬起：停止录音
    onPressEnd() {
      if (this.data.state !== 'recording') return;
      this.clearTimer();
      const duration = (Date.now() - this.data._startAt) / 1000;
      this.setData({ seconds: 0, state: 'idle', tipText: '按住录音跟读' });
      
      // 时长校验
      if (duration < this.data.minDuration) {
        wx.showToast({ title: '录音太短，请重新录制', icon: 'none' });
        this.triggerEvent('fail', { reason: 'too_short', duration });
        return;
      }
      
      // 回调父页面（携带 mock 路径与时长）
      this.triggerEvent('complete', {
        tempFilePath: 'mock://recording.mp3',
        duration: Math.round(duration * 10) / 10,
      });
    },

    setProcessing() {
      this.setData({ state: 'processing', tipText: 'AI 正在评分...' });
    },

    clearTimer() {
      if (this.data._timer) {
        clearInterval(this.data._timer);
        this.setData({ _timer: null });
      }
    },
  },
});
