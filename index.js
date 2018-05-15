var linebot = require('linebot');
var express = require('express');
const app = express();

var bot = linebot({
    channelId: "1580992358",
    channelSecret: "bc8e776f80f6af75127579866f0a0bb8",
    channelAccessToken: "BAnPhEiqEnOuioS/Ilb02DHCEWzFKSxlBw5TAsJMG+9InRB+UmjD2+D9wDyeuIzjaOfyORLJcH/kMbTj0ctZjfr4ZNnAXZckPWDUe03ByCj4byeSdo+0IS+JE269W78aDVqiG+qyDzO3vWJLPpOUDAdB04t89/1O/w1cDnyilFU="
});

bot.on('message', function (event) {
    console.log(event); //把收到訊息的 event 印出來看看
});

const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});