const app = getApp()
const { validatePhone, validatePickupCode } = require('../../utils/common')

Page({
  data: {
    // 表单数据
    pickupPoint: '',
    pickupPointIndex: 0,
    company: '',
    companyIndex: 0,
    reward: 10,
    submitting: false,
    
    // 选项数据
    pickupPoints: ['南区', '北区'],
    companies: [
      '顺丰速运', '圆通速递', '申通快递', '中通快递', 
      '韵达快递', '百世快递', '天天快递', 'EMS', '其他'
    ]
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'error'
      })
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)
    }
  },

  // 快递点选择
  onPickupPointChange(e) {
    const index = e.detail.value
    this.setData({
      pickupPointIndex: index,
      pickupPoint: this.data.pickupPoints[index]
    })
  },

  // 快递公司选择
  onCompanyChange(e) {
    const index = e.detail.value
    this.setData({
      companyIndex: index,
      company: this.data.companies[index]
    })
  },

  // 酬劳滑块变化
  onRewardChange(e) {
    this.setData({
      reward: e.detail.value
    })
  },

  // 表单提交
  async onSubmit(e) {
    if (this.data.submitting) return
    
    const formData = e.detail.value
    
    // 表单验证
    if (!this.validateForm(formData)) {
      return
    }
    const user = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if (!user || !user.phone || !user.wechat) {
      wx.showToast({ title: '请先在个人信息中填写电话和微信', icon: 'error' })
      setTimeout(() => { wx.switchTab({ url: '/pages/profile/profile' }) }, 1200)
      return
    }
    
    this.setData({ submitting: true })
    wx.showLoading({ title: '发布中...' })
    
    try {
      // 构建发布数据
      const taskData = {
        pickupPoint: this.data.pickupPoint,
        company: this.data.company,
        pickupCode: formData.pickupCode.trim(),
        phone: formData.phone.trim(),
        wechat: formData.wechat.trim(),
        reward: this.data.reward,
        remark: formData.remark.trim()
      }
      
      // 调用云函数创建任务
      const res = await wx.cloud.callFunction({
        name: 'createTask',
        data: taskData
      })
      
      if (res.result.success) {
        wx.showToast({
          title: '发布成功',
          icon: 'success',
          duration: 2000
        })
        
        // 返回首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 2000)
      } else {
        throw new Error(res.result.error)
      }
    } catch (error) {
      wx.showToast({
        title: '发布失败',
        icon: 'error'
      })
      console.error('发布任务失败:', error)
    } finally {
      this.setData({ submitting: false })
      wx.hideLoading()
    }
  },

  // 表单验证
  validateForm(formData) {
    // 验证快递点
    if (!this.data.pickupPoint) {
      wx.showToast({
        title: '请选择快递点',
        icon: 'error'
      })
      return false
    }
    
    // 验证快递公司
    if (!this.data.company) {
      wx.showToast({
        title: '请选择快递公司',
        icon: 'error'
      })
      return false
    }
    
    // 验证取件码
    if (!formData.pickupCode || formData.pickupCode.trim().length === 0) {
      wx.showToast({
        title: '请输入取件码',
        icon: 'error'
      })
      return false
    }
    
    // 验证联系电话
    if (!formData.phone || !validatePhone(formData.phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'error'
      })
      return false
    }
    
    return true
  },

  // 显示用户协议
  showAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '1. 本平台仅提供信息撮合服务\n2. 请如实填写快递信息\n3. 请诚信互助，按时完成代取\n4. 遇到问题请及时联系对方\n5. 平台不对代取过程负责',
      showCancel: false,
      confirmText: '我知道了'
    })
  }
})
