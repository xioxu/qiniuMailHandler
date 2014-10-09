var fs = require("fs");
var config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

var emailJs = require("emailjs");
var mailSvr  = emailJs.server.connect({
    user:    config.username,
    password:config.password,
    host:   config.smtp.host,
    ssl:     config.smtp.ssl
});

var qiniu = require('qiniu');
qiniu.conf.ACCESS_KEY = 'CKsPFSCkvsT1UzP_90yqEI0CbBWntReYd8jwH1Yh';
qiniu.conf.SECRET_KEY = 'Yfx36l69rUqAfwvXquxjfn8ZDEu5abfLWBDweo-h';

var qiniuDomain = "datafiddle.qiniudn.com";

exports.handle = function(mail){
   var mailSubject = mail.subject.toLowerCase();

    if(mailSubject.match(/upload.*/)){
        upload(mail);
    }
    else  if(mailSubject.match(/convert.*/)){
        var convertTo = mailSubject.split(":")[1];

        if(convertTo){
            convert(mail,convertTo);
        }
        else{
            console.log("无效的文档转换命令")
        }
    }
};

function uploadFile(file,callback){
    var putPolicy = new qiniu.rs.PutPolicy("datafiddle");
    var uploadToken = putPolicy.token();

    qiniu.io.put(uploadToken, file.fileName, file.content, null, function(err, ret) {
        callback(err,ret);
    });
}

function upload(mail){
    mail.attachments.map(function(item){
        uploadFile(item, function (err,ret) {
            var baseUrl = qiniu.rs.makeBaseUrl(qiniuDomain, ret.key);
            var policy = new qiniu.rs.GetPolicy();
            var downloadUrl = policy.makeRequest(baseUrl);

            var subject = item.fileName + "上传完成."

            console.log(subject);

            var mailContent = "<html><body> 下载地址：<a src='" + downloadUrl + "'>" + downloadUrl +"</a> </body></html>";

            mailSvr.send({
                from:config.username,
                to:mail.from[0].address,
                subject: subject,
                attachment: {data:mailContent, alternative:true}
            }, function(err, message) {
                console.log("Email已发送");
                console.log(err || message); });
        });
    });
};

function convert(mail,convertTo){
    mail.attachments.map(function(item){
        uploadFile(item, function (err,ret) {
            var baseUrl = qiniu.rs.makeBaseUrl(qiniuDomain, ret.key);
            var policy = new qiniu.rs.GetPolicy();
            baseUrl+= "?odconv/"+convertTo;
            var downloadUrl = policy.makeRequest(baseUrl);

            var subject = item.fileName + "转换完成."

            console.log(subject);

            var mailContent = "<html><body> 转换后文件下载地址：<a src='" + downloadUrl + "'>" + downloadUrl +"</a> </body></html>";

            mailSvr.send({
                from:config.username,
                to:mail.from[0].address,
                subject: subject,
                attachment: {data:mailContent, alternative:true}
            }, function(err, message) {
                console.log("Email已发送");
                console.log(err || message); });
        });
    });
};
