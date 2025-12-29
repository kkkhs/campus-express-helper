App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-8gy7urmg8538c2c1', // 你的 env ID
        traceUser: true,
      })
    }

    this.globalData = {
      userInfo: null,
      isAdmin: false,
    }

    // 用于通知其他页面 DB 是否准备好
    this._dbReadyResolve = null
    this.dbReadyPromise = new Promise((resolve) => {
      this._dbReadyResolve = resolve
    })

    this.initDatabase()
  },

  /**
   * 调用云函数初始化数据库
   * 仅首次执行（存储在本地）
   */
  async initDatabase() {
    const inited = wx.getStorageSync('db_inited')
    if (inited) {
      console.log('DB 已初始化，本地标记存在')
      this._dbReadyResolve(true)
      return
    }

    try {
      console.log('正在初始化数据库（云函数 initDB）...')
      const res = await wx.cloud.callFunction({
        name: 'initDB',
      })

      if (res.result && res.result.ok) {
        console.log('数据库初始化成功')
        wx.setStorageSync('db_inited', true)
      } else {
        console.error('数据库初始化失败', res)
      }
    } catch (err) {
      console.error('initDB 云函数调用出错：', err)
    }

    this._dbReadyResolve(true)
  },
})
