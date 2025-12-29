const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { page = 0, pageSize = 20 } = event

  try {
    // 检查是否为管理员（集合 + 白名单）
    const ADMIN_OPENIDS = ['oksZj1-M_fbfKabDeQ6iSEY10SaA']
    try {
      await db.collection('admins').limit(1).get()
    } catch (e) {
      const msg = String(e && e.message || '')
      if (msg.includes('collection not exists') || msg.includes('ResourceNotFound')) {
        await db.createCollection('admins')
      } else {
        throw e
      }
    }

    const adminRes = await db.collection('admins').where({ _openid: wxContext.OPENID }).get()
    const isAdmin = adminRes.data.length > 0 || ADMIN_OPENIDS.includes(wxContext.OPENID)
    if (!isAdmin) {
      return {
        success: false,
        error: '无管理员权限',
      }
    }

    // 查询任务列表
    const tasksRes = await db
      .collection('tasks')
      .orderBy('createTime', 'desc')
      .skip(page * pageSize)
      .limit(pageSize)
      .get()

    // 获取发布者信息
    const tasksWithPublisher = await Promise.all(
      tasksRes.data.map(async (task) => {
        const publisherRes = await db
          .collection('users')
          .where({
            _openid: task.userId,
          })
          .get()

        return {
          ...task,
          publisher: publisherRes.data[0] || {},
        }
      })
    )

    return {
      success: true,
      tasks: tasksWithPublisher,
    }
  } catch (error) {
    console.error('获取任务列表失败:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}
