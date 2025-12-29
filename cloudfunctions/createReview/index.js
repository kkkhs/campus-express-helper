const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { orderId, revieweeId, rating, comment } = event
    
    // 查询订单详情
    const orderResult = await db.collection('orders').doc(orderId).get()
    
    if (!orderResult.data) {
      return {
        success: false,
        error: '订单不存在'
      }
    }
    
    const order = orderResult.data
    
    // 检查订单是否已完成
    if (order.status !== 'completed') {
      return {
        success: false,
        error: '订单未完成，无法评价'
      }
    }
    
    // 检查是否已经评价过
    const existingReview = await db.collection('reviews')
      .where({
        orderId,
        reviewerId: wxContext.OPENID
      })
      .get()
    
    if (existingReview.data.length > 0) {
      return {
        success: false,
        error: '已经评价过此订单'
      }
    }
    
    // 创建评价
    const reviewData = {
      reviewerId: wxContext.OPENID,
      revieweeId,
      orderId,
      rating,
      comment: comment || '',
      createTime: new Date()
    }
    
    const result = await db.collection('reviews').add({
      data: reviewData
    })
    
    // 更新被评价者的平均评分（健壮计算）
    const reviews = await db.collection('reviews')
      .where({ revieweeId })
      .get()
    const list = Array.isArray(reviews.data) ? reviews.data : []
    const sum = list.reduce((acc, r) => acc + Number(r.rating || 0), 0)
    const avgRating = list.length ? Math.round((sum / list.length) * 10) / 10 : Number(rating)
    
    await db.collection('users')
      .where({ _openid: revieweeId })
      .update({
        data: {
          rating: Math.round(avgRating * 10) / 10
        }
      })
    
    return {
      success: true,
      data: {
        reviewId: result._id,
        ...reviewData
      }
    }
  } catch (error) {
    console.error('创建评价失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
