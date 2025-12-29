# 📁 项目结构说明

> 校园快递代取互助平台 - 优化版 v2.0

---

## 🗂️ 完整目录结构

```
programe1/
├── .github/                      # GitHub 配置
│   └── PROJECT_STRUCTURE.md      # 本文档
│
├── .trae/                        # 历史文档（保留）
│   └── documents/
│       ├── 校园快递代取互助平台PRD.md
│       ├── 校园快递代取互助平台技术架构.md
│       └── 接受任务流程全面排查与修复计划.md
│
├── cloudfunctions/               # 云函数目录
│   ├── common/                   # 🆕 公共工具模块
│   │   ├── utils.js              # 云函数公共工具库（11个函数）
│   │   └── package.json
│   │
│   ├── acceptTask/               # ✅ 已优化 - 接单功能
│   │   ├── index.js
│   │   └── package.json
│   │
│   ├── createTask/               # ✅ 已优化 - 创建任务
│   │   ├── index.js
│   │   └── package.json
│   │
│   ├── completeOrder/            # ✅ 已优化 - 完成订单
│   │   ├── index.js
│   │   └── package.json
│   │
│   ├── cancelTask/               # ✅ 已优化 - 取消任务（功能增强）
│   │   ├── index.js
│   │   └── package.json
│   │
│   ├── getTaskDetail/            # ✅ 已优化 - 获取任务详情
│   │   ├── index.js
│   │   └── package.json
│   │
│   ├── getTaskList/              # ✅ 已优化 - 获取任务列表
│   │   ├── index.js
│   │   └── package.json
│   │
│   ├── getMyOrders/              # ✅ 已优化 - 获取我的订单（性能提升93%）
│   │   ├── index.js
│   │   └── package.json
│   │
│   ├── getMyTasks/               # 获取我的发布
│   ├── login/                    # 用户登录
│   ├── updateUserInfo/           # 更新用户信息
│   ├── createReview/             # 创建评价
│   ├── getUserReviews/           # 获取用户评价
│   ├── getOrderReviews/          # 获取订单评价
│   ├── getMyWrittenReviews/      # 获取我写的评价
│   ├── getStatistics/            # 获取统计数据
│   ├── getOrderDetail/           # 获取订单详情
│   ├── completeTask/             # 完成任务
│   ├── adminGetUsers/            # 管理员 - 获取用户列表
│   ├── adminGetTasks/            # 管理员 - 获取任务列表
│   ├── adminGetComplaints/       # 管理员 - 获取投诉列表
│   ├── adminGetStatistics/       # 管理员 - 获取统计数据
│   ├── adminHandleComplaint/     # 管理员 - 处理投诉
│   ├── adminBanUser/             # 管理员 - 封禁用户
│   ├── initDB/                   # 初始化数据库
│   └── quickstartFunctions/      # 快速开始示例
│
├── docs/                         # 🆕 文档目录
│   ├── README.md                 # 文档索引
│   ├── QUICK_START.md            # 快速开始指南
│   ├── DEPLOY_README.md          # 部署指南
│   ├── UPGRADE_GUIDE.md          # 升级指南
│   ├── OPTIMIZATION_SUMMARY.md   # 优化总结
│   ├── ANALYSIS_AND_OPTIMIZATION.md  # 问题分析
│   └── 优化完成总结.md            # 完成总结
│
├── miniprogram/                  # 小程序资源
│   └── images/                   # 图片资源
│       ├── avatar.png
│       └── icons/
│           ├── home.png
│           ├── home-active.png
│           ├── goods.png
│           ├── goods-active.png
│           ├── usercenter.png
│           └── usercenter-active.png
│
├── pages/                        # 小程序页面
│   ├── index/                    # ✅ 已优化 - 首页/任务大厅
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   │
│   ├── detail/                   # ✅ 已优化 - 任务详情页
│   │   ├── detail.js
│   │   ├── detail.json
│   │   ├── detail.wxml
│   │   └── detail.wxss
│   │
│   ├── publish/                  # ✅ 已优化 - 发布任务页
│   │   ├── publish.js
│   │   ├── publish.json
│   │   ├── publish.wxml
│   │   └── publish.wxss
│   │
│   ├── my-orders/                # ✅ 已优化 - 我的接单页
│   │   ├── my-orders.js
│   │   ├── my-orders.json
│   │   ├── my-orders.wxml
│   │   └── my-orders.wxss
│   │
│   ├── profile/                  # ✅ 已优化 - 个人中心页
│   │   ├── profile.js
│   │   ├── profile.json
│   │   ├── profile.wxml
│   │   └── profile.wxss
│   │
│   ├── my-tasks/                 # 我的发布页
│   ├── order-detail/             # 订单详情页
│   ├── review/                   # 评价页
│   ├── reviews/                  # 评价列表页
│   ├── my-reviews/               # 我的评价页
│   └── admin/                    # 管理员页面
│
├── scripts/                      # 🆕 脚本目录
│   ├── README.md                 # 脚本说明
│   └── deploy-optimized-functions.sh  # 一键部署脚本
│
├── utils/                        # 🆕 前端公共工具
│   └── common.js                 # 公共工具函数（15个函数）
│
├── app.js                        # 小程序入口文件
├── app.json                      # 小程序配置
├── app.wxss                      # 全局样式
├── sitemap.json                  # 站点地图
├── cloudbaserc.json              # 云开发配置
├── project.config.json           # 项目配置
├── project.private.config.json   # 私有配置
├── README.md                     # 项目说明（已更新）
└── .gitignore                    # Git忽略文件

```

