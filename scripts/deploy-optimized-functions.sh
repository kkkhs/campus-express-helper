#!/bin/bash

# 云函数部署脚本 - 优化版本
# 用于部署所有已优化的云函数

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 环境ID配置
# 优先级：环境变量 > cloudbaserc.json > 默认值
if [ -z "$ENV_ID" ]; then
    # 尝试从 cloudbaserc.json 读取
    if [ -f "cloudbaserc.json" ]; then
        ENV_ID=$(grep -o '"envId"[[:space:]]*:[[:space:]]*"[^"]*"' cloudbaserc.json | sed 's/.*"\([^"]*\)".*/\1/')
    fi
    # 如果还是为空，使用默认值
    if [ -z "$ENV_ID" ]; then
        ENV_ID="cloud1-8gy7urmg8538c2c1"
    fi
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  云函数优化版本部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}环境ID: ${ENV_ID}${NC}"
echo -e "${YELLOW}配置来源: ${ENV_ID_SOURCE:-cloudbaserc.json}${NC}"
echo ""

# 检查 tcb 命令是否存在
if ! command -v tcb &> /dev/null; then
    echo -e "${RED}错误: 未找到 tcb 命令${NC}"
    echo -e "${YELLOW}请先安装 CloudBase CLI:${NC}"
    echo -e "  npm install -g @cloudbase/cli"
    echo ""
    echo -e "${YELLOW}安装后请登录:${NC}"
    echo -e "  tcb login"
    exit 1
fi

# 检查是否已登录
if ! tcb env:list &> /dev/null; then
    echo -e "${RED}错误: 未登录 CloudBase${NC}"
    echo -e "${YELLOW}请先登录:${NC}"
    echo -e "  tcb login"
    exit 1
fi

echo -e "${GREEN}✓ tcb 命令已就绪${NC}"
echo ""

# 需要部署的云函数列表
declare -a FUNCTIONS=(
    "acceptTask"
    "createTask"
    "completeOrder"
    "cancelTask"
    "getTaskDetail"
    "getTaskList"
    "getMyOrders"
    "getUserStats"
)

# 部署计数
TOTAL=${#FUNCTIONS[@]}
SUCCESS=0
FAILED=0

echo -e "${YELLOW}注意：工具函数已内联到各云函数中，无需部署 common 模块${NC}"
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}开始部署 ${TOTAL} 个云函数${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 部署函数
for i in "${!FUNCTIONS[@]}"; do
    func="${FUNCTIONS[$i]}"
    num=$((i+1))
    
    echo -e "${YELLOW}[$num/$TOTAL] 正在部署: ${func}${NC}"
    
    # 执行部署命令
    if tcb fn deploy "$func" --dir "cloudfunctions/$func" -e "$ENV_ID" --force; then
        echo -e "${GREEN}✓ ${func} 部署成功${NC}"
        SUCCESS=$((SUCCESS+1))
    else
        echo -e "${RED}✗ ${func} 部署失败${NC}"
        FAILED=$((FAILED+1))
    fi
    
    echo ""
done

# 部署总结
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}部署完成${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "总计: ${TOTAL} 个云函数"
echo -e "${GREEN}成功: ${SUCCESS}${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}失败: ${FAILED}${NC}"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有云函数部署成功！${NC}"
    echo ""
    echo -e "${YELLOW}下一步操作：${NC}"
    echo -e "1. 在小程序开发工具中点击「编译」"
    echo -e "2. 测试核心功能（登录、发布、接单、完成、取消）"
    echo -e "3. 查看详细优化说明: UPGRADE_GUIDE.md"
    echo ""
else
    echo -e "${RED}⚠️  部分云函数部署失败，请检查错误信息${NC}"
    echo ""
    echo -e "${YELLOW}常见问题：${NC}"
    echo -e "1. 检查环境ID是否正确"
    echo -e "2. 确保已登录 tcb (运行 tcb login)"
    echo -e "3. 检查云函数目录结构是否正确"
    echo ""
fi

exit $FAILED
