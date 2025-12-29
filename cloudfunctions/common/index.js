/**
 * Common 云函数入口
 * 
 * 注意：这是一个特殊的云函数，主要用作公共工具库
 * 其他云函数通过 require('common/utils') 来使用工具函数
 * 
 * 本文件主要是为了满足云函数部署的入口文件要求
 */

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 云函数入口函数
 * 
 * 虽然 common 主要作为工具库使用，但仍然提供一个入口函数
 * 可以用于测试工具函数是否正常工作
 */
exports.main = async (event, context) => {
  const utils = require('./utils')
  
  return {
    success: true,
    message: 'Common 工具库已就绪',
    availableFunctions: [
      'ensureCollection',
      'ensureCollections',
      'errorResponse',
      'successResponse',
      'validateRequired',
      'validatePhone',
      'validateWechat',
      'checkUserPermission',
      'checkIsAdmin',
      'normalizePagination',
      'logAction'
    ],
    usage: '其他云函数通过 require("common/utils") 来使用这些工具函数',
    version: '2.0.0'
  }
}
