const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  try {
    const { page = 0, pageSize = 20 } = event
    const reviewsRes = await db.collection('reviews')
      .where({ reviewerId: wxContext.OPENID })
      .orderBy('createTime', 'desc')
      .skip(page * pageSize)
      .limit(pageSize)
      .get()

    const withReviewee = await Promise.all(
      reviewsRes.data.map(async (rev) => {
        const uRes = await db.collection('users')
          .where({ _openid: rev.revieweeId })
          .field({ nickname: true, avatar: true })
          .get()
        return { ...rev, reviewee: uRes.data[0] || { nickname: '匿名用户', avatar: '' } }
      })
    )

    return { success: true, reviews: withReviewee }
  } catch (error) {
    console.error('获取我写的评价失败:', error)
    return { success: false, error: error.message }
  }
}
