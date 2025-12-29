const app = getApp()
const { formatTime, makePhoneCall, copyToClipboard } = require('../../utils/common')

Page({
  data: {
    orders: [],
    loading: false,
    hasMore: true,
    page: 0,
    pageSize: 20,
    statusTabs: [
      { key: 'all', name: '全部' },
      { key: 'accepted', name: '进行中' },
      { key: 'completed', name: '已完成' }
    ],
    activeTab: 'all'
  },

  onLoad() {
    this.loadOrders()
  },

  onShow() {
    // 页面显示时刷新数据
    if (this.data.orders.length > 0) {
      this.refreshOrders()
    }
  },

  // 切换状态标签
  onTabChange(e) {
    const { tab } = e.currentTarget.dataset
    if (tab === this.data.activeTab) return
    
    this.setData({
      activeTab: tab,
      orders: [],
      page: 0,
      hasMore: true
    })
    
    this.loadOrders()
  },

  // 加载订单列表
  async loadOrders() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getMyOrders',
        data: {
          status: this.data.activeTab === 'all' ? null : this.data.activeTab,
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      })

      if (res.result.success) {
        // 处理订单数据，添加状态样式信息和格式化时间
        const newOrders = res.result.orders.map(order => ({
          ...order,
          statusStyle: this.getStatusStyle(order.status),
          createTimeText: formatTime(order.createTime)
        }))
        
        const orders = this.data.page === 0 ? newOrders : [...this.data.orders, ...newOrders]
        
        this.setData({
          orders,
          hasMore: newOrders.length === this.data.pageSize,
          page: this.data.page + 1
        })
      } else {
        throw new Error(res.result.error)
      }
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
      console.error('加载我的接单失败:', error)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 刷新订单列表
  async refreshOrders() {
    this.setData({
      orders: [],
      page: 0,
      hasMore: true
    })
    await this.loadOrders()
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.refreshOrders()
    wx.stopPullDownRefresh()
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadOrders()
    }
  },

  // 查看订单详情
  viewOrderDetail(e) {
    const { orderId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    })
  },

  // 联系发布者
  contactPublisher(e) {
    const { phone, wechat } = e.currentTarget.dataset
    
    wx.showActionSheet({
      itemList: ['拨打电话', '复制微信号'],
      success: (res) => {
        if (res.tapIndex === 0) {
          makePhoneCall(phone)
        } else if (res.tapIndex === 1) {
          copyToClipboard(wechat, '微信号已复制')
        }
      }
    })
  },

  // 完成任务
  async completeOrder(e) {
    const { orderId, taskId } = e.currentTarget.dataset
    
    wx.showModal({
      title: '完成任务',
      content: '确认已完成快递代取任务？完成后订单将标记为完成状态。',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          
          try {
            const res = await wx.cloud.callFunction({
              name: 'completeOrder',
              data: { orderId, taskId }
            })
            
            if (res.result.success) {
              wx.showToast({
                title: '任务完成',
                icon: 'success'
              })
              
              // 刷新列表
              await this.refreshOrders()
            } else {
              throw new Error(res.result.error)
            }
          } catch (error) {
            wx.showToast({
              title: '操作失败',
              icon: 'error'
            })
            console.error('完成订单失败:', error)
          } finally {
            wx.hideLoading()
          }
        }
      }
    })
  },

  // 评价发布者
  goToReview(e) {
    const { taskId, orderId, revieweeId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/review/review?taskId=${taskId}&orderId=${orderId}&revieweeId=${revieweeId}`
    })
  },

  // 获取状态标签样式
  getStatusStyle(status) {
    const styles = {
      accepted: { text: '进行中', color: '#1890ff', bg: '#e6f7ff' },
      completed: { text: '已完成', color: '#52c41a', bg: '#f6ffed' }
    }
    return styles[status] || styles.accepted
  }
})
