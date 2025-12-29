const app = getApp()
const { formatTime, callCloud, handleCloudError, getStatusText, STATUS_MAP } = require('../../utils/common')

Page({
  data: {
    tasks: [],
    loading: false,
    isRefreshing: false,
    hasMore: true,
    page: 1,
    pageSize: 20,

    // 筛选条件
    pickupPoint: '',
    sortBy: '',
    sortIndex: 0,
    rewardMin: 0,
    rewardMax: 50,
    showRewardFilter: false,

    // 选项数据
    pickupPoints: ['全部', '南区', '北区'],
    sortOptions: ['默认排序', '按酬劳排序', '按时间排序'],

    // 状态映射（使用公共常量）
    statusMap: STATUS_MAP,
    showLogin: false,
  },

  async onLoad() {
    await app.dbReadyPromise
    this.checkLogin()
  },

  onShow() {
    if (this.data.showLogin) return
    this.loadTasks(true)
  },

  // 检查登录状态
  async checkLogin() {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      this.setData({ showLogin: true })
    } else {
      app.globalData.userInfo = userInfo
      this.setData({
        isAdmin: wx.getStorageSync('isAdmin') || false,
      })
    }
  },

  // 微信登录
  async login() {
    wx.showLoading({ title: '登录中...', mask: true })

    try {
      // 新版登录：不再使用废弃的 wx.getUserProfile()
      // 登录成功后，用户可以在个人中心自定义头像和昵称
      const res = await callCloud('login', {})

      if (res.result.success) {
        wx.setStorageSync('userInfo', res.result.data.userInfo)
        wx.setStorageSync('isAdmin', res.result.data.isAdmin)

        app.globalData.userInfo = res.result.data.userInfo
        app.globalData.isAdmin = res.result.data.isAdmin

        this.setData({
          isAdmin: res.result.data.isAdmin,
        })

        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 2000,
        })

        this.setData({ showLogin: false })
        this.loadTasks()
      } else {
        throw new Error(res.result.error)
      }
    } catch (error) {
      const msg = handleCloudError(error)
      wx.showToast({ 
        title: msg || '登录失败，请重试', 
        icon: 'none',
        duration: 2000 
      })
      console.error('登录失败:', error)
    } finally {
      wx.hideLoading()
    }
  },

  // 加载任务列表
  async loadTasks(refresh = false) {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const page = refresh ? 1 : this.data.page

      const res = await callCloud('getTaskList', {
        pickupPoint:
          this.data.pickupPoint === '全部' ? '' : this.data.pickupPoint,
        sortBy: this.data.sortBy,
        rewardRange: [this.data.rewardMin, this.data.rewardMax],
        page,
        pageSize: this.data.pageSize,
      })

      if (res.result.success) {
        const tasks = res.result.data.tasks.map((task) => ({
          ...task,
          statusText: getStatusText(task.status),
          createTimeText: formatTime(task.createTime),
        }))

        if (refresh) {
          this.setData({
            tasks,
            page: 2,
            hasMore: tasks.length >= this.data.pageSize,
          })
        } else {
          this.setData({
            tasks: [...this.data.tasks, ...tasks],
            page: this.data.page + 1,
            hasMore: tasks.length >= this.data.pageSize,
          })
        }
      } else {
        throw new Error(res.result.error)
      }
    } catch (error) {
      const msg = handleCloudError(error)
      wx.showToast({ title: msg, icon: 'error' })
      console.error('加载任务失败:', error)
    } finally {
      this.setData({
        loading: false,
        isRefreshing: false,
      })
    }
  },

  // 下拉刷新
  onRefresh() {
    this.setData({ isRefreshing: true })
    this.loadTasks(true)
  },

  // 快递点筛选
  onPickupPointChange(e) {
    const index = e.detail.value
    const pickupPoint = this.data.pickupPoints[index]
    this.setData({
      pickupPoint: pickupPoint === '全部' ? '' : pickupPoint,
    })
    this.loadTasks(true)
  },

  // 排序筛选
  onSortChange(e) {
    const index = e.detail.value
    const sortMap = ['', 'reward', 'time']
    this.setData({
      sortIndex: index,
      sortBy: sortMap[index],
    })
    this.loadTasks(true)
  },

  // 显示酬劳筛选
  toggleRewardFilter() {
    this.setData({
      showRewardFilter: !this.data.showRewardFilter,
    })
  },

  // 酬劳范围变化
  onRewardMinChange(e) {
    const val = Number(e.detail.value)
    const max = this.data.rewardMax
    this.setData({ rewardMin: Math.min(val, max) })
  },
  onRewardMaxChange(e) {
    const val = Number(e.detail.value)
    const min = this.data.rewardMin
    this.setData({ rewardMax: Math.max(val, min) })
  },
  // 滑动中即时更新（提升展示体验）
  onRewardMinChanging(e) {
    const val = Number(e.detail.value)
    const max = this.data.rewardMax
    this.setData({ rewardMin: Math.min(val, max) })
  },
  onRewardMaxChanging(e) {
    const val = Number(e.detail.value)
    const min = this.data.rewardMin
    this.setData({ rewardMax: Math.max(val, min) })
  },

  // 重置酬劳筛选
  resetRewardFilter() {
    this.setData({ rewardMin: 0, rewardMax: 50 })
  },

  // 确认酬劳筛选
  confirmRewardFilter() {
    this.toggleRewardFilter()
    this.loadTasks(true)
  },

  // 跳转到任务详情
  goToDetail(e) {
    const taskId = e.currentTarget.dataset.taskId
    wx.navigateTo({
      url: `/pages/detail/detail?taskId=${taskId}`,
    })
  },

  // 跳转到发布页面
  goToPublish() {
    wx.switchTab({
      url: '/pages/publish/publish',
    })
  },

  // 页面滚动到底部
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadTasks()
    }
  },
})
