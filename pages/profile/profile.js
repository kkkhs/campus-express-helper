const app = getApp()
const { validatePhone } = require('../../utils/common')

Page({
  data: {
    userInfo: {},
    isAdmin: false,
    showEditModal: false,
    showAvatarModal: false,
    editForm: {
      phone: '',
      wechat: '',
      nickname: '',
    },
    tempAvatarUrl: '', // 临时头像URL
    stats: {
      publishCount: 0,
      acceptCount: 0,
      completeCount: 0,
    },
  },

  onLoad() {
    this.loadUserInfo()
    this.loadUserStats()
  },

  onShow() {
    // 每次显示页面时刷新用户信息和统计数据
    this.loadUserInfo()
    this.loadUserStats()
  },

  // 加载用户信息
  loadUserInfo() {
    const cachedUser = app.globalData.userInfo || wx.getStorageSync('userInfo')
    const cachedAdmin = app.globalData.isAdmin || wx.getStorageSync('isAdmin')

    if (!cachedUser) {
      // 用户未登录，跳转到首页
      wx.switchTab({ url: '/pages/index/index' })
      return
    }

    // 先显示缓存数据
    this.setData({
      userInfo: cachedUser,
      isAdmin: cachedAdmin,
      editForm: {
        phone: cachedUser.phone || '',
        wechat: cachedUser.wechat || '',
      },
    })

    // 后台刷新最新数据
    wx.cloud
      .callFunction({ name: 'login', data: {} })
      .then((res) => {
        if (res.result && res.result.success) {
          const fresh = res.result.data.userInfo
          app.globalData.userInfo = fresh
          app.globalData.isAdmin = res.result.data.isAdmin
          wx.setStorageSync('userInfo', fresh)
          wx.setStorageSync('isAdmin', res.result.data.isAdmin)
          this.setData({
            userInfo: fresh,
            isAdmin: res.result.data.isAdmin,
            editForm: {
              phone: fresh.phone || '',
              wechat: fresh.wechat || '',
            },
          })
        }
      })
      .catch((err) => {
        console.error('刷新用户信息失败:', err)
        // 静默失败，不影响用户体验
      })
  },

  // 加载用户统计数据
  async loadUserStats() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getUserStats',
        data: {},
      })

      if (res.result && res.result.success) {
        this.setData({
          stats: res.result.data || {
            publishCount: 0,
            acceptCount: 0,
            completeCount: 0,
          },
        })
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
      // 静默失败，使用默认值
    }
  },

  // 编辑资料
  editProfile() {
    this.setData({
      showEditModal: true,
      editForm: {
        phone: this.data.userInfo.phone || '',
        wechat: this.data.userInfo.wechat || '',
        nickname: this.data.userInfo.nickname || '',
      },
    })
  },

  // 编辑头像
  editAvatar() {
    this.setData({
      showAvatarModal: true,
      tempAvatarUrl: this.data.userInfo.avatar || '',
    })
  },

  // 关闭头像编辑弹窗
  closeAvatarModal() {
    this.setData({
      showAvatarModal: false,
      tempAvatarUrl: '',
    })
  },

  // 关闭编辑弹窗
  closeEditModal() {
    this.setData({
      showEditModal: false,
    })
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },

  // 保存编辑
  async onEditSubmit(e) {
    const { phone, wechat, nickname } = e.detail.value

    // 验证手机号格式（如果填写了手机号）
    if (phone && phone.trim() && !validatePhone(phone.trim())) {
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'error',
        duration: 2000,
      })
      return
    }

    // 验证昵称
    if (nickname && nickname.trim() && nickname.trim().length < 2) {
      wx.showToast({
        title: '昵称至少2个字符',
        icon: 'none',
        duration: 2000,
      })
      return
    }

    wx.showLoading({ title: '保存中...', mask: true })

    try {
      const updateData = {
        phone: phone ? phone.trim() : '',
        wechat: wechat ? wechat.trim() : '',
      }

      // 如果填写了昵称，才更新昵称
      if (nickname && nickname.trim()) {
        updateData.nickname = nickname.trim()
      }

      const res = await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: updateData,
      })

      if (res.result && res.result.success) {
        // 更新本地数据
        const updatedUserInfo = {
          ...this.data.userInfo,
          ...updateData,
        }

        app.globalData.userInfo = updatedUserInfo
        wx.setStorageSync('userInfo', updatedUserInfo)

        this.setData({
          userInfo: updatedUserInfo,
          showEditModal: false,
        })

        wx.showToast({
          title: '保存成功',
          icon: 'success',
        })
      } else {
        throw new Error(res.result.error || '保存失败')
      }
    } catch (error) {
      console.error('保存用户信息失败:', error)
      wx.showToast({
        title: error.message || '保存失败，请重试',
        icon: 'none',
        duration: 2000,
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 选择头像（新API）
  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    if (!avatarUrl) {
      wx.showToast({
        title: '未选择头像',
        icon: 'none',
      })
      return
    }

    // 显示临时头像
    this.setData({
      tempAvatarUrl: avatarUrl,
    })
  },

  // 保存新头像
  async saveAvatar() {
    const tempPath = this.data.tempAvatarUrl
    if (!tempPath) {
      wx.showToast({
        title: '请先选择头像',
        icon: 'none',
      })
      return
    }

    wx.showLoading({ title: '上传中...', mask: true })

    try {
      // 1. 上传到云存储
      const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: tempPath,
      })

      if (!uploadRes.fileID) {
        throw new Error('上传失败')
      }

      // 2. 更新到数据库
      const res = await wx.cloud.callFunction({
        name: 'updateUserInfo',
        data: {
          avatar: uploadRes.fileID,
        },
      })

      if (res.result && res.result.success) {
        const updatedUserInfo = {
          ...this.data.userInfo,
          avatar: uploadRes.fileID,
        }

        // 更新全局和本地存储
        app.globalData.userInfo = updatedUserInfo
        wx.setStorageSync('userInfo', updatedUserInfo)

        this.setData({
          userInfo: updatedUserInfo,
          showAvatarModal: false,
          tempAvatarUrl: '',
        })

        wx.showToast({
          title: '头像更新成功',
          icon: 'success',
        })
      } else {
        throw new Error(res.result.error || '保存失败')
      }
    } catch (error) {
      console.error('保存头像失败:', error)
      wx.showToast({
        title: error.message || '保存失败，请重试',
        icon: 'none',
        duration: 2000,
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 跳转到我的发布
  goToMyTasks() {
    // 确保用户已登录
    if (!this.data.userInfo || !this.data.userInfo._id) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
      })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 1500)
      return
    }

    wx.navigateTo({
      url: '/pages/my-tasks/my-tasks',
    })
  },

  // 跳转到我的接单
  goToMyOrders() {
    // 确保用户已登录
    if (!this.data.userInfo || !this.data.userInfo._id) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
      })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 1500)
      return
    }

    wx.switchTab({
      url: '/pages/my-orders/my-orders',
    })
  },

  // 跳转到我的评价
  goToMyReviews() {
    // 确保用户已登录
    if (!this.data.userInfo || !this.data.userInfo._id) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
      })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 1500)
      return
    }

    wx.navigateTo({
      url: '/pages/my-reviews/my-reviews',
    })
  },

  // 跳转到关于我们
  goToAbout() {
    wx.showModal({
      title: '关于我们',
      content:
        '校园快递代取互助平台\n\n版本：v1.0.1\n开发团队：校园互助团队\n\n📦 让校园生活更便捷\n🤝 互帮互助，共建美好校园',
      showCancel: false,
      confirmText: '知道了',
    })
  },

  // 跳转到后台管理
  goToAdmin() {
    // 严格检查管理员权限
    if (!this.data.isAdmin) {
      wx.showToast({
        title: '无管理员权限',
        icon: 'error',
        duration: 2000,
      })
      return
    }

    wx.navigateTo({
      url: '/pages/admin/admin',
    })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          try {
            // 清除所有用户相关数据
            app.globalData.userInfo = null
            app.globalData.isAdmin = false
            
            // 清除本地存储
            wx.removeStorageSync('userInfo')
            wx.removeStorageSync('isAdmin')
            
            // 清空页面数据
            this.setData({
              userInfo: {},
              isAdmin: false,
              stats: {
                publishCount: 0,
                acceptCount: 0,
                completeCount: 0,
              },
            })

            wx.showToast({
              title: '已退出登录',
              icon: 'success',
              duration: 1500,
            })

            // 延迟跳转到首页
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/index/index',
              })
            }, 1500)
          } catch (error) {
            console.error('退出登录失败:', error)
            // 即使出错也要跳转
            wx.switchTab({
              url: '/pages/index/index',
            })
          }
        }
      },
      fail: (error) => {
        console.error('退出登录弹窗失败:', error)
      },
    })
  },
})
