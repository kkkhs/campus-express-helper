const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
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
  try {
    // 验证必填参数
    const validationError = validateRequired(event, ['taskId'])
    if (validationError) {
      return validationError
    }
    
    const { taskId, cancelReason = '' } = event
    
    // 确保集合存在
    await ensureCollections(db, ['tasks', 'orders'])

    const taskRes = await db.collection('tasks').doc(taskId).get()
    if (!taskRes.data) {
      return errorResponse('任务不存在')
    }

    const task = taskRes.data
    if (task.userId !== wxContext.OPENID) {
      return errorResponse('无权限取消该任务')
    }

    // 已完成或已取消的任务不能再次取消
    if (task.status === 'completed' || task.status === 'cancelled') {
      return errorResponse('该任务不可取消')
    }

    // 使用事务处理，确保任务和订单状态同步
    const result = await db.runTransaction(async transaction => {
      // 更新任务状态
      await transaction.collection('tasks').doc(taskId).update({
        data: {
          status: 'cancelled',
          cancelReason: cancelReason,
          cancelTime: new Date(),
          updateTime: new Date(),
        },
      })

      // 如果任务已被接单，需要同步取消订单
      if (task.status === 'accepted') {
        const orderRes = await transaction.collection('orders')
          .where({ taskId: taskId })
          .get()
        
        if (orderRes.data.length > 0) {
          const order = orderRes.data[0]
          await transaction.collection('orders').doc(order._id).update({
            data: {
              status: 'cancelled',
              cancelReason: '发布者取消任务',
              updateTime: new Date(),
            },
          })
        }
      }

      return { taskId }
    })
    
    // 记录操作日志
    await logAction(db, wxContext.OPENID, 'cancelTask', 'task', taskId, { 
      cancelReason,
      previousStatus: task.status 
    })

    return successResponse(result)
  } catch (error) {
    console.error('取消任务失败:', error)
    return errorResponse(error, '取消任务失败，请稍后重试')
  }
}
