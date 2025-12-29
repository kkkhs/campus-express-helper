const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { phone, wechat, nickname, avatar } = event
    
    // 更新用户信息
    const result = await db.collection('users').where({
      _openid: wxContext.OPENID
    }).update({
      data: {
        phone: phone || '',
        wechat: wechat || '',
        ...(nickname !== undefined ? { nickname: nickname } : {}),
        ...(avatar !== undefined ? { avatar: avatar } : {}),
        updateTime: new Date()
      }
    })
    
    if (result.stats.updated === 0) {
      return {
        success: false,
        error: '用户不存在'
      }
    }
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
