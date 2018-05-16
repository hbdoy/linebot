var linebot = require('linebot');
var express = require('express');
var request = require('request');

var bot = linebot({
    channelId: process.env.channelID,
    channelSecret: process.env.channelSecret,
    channelAccessToken: process.env.channelAccessToken
});

var timerForToken, timerForNCNU;
var NCNUPosts = [];
_keepTokenAlive();
_getPosts();
_botInit();

const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

// app.get('/getPosts', function (req, res) {
//     _getPosts();
// })

var server = app.listen(process.env.PORT || 3000, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});

function _botInit() {
    bot.on('message', function (event) {
        if (event.message.type == 'text') {
            var waitForAjax = false;
            var msg = event.message.text;
            var replyMsg = '';
            if (msg == "/help") {
                replyMsg = "/我是誰: 查看我是誰,\n/誰最帥: 查看誰最帥,\n/查看文章: 查看最近文章";
            } else if (msg == "/我是誰") {
                waitForAjax = true;
                event.source.profile().then(function (profile) {
                    event.reply('Hello ' + profile.displayName);
                });
            } else if (msg == "/誰最帥") {
                replyMsg = "李叡";
            }else if (msg == "/查看文章"){
                for(let i = 0; i < 5; i++){
                    replyMsg += NCNUPosts[i].message;
                    replyMsg += "\n------\n";
                }
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

function _getPosts(url){
    clearTimeout(timerForNCNU);
    var myToken = "EAACEdEose0cBAJ9gpLC5gPcf9DwlvX21M9COHE5bE1tUZBPS71lNxMwL7bflAcrv09uSF7ywKfXybv6xZAxsfLs0MN8ev4qgCkGgIEoyZCymWiZCy2VVSRcUvelADzE3Y9ZCHR4Utl8GBTg1K0enoePq5x9c1qZAH17c4POQZBYqlam13aFVuGcZA6wLO5TIkOUZD";
    var pageID = 164784850554267;
    url = url || `https://graph.facebook.com/v3.0/${pageID}/posts?fields=message,comments.summary(true),likes.summary(true),shares,created_time&access_token=${myToken}`;
    request({
        url: url,
        method: "GET"
    }, function (error, response, body) {
        if (error || !body) {
            console.log("發生錯誤");
            console.log(error);
            return;
        }
        // console.log(JSON.parse(body).data);
        for (let value of JSON.parse(body).data){
            NCNUPosts.push(value);
        }
        // console.log(NCNUPosts[NCNUPosts.length - 1]);
        // var currTime = Date.parse(new Date().toDateString());
        // var lastTime = Date.parse(NCNUPosts[NCNUPosts.length - 1].created_time);
        // var weekSec = 7 * 24 * 60 * 60 * 1000;
        // console.log(lastTime);
        // console.log(currTime);
        // if (lastTime >= (currTime - weekSec)){
        //     // 最後一筆仍在7天內,且還有下一頁的文章,則再抓取
        //     // console.log(JSON.parse(body).paging.next);
        //     if (JSON.parse(body).paging.next != ""){
        //         _getPosts(JSON.parse(body).paging.next);
        //     }
        // }
    });
    // 每半小時抓取一次新資料
    timerForNCNU = setInterval(_getPosts, 1800000);
}

function _keepTokenAlive(){
    clearTimeout(timerForToken);
    var myToken = "EAACEdEose0cBAJ9gpLC5gPcf9DwlvX21M9COHE5bE1tUZBPS71lNxMwL7bflAcrv09uSF7ywKfXybv6xZAxsfLs0MN8ev4qgCkGgIEoyZCymWiZCy2VVSRcUvelADzE3Y9ZCHR4Utl8GBTg1K0enoePq5x9c1qZAH17c4POQZBYqlam13aFVuGcZA6wLO5TIkOUZD";
    var url = `https://graph.facebook.com/me?access_token=${myToken}`;
    request({
        url: url,
        method: "GET"
    }, function (error, response, body) {
        if (error || !body) {
            console.log("發生錯誤");
            console.log(error);
            return;
        }
    });
    console.log("reflash");
    //每分鐘刷新
    timerForToken = setInterval(_keepTokenAlive, 60000);
}

