/**
 * 公共工具函数库
 * 用于小程序前端页面共享的工具方法
 */

/**
 * 格式化时间显示
 * @param {String|Date} dateStr - 日期字符串或日期对象
 * @returns {String} 格式化后的时间文本
 */
function formatTime(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return `${date.getMonth() + 1}月${date.getDate()}日`
}

/**
 * 格式化详细时间（包含具体时分）
 * @param {String|Date} dateStr - 日期字符串或日期对象
 * @returns {String} 格式化后的详细时间
 */
function formatDetailTime(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return `${date.getFullYear()}年${
    date.getMonth() + 1
  }月${date.getDate()}日 ${date.getHours()}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`
}

/**
 * 验证手机号格式
 * @param {String} phone - 手机号
 * @returns {Boolean} 是否有效
 */
function validatePhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 验证微信号格式
 * @param {String} wechat - 微信号
 * @returns {Boolean} 是否有效
 */
function validateWechat(wechat) {
  // 微信号规则：6-20位，字母、数字、下划线、减号
  const wechatRegex = /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/
  return wechatRegex.test(wechat)
}

/**
 * 验证取件码格式
 * @param {String} code - 取件码
 * @returns {Boolean} 是否有效
 */
function validatePickupCode(code) {
  // 取件码通常是4-8位数字或字母数字组合
  const codeRegex = /^[A-Za-z0-9]{4,8}$/
  return codeRegex.test(code)
}

/**
 * 云函数调用封装（带超时保护）
 * @param {String} name - 云函数名称
 * @param {Object} data - 参数数据
 * @param {Number} timeoutMs - 超时时间（毫秒）
 * @returns {Promise} 云函数调用结果
 */
function callCloud(name, data = {}, timeoutMs = 8000) {
  return Promise.race([
    wx.cloud.callFunction({ name, data }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('CLOUD_TIMEOUT')), timeoutMs)
    ),
  ])
}

/**
 * 显示加载提示
 * @param {String} title - 提示文本
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true,
  })
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading()
}

/**
 * 显示成功提示
 * @param {String} title - 提示文本
 * @param {Number} duration - 持续时间（毫秒）
 */
function showSuccess(title, duration = 2000) {
  wx.showToast({
    title,
    icon: 'success',
    duration,
  })
}

/**
 * 显示错误提示
 * @param {String} title - 提示文本
 * @param {Number} duration - 持续时间（毫秒）
 */
function showError(title, duration = 2000) {
  wx.showToast({
    title,
    icon: 'error',
    duration,
  })
}

/**
 * 显示普通提示
 * @param {String} title - 提示文本
 * @param {Number} duration - 持续时间（毫秒）
 */
function showToast(title, duration = 2000) {
  wx.showToast({
    title,
    icon: 'none',
    duration,
  })
}

/**
 * 任务状态映射
 */
const STATUS_MAP = {
  pending: '待接单',
  accepted: '已接单',
  completed: '已完成',
  cancelled: '已取消',
}

/**
 * 获取状态文本
 * @param {String} status - 状态值
 * @returns {String} 状态文本
 */
function getStatusText(status) {
  return STATUS_MAP[status] || '未知状态'
}

/**
 * 拨打电话
 * @param {String} phone - 电话号码
 */
function makePhoneCall(phone) {
  if (!phone) {
    showToast('暂无联系方式')
    return
  }

  wx.makePhoneCall({
    phoneNumber: phone,
    fail: () => {
      showError('拨打失败')
    },
  })
}

/**
 * 复制文本到剪贴板
 * @param {String} text - 要复制的文本
 * @param {String} successMsg - 成功提示文本
 */
function copyToClipboard(text, successMsg = '已复制') {
  if (!text) {
    showToast('无内容可复制')
    return
  }

  wx.setClipboardData({
    data: text,
    success: () => {
      showSuccess(successMsg)
    },
    fail: () => {
      showError('复制失败')
    },
  })
}

/**
 * 处理云函数错误
 * @param {Error} error - 错误对象
 * @returns {String} 用户友好的错误提示
 */
function handleCloudError(error) {
  if (error && error.message === 'CLOUD_TIMEOUT') {
    return '请求超时，请检查网络连接'
  }
  
  const errorMsg = error && error.message
  
  // 根据错误类型返回友好提示
  if (errorMsg && errorMsg.includes('permission')) {
    return '权限不足，请重新登录'
  }
  if (errorMsg && errorMsg.includes('network')) {
    return '网络连接失败，请检查网络'
  }
  
  return '操作失败，请稍后重试'
}

module.exports = {
  formatTime,
  formatDetailTime,
  validatePhone,
  validateWechat,
  validatePickupCode,
  callCloud,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  showToast,
  getStatusText,
  makePhoneCall,
  copyToClipboard,
  handleCloudError,
  STATUS_MAP,
}
