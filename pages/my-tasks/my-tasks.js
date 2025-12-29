const app = getApp()

Page({
  data: {
    tasks: [],
    loading: false,
    hasMore: true,
    page: 0,
    pageSize: 20,
    statusTabs: [
      { key: 'all', name: '全部' },
      { key: 'pending', name: '待接单' },
      { key: 'accepted', name: '已接单' },
      { key: 'completed', name: '已完成' },
      { key: 'cancelled', name: '已取消' },
    ],
    activeTab: 'all',
  },

  // 云函数调用封装（超时保护）
  callCloud(name, data = {}, timeoutMs = 8000) {
    return Promise.race([
      wx.cloud.callFunction({ name, data }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('CLOUD_TIMEOUT')), timeoutMs)
      ),
    ])
  },

  onLoad() {
    this.loadTasks()
  },

  onShow() {
    // 页面显示时刷新数据
    if (this.data.tasks.length > 0) {
      this.refreshTasks()
    }
  },

  // 切换状态标签
  onTabChange(e) {
    const { tab } = e.currentTarget.dataset
    if (tab === this.data.activeTab) return

    this.setData({
      activeTab: tab,
      tasks: [],
      page: 0,
      hasMore: true,
    })

    this.loadTasks()
  },

  // 加载任务列表
  async loadTasks() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    try {
      const res = await this.callCloud('getMyTasks', {
        status: this.data.activeTab === 'all' ? null : this.data.activeTab,
        page: this.data.page,
        pageSize: this.data.pageSize,
      })

      if (res.result && res.result.success) {
        const newTasks = res.result.tasks
        const tasks =
          this.data.page === 0 ? newTasks : [...this.data.tasks, ...newTasks]

        this.setData({
          tasks,
          hasMore: newTasks.length === this.data.pageSize,
          page: this.data.page + 1,
        })
      } else {
        throw new Error((res.result && res.result.error) || '加载失败')
      }
    } catch (error) {
      const msg =
        error && error.message === 'CLOUD_TIMEOUT'
          ? '加载超时，请检查云环境'
          : '加载失败'
      wx.showToast({ title: msg, icon: 'error' })
      console.error('加载我的任务失败:', error)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 刷新任务列表
  async refreshTasks() {
    this.setData({
      tasks: [],
      page: 0,
      hasMore: true,
    })
    await this.loadTasks()
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.refreshTasks()
    wx.stopPullDownRefresh()
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadTasks()
    }
  },

  // 查看任务详情
  viewTaskDetail(e) {
    const { taskId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/detail/detail?taskId=${taskId}`,
    })
  },

  // 取消任务
  async cancelTask(e) {
    const { taskId } = e.currentTarget.dataset

    wx.showModal({
      title: '取消任务',
      content: '确定要取消这个任务吗？取消后任务将无法恢复。',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })

          try {
            const res = await wx.cloud.callFunction({
              name: 'cancelTask',
              data: { taskId },
            })

            if (res.result.success) {
              wx.showToast({
                title: '取消成功',
                icon: 'success',
              })

              // 刷新列表
              await this.refreshTasks()
            } else {
              throw new Error(res.result.error)
            }
          } catch (error) {
            wx.showToast({
              title: '取消失败',
              icon: 'error',
            })
            console.error('取消任务失败:', error)
          } finally {
            wx.hideLoading()
          }
        }
      },
    })
  },

  // 完成任务
  async completeTask(e) {
    const { taskId } = e.currentTarget.dataset

    wx.showModal({
      title: '完成任务',
      content: '确认任务已完成？完成后任务将标记为完成状态。',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })

          try {
            const res = await wx.cloud.callFunction({
              name: 'completeTask',
              data: { taskId },
            })

            if (res.result.success) {
              wx.showToast({
                title: '任务已完成',
                icon: 'success',
              })

              // 刷新列表
              await this.refreshTasks()
            } else {
              throw new Error(res.result.error)
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

  // 评价接单者
  goToReview(e) {
    const { taskId, orderId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/review/review?taskId=${taskId}&orderId=${orderId}`,
    })
  },

  // 格式化时间
  formatTime(date) {
    const now = new Date()
    const taskDate = new Date(date)
    const diff = now - taskDate

    if (diff < 60000) {
      return '刚刚'
    } else if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前'
    } else if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前'
    } else {
      return Math.floor(diff / 86400000) + '天前'
    }
  },

  // 获取状态标签样式
  getStatusStyle(status) {
    const styles = {
      pending: { text: '待接单', color: '#ff7d00', bg: '#fff7e6' },
      accepted: { text: '已接单', color: '#1890ff', bg: '#e6f7ff' },
      completed: { text: '已完成', color: '#52c41a', bg: '#f6ffed' },
      cancelled: { text: '已取消', color: '#999', bg: '#f5f5f5' },
    }
    return styles[status] || styles.pending
  },
})
