const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    const msgIncludes = (m, s) => String(m || '').includes(s)
    try {
      await db.collection('users').limit(1).get()
    } catch (e) {
      const msg = e && e.message
      if (
        msgIncludes(msg, 'collection not exists') ||
        msgIncludes(msg, 'ResourceNotFound')
      ) {
        await db.createCollection('users')
        await new Promise((r) => setTimeout(r, 300))
        await db.collection('users').limit(1).get()
      } else {
        throw e
      }
    }
    // 检查用户是否已存在
    const userResult = await db
      .collection('users')
      .where({
        _openid: wxContext.OPENID,
      })
      .get()

    let userInfo = null

    if (userResult.data.length === 0) {
      // 新用户，创建用户记录
      const newUser = {
        _openid: wxContext.OPENID,
        nickname: event.nickName || '匿名用户',
        avatar: event.avatarUrl || '',
        phone: '',
        wechat: '',
        rating: 5.0,
        createTime: new Date(),
      }

      const addResult = await db.collection('users').add({
        data: newUser,
      })

      userInfo = {
        ...newUser,
        _id: addResult._id,
      }
    } else {
      // 已存在用户，返回用户信息
      userInfo = userResult.data[0]
      // 如果本次登录传入了微信昵称/头像，更新用户档案以保持一致
      const needUpdateNick =
        event.nickName && event.nickName !== userInfo.nickname
      const needUpdateAvatar =
        event.avatarUrl && event.avatarUrl !== userInfo.avatar
      if (needUpdateNick || needUpdateAvatar) {
        await db
          .collection('users')
          .where({ _openid: wxContext.OPENID })
          .update({
            data: {
              ...(needUpdateNick ? { nickname: event.nickName } : {}),
              ...(needUpdateAvatar ? { avatar: event.avatarUrl } : {}),
              updateTime: new Date(),
            },
          })
        userInfo = {
          ...userInfo,
          nickname: needUpdateNick ? event.nickName : userInfo.nickname,
          avatar: needUpdateAvatar ? event.avatarUrl : userInfo.avatar,
        }
      }
    }

    // 检查是否为管理员：白名单或 admins 集合
    const ADMIN_OPENIDS = ['oksZj1-M_fbfKabDeQ6iSEY10SaA']
    let isAdmin = false
    try {
      try {
        await db.collection('admins').limit(1).get()
      } catch (e) {
        const msg = String((e && e.message) || '')
        if (
          msg.includes('collection not exists') ||
          msg.includes('ResourceNotFound')
        ) {
          await db.createCollection('admins')
        } else {
          throw e
        }
      }

      const adminRes = await db
        .collection('admins')
        .where({ _openid: wxContext.OPENID })
        .get()
      if (adminRes.data.length > 0) {
        isAdmin = true
      } else if (ADMIN_OPENIDS.includes(wxContext.OPENID)) {
        try {
          await db
            .collection('admins')
            .add({ data: { _openid: wxContext.OPENID, createdAt: new Date() } })
        } catch (_) {}
        isAdmin = true
      }
    } catch (_) {
      isAdmin = ADMIN_OPENIDS.includes(wxContext.OPENID)
    }

    return {
      success: true,
      data: {
        userInfo,
        isAdmin,
        openid: wxContext.OPENID,
      },
    }
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}