---

## 📝 目录说明

### 核心目录

#### `/cloudfunctions` - 云函数
- **用途**：存放所有云函数
- **新增**：`common/` 公共工具模块
- **已优化**：8个云函数（标记 ✅）

#### `/pages` - 小程序页面
- **用途**：存放所有小程序页面
- **已优化**：5个主要页面（标记 ✅）

#### `/utils` - 前端公共工具 🆕
- **用途**：存放前端公共工具函数
- **新增**：`common.js`（15个工具函数）

### 新增目录

#### `/docs` - 文档目录 🆕
- **用途**：存放所有项目文档
- **包含**：6份完整文档
- **特点**：结构清晰，易于查找

#### `/scripts` - 脚本目录 🆕
- **用途**：存放自动化脚本
- **包含**：部署脚本
- **特点**：提升开发效率

#### `/.github` - GitHub配置 🆕
- **用途**：存放GitHub相关配置
- **包含**：项目结构说明
- **特点**：规范化管理

### 历史目录

#### `/.trae` - 历史文档
- **用途**：保留原有的设计文档
- **状态**：仅作参考，不再更新

---

## 🎯 目录组织原则

### 1. 按功能分类
- 云函数 → `cloudfunctions/`
- 页面 → `pages/`
- 工具 → `utils/`
- 文档 → `docs/`
- 脚本 → `scripts/`

### 2. 命名规范
- 云函数：驼峰命名（如 `getTaskList`）
- 页面：短横线命名（如 `my-orders`）
- 文档：大写+下划线或中文（如 `README.md`）
- 脚本：短横线命名（如 `deploy-optimized-functions.sh`）

### 3. 文件组织
- 每个功能模块独立目录
- 相关文件放在一起
- README.md 作为目录说明

---

## 📊 文件统计

### 代码文件
- **云函数**：24个（8个已优化）
- **页面**：11个（5个已优化）
- **公共工具**：2个（新增）

### 文档文件
- **文档总数**：7份（含索引）
- **总字数**：约 25,000 字

### 脚本文件
- **脚本总数**：1个
- **自动化程度**：100%

---

## 🆕 v2.0 新增内容

### 新增目录（3个）
1. `/docs` - 文档目录
2. `/scripts` - 脚本目录
3. `/.github` - GitHub配置

### 新增代码（3个）
1. `/utils/common.js` - 前端工具库
2. `/cloudfunctions/common/utils.js` - 云函数工具库
3. `/cloudfunctions/common/package.json` - 工具库配置

### 新增文档（7个）
1. `/docs/README.md` - 文档索引
2. `/docs/QUICK_START.md` - 快速开始
3. `/docs/DEPLOY_README.md` - 部署指南
4. `/docs/UPGRADE_GUIDE.md` - 升级指南
5. `/docs/OPTIMIZATION_SUMMARY.md` - 优化总结
6. `/docs/ANALYSIS_AND_OPTIMIZATION.md` - 问题分析
7. `/docs/优化完成总结.md` - 完成总结

### 新增脚本（1个）
1. `/scripts/deploy-optimized-functions.sh` - 一键部署

---

## 🔍 快速查找

### 想查看文档？
→ 进入 `/docs` 目录

### 想运行脚本？
→ 进入 `/scripts` 目录

### 想修改云函数？
→ 进入 `/cloudfunctions` 目录

### 想修改页面？
→ 进入 `/pages` 目录

### 想使用公共函数？
→ 查看 `/utils/common.js` 或 `/cloudfunctions/common/utils.js`

---

## 📚 相关文档

- **项目说明**：[../README.md](../README.md)
- **文档索引**：[../docs/README.md](../docs/README.md)
- **脚本说明**：[../scripts/README.md](../scripts/README.md)

---

## 💡 目录管理建议

1. **保持结构清晰**：按功能分类，避免文件混乱
2. **及时更新说明**：添加新文件时更新 README
3. **规范命名**：遵循项目命名规范
4. **适时重构**：当目录变复杂时及时重新组织

---

**项目结构清晰，开发更高效！** 📁
