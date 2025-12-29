Page({
  data:{ userId:'', reviews:[] },
  onLoad(options){ this.setData({ userId: options.userId }); this.loadReviews() },
  async loadReviews(){
    wx.showLoading({ title:'加载中...' })
    try{
      const res = await wx.cloud.callFunction({ name:'getUserReviews', data:{ userId: this.data.userId } })
      if(res.result && res.result.success){ this.setData({ reviews: res.result.reviews }) } else { throw new Error((res.result && res.result.error)||'加载失败') }
    }catch(e){ wx.showToast({ title:'加载失败', icon:'error' }); console.error('加载评价失败:', e) } finally{ wx.hideLoading() }
  },
  formatTime(date){ const d=new Date(date); const now=new Date(); const diff=now-d; const m=Math.floor(diff/60000); const h=Math.floor(diff/3600000); const day=Math.floor(diff/86400000); if(m<1)return '刚刚'; if(m<60)return `${m}分钟前`; if(h<24)return `${h}小时前`; if(day<7)return `${day}天前`; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
})
