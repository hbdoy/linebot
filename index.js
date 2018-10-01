var linebot = require('linebot');
var express = require('express');
var request = require('request');
var superagent = require('superagent');
var firebase = require("firebase");
var cheerio = require("cheerio");

// Initialize Firebase
var config = {
    apiKey: process.env.apiKey,
    authDomain: process.env.authDomain,
    databaseURL: process.env.databaseURL,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId
};
firebase.initializeApp(config);
var db = firebase.database();



var bot = linebot({
    channelId: process.env.channelID,
    channelSecret: process.env.channelSecret,
    channelAccessToken: process.env.channelAccessToken
});

var timerForToken, timerForImg, timerForUploadGT, timerForUploadRT, timerForLuck;
var myToken = '';
var NCNUPosts = [],
    NCNUPostsW = [],
    NCNUPostsM = [],
    beautyImg_new = [],
    beautyImg_DB = [],
    beautyImg_check = {},
    allConstellations = [],
    luckData = [],
    allUserConstellation = {};
var data_in_group_wating_for_update = [],
    data_in_room_wating_for_update = [];

// reflashToken();
updateUserConstellation();
_getBeautyImg();
_getNewLuck();
_uploadText();
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
            var counter = '';
            var action = '';
            var allConstellationKeyWord_i = ["aquarius", "pisces", "aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn"];
            var allConstellationKeyWord_ii = ["aqu", "pis", "ari", "tau", "gem", "can", "leo", "vir", "lib", "sco", "sag", "cap"];
            var allConstellationKeyWord_iii = ["水瓶座", "雙魚座", "牡羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座", "天秤座", "天蠍座", "射手座", "摩羯座"];
            var allConstellationKeyWord_iv = ["水瓶", "雙魚", "牡羊", "金牛", "雙子", "巨蟹", "獅子", "處女", "天秤", "天蠍", "射手", "摩羯"];
            var allConstellationKeyWord = allConstellationKeyWord_i.concat(allConstellationKeyWord_ii, allConstellationKeyWord_iii, allConstellationKeyWord_iv);
            msg = msg.replace("魔羯", "摩羯");
            if (msg == "功能") {
                action = msg;
                replyMsg = "抓: 查看最近熱門文章,\n抓週: 查看7天內熱門文章,\n抓月: 查看30天內熱門文章,\n\n轉蛋: 抽美美/帥帥的照片\n(圖片來源為網路，若是侵權請立即告知),\n\n今日運勢: 輸入想查詢的星座，\nex:「摩羯座/魔羯/Cap」~\n(文字來源為網路，若是侵權請立即告知)\n\n說明: 查看說明,\n我是誰: 查看我是誰,\n誰最帥: 查看誰最帥,\n聯絡: 聯絡作者,\n許願: 想要的功能目前沒有嗎?\n\n滾: 嗚嗚...\n\n以上功能使用方式為直接輸入關鍵字\n就會執行或是看到該功能更多說明\nex: 輸入「許願」\n就會教你怎麼許願 >///<";
            } else if (msg == "說明") {
                action = msg;
                replyMsg = "沒有時間看靠北版?\n但又想知道最近大家再靠北什麼嗎?\n\n歡迎使用本機器人\n幫您統整近期/一週/一個月內的熱門文章\n(熱門文章: 透過演算法評量按讚、留言、分享數)\n\n用法: 直接輸入想使用的指令即可，ex: 「抓」\n\n這是閒暇之餘的作品\n部屬在免費空間\n沒有反應可以再輸入一次或是稍後再試\n當然也歡迎小額donate\n將會用在伺服器升級(應該啦)\n\n(圖片和文章來源皆為網路，並非用於營利用途，如有侵權請立即告知!)";
            } else if (allConstellationKeyWord.indexOf(msg.toLocaleLowerCase()) != -1) {
                action = "星座運勢";
                if (luckData.length == 12) {
                    replyMsg = allConstellationKeyWord_iii[(allConstellationKeyWord.indexOf(msg.toLocaleLowerCase()) % 12)] + "今日運勢:\n\n" + luckData[(allConstellationKeyWord.indexOf(msg.toLocaleLowerCase()) % 12)];
                } else {
                    replyMsg = "目前在更新，請稍後再試>///<";
                }
            } else if (msg == "今日運勢") {
                action = msg;
                waitForAjax = true;
                event.source.profile().then(function (profile) {
                    if (allUserConstellation[profile.userId]) {
                        if (luckData.length == 12) {
                            replyMsg = allConstellationKeyWord_iii[(allConstellationKeyWord.indexOf(allUserConstellation[profile.userId].content.toLocaleLowerCase()) % 12)] + "今日運勢:\n\n" + luckData[(allConstellationKeyWord.indexOf(allUserConstellation[profile.userId].content.toLocaleLowerCase()) % 12)];
                            event.reply(replyMsg);
                        } else {
                            replyMsg = "目前在更新，請稍後再試>///<";
                            event.reply(replyMsg);
                        }
                    } else{
                        replyMsg = "直接輸入想查詢的星座\n「ex: 水瓶座/水瓶/aqu」\n\n另外可以儲存您的星座，之後就可以直接點選查詢，而不用再輸入星座\n\n儲存教學: 直接輸入「我=xx座」\nex:「我=水瓶座」";
                        event.reply(replyMsg);
                    }
                });
            } else if (msg == "轉蛋") {
                action = msg;
                if (beautyImg_DB.length == 0) {
                    replyMsg = "現在沒有圖片，請稍後再試>///<";
                } else {
                    waitForAjax = true;
                    var num;
                    do {
                        num = Math.floor(Math.random() * beautyImg_DB.length);
                    }
                    while (beautyImg_check[beautyImg_DB[num].key].reportNum != 0);
                    event.reply([{
                        type: 'image',
                        originalContentUrl: beautyImg_DB[num].url,
                        previewImageUrl: beautyImg_DB[num].url
                    }, {
                        type: 'template',
                        altText: '手機版才能檢舉圖片~',
                        template: {
                            type: 'buttons',
                            title: '檢舉',
                            text: '此圖片將不會再出現',
                            actions: [{
                                type: 'postback',
                                label: '檢舉',
                                data: 'report&' + beautyImg_DB[num].key
                            }, {
                                type: 'postback',
                                label: '算了吧',
                                data: 'nothing&666'
                            }]
                        }
                    }]);
                }
            } else if (msg == "我是誰") {
                action = msg;
                waitForAjax = true;
                event.source.profile().then(function (profile) {
                    event.reply('Hello ' + profile.displayName);
                });
            } else if (msg == "許願") {
                action = msg;
                replyMsg = "想要的功能上面沒有嗎?\n歡迎使用「許願=XXX」來讓作者知道~\n\nex: 好想要一個作業交易平台，那就輸入:\n「許願=我想要一個作業交易平台」\n\n有朝一日會有猴子完成的^_^";
            } else if (msg == "聯絡") {
                action = msg;
                replyMsg = "有任何問題或想法都歡迎與我聯繫\ncowpei@protonmail.com";
            } else if (msg == "誰最帥") {
                action = msg;
                replyMsg = "李叡";
            } else if (msg == "抓") {
                action = msg;
                console.log(NCNUPosts.length);
                replyMsg = [];
                counter = "";
                if (NCNUPosts.length <= 0) {
                    replyMsg = "現在沒有文章，請稍後再試...";
                } else if (NCNUPosts.length >= 5) {
                    for (let i = 0; i < 5; i++) {
                        counter += NCNUPosts[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPosts[i].url;
                        if (counter > 2500) {
                            break;
                        }
                        replyMsg.push(NCNUPosts[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPosts[i].url);
                    }
                } else {
                    for (let i = 0; i < NCNUPosts.length; i++) {
                        counter += NCNUPosts[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPosts[i].url;
                        if (counter > 2500) {
                            break;
                        }
                        replyMsg.push(NCNUPosts[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPosts[i].url);
                    }
                }
            } else if (msg == "抓週") {
                action = msg;
                console.log(NCNUPostsW.length);
                replyMsg = [];
                counter = "";
                if (NCNUPostsW.length <= 0) {
                    replyMsg = "現在沒有文章，請稍後再試...";
                } else if (NCNUPostsW.length >= 5) {
                    for (let i = 0; i < 5; i++) {
                        counter += NCNUPostsW[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPostsW[i].url;
                        if (counter.length > 2500) {
                            break;
                        }
                        replyMsg.push(NCNUPostsW[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPostsW[i].url);
                    }
                } else {
                    for (let i = 0; i < NCNUPostsW.length; i++) {
                        counter += NCNUPostsW[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPostsW[i].url;
                        if (counter.length > 2500) {
                            break;
                        }
                        replyMsg.push(NCNUPostsW[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPostsW[i].url);
                    }
                }
            } else if (msg == "抓月") {
                action = msg;
                console.log(NCNUPostsM.length);
                replyMsg = [];
                counter = "";
                if (NCNUPostsM.length <= 0) {
                    replyMsg = "現在沒有文章，請稍後再試...";
                } else if (NCNUPostsM.length >= 5) {
                    for (let i = 0; i < 5; i++) {
                        counter += NCNUPostsM[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPostsM[i].url;
                        if (counter.length > 2500) {
                            break;
                        }
                        replyMsg.push(NCNUPostsM[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPostsM[i].url);
                    }
                } else {
                    for (let i = 0; i < NCNUPostsM.length; i++) {
                        counter += NCNUPostsM[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPostsM[i].url;
                        if (counter.length > 2500) {
                            break;
                        }
                        replyMsg.push(NCNUPostsM[i].message + "\nfb.com/NCNUSecrets2.0/posts/" + NCNUPostsM[i].url);
                    }
                }
            } else if (msg == "滾") {
                action = msg;
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
            } else if (msg.split("許願=").length == 2) {
                action = "提交許願";
                replyMsg = "感謝你讓我知道你掉的願望，有朝一日讓我替你實現 <3\n我不是神，卻想給你陽光";
            } else if (msg.split("我=").length == 2) {
                if (allConstellationKeyWord.indexOf(msg.toLocaleLowerCase().split("我=")[1]) != -1) {
                    action = "紀錄星座";
                    replyMsg = "紀錄您的星座了，若是需要更改，再輸入一次新的指令就好~";
                } else {
                    replyMsg = "無法識別輸入的星座QQ";
                }
            } else if (msg == "bottest") {
                waitForAjax = true;
                event.reply({
                    type: 'template',
                    altText: 'this is a buttons template',
                    template: {
                        type: 'buttons',
                        title: '檢舉',
                        text: '此圖片將不會再出現',
                        actions: [{
                            type: 'postback',
                            label: '檢舉',
                            data: 'action=buy&itemid=123'
                        }, {
                            type: 'postback',
                            label: '算了吧',
                            data: 'action=add&itemid=123'
                        }]
                    }
                });
            }
            if (!waitForAjax) {
                event.reply(replyMsg).then(function (data) {
                    console.log(replyMsg);
                }).catch(function (error) {
                    console.log('error');
                });
            }
            event.source.profile().then(function (profile) {
                pushUserData(profile);
                // 特別處理許願
                if (action == "提交許願") {
                    pushWishList({
                        userId: profile.userId,
                        content: msg.split("許願=")[1]
                    });
                } else if (action == "紀錄星座") {
                    saveUserConstellation({
                        userId: profile.userId,
                        content: msg.split("我=")[1]
                    });
                }
                // 其餘直接將行為名稱存入
                if (action != '') {
                    pushActionLog({
                        userId: profile.userId,
                        action: action
                    });
                }
                if (event.source.groupId) {
                    var tmp = {};
                    if (action == '') {
                        tmp = {
                            groupId: event.source.groupId,
                            userId: profile.userId,
                            text: msg,
                            createTime: DateTimezone(8)
                        };
                        data_in_group_wating_for_update.push(tmp);
                    }
                } else if (event.source.roomId) {
                    var tmp = {};
                    if (action == '') {
                        tmp = {
                            roomId: event.source.roomId,
                            userId: profile.userId,
                            text: msg,
                            createTime: DateTimezone(8)
                        };
                        data_in_room_wating_for_update.push(tmp);
                    }
                }
                // console.log(profile);
            });
        }
    });
    // postback
    bot.on('postback', function (event) {
        // console.log('postback data: ' + event.postback.data);
        if (event.postback.data) {
            var tmp = event.postback.data.split("&");
            if (tmp[0] == "report") {
                // 要檢舉的圖片key
                _reportImg(tmp[1]);
                event.reply('收到了~');
            }
        }
    });
    bot.on('join', function (event) {
        event.reply("感謝您將本帳號加入群組，也歡迎將本帳號設為好友！\n\n每天都有好多的靠北文\n全部看完很花時間\n但又想知道最近哪些靠北文比較火紅嗎？\n\n歡迎使用本懶人靠北包\n不知道要怎麼操作?\n試試看輸入「功能」\n\nps.\n沒有反應可以再輸入一次或是稍後再試>///<");
        if (event.source.groupId) {
            pushGroup({
                groupId: event.source.groupId
            });
        } else if (event.source.roomId) {
            pushRoom({
                roomId: event.source.roomId
            });
        }
        // console.log(event);
    });
    bot.on('follow', function (event) {
        event.source.profile().then(function (profile) {
            pushUserData(profile);
            pushActionLog({
                userId: profile.userId,
                action: "follow"
            });
            // console.log(profile);
        });
    });
    bot.on('unfollow', function (event) {
        pushActionLog({
            userId: event.source.userId,
            action: "unfollow"
        });
        // console.log(event);
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
            // var currTime = Date.parse(new Date().toDateString());
            // 當日時間改以po文時間為準,而不是系統時間
            var currTime = Date.parse(NCNUPosts[0].created_time);
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
            } else {
                // 按熱度由高至低
                NCNUPosts = NCNUPosts.sort(function (a, b) {
                    return a.hot < b.hot ? 1 : -1;
                });
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
            // var currTime = Date.parse(new Date().toDateString());
            var currTime = Date.parse(NCNUPostsM[0].created_time);
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
            } else {
                // 按熱度由高至低
                NCNUPostsM = NCNUPostsM.sort(function (a, b) {
                    return a.hot < b.hot ? 1 : -1;
                });
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
            // var currTime = Date.parse(new Date().toDateString());
            var currTime = Date.parse(NCNUPostsW[0].created_time);
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
            } else {
                // 按熱度由高至低
                NCNUPostsW = NCNUPostsW.sort(function (a, b) {
                    return a.hot < b.hot ? 1 : -1;
                });
            }
        }
    });
}

// 爬取最新圖片，並更新進DB
function _getNewBeautyImg() {
    var url = "https://ptt-beauty-images.herokuapp.com/";
    request({
        url: url,
        method: "GET"
    }, function (error, response, body) {
        if (error || !body) {
            console.log(error);
            return;
        }
        var $ = cheerio.load(body);
        $(".img-thumbnail").each(function (i, e) {
            var tmp = $(e).attr("href");
            if ((tmp.indexOf(".jpg") != -1) || (tmp.indexOf(".png") != -1)) {
                // 過濾掉網址可能是xxx.mp4.jpg的影片
                if ((tmp.indexOf(".mp4") == -1) && (tmp.indexOf(".gif") == -1) && (tmp.indexOf("imgur") != -1)) {
                    var tmpp = tmp.replace("https://i.imgur.com/", "").split(".");
                    var key = tmpp[0];
                    if (!beautyImg_check.key) {
                        beautyImg_new.push({
                            url: tmp,
                            key: key
                        });
                    }
                }
            }
            // console.log($(e).attr("href"));
        });
        for (var value of beautyImg_new) {
            db.ref("/beauty/" + value.key).set({
                url: value.url,
                // 新增的圖片舉報數初始為0
                reportNum: 0
            });
        }
        // console.log(beautyImg.length);
    });
}

// from firebase
function _getBeautyImg() {
    // 每個小時從DB撈最新的資料
    clearTimeout(timerForImg);
    db.ref('/beauty').once('value', function (snapshot) {
        // 抓到新資料後先把舊資料清空
        beautyImg_DB = [],
            beautyImg_new = [],
            beautyImg_check = {};
        var data = snapshot.val();
        if (data) {
            for (var item in data) {
                beautyImg_DB.push({
                    key: item,
                    url: data[item].url,
                });
                // 方便更新時檢查是否存在
                beautyImg_check[item] = {
                    url: data[item].url,
                    reportNum: data[item].reportNum
                };
            }
        }
        // 順便從網站抓取最新的資料
        _getNewBeautyImg();
    });
    console.log("Img update: finish!");
    // 一小時更新一次
    timerForImg = setInterval(_getBeautyImg, 3600000);
}

function reflashToken() {
    clearTimeout(timerForToken);
    var url = "https://developers.facebook.com/tools/explorer";
    var myCookie = "c_user=100003315001440;xs=203%3AJlb6EiLMTPV8ug%3A2%3A1528476988%3A11327%3A11322";
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
            console.log("Token: reflash!");
            // 抓取前先清空
            NCNUPosts = [];
            NCNUPostsW = [];
            NCNUPostsM = [];
            _getPosts();
            _getPostsW();
            _getPostsM();
        })
    // 每15分鐘抓取一次新資料
    timerForToken = setInterval(reflashToken, 900000);
}

function pushUserData(tmp) {
    // 大雷: 使用者在group中，資料抓不到statusMsg
    // 大雷2: 使用者在group中，照片網址和個人資料中的不一樣
    var inGroup = false;
    var needUpdate = false;
    db.ref('/user/' + tmp.userId).once('value', function (snapshot) {
        var data = snapshot.val();
        if (tmp.groupId) {
            delete tmp.groupId;
            inGroup = true;
        }
        if (data) {
            // 在群組裡面沒有辦法抓到statusMsg，故不判斷
            if (inGroup) {
                needUpdate = (data.displayName != tmp.displayName) || (data.pictureUrl != tmp.pictureUrl);
                // 如果資料庫有個性簽名，則加入tmp中
                if (data.statusMessage) {
                    tmp.statusMessage = data.statusMessage;
                }
            } else {
                if (!data.statusMessage) {
                    needUpdate = true;
                } else {
                    needUpdate = (data.displayName != tmp.displayName) || (data.pictureUrl != tmp.pictureUrl) || (data.statusMessage != tmp.statusMessage);
                }
            }
            // 如果資料更改需要更新
            if (needUpdate) {
                tmp.lastTime = DateTimezone(8);
                db.ref("/user/" + tmp.userId).set(tmp);
                console.log("Update User's Data");
            }
        } else {
            tmp.lastTime = DateTimezone(8);
            db.ref("/user/" + tmp.userId).set(tmp);
        }
    });
}

function pushActionLog(tmp) {
    db.ref("/log").push({
        userId: tmp.userId,
        action: tmp.action,
        time: DateTimezone(8)
    });
}

function pushWishList(tmp) {
    db.ref("/wish").push({
        userId: tmp.userId,
        content: tmp.content,
        time: DateTimezone(8)
    });
}

function pushGroup(tmp) {
    db.ref('/group/' + tmp.groupId).once('value', function (snapshot) {
        var data = snapshot.val();
        if (data) {
            console.log("Group Already exist");
        } else {
            db.ref("/group/" + tmp.groupId).set({
                groupId: tmp.groupId,
                joinTime: DateTimezone(8)
            });
        }
    });
}

function pushContentInGroup() {
    clearTimeout(timerForUploadGT);
    var lastKey = data_in_group_wating_for_update.length;
    if(lastKey != 0){
        for (let i = 0; i < lastKey; i++) {
            if (data_in_group_wating_for_update[i].text != "") {
                db.ref("/group/" + data_in_group_wating_for_update[i].groupId + "/content").push({
                    text: data_in_group_wating_for_update[i].text,
                    userId: data_in_group_wating_for_update[i].userId,
                    createTime: data_in_group_wating_for_update[i].createTime
                });
            }
        }
        // 上傳完就清空
        data_in_group_wating_for_update.splice(0, lastKey);
    }
    // 每1分鐘上傳一次資料
    timerForUploadGT = setInterval(pushContentInGroup, 60000);
    console.log("GroupTextUpload");
}

function pushRoom(tmp) {
    db.ref('/room/' + tmp.roomId).once('value', function (snapshot) {
        var data = snapshot.val();
        if (data) {
            console.log("Room Already exist");
        } else {
            db.ref("/room/" + tmp.roomId).set({
                roomId: tmp.roomId,
                joinTime: DateTimezone(8)
            });
        }
    });
}

function pushContentInRoom() {
    clearTimeout(timerForUploadRT);
    var lastKey = data_in_room_wating_for_update.length;
    if(lastKey != 0){
        for (let i = 0; i < lastKey; i++) {
            if (data_in_room_wating_for_update[i].text != "") {
                db.ref("/room/" + data_in_room_wating_for_update[i].roomId + "/content").push({
                    text: data_in_room_wating_for_update[i].text,
                    userId: data_in_room_wating_for_update[i].userId,
                    createTime: data_in_room_wating_for_update[i].createTime
                });
            }
        }
        // 上傳完就清空
        data_in_room_wating_for_update.splice(0, lastKey);
    }
    // 每1分鐘上傳一次資料
    timerForUploadRT = setInterval(pushContentInRoom, 60000);
    console.log("RoomTextUpload");
}

function _uploadText() {
    pushContentInGroup();
    pushContentInRoom();
}

// 新增當地時區的時間物件
function DateTimezone(offset) {
    // 建立現在時間的物件
    d = new Date();
    // 取得 UTC time
    utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    // 新增不同時區的日期資料
    return new Date(utc + (3600000 * offset)).toLocaleString();
    // 8是台北
    // DateTimezone(8)
}

function getBigHousePosts() {
    var url = 'https://www.facebook.com/search/top/?q=暨大大本營&filters_rp_group={"name":"group_posts","args":"234446386568740"}&filters_rp_author={"name":"author_friends_groups","args":""}&filters_rp_creation_time={"name":"creation_time","args":"{ \"start_year\":\"2018\",\"start_month\":\"2018-06\",\"end_year\":\"2018\",\"end_month\":\"2018-06\"}" }';
    // var url = "https://www.facebook.com/groups/234446386568740/?sorting_setting=RECENT_ACTIVITY";
    var myCookie = "c_user=100003315001440;xs=39%3A7dTnwJwqxwH3wg%3A2%3A1526528920%3A11327%3A11322";
    superagent.get(url)
        .set("Cookie", myCookie)
        .end(function (err, res) {
            if (err) {
                throw err;
            };
            // console.log(res.text);
            // tmpp = tmp[0] + "</html>";
            // var tmpp = tmp[2].split("appID");
            // var finalKey = tmpp[0].substr(5, 230).split("\\");
            // myToken = finalKey[0];

            // var gg = re.text.split("_5pbx userContent _3576")


            // res.setHeader('Access-Control-Allow-Origin', '*');
            // res.status(200).send(JSON.stringify(re));
        })
}

// 爬取最新運勢，並更新進DB
function _getNewLuck(num) {
    clearTimeout(timerForLuck);
    num = num || 0;
    if (num == 0) {
        console.log("Update Constellation: start!");
    }
    allConstellations = ["Aquarius", "Pisces", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn"];
    var url = `https://www.daily-zodiac.com/mobile/zodiac/${allConstellations[num]}`;
    request({
        url: url,
        method: "GET",
    }, function (error, response, body) {
        if (error || !body) {
            console.log(error);
            return;
        }
        var $ = cheerio.load(body);
        var tmp = $("article").text();
        // console.log(tmp);
        luckData[num] = tmp.replace(/\n/g, "").replace(/ /g, "");
        if (num < allConstellations.length - 1) {
            _getNewLuck(++num);
        } else {
            console.log(luckData);
            console.log("Update Constellation: finish");
        }
    });
    // 三小時更新一次
    timerForLuck = setInterval(_getNewLuck, 3600000 * 3);
}

function _reportImg(key) {
    // 檢舉數+1
    beautyImg_check[key].reportNum++;
    db.ref("/beauty/" + key).update({
        reportNum: beautyImg_check[key].reportNum
    });
}

function saveUserConstellation(data) {
    db.ref("/constellation/" + data.userId).set({
        content: data.content
    }).then(() => {
        updateUserConstellation();
    });
}

function updateUserConstellation() {
    db.ref('/constellation').once('value', function (snapshot) {
        // 抓到新資料後先把舊資料清空
        allUserConstellation = {};
        var data = snapshot.val();
        if (data) {
            for (var item in data) {
                allUserConstellation[item] = {
                    content: data[item].content,
                };
            }
        }
    });
}