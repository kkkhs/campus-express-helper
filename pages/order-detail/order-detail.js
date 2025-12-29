Page({
  data: {
    orderId: '',
    order: null,
    task: null,
    publisher: null,
    taker: null,
  },
  onLoad(options) {
    this.setData({ orderId: options.id })
    this.loadDetail()
  },
  async loadDetail() {
    wx.showLoading({ title: '加载中...' })
    try {
      const res = await wx.cloud.callFunction({ name: 'getOrderDetail', data: { orderId: this.data.orderId } })
      if (res.result && res.result.success) {
        const { order, task, publisher, taker } = res.result.data
        
        // 预处理数据，添加格式化的值
        const processedOrder = {
          ...order,
          statusIcon: this.getStatusIcon(order.status),
          statusText: this.getStatusText(order.status),
          createTimeText: this.formatTime(order.createTime),
          completeTimeText: order.completeTime ? this.formatTime(order.completeTime) : null
        }
        
        this.setData({ 
          order: processedOrder, 
          task, 
          publisher, 
          taker 
        })
      } else {
        throw new Error((res.result && res.result.error) || '加载失败')
      }
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'error' })
      console.error('加载订单详情失败:', e)
    } finally {
      wx.hideLoading()
    }
  },
  getStatusText(status) {
    const map = { pending: '待接单', accepted: '进行中', completed: '已完成', cancelled: '已取消' }
    return map[status] || '未知状态'
  },
  getStatusIcon(status) {
    const map = { pending: '⏳', accepted: '🔄', completed: '✅', cancelled: '❌' }
    return map[status] || '❓'
  },
  formatTime(date) {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    const m = Math.floor(diff / (1000 * 60))
    const h = Math.floor(diff / (1000 * 60 * 60))
    const day = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (m < 1) return '刚刚'
    if (m < 60) return `${m}分钟前`
    if (h < 24) return `${h}小时前`
    if (day < 7) return `${day}天前`
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  },
  makePhoneCall(e) {
    const phone = e.currentTarget.dataset.phone
    if (!phone) return
    wx.makePhoneCall({ phoneNumber: phone })
  },
  copyWechat(e) {
    const wechat = e.currentTarget.dataset.wechat
    if (!wechat) return
    wx.setClipboardData({ data: wechat, success: () => wx.showToast({ title: '已复制微信号', icon: 'success' }) })
  },
})
