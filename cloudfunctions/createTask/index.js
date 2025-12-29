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
  
  try {
    // 验证必填参数
    const validationError = validateRequired(event, ['pickupPoint', 'company', 'pickupCode', 'phone'])
    if (validationError) {
      return validationError
    }
    
    const { pickupPoint, company, pickupCode, phone, wechat, reward, remark } = event

    // 确保集合存在
    await ensureCollections(db, ['users', 'tasks'])
    
    // 检查用户信息是否完整
    const userRes = await db.collection('users').where({ _openid: wxContext.OPENID }).get()
    const user = userRes.data && userRes.data[0]
    if (!user || !user.phone || !user.wechat) {
      return errorResponse('请先在个人信息中填写电话和微信')
    }
    
    // 创建任务
    const taskData = {
      userId: wxContext.OPENID,
      pickupPoint,
      company,
      pickupCode,
      phone,
      wechat,
      reward: reward || 0,
      remark: remark || '',
      status: 'pending',
      createTime: new Date(),
      updateTime: new Date()
    }
    
    const result = await db.collection('tasks').add({
      data: taskData
    })
    
    const taskId = result._id
    
    // 记录操作日志
    await logAction(db, wxContext.OPENID, 'createTask', 'task', taskId, { reward, pickupPoint })
    
    return successResponse({
      taskId,
      ...taskData
    })
  } catch (error) {
    console.error('创建任务失败:', error)
    return errorResponse(error, '创建任务失败，请稍后重试')
  }
}
