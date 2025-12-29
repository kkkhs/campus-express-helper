const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 检查是否为管理员
    if (wxContext.OPENID !== 'admin-openid') { // 替换为实际的管理员openid
      return {
        success: false,
        error: '无权限访问'
      }
    }
    
    // 获取用户统计
    const userCount = await db.collection('users').count()
    
    // 获取任务统计
    const taskStats = await db.collection('tasks').aggregate()
      .group({
        _id: '$status',
        count: _.sum(1)
      })
      .end()
    
    const taskCount = taskStats.list.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})
    
    // 获取订单统计
    const orderStats = await db.collection('orders').aggregate()
      .group({
        _id: '$status',
        count: _.sum(1)
      })
      .end()
    
    const orderCount = orderStats.list.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})
    
    // 获取今日数据
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayTaskCount = await db.collection('tasks')
      .where({
        createTime: _.gte(today)
      })
      .count()
    
    const todayOrderCount = await db.collection('orders')
      .where({
        createTime: _.gte(today)
      })
      .count()
    
    return {
      success: true,
      data: {
        userCount: userCount.total,
        taskCount: {
          pending: taskCount.pending || 0,
          accepted: taskCount.accepted || 0,
          completed: taskCount.completed || 0,
          total: (taskCount.pending || 0) + (taskCount.accepted || 0) + (taskCount.completed || 0)
        },
        orderCount: {
          accepted: orderCount.accepted || 0,
          completed: orderCount.completed || 0,
          total: (orderCount.accepted || 0) + (orderCount.completed || 0)
        },
        todayStats: {
          tasks: todayTaskCount.total,
          orders: todayOrderCount.total
        }
      }
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}