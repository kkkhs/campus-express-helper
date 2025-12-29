Page({
  data:{ orderId:'', revieweeId:'', rating:5, comment:'', submitting:false },
  onLoad(options){
    this.setData({ orderId: options.orderId || options.id || '', revieweeId: options.revieweeId || '' })
    this.ensureParams()
  },
  async ensureParams(){
    if(!this.data.orderId){ wx.showToast({ title:'缺少订单参数', icon:'error' }); return }
    if(!this.data.revieweeId){
      try{
        const res = await wx.cloud.callFunction({ name:'getOrderDetail', data:{ orderId: this.data.orderId } })
        if(res.result && res.result.success){
          const { order, task } = res.result.data
          const me = (wx.getStorageSync('userInfo') || {}).openid || (wx.getStorageSync('userInfo') || {})._openid
          const revieweeId = me === task.userId ? order.takerId : task.userId
          if(revieweeId){ this.setData({ revieweeId }) }
        }
      }catch(e){ console.error('获取订单详情失败:', e) }
    }
  },
  onStarTap(e){ const v = Number(e.currentTarget.dataset.value); this.setData({ rating: v }) },
  onCommentInput(e){ this.setData({ comment: e.detail.value }) },
  async submitReview(){
    await this.ensureParams()
    if(!this.data.orderId || !this.data.revieweeId){ wx.showToast({ title:'缺少参数', icon:'error' }); return }
    this.setData({ submitting:true })
    try{
      const res = await wx.cloud.callFunction({ name:'createReview', data:{ orderId:this.data.orderId, revieweeId:this.data.revieweeId, rating:this.data.rating, comment:this.data.comment } })
      if(res.result && res.result.success){ wx.showToast({ title:'已提交', icon:'success' }); setTimeout(()=>wx.navigateBack(),1200) } else { throw new Error((res.result && res.result.error)||'提交失败') }
    }catch(e){ wx.showToast({ title:'提交失败', icon:'error' }); console.error('提交评价失败:', e) }
    finally{ this.setData({ submitting:false }) }
  }
})
