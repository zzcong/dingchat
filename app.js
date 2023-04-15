const Koa = require('koa');
const app = new Koa();

const mongoDB = require('./src/db')

const chat = require('./src/chat')
mongoDB()

app.use(async ctx => {
  if (ctx.method === 'GET' && ctx.request.path === '/chat') {
    ctx.body = chat(ctx.request., ctx)
  }
  console.log(ctx.request.path);
  console.log(ctx.request);
  console.log(ctx.method)
});

app.listen(3000);
