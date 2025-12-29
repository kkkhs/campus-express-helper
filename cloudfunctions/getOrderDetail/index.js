const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const { orderId } = event
    if (!orderId) {
      return { success: false, error: '缺少订单ID' }
    }

    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) {
      return { success: false, error: '订单不存在' }
    }
    const order = orderRes.data

    const taskRes = await db.collection('tasks').doc(order.taskId).get()
    const task = taskRes.data || null

    let publisher = null
    if (task && task.userId) {
      const pubRes = await db.collection('users').where({ _openid: task.userId }).field({ nickname: true, avatar: true, rating: true, phone: true, wechat: true }).get()
      publisher = pubRes.data[0] || { nickname: '匿名用户', avatar: '', rating: 5.0, phone: '', wechat: '' }
    }

    let taker = null
    if (order.takerId) {
      const takerRes = await db.collection('users').where({ _openid: order.takerId }).field({ nickname: true, avatar: true, rating: true, phone: true, wechat: true }).get()
      taker = takerRes.data[0] || { nickname: '匿名用户', avatar: '', rating: 5.0, phone: '', wechat: '' }
    }

    return { success: true, data: { order, task, publisher, taker } }
  } catch (error) {
    console.error('获取订单详情失败:', error)
    return { success: false, error: error.message }
  }
}
