var mailHandler = require("./mailCommandHandler");
var MailListener = require("mail-listener2");
var fs = require("fs");
var config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

var mailListener = new MailListener({
    username: config.username,
    password: config.password,
    host: config.imap.host,
    port: config.imap.port,
    tls: config.imap.secure,
    tlsOptions: { rejectUnauthorized: false },
    mailbox: "INBOX", // mailbox to monitor
    searchFilter: ["NEW"], // the search filter being used after an IDLE notification has been retrieved
    markSeen: true, // all fetched email willbe marked as seen and not fetched next time
    fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
    mailParserOptions: {streamAttachments: false}, // options to be passed to mailParser lib.
    attachments: true, // download attachments as they are encountered to the project directory
    attachmentOptions: { directory: "attachments/" } // specify a download directory for attachments
});
mailListener.start(); // start listening

mailListener.on("server:connected", function(){
    console.log("imapConnected");
});

mailListener.on("server:disconnected", function(){
    console.log("imapDisconnected");
});

mailListener.on("error", function(err){
    console.log(err);
});

mailListener.on("mail", function(mail, seqno, attributes){
    // do something with mail object including attachments
    console.log("emailParsed", mail);
    mailHandler.handle(mail);
    // mail processing code goes here
});

mailListener.on("attachment", function(attachment){
    console.log(attachment.path);
});
