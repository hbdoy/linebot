var linebot = require('linebot');
var express = require('express');

var bot = linebot({
    channelId: "1580992358",
    channelSecret: process.env.channelSecret,
    channelAccessToken: process.env.channelAccessToken
});


_bot();
const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});

function _bot() {
    bot.on('message', function (event) {
        if (event.message.type == 'text') {
            waitForAjax = false;
            var msg = event.message.text;
            var replyMsg = '';
            if (msg == "/help") {
                replyMsg = `/我是誰: 查看我是誰,\n
                /誰最帥: 查看誰最帥`;
            } else if (msg == "/我是誰") {
                waitForAjax = true;
                event.source.profile().then(function (profile) {
                    event.reply('Hello ' + profile.displayName);
                });
            } else if (msg == "/誰最帥") {
                replyMsg = "李叡";
            }
            if(!waitForAjax){
                event.reply(replyMsg).then(function (data) {
                    console.log(replyMsg);
                }).catch(function (error) {
                    console.log('error');
                });
            }
        }
    });

}