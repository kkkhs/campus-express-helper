const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  try {
    const { userId, page = 0, pageSize = 20 } = event
    if (!userId) {
      return { success: false, error: '缺少用户ID' }
    }

    const reviewsRes = await db.collection('reviews')
      .where({ revieweeId: userId })
      .orderBy('createTime', 'desc')
      .skip(page * pageSize)
      .limit(pageSize)
      .get()

    const withReviewer = await Promise.all(reviewsRes.data.map(async (rev) => {
      const rRes = await db.collection('users').where({ _openid: rev.reviewerId }).field({ nickname: true, avatar: true }).get()
      return { ...rev, reviewer: rRes.data[0] || { nickname: '匿名用户', avatar: '' } }
    }))

    return { success: true, reviews: withReviewer }
  } catch (error) {
    console.error('获取用户评价失败:', error)
    return { success: false, error: error.message }
  }
}
