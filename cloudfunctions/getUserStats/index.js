// 云函数：获取用户统计数据
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})
const db = cloud.database()

// ========== 工具函数 ==========
async function ensureCollection(db, collectionName) {
  try {
    await db.collection(collectionName).count()
    return true
  } catch (error) {
    if (error.errCode === -1 || error.message.includes('collection not exist')) {
      console.warn(`集合 ${collectionName} 不存在，正在创建...`)
      try {
        await db.createCollection(collectionName)
        console.log(`集合 ${collectionName} 创建成功`)
        return true
      } catch (createError) {
        console.error(`创建集合 ${collectionName} 失败:`, createError)
        return false
      }
    }
    throw error
  }
}

async function ensureCollections(db, collectionNames) {
  const results = await Promise.all(
    collectionNames.map((name) => ensureCollection(db, name))
  )
  return results.every((r) => r)
}

function errorResponse(error, defaultMsg = '操作失败') {
  console.error('Error:', error)
  return {
    success: false,
    error: error.message || defaultMsg,
  }
}

function successResponse(data = null) {
  return {
    success: true,
    data,
  }
}
// ========== 工具函数结束 ==========

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const userId = wxContext.OPENID

    if (!userId) {
      return errorResponse(new Error('用户未登录'))
    }

    // 确保集合存在
    await ensureCollections(db, ['tasks', 'orders'])

    // 并行查询统计数据
    const [publishResult, acceptResult, completeResult] = await Promise.all([
      // 1. 统计发布的任务数（所有状态的任务）
      db
        .collection('tasks')
        .where({
          userId: userId,
        })
        .count(),

      // 2. 统计接受的订单数（所有状态的订单）
      db
        .collection('orders')
        .where({
          takerId: userId,
        })
        .count(),

      // 3. 统计完成的订单数
      db
        .collection('orders')
        .where({
          takerId: userId,
          status: 'completed',
        })
        .count(),
    ])

    const stats = {
      publishCount: publishResult.total || 0,
      acceptCount: acceptResult.total || 0,
      completeCount: completeResult.total || 0,
    }

    return successResponse(stats)
  } catch (error) {
    return errorResponse(error, '获取统计数据失败')
  }
}
