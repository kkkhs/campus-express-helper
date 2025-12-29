const app = getApp()
const { formatDetailTime, getStatusText, makePhoneCall, copyToClipboard } = require('../../utils/common')

Page({
  data: {
    taskId: '',
    task: null,
    publisher: null,
    order: null,
    canViewContact: false,
    isTaskOwner: false,
    isTaskTaker: false,
    hasAction: false,
    statusText: '',
    createTimeText: '',
    completeTimeText: '',
    reviews: [],
  },

  onLoad(options) {
    this.setData({
      taskId: options.taskId,
    })
    this.loadTaskDetail()
  },

  onShow() {
    // 页面显示时刷新数据
    if (this.data.taskId) {
      this.loadTaskDetail()
    }
  },

  // 加载任务详情
  async loadTaskDetail() {
    wx.showLoading({ title: '加载中...' })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getTaskDetail',
        data: {
          taskId: this.data.taskId,
        },
      })

      if (res.result.success) {
        const { task, publisher, order, canViewContact } = res.result.data
        const userInfo = app.globalData.userInfo

        const isTaskOwner = task.userId === userInfo._openid
        const isTaskTaker = order && order.takerId === userInfo._openid
        const hasAction = isTaskOwner
          ? ['pending', 'accepted', 'completed'].includes(task.status)
          : task.status === 'pending' ||
            (task.status === 'accepted' && isTaskTaker) ||
            (task.status === 'completed' && isTaskTaker)

        this.setData({
          task,
          publisher,
          order,
          canViewContact,
          isTaskOwner,
          isTaskTaker,
          hasAction,
          statusText: getStatusText(task.status),
          createTimeText: formatDetailTime(task.createTime),
          completeTimeText:
            order && order.completeTime
              ? formatDetailTime(order.completeTime)
              : '',
        })

        if (task.status === 'completed' && order && order._id) {
          await this.loadOrderReviews(order._id)
        } else {
          this.setData({ reviews: [] })
        }
      } else {
        throw new Error(res.result.error)
      }
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'error',
      })
      console.error('加载任务详情失败:', error)
    } finally {
      wx.hideLoading()
    }
  },

  async loadOrderReviews(orderId) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getOrderReviews',
        data: { orderId, page: 0, pageSize: 5 },
      })
      if (res.result && res.result.success) {
        const reviews = (res.result.reviews || []).map((r) => ({
          ...r,
          createTimeText: formatDetailTime(r.createTime),
        }))
        this.setData({ reviews })
      } else {
        this.setData({ reviews: [] })
      }
    } catch (e) {
      this.setData({ reviews: [] })
      console.error('加载订单评价失败:', e)
    }
  },

  // 立即接单
  async acceptTask() {
    wx.showModal({
      title: '确认接单',
      content: '确认要接这个任务吗？接单后请及时联系对方完成代取。',
      success: async (res) => {
        if (res.confirm) {
          const user = app.globalData.userInfo || wx.getStorageSync('userInfo')
          if (!user || !user.phone || !user.wechat) {
            wx.showToast({
              title: '请先在个人信息中填写电话和微信',
              icon: 'error',
            })
            setTimeout(() => {
              wx.switchTab({ url: '/pages/profile/profile' })
            }, 1200)
            return
          }
          wx.showLoading({ title: '处理中...' })

          try {
            const result = await wx.cloud.callFunction({
              name: 'acceptTask',
              data: {
                taskId: this.data.taskId,
              },
            })

            if (result.result.success) {
              wx.showToast({
                title: '接单成功',
                icon: 'success',
              })

              // 刷新页面数据
              setTimeout(() => {
                this.loadTaskDetail()
              }, 1500)
            } else {
              throw new Error(result.result.error)
            }
          } catch (error) {
            wx.showToast({
              title: '接单失败',
              icon: 'error',
            })
            console.error('接单失败:', error)
          } finally {
            wx.hideLoading()
          }
        }
      },
    })
  },

  // 确认完成任务
  async completeTask() {
    if (!this.data.order) {
      wx.showToast({
        title: '订单信息错误',
        icon: 'error',
      })
      return
    }

    wx.showModal({
      title: '确认完成',
      content: '确认任务已完成吗？完成后将不可撤销。',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })

          try {
            const result = await wx.cloud.callFunction({
              name: 'completeOrder',
              data: {
                orderId: this.data.order._id,
                taskId: this.data.taskId,
              },
            })

            if (result.result.success) {
              wx.showToast({
                title: '任务已完成',
                icon: 'success',
              })

              // 跳转到评价页面
              setTimeout(() => {
                this.goToReview()
              }, 1500)
            } else {
              throw new Error(result.result.error)
            }
          } catch (error) {
            wx.showToast({
              title: '操作失败',
              icon: 'error',
            })
            console.error('完成任务失败:', error)
          } finally {
            wx.hideLoading()
          }
        }
      },
    })
  },

  // 取消任务
  async cancelTask() {
    wx.showModal({
      title: '取消任务',
      content: '确定要取消这个任务吗？取消后任务将不可恢复。',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          try {
            const result = await wx.cloud.callFunction({
              name: 'cancelTask',
              data: { taskId: this.data.taskId },
            })
            if (result.result && result.result.success) {
              wx.showToast({ title: '取消成功', icon: 'success' })
              setTimeout(() => {
                this.loadTaskDetail()
              }, 1200)
            } else {
              throw new Error(
                (result.result && result.result.error) || '取消失败'
              )
            }
          } catch (error) {
            wx.showToast({ title: '取消失败', icon: 'error' })
            console.error('取消任务失败:', error)
          } finally {
            wx.hideLoading()
          }
        }
      },
    })
  },

  // 跳转到评价页面
  goToReview() {
    const revieweeId = this.data.isTaskOwner
      ? this.data.order.takerId
      : this.data.task.userId
    wx.navigateTo({
      url: `/pages/review/review?orderId=${this.data.order._id}&revieweeId=${revieweeId}`,
    })
  },

  // 查看评价
  viewReviews() {
    const userId = this.data.isTaskOwner
      ? this.data.order.takerId
      : this.data.task.userId
    wx.navigateTo({
      url: `/pages/reviews/reviews?userId=${userId}`,
    })
  },

  // 拨打电话
  makePhoneCall(e) {
    const phone = e.currentTarget.dataset.phone
    makePhoneCall(phone)
  },

  // 复制微信号
  copyWechat(e) {
    const wechat = e.currentTarget.dataset.wechat
    copyToClipboard(wechat, '已复制微信号')
  },
})
