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

var server = app.listen(process.env.PORT || 8080, function () {
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
    var myToken = "EAACEdEose0cBAF7GU6WkrJm1DOjuwZAU42uqMbZAQ4R1kYYSp8U9XZAmtEuLTeKnmbvXx4u6upuZCEUZBlCGAIUZB2PnNTYBMu7rBQbh7iywzPJ2WNA77xBvVlZAAoLy8l6QC8ypumBAZAjMg8W82qkPSLofa6p25gEJu4ozcDtjQshvjqm1GPTj9WN3NZBgtCxEZD";
    var pageID = 164784850554267;
    url = url || `https://graph.facebook.com/v3.0/${pageID}/posts?access_token=${myToken}`;
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
        // console.log(fbPosts[fbPosts.length - 1]);
        // if(response.next != ""){
        //     _getPosts(response.next);
        // }
    });
    //每半小時抓取一次新資料
    timerForNCNU = setInterval(_getPosts, 1800000);
}

function _keepTokenAlive(){
    clearTimeout(timerForToken);
    var myToken = "EAACEdEose0cBAF7GU6WkrJm1DOjuwZAU42uqMbZAQ4R1kYYSp8U9XZAmtEuLTeKnmbvXx4u6upuZCEUZBlCGAIUZB2PnNTYBMu7rBQbh7iywzPJ2WNA77xBvVlZAAoLy8l6QC8ypumBAZAjMg8W82qkPSLofa6p25gEJu4ozcDtjQshvjqm1GPTj9WN3NZBgtCxEZD";
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
    //每分鐘刷新
    timerForToken = setInterval(_keepTokenAlive, 60000);
}