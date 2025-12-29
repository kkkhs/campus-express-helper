const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// ========== 工具函数 ==========
async function ensureCollection(db, collectionName) {
  try {
    await db.collection(collectionName).limit(1).get()
  } catch (e) {
    const msg = String((e && e.message) || '')
    if (msg.includes('collection not exists') || msg.includes('ResourceNotFound')) {
      try {
        await db.createCollection(collectionName)
        await new Promise((resolve) => setTimeout(resolve, 300))
      } catch (err) {
        console.error(`创建集合 ${collectionName} 失败:`, err)
      }
    }
  }
}

async function ensureCollections(db, collectionNames) {
  for (const name of collectionNames) {
    await ensureCollection(db, name)
  }
}

function errorResponse(error, defaultMsg = '操作失败') {
  console.error('错误:', error)
  const errorMsg = typeof error === 'string' ? error : (error && error.message)
  let userMsg = defaultMsg
  if (errorMsg && errorMsg.length < 50) {
    userMsg = errorMsg
  }
  return { success: false, error: userMsg }
}

function successResponse(data = null) {
  const response = { success: true }
  if (data !== null) response.data = data
  return response
}

function validateRequired(params, requiredFields) {
  for (const field of requiredFields) {
    if (!params[field]) {
      return errorResponse(`缺少必填参数: ${field}`)
    }
  }
  return null
}

async function logAction(db, userId, action, targetType, targetId, details = {}) {
  try {
    await ensureCollection(db, 'logs')
    await db.collection('logs').add({
      data: { userId, action, targetType, targetId, details, createTime: new Date() }
    })
  } catch (error) {
    console.error('记录日志失败:', error)
  }
}
// ========== 工具函数结束 ==========

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { orderId, taskId } = event
  
  try {
    // 验证必填参数
    const validationError = validateRequired(event, ['orderId'])
    if (validationError) {
      return validationError
    }
    
    // 确保集合存在
    await ensureCollections(db, ['orders', 'tasks'])
    // 获取订单信息
    const orderRes = await db.collection('orders')
      .doc(orderId)
      .get()
    
    if (!orderRes.data) {
      return errorResponse('订单不存在')
    }
    
    const order = orderRes.data
    const resolvedTaskId = taskId || order.taskId
    
    // 检查是否是接单者
    if (order.takerId !== wxContext.OPENID) {
      return errorResponse('只能完成自己接的订单')
    }
    
    // 检查订单状态
    if (order.status !== 'accepted') {
      return errorResponse('订单状态不正确')
    }
    
    // 使用事务处理，确保数据一致性
    const result = await db.runTransaction(async transaction => {
      // 更新订单状态
      await transaction.collection('orders')
        .doc(orderId)
        .update({
          data: {
            status: 'completed',
            completeTime: new Date(),
            updateTime: new Date()
          }
        })
      
      // 更新任务状态
      await transaction.collection('tasks')
        .doc(resolvedTaskId)
        .update({
          data: {
            status: 'completed',
            updateTime: new Date()
          }
        })
      
      return { orderId, taskId: resolvedTaskId }
    })
    
    // 记录操作日志
    await logAction(db, wxContext.OPENID, 'completeOrder', 'order', orderId, { taskId: resolvedTaskId })
    
    return successResponse(result)
  } catch (error) {
    console.error('完成订单失败:', error)
    return errorResponse(error, '完成订单失败，请稍后重试')
  }
}
