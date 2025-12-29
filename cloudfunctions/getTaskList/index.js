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
// ========== 工具函数结束 ==========

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { pickupPoint, sortBy, rewardRange, page = 1, pageSize = 20 } = event
    
    // 确保集合存在
    await ensureCollections(db, ['tasks', 'users'])
    
    // 构建查询条件
    let where = {
      status: 'pending'
    }
    
    if (pickupPoint) {
      where.pickupPoint = pickupPoint
    }
    
    if (rewardRange && rewardRange.length === 2) {
      where.reward = _.gte(rewardRange[0]).and(_.lte(rewardRange[1]))
    }
    
    // 构建排序条件
    let orderBy = 'createTime'
    let order = 'desc'
    
    switch (sortBy) {
      case 'reward':
        orderBy = 'reward'
        order = 'desc'
        break
      case 'time':
        orderBy = 'createTime'
        order = 'desc'
        break
      default:
        orderBy = 'createTime'
        order = 'desc'
    }
    
    // 查询任务列表
    const result = await db.collection('tasks')
      .where(where)
      .orderBy(orderBy, order)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    // 获取发布者信息
    const tasksWithUserInfo = await Promise.all(
      result.data.map(async (task) => {
        const userResult = await db.collection('users')
          .where({ _openid: task.userId })
          .field({ nickname: true, avatar: true, rating: true })
          .get()
        
        return {
          ...task,
          publisher: userResult.data[0] || {
            nickname: '匿名用户',
            avatar: '',
            rating: 5.0
          }
        }
      })
    )
    
    return successResponse({
      tasks: tasksWithUserInfo,
      total: result.data.length,
      page,
      pageSize
    })
  } catch (error) {
    console.error('获取任务列表失败:', error)
    return errorResponse(error, '获取任务列表失败，请稍后重试')
  }
}
