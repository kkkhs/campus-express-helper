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
    await ensureCollections(db, ['tasks', 'users', 'orders'])
    
    // 查询任务详情
    const taskResult = await db.collection('tasks').doc(taskId).get()
    
    if (!taskResult.data) {
      return errorResponse('任务不存在')
    }
    
    const task = taskResult.data
    
    // 获取发布者信息
    const userResult = await db.collection('users')
      .where({ _openid: task.userId })
      .field({ nickname: true, avatar: true, rating: true, phone: true, wechat: true })
      .get()
    
    const basePublisher = userResult.data[0] || {
      nickname: '匿名用户',
      avatar: '',
      rating: 5.0,
      phone: '',
      wechat: ''
    }

    const publisher = {
      ...basePublisher,
      phone: basePublisher.phone || task.phone || '',
      wechat: basePublisher.wechat || task.wechat || ''
    }
    
    // 检查是否已接单
    let order = null
    if (task.status !== 'pending') {
      const orderResult = await db.collection('orders')
        .where({ taskId })
        .get()
      
      if (orderResult.data.length > 0) {
        order = orderResult.data[0]
        
        // 获取接单者信息
        if (order.takerId) {
          const takerResult = await db.collection('users')
            .where({ _openid: order.takerId })
            .field({ nickname: true, avatar: true, rating: true, phone: true, wechat: true })
            .get()
          
          order.takerInfo = takerResult.data[0] || {
            nickname: '匿名用户',
            avatar: '',
            rating: 5.0,
            phone: '',
            wechat: ''
          }
        }
      }
    }
    
    return successResponse({
      task,
      publisher,
      order,
      canViewContact: task.status !== 'pending' || task.userId === wxContext.OPENID
    })
  } catch (error) {
    console.error('获取任务详情失败:', error)
    return errorResponse(error, '获取任务详情失败，请稍后重试')
  }
}
