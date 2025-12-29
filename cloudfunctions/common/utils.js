/**
 * 云函数公共工具函数
 */

/**
 * 确保数据库集合存在
 * @param {Object} db - 数据库实例
 * @param {String} collectionName - 集合名称
 * @returns {Promise<void>}
 */
async function ensureCollection(db, collectionName) {
  try {
    await db.collection(collectionName).limit(1).get()
  } catch (e) {
    const msg = String((e && e.message) || '')
    if (msg.includes('collection not exists') || msg.includes('ResourceNotFound')) {
      try {
        await db.createCollection(collectionName)
        // 等待集合创建完成
        await new Promise((resolve) => setTimeout(resolve, 300))
        // 验证集合创建成功
        await db.collection(collectionName).limit(1).get()
      } catch (err) {
        console.error(`创建集合 ${collectionName} 失败:`, err)
        throw err
      }
    } else {
      throw e
    }
  }
}

/**
 * 批量确保多个集合存在
 * @param {Object} db - 数据库实例
 * @param {Array<String>} collectionNames - 集合名称数组
 * @returns {Promise<void>}
 */
async function ensureCollections(db, collectionNames) {
  for (const name of collectionNames) {
    await ensureCollection(db, name)
  }
}

/**
 * 标准化错误响应
 * @param {Error|String} error - 错误对象或错误信息
 * @param {String} defaultMsg - 默认错误信息
 * @returns {Object} 标准化的错误响应对象
 */
function errorResponse(error, defaultMsg = '操作失败') {
  console.error('错误:', error)
  
  const errorMsg = typeof error === 'string' ? error : (error && error.message)
  
  // 根据错误类型返回友好提示
  let userMsg = defaultMsg
  
  if (errorMsg) {
    if (errorMsg.includes('permission') || errorMsg.includes('权限')) {
      userMsg = '权限不足'
    } else if (errorMsg.includes('not found') || errorMsg.includes('不存在')) {
      userMsg = '数据不存在'
    } else if (errorMsg.includes('network') || errorMsg.includes('网络')) {
      userMsg = '网络错误，请稍后重试'
    } else if (errorMsg.includes('timeout') || errorMsg.includes('超时')) {
      userMsg = '请求超时，请稍后重试'
    } else {
      // 如果是自定义的友好错误信息，直接使用
      userMsg = errorMsg.length < 50 ? errorMsg : defaultMsg
    }
  }
  
  return {
    success: false,
    error: userMsg
  }
}

/**
 * 标准化成功响应
 * @param {Object} data - 响应数据
 * @returns {Object} 标准化的成功响应对象
 */
function successResponse(data = null) {
  const response = { success: true }
  if (data !== null) {
    response.data = data
  }
  return response
}

/**
 * 验证必填参数
 * @param {Object} params - 参数对象
 * @param {Array<String>} requiredFields - 必填字段数组
 * @returns {Object|null} 如果验证失败返回错误响应，否则返回null
 */
function validateRequired(params, requiredFields) {
  for (const field of requiredFields) {
    if (!params[field]) {
      return errorResponse(`缺少必填参数: ${field}`)
    }
  }
  return null
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
  const wechatRegex = /^[a-zA-Z][-_a-zA-Z0-9]{5,19}$/
  return wechatRegex.test(wechat)
}

/**
 * 检查用户权限
 * @param {Object} db - 数据库实例
 * @param {String} openid - 用户openid
 * @param {String} resourceId - 资源ID
 * @param {String} collection - 集合名称
 * @param {String} userIdField - 用户ID字段名（默认为userId）
 * @returns {Promise<Boolean>} 是否有权限
 */
async function checkUserPermission(db, openid, resourceId, collection, userIdField = 'userId') {
  try {
    const res = await db.collection(collection).doc(resourceId).get()
    if (!res.data) {
      return false
    }
    return res.data[userIdField] === openid
  } catch (error) {
    console.error('检查权限失败:', error)
    return false
  }
}

/**
 * 检查是否为管理员
 * @param {Object} db - 数据库实例
 * @param {String} openid - 用户openid
 * @param {Array<String>} adminWhitelist - 管理员白名单
 * @returns {Promise<Boolean>} 是否为管理员
 */
async function checkIsAdmin(db, openid, adminWhitelist = []) {
  // 先检查白名单
  if (adminWhitelist.includes(openid)) {
    return true
  }
  
  try {
    await ensureCollection(db, 'admins')
    const adminRes = await db.collection('admins')
      .where({ _openid: openid })
      .get()
    return adminRes.data.length > 0
  } catch (error) {
    console.error('检查管理员权限失败:', error)
    return false
  }
}

/**
 * 分页参数标准化
 * @param {Number} page - 页码
 * @param {Number} pageSize - 每页数量
 * @param {Number} maxPageSize - 最大每页数量
 * @returns {Object} 标准化的分页参数
 */
function normalizePagination(page = 1, pageSize = 20, maxPageSize = 100) {
  const normalizedPage = Math.max(1, parseInt(page) || 1)
  const normalizedPageSize = Math.min(
    maxPageSize,
    Math.max(1, parseInt(pageSize) || 20)
  )
  
  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
    skip: (normalizedPage - 1) * normalizedPageSize
  }
}

/**
 * 日志记录
 * @param {Object} db - 数据库实例
 * @param {String} userId - 用户ID
 * @param {String} action - 操作类型
 * @param {String} targetType - 目标类型
 * @param {String} targetId - 目标ID
 * @param {Object} details - 详细信息
 */
async function logAction(db, userId, action, targetType, targetId, details = {}) {
  try {
    await ensureCollection(db, 'logs')
    await db.collection('logs').add({
      data: {
        userId,
        action,
        targetType,
        targetId,
        details,
        createTime: new Date()
      }
    })
  } catch (error) {
    // 日志记录失败不应该影响主流程
    console.error('记录日志失败:', error)
  }
}

module.exports = {
  ensureCollection,
  ensureCollections,
  errorResponse,
  successResponse,
  validateRequired,
  validatePhone,
  validateWechat,
  checkUserPermission,
  checkIsAdmin,
  normalizePagination,
  logAction
}
