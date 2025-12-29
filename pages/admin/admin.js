const app = getApp()

Page({
  data: {
    activeTab: 'users',
    users: [],
    tasks: [],
    complaints: [],
    statistics: {
      totalUsers: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingComplaints: 0,
    },
    loading: false,
    page: 0,
    pageSize: 20,
    hasMore: true,
    tabs: [
      { key: 'users', name: '用户管理' },
      { key: 'tasks', name: '任务管理' },
      { key: 'complaints', name: '投诉管理' },
      { key: 'statistics', name: '数据统计' },
    ],
  },

  onLoad() {
    this.checkAdminPermission()
  },

  // 检查管理员权限（若本地为 false，则刷新一次登录信息）
  async checkAdminPermission() {
    let isAdmin = app.globalData.isAdmin || wx.getStorageSync('isAdmin')
    if (!isAdmin) {
      try {
        const res = await wx.cloud.callFunction({ name: 'login', data: {} })
        if (res.result && res.result.success) {
          isAdmin = res.result.data.isAdmin || false
          app.globalData.isAdmin = isAdmin
          wx.setStorageSync('isAdmin', isAdmin)
        }
      } catch (_) {}
    }

    if (!isAdmin) {
      wx.showModal({
        title: '无权限访问',
        content: '您没有管理员权限，无法访问后台管理页面',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        },
      })
      return
    }
    this.loadData()
  },

  // 切换标签页
  onTabChange(e) {
    const { tab } = e.currentTarget.dataset
    if (tab === this.data.activeTab) return

    this.setData({
      activeTab: tab,
      users: [],
      tasks: [],
      complaints: [],
      page: 0,
      hasMore: true,
    })

    this.loadData()
  },

  // 加载数据
  async loadData() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    try {
      let res
      switch (this.data.activeTab) {
        case 'users':
          res = await this.loadUsers()
          break
        case 'tasks':
          res = await this.loadTasks()
          break
        case 'complaints':
          res = await this.loadComplaints()
          break
        case 'statistics':
          res = await this.loadStatistics()
          break
      }

      if (res && res.result && res.result.success) {
        this.handleLoadSuccess(res.result)
      } else {
        throw new Error((res && res.result && res.result.error) || '加载失败')
      }
    } catch (error) {
      wx.showToast({
        title: '加载失败',
        icon: 'error',
      })
      console.error('加载数据失败:', error)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载用户列表
  async loadUsers() {
    return await wx.cloud.callFunction({
      name: 'adminGetUsers',
      data: {
        page: this.data.page,
        pageSize: this.data.pageSize,
      },
    })
  },

  // 加载任务列表
  async loadTasks() {
    return await wx.cloud.callFunction({
      name: 'adminGetTasks',
      data: {
        page: this.data.page,
        pageSize: this.data.pageSize,
      },
    })
  },

  // 加载投诉列表
  async loadComplaints() {
    return await wx.cloud.callFunction({
      name: 'adminGetComplaints',
      data: {
        page: this.data.page,
        pageSize: this.data.pageSize,
      },
    })
  },

  // 加载统计数据
  async loadStatistics() {
    return await wx.cloud.callFunction({
      name: 'adminGetStatistics',
      data: {},
    })
  },

  // 处理加载成功
  handleLoadSuccess(res) {
    switch (this.data.activeTab) {
      case 'users':
        const newUsers = (res.users || []).map((u) => ({
          ...u,
          createTimeText: this.formatDate(u.createTime),
        }))
        const users =
          this.data.page === 0 ? newUsers : [...this.data.users, ...newUsers]
        this.setData({
          users,
          hasMore: newUsers.length === this.data.pageSize,
          page: this.data.page + 1,
        })
        break
      case 'tasks':
        const newTasks = res.tasks || []
        const tasks =
          this.data.page === 0 ? newTasks : [...this.data.tasks, ...newTasks]
        this.setData({
          tasks,
          hasMore: newTasks.length === this.data.pageSize,
          page: this.data.page + 1,
        })
        break
      case 'complaints':
        const newComplaints = res.complaints || []
        const complaints =
          this.data.page === 0
            ? newComplaints
            : [...this.data.complaints, ...newComplaints]
        this.setData({
          complaints,
          hasMore: newComplaints.length === this.data.pageSize,
          page: this.data.page + 1,
        })
        break
      case 'statistics':
        this.setData({
          statistics: res.statistics,
        })
        break
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    this.setData({
      users: [],
      tasks: [],
      complaints: [],
      page: 0,
      hasMore: true,
    })
    await this.loadData()
    wx.stopPullDownRefresh()
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadData()
    }
  },

  // 封禁/解封用户
  async toggleUserBan(e) {
    const { userId, banned } = e.currentTarget.dataset

    wx.showModal({
      title: banned ? '解封用户' : '封禁用户',
      content: `确定要${banned ? '解封' : '封禁'}该用户吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })

          try {
            const res = await wx.cloud.callFunction({
              name: 'adminBanUser',
              data: { userId, banned: !banned },
            })

            if (res.result.success) {
              wx.showToast({
                title: banned ? '解封成功' : '封禁成功',
                icon: 'success',
              })

              // 刷新用户列表
              this.setData({
                users: [],
                page: 0,
                hasMore: true,
              })
              await this.loadData()
            } else {
              throw new Error(res.result.error)
            }
          } catch (error) {
            wx.showToast({
              title: '操作失败',
              icon: 'error',
            })
            console.error('封禁用户失败:', error)
          } finally {
            wx.hideLoading()
          }
        }
      },
    })
  },

  // 处理投诉
  async handleComplaint(e) {
    const { complaintId, action } = e.currentTarget.dataset

    const actionText = action === 'resolve' ? '标记已解决' : '驳回投诉'

    wx.showModal({
      title: '处理投诉',
      content: `确定要${actionText}吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })

          try {
            const res = await wx.cloud.callFunction({
              name: 'adminHandleComplaint',
              data: { complaintId, action },
            })

            if (res.result.success) {
              wx.showToast({
                title: '处理成功',
                icon: 'success',
              })

              // 刷新投诉列表
              this.setData({
                complaints: [],
                page: 0,
                hasMore: true,
              })
              await this.loadData()
            } else {
              throw new Error(res.result.error)
            }
          } catch (error) {
            wx.showToast({
              title: '处理失败',
              icon: 'error',
            })
            console.error('处理投诉失败:', error)
          } finally {
            wx.hideLoading()
          }
        }
      },
    })
  },

  // 查看任务详情
  viewTaskDetail(e) {
    const { taskId } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/detail/detail?taskId=${taskId}`,
    })
  },

  // 格式化时间
  formatTime(date) {
    const now = new Date()
    const targetDate = new Date(date)
    const diff = now - targetDate

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

  // 格式化日期
  formatDate(date) {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(d.getDate()).padStart(2, '0')}`
  },
})
