const app = getApp()
Page({
  data:{ activeTab:'received', received:[], written:[] },
  onLoad(){ this.loadAll() },
  async loadAll(){
    const user = app.globalData.userInfo || wx.getStorageSync('userInfo')
    if(!user){ wx.showToast({ title:'请先登录', icon:'error' }); setTimeout(()=>wx.switchTab({ url:'/pages/index/index' }),1200); return }
    wx.showLoading({ title:'加载中...' })
    try{
      const [rec, wrt] = await Promise.all([
        wx.cloud.callFunction({ name:'getUserReviews', data:{ userId: user._openid } }),
        wx.cloud.callFunction({ name:'getMyWrittenReviews' })
      ])
      this.setData({
        received: rec.result && rec.result.success ? (rec.result.reviews || []) : [],
        written: wrt.result && wrt.result.success ? (wrt.result.reviews || []) : []
      })
    }catch(e){ wx.showToast({ title:'加载失败', icon:'error' }); console.error('加载评价失败:', e) }
    finally{ wx.hideLoading() }
  },
  onTabChange(e){ const tab = e.currentTarget.dataset.tab; if(tab === this.data.activeTab) return; this.setData({ activeTab: tab }) },
  formatTime(date){ const d=new Date(date); const now=new Date(); const diff=now-d; const m=Math.floor(diff/60000); const h=Math.floor(diff/3600000); const day=Math.floor(diff/86400000); if(m<1)return '刚刚'; if(m<60)return `${m}分钟前`; if(h<24)return `${h}小时前`; if(day<7)return `${day}天前`; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
})
