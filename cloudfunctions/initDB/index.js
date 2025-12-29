// 云函数：initDB（用于创建集合）
// 文件路径：cloudfunctions/initDB/index.js
const cloud = require('wx-server-sdk')

console.log('InitDB start')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

// 需要初始化的集合名称（涵盖当前项目使用的所有集合）
const collections = [
  'users',
  'tasks',
  'orders',
  'reviews',
  'admins',
  'complaints',
]

exports.main = async () => {
  try {
    const created = []
    const existed = []

    const ensureCollection = async (name) => {
      try {
        await db.collection(name).limit(1).get()
        existed.push(name)
      } catch (e) {
        const msg = String((e && e.message) || '')
        if (
          msg.includes('collection not exists') ||
          msg.includes('ResourceNotFound')
        ) {
          await db.createCollection(name)
          created.push(name)
          await new Promise((r) => setTimeout(r, 300))
          await db.collection(name).limit(1).get()
        } else {
          throw e
        }
      }
    }

    for (const name of collections) {
      await ensureCollection(name)
      console.log(`Added to ${name}`)
    }

    return {
      ok: true,
      message: 'Collections ensured successfully',
      created,
      existed,
    }
  } catch (e) {
    return {
      ok: false,
      error: e && e.message ? e.message : e,
    }
  }
}
