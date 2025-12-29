# 📜 部署脚本

> 自动化部署工具集

---

## 📦 脚本列表

### deploy-optimized-functions.sh

**功能**：一键部署所有优化的云函数

**使用方法**：
```bash
# 在项目根目录执行
./scripts/deploy-optimized-functions.sh

# 或指定环境ID
ENV_ID="你的环境ID" ./scripts/deploy-optimized-functions.sh
```

**特性**：
- ✅ 自动读取 cloudbaserc.json 中的环境ID
- ✅ 按正确顺序部署云函数（common 优先）
- ✅ 彩色输出显示进度
- ✅ 自动检查 tcb 命令和登录状态
- ✅ 部署统计（成功/失败数量）
- ✅ 失败处理和提示

**部署的云函数**（共7个）：
1. acceptTask
2. createTask
3. completeOrder
4. cancelTask
5. getTaskDetail
6. getTaskList
7. getMyOrders

> 注意：原计划的 common 公共模块已改为内联方式，详见 [../docs/部署修复说明.md](../docs/部署修复说明.md)

---

## 🔧 脚本说明

### 环境ID配置

脚本会按以下优先级获取环境ID：

1. **环境变量** - `ENV_ID` 环境变量
2. **配置文件** - `cloudbaserc.json` 中的 `envId` 字段
3. **默认值** - `cloud1-8gy7urmg8538c2c1`

### 前置要求

- ✅ 已安装 CloudBase CLI：`npm install -g @cloudbase/cli`
- ✅ 已登录：`tcb login`
- ✅ 有环境管理权限

### 输出示例

```
========================================
  云函数优化版本部署脚本
========================================

环境ID: cloud1-8gy7urmg8538c2c1
配置来源: cloudbaserc.json

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

## ⚠️ 注意事项

1. **部署顺序很重要**：脚本已自动处理，确保 common 最先部署
2. **网络要求**：需要稳定的网络连接
3. **权限要求**：确保账号有云环境的管理权限
4. **时间要求**：完整部署需要 2-3 分钟

---

## 🐛 常见问题

### Q: 提示 "tcb: command not found"

**解决**：
```bash
npm install -g @cloudbase/cli
```

### Q: 提示未登录

**解决**：
```bash
tcb login
```

### Q: 某个函数部署失败

**解决**：
1. 查看错误信息
2. 检查网络连接
3. 手动重新部署该函数：
   ```bash
   tcb fn deploy <函数名> --dir cloudfunctions/<函数名> -e $ENV_ID --force
   ```

---

## 📚 相关文档

- **部署指南**：[../docs/DEPLOY_README.md](../docs/DEPLOY_README.md)
- **快速开始**：[../docs/QUICK_START.md](../docs/QUICK_START.md)
- **升级指南**：[../docs/UPGRADE_GUIDE.md](../docs/UPGRADE_GUIDE.md)

---

## 🔄 脚本更新记录

### v1.0 (2025-12-19)

- ✅ 创建一键部署脚本
- ✅ 支持自动读取环境ID
- ✅ 添加完整的错误检查
- ✅ 彩色输出和统计

---

**享受自动化部署的便利！** 🚀
