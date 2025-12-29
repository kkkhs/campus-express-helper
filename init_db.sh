#!/usr/bin/env bash
# 数据库初始化脚本（使用 CloudBase CLI）
# 
# 注意：此脚本可能因为 CLI 版本问题而失败
# 推荐使用云函数方式：直接在微信开发者工具中调用 initDB 云函数
# 
# 使用方法：
# ./init_db.sh <你的环境ID>
# 或者：ENV_ID=你的环境ID ./init_db.sh

set -euo pipefail

ENV_ID="${1:-${ENV_ID:-}}"
if [ -z "$ENV_ID" ]; then 
  echo "❌ 错误：需要提供云开发环境 ID"
  echo ""
  echo "使用方法："
  echo "  ./init_db.sh <环境ID>"
  echo "  或："
  echo "  ENV_ID=<环境ID> ./init_db.sh"
  echo ""
  echo "💡 推荐方式：使用云函数 initDB（更简单可靠）"
  echo "   1. 在微信开发者工具中打开项目"
  echo "   2. 点击「云开发」"
  echo "   3. 进入「云函数」"
  echo "   4. 找到 initDB 云函数并「云端测试」"
  exit 1
fi

# 需要创建的集合
collections=(users tasks orders reviews admins complaints)

# 检查 CloudBase CLI
if command -v tcb >/dev/null 2>&1; then
  CLI="tcb"
elif command -v cloudbase >/dev/null 2>&1; then
  CLI="cloudbase"
else
  echo "❌ 错误：未安装 CloudBase CLI"
  echo ""
  echo "请先安装："
  echo "  npm install -g @cloudbase/cli"
  echo ""
  echo "然后登录："
  echo "  tcb login"
  echo ""
  echo "💡 或者使用云函数 initDB（推荐）"
  exit 1
fi

echo "✅ 使用 CLI: $CLI"
echo "🌐 环境 ID: $ENV_ID"
echo ""

# 检查是否已登录
echo "🔍 检查登录状态..."
if ! $CLI env:list >/dev/null 2>&1; then
  echo "❌ 错误：未登录"
  echo ""
  echo "请先登录："
  echo "  $CLI login"
  exit 1
fi

echo "✅ 已登录"
echo ""

# 创建集合
echo "📦 开始创建数据库集合..."
echo ""

created=0
existed=0
failed=0

create_collection() {
  name="$1"
  echo "⏳ 创建集合: $name"
  
  # 尝试不同的命令格式
  if $CLI database:create "$name" -e "$ENV_ID" 2>/dev/null; then
    echo "✅ $name 创建成功"
    ((created++))
    return 0
  elif $CLI database:create -c "$name" -e "$ENV_ID" 2>/dev/null; then
    echo "✅ $name 创建成功"
    ((created++))
    return 0
  else
    # 可能已经存在
    echo "⚠️  $name 可能已存在或创建失败"
    ((existed++))
    return 0
  fi
}

for c in "${collections[@]}"; do
  create_collection "$c"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 初始化完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 新建: $created 个集合"
echo "⚠️  跳过: $existed 个集合（可能已存在）"
echo ""
echo "💡 提示：请在云开发控制台中验证集合是否创建成功"
echo ""
echo "需要创建的集合列表："
for c in "${collections[@]}"; do
  echo "  - $c"
done
echo ""
