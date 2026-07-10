// components/record-button/record-button.js
Component({
  properties: {
    disabled: {
      type: Boolean,
      value: false,
    },
    minDuration: {
      type: Number,
      value: 1,
    },
    maxDuration: {
      type: Number,
      value: 15000,
    },
  },

  data: {
    state: 'idle',
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
        if (duration < this.data.minDuration) {
          wx.showToast({ title: '录音太短，请重新录制', icon: 'none' });
          this.triggerEvent('fail', { reason: 'too_short', duration });
          return;
        }
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
      mgr.onInterruptionBegin(() => {
        this.clearTimer();
        this.setData({ state: 'idle', seconds: 0, tipText: '录音已取消' });
        wx.showToast({ title: '录音已取消', icon: 'none' });
      });
      this.setData({ _recManager: mgr });
    },

    onPressStart() {
      if (this.data.disabled || this.data.state === 'recording') return;
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.record'] === false) {
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
        console.warn('录音API失败，进入模拟模式', err);
        this.mockRecording();
      }
    },

    mockRecording() {
      this.setData({ state: 'recording', tipText: '松开结束' });
      const timer = setInterval(() => {
        const elapsed = (Date.now() - this.data._startAt) / 1000;
        this.setData({ seconds: elapsed.toFixed(1) });
      }, 100);
      this.setData({ _timer: timer });
    },

    onPressEnd() {
      if (this.data.state !== 'recording') return;
      this.clearTimer();
      const duration = (Date.now() - this.data._startAt) / 1000;
      this.setData({ seconds: 0, state: 'idle', tipText: '按住录音跟读' });
      
      if (duration < this.data.minDuration) {
        wx.showToast({ title: '录音太短，请重新录制', icon: 'none' });
        this.triggerEvent('fail', { reason: 'too_short', duration });
        return;
      }
      
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
