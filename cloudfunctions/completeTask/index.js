const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { taskId } = event

  try {
    // 获取任务信息
    const taskRes = await db.collection('tasks').doc(taskId).get()

    if (taskRes.data.length === 0) {
      return {
        success: false,
        error: '任务不存在',
      }
    }

    const task = taskRes.data

    // 检查是否是任务发布者
    if (task.userId !== wxContext.OPENID) {
      return {
        success: false,
        error: '只能完成自己发布的任务',
      }
    }

    // 检查任务状态
    if (task.status !== 'accepted') {
      return {
        success: false,
        error: '只能完成已接单状态的任务',
      }
    }

    // 获取对应的订单
    const orderRes = await db
      .collection('orders')
      .where({
        taskId: taskId,
        status: 'accepted',
      })
      .get()

    if (orderRes.data.length === 0) {
      return {
        success: false,
        error: '未找到对应的订单',
      }
    }

    const order = orderRes.data[0]

    // 开始事务处理
    const transaction = await db.startTransaction()

    try {
      // 更新任务状态
      await transaction
        .collection('tasks')
        .doc(taskId)
        .update({
          data: {
            status: 'completed',
            updateTime: new Date(),
          },
        })

      // 更新订单状态
      await transaction
        .collection('orders')
        .doc(order._id)
        .update({
          data: {
            status: 'completed',
            completeTime: new Date(),
            updateTime: new Date(),
          },
        })

      // 提交事务
      await transaction.commit()

      return {
        success: true,
      }
    } catch (error) {
      // 回滚事务
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error('完成任务失败:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}
