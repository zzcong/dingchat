class MsgHandler {
  constructor() {
    this.msg = new Map()
  }

  getMsg(id) {
    let list =  this.msg.get(id) || []
    const outTime = new Date().getTime() - (20 * 60 * 1000)
    list = list.filter(item => item.time > outTime).map(item => ({role: item.role, content:item.content}))
    return list.length ? list : [{ role: 'system', content: 'You are a helpful assistant.' }]
  }
  setMsg(id, msg) {
    const m = {...msg, time: new Date().getTime()}
    this.msg.set(id, [...this.getMsg(id), m])
  }
  clean(id) {
    this.msg.set(id, [])
  }
  setRole(id, msg) {
    const m = {...msg, time: new Date().getTime()}
    this.msg.set(id, [m])
  }
}

module.exports = new MsgHandler()
