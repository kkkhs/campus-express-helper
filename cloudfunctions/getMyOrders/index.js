const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { status, page = 0, pageSize = 20 } = event
  
  try {
    // 构建查询条件
    const where = {
      takerId: wxContext.OPENID
    }
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    // 查询订单
    const ordersRes = await db.collection('orders')
      .where(where)
      .orderBy('createTime', 'desc')
      .skip(page * pageSize)
      .limit(pageSize)
      .get()
    
    if (ordersRes.data.length === 0) {
      return {
        success: true,
        orders: []
      }
    }
    
    // 批量获取任务ID列表
    const taskIds = ordersRes.data.map(order => order.taskId)
    
    // 批量查询任务详情（使用 _.in 批量查询）
    const tasksRes = await db.collection('tasks')
      .where({
        _id: _.in(taskIds)
      })
      .get()
    
    // 创建任务ID到任务对象的映射
    const tasksMap = {}
    tasksRes.data.forEach(task => {
      tasksMap[task._id] = task
    })
    
    // 批量获取发布者ID列表（去重）
    const publisherIds = [...new Set(tasksRes.data.map(task => task.userId))]
    
    // 批量查询发布者信息
    const publishersRes = await db.collection('users')
      .where({
        _openid: _.in(publisherIds)
      })
      .field({ 
        _openid: true, 
        nickname: true, 
        avatar: true, 
        rating: true, 
        phone: true, 
        wechat: true 
      })
      .get()
    
    // 创建发布者ID到发布者对象的映射
    const publishersMap = {}
    publishersRes.data.forEach(publisher => {
      publishersMap[publisher._openid] = publisher
    })
    
    // 批量获取订单ID列表
    const orderIds = ordersRes.data.map(order => order._id)
    
    // 批量查询评价（只查询当前用户作为评价者的评价）
    const reviewsRes = await db.collection('reviews')
      .where({
        orderId: _.in(orderIds),
        reviewerId: wxContext.OPENID
      })
      .field({ orderId: true })
      .get()
    
    // 创建已评价订单ID的集合
    const reviewedOrderIds = new Set(reviewsRes.data.map(review => review.orderId))
    
    // 组装订单详情数据
    const ordersWithDetails = ordersRes.data.map(order => {
      const task = tasksMap[order.taskId] || {}
      const publisher = publishersMap[task.userId] || {
        nickname: '匿名用户',
        avatar: '',
        rating: 5.0,
        phone: '',
        wechat: ''
      }
      
      return {
        ...order,
        task,
        publisher,
        reviewed: reviewedOrderIds.has(order._id)
      }
    })
    
    return {
      success: true,
      orders: ordersWithDetails
    }
  } catch (error) {
    console.error('获取我的接单失败:', error)
    return {
      success: false,
      error: '获取订单列表失败，请稍后重试'
    }
  }
}
