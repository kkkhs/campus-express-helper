const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { status, page = 0, pageSize = 20 } = event
  
  try {
    // 构建查询条件
    const where = {
      userId: wxContext.OPENID
    }
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    // 查询任务
    const tasksRes = await db.collection('tasks')
      .where(where)
      .orderBy('createTime', 'desc')
      .skip(page * pageSize)
      .limit(pageSize)
      .get()
    
    // 获取关联的订单信息（用于判断是否已评价）
    const tasksWithOrders = await Promise.all(
      tasksRes.data.map(async (task) => {
        if (task.status === 'completed') {
          const orderRes = await db.collection('orders')
            .where({
              taskId: task._id,
              status: 'completed'
            })
            .get()
          
          if (orderRes.data.length > 0) {
            const order = orderRes.data[0]
            // 检查是否已有评价
            const reviewRes = await db.collection('reviews')
              .where({
                taskId: task._id,
                orderId: order._id
              })
              .get()
            
            return {
              ...task,
              orderId: order._id,
              reviewed: reviewRes.data.length > 0
            }
          }
        }
        return task
      })
    )
    
    return {
      success: true,
      tasks: tasksWithOrders
    }
  } catch (error) {
    console.error('获取我的任务失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
