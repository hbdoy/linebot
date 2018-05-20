var linebot = require('linebot');
var express = require('express');
var request = require('request');
var superagent = require('superagent');

var bot = linebot({
    channelId: process.env.channelID,
    channelSecret: process.env.channelSecret,
    channelAccessToken: process.env.channelAccessToken
});

var timerForNCNU, timerForToken;
var myToken = '';
var NCNUPosts = [],
    NCNUPostsW = [],
    NCNUPostsM = [];
reflashToken();
_botInit();

const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

app.get('/', function (req, res) {
    var status = {};
    if (NCNUPosts.length > 0) {
        status.NCNUPosts = "normal"
    } else {
        status.NCNUPosts = "something error"
    }
    if (NCNUPostsW.length > 0) {
        status.NCNUPostsW = "normal"
    } else {
        status.NCNUPostsW = "something error"
    }
    if (NCNUPostsM.length > 0) {
        status.NCNUPostsM = "normal"
    } else {
        status.NCNUPostsM = "something error"
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(JSON.stringify(status));
})

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
            if (msg == "功能") {
                replyMsg = "抓: 查看最近熱門文章,\n抓週: 查看7天內熱門文章,\n抓月: 查看30天內熱門文章,\n說明: 查看說明,\n我是誰: 查看我是誰,\n誰最帥: 查看誰最帥,\n聯絡: 聯絡作者,\n滾: 嗚嗚...";
            } else if (msg == "說明") {
                replyMsg = "沒有時間看靠北版?\n但又想知道最近大家再靠北什麼嗎?\n\n歡迎使用本機器人\n幫您統整近期/一週/一個月內的熱門文章\n(熱門文章: 透過演算法評量按讚、留言、分享數)\n\n用法: 直接輸入想使用的指令即可，ex: 「抓」\n\n這是閒暇之餘的作品\n部屬在免費空間\n沒有反應可以再輸入一次或是稍後再試\n當然也歡迎小額donate\n將會用在伺服器升級(應該啦)";
            } else if (msg == "我是誰") {
                waitForAjax = true;
                event.source.profile().then(function (profile) {
                    event.reply('Hello ' + profile.displayName);
                });
            } else if (msg == "聯絡") {
                replyMsg = "開放許願功能，另外有任何問題都歡迎與我聯繫\nfelicity860128@gmail.com";
            } else if (msg == "誰最帥") {
                for (let i = 0; i < 5; i++) {
                    replyMsg = "李叡";
                }
            } else if (msg == "抓") {
                replyMsg = [];
                if (NCNUPosts.length <= 0) {
                    replyMsg = "現在沒有文章，請稍後再試...";
                } else if (NCNUPosts.length >= 5) {
                    for (let i = 0; i < 5; i++) {
                        replyMsg.push(NCNUPosts[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPosts[i].url);
                    }
                } else {
                    for (let i = 0; i < NCNUPosts.length; i++) {
                        replyMsg.push(NCNUPosts[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPosts[i].url);
                    }
                }
            } else if (msg == "抓週") {
                replyMsg = [];
                if (NCNUPostsW.length <= 0) {
                    replyMsg = "現在沒有文章，請稍後再試...";
                } else if (NCNUPostsW.length >= 5) {
                    for (let i = 0; i < 5; i++) {
                        replyMsg.push(NCNUPostsW[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPostsW[i].url);
                    }
                } else {
                    for (let i = 0; i < NCNUPostsW.length; i++) {
                        replyMsg.push(NCNUPostsW[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPostsW[i].url);
                    }
                }
            } else if (msg == "抓月") {
                replyMsg = [];
                if (NCNUPostsM.length <= 0) {
                    replyMsg = "現在沒有文章，請稍後再試...";
                } else if (NCNUPostsM.length >= 5) {
                    for (let i = 0; i < 5; i++) {
                        replyMsg.push(NCNUPostsM[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPostsM[i].url);
                    }
                } else {
                    for (let i = 0; i < NCNUPostsM.length; i++) {
                        replyMsg.push(NCNUPostsM[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPostsM[i].url);
                    }
                }
            } else if (msg == "滾") {
                waitForAjax = true;
                if (event.source.groupId) {
                    replyMsg = "我會再回來的";
                    event.reply(replyMsg).then(function (data) {
                        console.log(replyMsg);
                        bot.leaveGroup(event.source.groupId);
                    }).catch(function (error) {
                        console.log('error');
                    });
                } else if (event.source.roomId) {
                    replyMsg = "我會再回來的";
                    event.reply(replyMsg).then(function (data) {
                        console.log(replyMsg);
                        bot.leaveRoom(event.source.roomId);
                    }).catch(function (error) {
                        console.log('error');
                    });
                } else {
                    replyMsg = "我在群組才會被踢掉喔 <3";
                    event.reply(replyMsg);
                    console.log(replyMsg);
                }
            }
            if (!waitForAjax) {
                event.reply("123").then(function (data) {
                    event.reply("456").then(function (data) {
                        console.log(replyMsg);
                    })
                }).catch(function (error) {
                    console.log('error');
                });
            }
        }
    });
    bot.on('join', function (event) {
        event.reply("感謝您將本帳號加入群組，也歡迎將本帳號設為好友！\n\n每天都有好多的靠北文\n全部看完很花時間\n但又想知道最近哪些靠北文比較火紅嗎？\n\n歡迎使用本懶人靠北包\n不知道要怎麼操作?\n試試看輸入「功能」\n\nps.\n沒有反應可以再輸入一次或是稍後再試>///<");
    });
}

function _getPosts(url) {
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
        // console.log(JSON.parse(body).error.message);
        if (JSON.parse(body).data) {
            for (let value of JSON.parse(body).data) {
                var like = 0,
                    comm = 0,
                    share = 0;
                if (value.likes.summary.total_count) {
                    like = value.likes.summary.total_count;
                }
                if (value.comments.summary.total_count) {
                    comm = value.comments.summary.total_count;
                }
                if (value.shares) {
                    share = value.shares.count;
                }
                value.hot = like * 1 + comm * 2 + share * 3;
                value.url = value.id.split("_")[1];
                NCNUPosts.push(value);
            }
            // 按熱度由高至低
            NCNUPosts = NCNUPosts.sort(function (a, b) {
                return a.hot < b.hot ? 1 : -1;
            });
            // console.log(NCNUPosts[NCNUPosts.length - 1]);
            var currTime = Date.parse(new Date().toDateString());
            var lastTime = Date.parse(NCNUPosts[NCNUPosts.length - 1].created_time);
            var daySec = 2 * 24 * 60 * 60 * 1000;
            // console.log(lastTime);
            // console.log(currTime);
            if (lastTime >= (currTime - daySec)) {
                // 最後一筆仍在2天內,且還有下一頁的文章,則再抓取
                // console.log(JSON.parse(body).paging.next);
                if (JSON.parse(body).paging.next) {
                    _getPosts(JSON.parse(body).paging.next);
                }
            }
        }
    });
}

function _getPostsM(url) {
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
        // console.log(JSON.parse(body).error.message);
        if (JSON.parse(body).data) {
            for (let value of JSON.parse(body).data) {
                var like = 0,
                    comm = 0,
                    share = 0;
                if (value.likes.summary.total_count) {
                    like = value.likes.summary.total_count;
                }
                if (value.comments.summary.total_count) {
                    comm = value.comments.summary.total_count;
                }
                if (value.shares) {
                    share = value.shares.count;
                }
                value.hot = like * 1 + comm * 2 + share * 3;
                value.url = value.id.split("_")[1];
                NCNUPostsM.push(value);
            }
            // 按熱度由高至低
            NCNUPostsM = NCNUPostsM.sort(function (a, b) {
                return a.hot < b.hot ? 1 : -1;
            });
            // console.log(NCNUPostsM[NCNUPostsM.length - 1]);
            var currTime = Date.parse(new Date().toDateString());
            var lastTime = Date.parse(NCNUPostsM[NCNUPostsM.length - 1].created_time);
            var monthSec = 30 * 24 * 60 * 60 * 1000;
            // console.log(lastTime);
            // console.log(currTime);
            if (lastTime >= (currTime - monthSec)) {
                // 最後一筆仍在7天內,且還有下一頁的文章,則再抓取
                // console.log(JSON.parse(body).paging.next);
                if (JSON.parse(body).paging.next) {
                    _getPostsM(JSON.parse(body).paging.next);
                }
            }
        }
    });
}

