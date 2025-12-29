const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

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

    // 获取统计数据
    const [
      usersCount,
      tasksCount,
      completedTasksCount,
      pendingComplaintsCount,
    ] = await Promise.all([
      // 总用户数
      db.collection('users').count(),
      // 总任务数
      db.collection('tasks').count(),
      // 已完成任务数
      db
        .collection('tasks')
        .where({
          status: 'completed',
        })
        .count(),
      // 待处理投诉数
      db
        .collection('complaints')
        .where({
          status: 'pending',
        })
        .count(),
    ])

    return {
      success: true,
      statistics: {
        totalUsers: usersCount.total,
        totalTasks: tasksCount.total,
        completedTasks: completedTasksCount.total,
        pendingComplaints: pendingComplaintsCount.total,
      },
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}
