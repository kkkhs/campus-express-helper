# 云函数部署说明

## 🚀 快速开始

### 一键部署（推荐）

```bash
# 1. 确保已安装并登录 CloudBase CLI
npm install -g @cloudbase/cli
tcb login

# 2. 运行部署脚本
./deploy-optimized-functions.sh
```

就这么简单！脚本会自动按顺序部署所有 8 个优化的云函数。

---

## 📦 需要部署的云函数

| 序号 | 云函数名 | 说明 | 优先级 |
|------|----------|------|--------|
| 1 | **common** | 公共工具模块 | 🔴 必须最先部署 |
| 2 | acceptTask | 接单功能 | 🟡 依赖 common |
| 3 | createTask | 创建任务 | 🟡 依赖 common |
| 4 | completeOrder | 完成订单 | 🟡 依赖 common |
| 5 | cancelTask | 取消任务（增强版） | 🟡 依赖 common |
| 6 | getTaskDetail | 获取任务详情 | 🟡 依赖 common |
| 7 | getTaskList | 获取任务列表 | 🟡 依赖 common |
| 8 | getMyOrders | 获取我的订单（性能优化版） | 🟡 依赖 common |

---

## 🛠️ 手动部署命令

### 准备工作

```bash
# 设置你的环境ID（请替换为实际的环境ID）
export ENV_ID="cloud1-8gy7urmg8538c2c1"
```

### 部署命令

```bash
# ⚠️ 重要：必须先部署 common！
tcb fn deploy common --dir cloudfunctions/common -e $ENV_ID --force

# 然后部署其他云函数（顺序可任意）
tcb fn deploy acceptTask --dir cloudfunctions/acceptTask -e $ENV_ID --force
tcb fn deploy createTask --dir cloudfunctions/createTask -e $ENV_ID --force
tcb fn deploy completeOrder --dir cloudfunctions/completeOrder -e $ENV_ID --force
tcb fn deploy cancelTask --dir cloudfunctions/cancelTask -e $ENV_ID --force
tcb fn deploy getTaskDetail --dir cloudfunctions/getTaskDetail -e $ENV_ID --force
tcb fn deploy getTaskList --dir cloudfunctions/getTaskList -e $ENV_ID --force
tcb fn deploy getMyOrders --dir cloudfunctions/getMyOrders -e $ENV_ID --force
```

### 单个云函数部署

如果你只想部署某个特定的云函数：

```bash
# 格式
tcb fn deploy <函数名> --dir cloudfunctions/<函数名> -e <环境ID> --force

# 示例：只部署 acceptTask
tcb fn deploy acceptTask --dir cloudfunctions/acceptTask -e $ENV_ID --force
```

---

## 📝 部署脚本说明

### 功能特性

✅ **自动按顺序部署** - common 优先，其他函数依次部署  
✅ **彩色输出** - 清晰显示部署进度和结果  
✅ **错误处理** - 部署失败会显示详细信息  
✅ **统计汇总** - 显示成功/失败数量  
✅ **环境检查** - 自动检查 tcb 命令和登录状态  

### 使用方法

```bash
# 使用默认环境ID
./deploy-optimized-functions.sh

# 使用自定义环境ID
ENV_ID="你的环境ID" ./deploy-optimized-functions.sh
```

### 脚本输出示例

```
========================================
  云函数优化版本部署脚本
========================================

环境ID: cloud1-8gy7urmg8538c2c1

✓ tcb 命令已就绪

========================================
开始部署 8 个云函数
========================================

[1/8] 正在部署: common
✓ common 部署成功

[2/8] 正在部署: acceptTask
✓ acceptTask 部署成功

...

========================================
部署完成
========================================

总计: 8 个云函数
成功: 8
失败: 0

🎉 所有云函数部署成功！
```

---

## ⚠️ 常见问题

### Q1: 提示 "tcb: command not found"

**原因**：未安装 CloudBase CLI

**解决**：
```bash
npm install -g @cloudbase/cli
tcb --version  # 验证安装
```

### Q2: 提示未登录

**原因**：未登录 CloudBase

**解决**：
```bash
tcb login
```

会打开浏览器进行登录授权。

### Q3: 部署后提示 "找不到 common 模块"

**原因**：
1. common 未部署
2. common 部署后未生效（需要等待）

**解决**：
```bash
# 重新部署 common
tcb fn deploy common --dir cloudfunctions/common -e $ENV_ID --force

# 等待 1-2 分钟让模块生效

# 重新部署其他函数
tcb fn deploy acceptTask --dir cloudfunctions/acceptTask -e $ENV_ID --force
```

### Q4: 权限不足

**原因**：账号无该环境的管理权限

**解决**：
1. 检查环境ID是否正确
2. 确认你的账号有该云环境的管理员权限
3. 联系云环境所有者添加权限

### Q5: 部署很慢或超时

**原因**：网络问题或云函数较大

**解决**：
1. 检查网络连接
2. 使用 `--force` 参数强制覆盖
3. 重试部署失败的函数

---

## 🔍 验证部署

### 1. 检查云函数列表

```bash
tcb fn list -e $ENV_ID
```

应该能看到所有 8 个云函数。

### 2. 查看单个云函数信息

```bash
tcb fn detail acceptTask -e $ENV_ID
```

### 3. 测试云函数

```bash
# 在微信开发者工具的控制台中
wx.cloud.callFunction({
  name: 'getTaskList',
  data: { page: 1, pageSize: 10 },
  success: res => console.log(res),
  fail: err => console.error(err)
})
```

### 4. 查看云函数日志

```bash
tcb fn log acceptTask -e $ENV_ID
```

或者在微信开发者工具中：
云开发 → 云函数 → 选择函数 → 查看日志

---

## 📚 相关文档

- **详细优化说明**：[./OPTIMIZATION_SUMMARY.md](././OPTIMIZATION_SUMMARY.md)
- **升级指南**：[./UPGRADE_GUIDE.md](././UPGRADE_GUIDE.md)
- **问题分析**：[./ANALYSIS_AND_OPTIMIZATION.md](././ANALYSIS_AND_OPTIMIZATION.md)

---

## 🎯 部署检查清单

部署完成后，请确认：

- [ ] 所有 8 个云函数已部署成功
- [ ] 云函数列表中能看到所有函数
- [ ] 在小程序中测试核心功能正常
- [ ] 查看云函数日志无异常错误
- [ ] 性能有明显提升（订单列表加载更快）

---

## 💡 提示

1. **首次部署**：建议使用自动化脚本，省时省力
2. **更新单个函数**：可以使用手动命令单独部署
3. **部署失败**：查看错误信息，通常是网络或权限问题
4. **测试建议**：部署后在测试环境充分测试再发布到正式环境

---

**部署愉快！** 🚀

如有问题，请查看 [./UPGRADE_GUIDE.md](././UPGRADE_GUIDE.md) 的常见问题章节。
