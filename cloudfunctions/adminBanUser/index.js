const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { userId, banned } = event

  try {
    // 检查是否为管理员
    const adminRes = await db
      .collection('admins')
      .where({
        _openid: wxContext.OPENID,
      })
      .get()

    if (adminRes.data.length === 0) {
      return {
        success: false,
        error: '无管理员权限',
      }
    }

    // 更新用户状态
    await db
      .collection('users')
      .doc(userId)
      .update({
        data: {
          banned: banned,
          updateTime: new Date(),
        },
      })

    return {
      success: true,
    }
  } catch (error) {
    console.error('封禁用户失败:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}
