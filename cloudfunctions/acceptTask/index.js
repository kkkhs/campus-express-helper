const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

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
  
  try {
    // 验证必填参数
    const validationError = validateRequired(event, ['taskId'])
    if (validationError) {
      return validationError
    }
    
    const { taskId } = event
    
    // 确保集合存在
    await ensureCollections(db, ['users', 'tasks', 'orders'])
    
    // 检查用户信息是否完整
    const userRes = await db.collection('users').where({ _openid: wxContext.OPENID }).get()
    const user = userRes.data && userRes.data[0]
    if (!user || !user.phone || !user.wechat) {
      return errorResponse('请先在个人信息中填写电话和微信')
    }
    
    // 开启事务
    const result = await db.runTransaction(async transaction => {
      // 查询任务详情
      const taskResult = await transaction.collection('tasks').doc(taskId).get()
      
      if (!taskResult.data) {
        return errorResponse('任务不存在')
      }
      
      const task = taskResult.data
      
      // 检查任务状态
      if (task.status !== 'pending') {
        return errorResponse('任务已被接单')
      }
      
      // 检查是否为自己的任务
      if (task.userId === wxContext.OPENID) {
        return errorResponse('不能接自己的任务')
      }
      
      // 更新任务状态
      await transaction.collection('tasks').doc(taskId).update({
        data: {
          status: 'accepted',
          updateTime: new Date()
        }
      })
      
      // 创建订单
      const orderResult = await transaction.collection('orders').add({
        data: {
          taskId: taskId,
          takerId: wxContext.OPENID,
          status: 'accepted',
          createTime: new Date(),
          completeTime: null
        }
      })
      
      return {
        taskId,
        orderId: orderResult._id
      }
    })
    
    // 记录操作日志
    await logAction(db, wxContext.OPENID, 'acceptTask', 'task', taskId, { orderId: result.orderId })
    
    return successResponse(result)
  } catch (error) {
    console.error('接单失败:', error)
    return errorResponse(error, '接单失败，请稍后重试')
  }
}
