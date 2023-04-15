const mongose = require('mongoose')

const mongoUrl = '47.108.85.251'
const port = 27017

module.exports = async () => {
  await mongose.connect(`mongodb://${mongoUrl}:${port}`, {user: 'admin', pass: 'password', dbName: 'ding'}).then(() => {
    console.log('连接成功');
  }).catch((err) => {
    console.log(err);
    console.log('连接失败');
  })

}