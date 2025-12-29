const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { complaintId, action } = event
  
  try {
    // 检查是否为管理员
    const adminRes = await db.collection('admins')
      .where({
        _openid: wxContext.OPENID
      })
      .get()
    
    if (adminRes.data.length === 0) {
      return {
        success: false,
        error: '无管理员权限'
      }
    }
    
    // 更新投诉状态
    await db.collection('complaints')
      .doc(complaintId)
      .update({
        data: {
          status: action === 'resolve' ? 'resolved' : 'rejected',
          handleTime: new Date(),
          updateTime: new Date()
        }
      })
    
    return {
      success: true
    }
  } catch (error) {
    console.error('处理投诉失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}