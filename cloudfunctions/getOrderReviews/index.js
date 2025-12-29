const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const { orderId, page = 0, pageSize = 10 } = event
    if (!orderId) {
      return { success: false, error: '缺少订单ID' }
    }

    const reviewsRes = await db.collection('reviews')
      .where({ orderId })
      .orderBy('createTime', 'desc')
      .skip(page * pageSize)
      .limit(pageSize)
      .get()

    const withReviewer = await Promise.all(
      (reviewsRes.data || []).map(async (rev) => {
        const rRes = await db.collection('users')
          .where({ _openid: rev.reviewerId })
          .field({ nickname: true, avatar: true })
          .get()
        return {
          ...rev,
          reviewer: rRes.data[0] || { nickname: '匿名用户', avatar: '' },
        }
      })
    )

    return { success: true, reviews: withReviewer }
  } catch (error) {
    console.error('获取订单评价失败:', error)
    return { success: false, error: error.message }
  }
}