function _getPostsW(url) {
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
        // console.log(JSON.parse(body).error.message);
        if (JSON.parse(body).data) {
            for (let value of JSON.parse(body).data) {
                var like = 0,
                    comm = 0,
                    share = 0;
                if (value.likes.summary.total_count) {
                    like = value.likes.summary.total_count;
                }
                if (value.comments.summary.total_count) {
                    comm = value.comments.summary.total_count;
                }
                if (value.shares) {
                    share = value.shares.count;
                }
                value.hot = like * 1 + comm * 2 + share * 3;
                value.url = value.id.split("_")[1];
                NCNUPostsW.push(value);
            }
            // 按熱度由高至低
            NCNUPostsW = NCNUPostsW.sort(function (a, b) {
                return a.hot < b.hot ? 1 : -1;
            });
            // console.log(NCNUPostsW[NCNUPostsW.length - 1]);
            var currTime = Date.parse(new Date().toDateString());
            var lastTime = Date.parse(NCNUPostsW[NCNUPostsW.length - 1].created_time);
            var weekSec = 7 * 24 * 60 * 60 * 1000;
            // console.log(lastTime);
            // console.log(currTime);
            if (lastTime >= (currTime - weekSec)) {
                // 最後一筆仍在7天內,且還有下一頁的文章,則再抓取
                // console.log(JSON.parse(body).paging.next);
                if (JSON.parse(body).paging.next) {
                    _getPostsW(JSON.parse(body).paging.next);
                }
            }
        }
    });
}

function reflashToken() {
    clearTimeout(timerForToken);
    var url = "https://developers.facebook.com/tools/explorer";
    var myCookie = "c_user=100003315001440;xs=39%3A7dTnwJwqxwH3wg%3A2%3A1526528920%3A11327%3A11322";
    superagent.get(url)
        .set("Cookie", myCookie)
        .end(function (err, res) {
            if (err) {
                throw err;
            };
            // console.log(JSON.stringify(res));
            var tmp = JSON.stringify(res).split("accessToken");
            var tmpp = tmp[2].split("appID");
            var finalKey = tmpp[0].substr(5, 230).split("\\");
            myToken = finalKey[0];
            console.log("Reflash!");
            // 抓取前先清空
            NCNUPosts = [];
            NCNUPostsW = [];
            NCNUPostsM = [];
            _getPosts();
            _getPostsW();
            _getPostsM();
        })
    // 每20分鐘抓取一次新資料
    timerForToken = setInterval(reflashToken, 1200000);
}