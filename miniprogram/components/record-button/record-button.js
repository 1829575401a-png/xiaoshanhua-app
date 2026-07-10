// components/record-button/record-button.js
// 开发期：完全绕过微信录音API，走模拟流程
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
    _startAt: 0,
    _timer: null,
  },

  lifetimes: {
    detached() {
      this.clearTimer();
    },
  },

  methods: {
    onPressStart() {
      if (this.data.disabled || this.data.state === 'recording') return;
      this.setData({ _startAt: Date.now() });
      this.startMockRecording();
    },

    startMockRecording() {
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
