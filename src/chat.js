// @see https://docs.aircode.io/guide/functions/
// const aircode = require('aircode')
const { Configuration, OpenAIApi } = require('openai')
const {
  generateSign,
  reply,
  handleError
} = require('./_utils')

const msgHandler = require('./msg.js')
const ChatsTable = require('./chatModel')
const conf = require('./config.json')

// 从环境变量中获取到钉钉和 OpenAI 的相关配置
const DING_APP_SECRET = conf.DING_APP_SECRET || ''
const OPENAI_KEY = conf.OPENAI_KEY || ''
// 当前使用的是 OpenAI 开放的最新 GPT-3.5 模型，如果后续 GPT-4 的 API 发布，修改此处参数即可
// OpenAI models 参数列表 https://platform.openai.com/docs/models
const OPENAI_MODEL = conf.OPENAI_MODEL || 'gpt-3.5-turbo'

// 主方法
module.exports = async function (params, context) {
  if (context.method !== 'POST') {
    // 钉钉机器人消息是 POST 请求，所以忽略所有非 POST 请求
    return
  }

  // 如果设置了 SECRET，则进行验证
  if (DING_APP_SECRET) {
    // 从 Headers 中拿到 timestamp 和 sign 进行验证
    const { timestamp, sign } = context.headers
    if (generateSign(timestamp) !== sign) {
      return
    }
  }

  // 打印请求参数到日志，方便排查
  console.log('Received params:', params)

  const { msgtype, text, conversationId, senderNick } = params

  // 示例中，我们只支持文本消息
  if (msgtype !== 'text') {
    return reply(params, '目前仅支持文本格式的消息。')
  }

  // 如果没有配置 OPENAI_KEY，则提醒需要配置
  if (!OPENAI_KEY) {
    return reply(params, '恭喜你已经调通了机器人，现在请进入 AirCode 中配置 OPENAI_KEY 环境变量，完成 ChatGPT 连接。')
  }

  // 将用户的问题存入数据表中，后续方便进行排查，或者支持连续对话
  const { content } = text

  await ChatsTable.create({ conversationId, role: 'user', content, roleName: senderNick })

  let messages = []

  if (content.includes('/help')) {
    return reply(params,
      `{
        角色扮演：输入'角色扮演:xxx'，
        清空上下文：'/clean'
      }`)
  } else if (content.includes('角色扮演:')) {
    const msg = { role: 'system', content: `你将扮演一个${content.split(':')[1]}，后面的问题你需要从这个角色方面回答。` }
    messages = [msg]
    msgHandler.setRole(conversationId, msg)
  } else if (content.includes('/clean')) {
    msgHandler.clean(conversationId)
    return reply(params, '已清除上下文')
  } else {
    const msg = { role: 'user', content }
    console.log(msgHandler.getMsg(conversationId))
    messages = [
      ...msgHandler.getMsg(conversationId),
      msg
    ]
    msgHandler.setMsg(conversationId, msg)
  }

  // 构建发送给 GPT 的消息体
  const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_KEY }))

  try {
    // 请求 GPT 获取回复
    const completion = await openai.createChatCompletion({
      model: OPENAI_MODEL,
      messages
    })

    const responseMessage = completion.data.choices[0].message

    // 将 ChatGPT 的响应也存入数据库
    await ChatsTable.create({ conversationId, ...responseMessage, roleName: 'chat-gpt' })
    msgHandler.setMsg(conversationId, responseMessage)
    console.log(responseMessage)
    // 回复钉钉用户消息
    return reply(params, responseMessage.content)
  } catch (error) {
    // 错误处理，首先打印错误到日志中，方便排查
    console.error(error.response || error)

    // 根据不同的情况来生成不同的错误信息
    const errorMessage = handleError(error)

    // 回复错误信息给用户
    return reply(params, `错误：${errorMessage}`)
  }
}