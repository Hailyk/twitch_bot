'use strict';

// Dependency Declaration
var irc = require("tmi.js");
var colors = require("colors");
var pjson = require('./package.json');
var config = require('./config');
var sleep = require('sleep');

//message timer prevent bot spamming
var MessageLimiter = Date.now() + config.messageLimit;

//Instance varible declaration
//Instance of the bot
var bot;

// Debug color setting only use for easier debug and logging
colors.setTheme({
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

//run bot
setup();
runBot();

//setup the bot
function setup(){
    // Init bot Instance
    bot = new irc.client(config.irc);
    
    // Connect the client to the server..
    bot.connect();
    
    // set color of the bot
    bot.color(config.botColor).catch(function(err) {
        console.log(colors.error(err));
    });
}

//runs the bot
function runBot(){
    
    //Random Message Posting, timePosting
    setInterval(function(err) {
        if(err)console.log(err);
        for(var i=0;i<config.irc.channels.length;i++){
            sendMessage(config.irc.channels[i], getRandomisms());
        }
    }, config.timePosting.interval);
    
    //Random Message Posting, donate
    setInterval(function(err) {
        if(err)console.log(err);
        for(var i=0;i<config.irc.channels.length;i++){
            sendMessage(config.irc.channels[i], config.donatePosting.message);
        }
    }, config.donatePosting.interval);
    
    
    // Message lisenter 
    bot.on('chat', function(channel, user, message, self) {
        if(isBotCommand(config.botName, message) && !self){
            var command = getBotCommand(config.botName, message).toLowerCase();
            if(isEasyReply(config.commands, command)){
                processEasyReply(config.commands, config.irc.channels[0], message, user);
            }
            else{
                // case switch to determin what command it and excute what to do when command is registered
                switch(command){
                  
                    case "version":
                          sendMessage(channel, config.botName+" Version: "+pjson.version);
                        break;
                    case "echo":
                        if((easyReplyRequireMod(config.commands, 'echo') && bot.isMod(channel, user.username)) || ! easyReplyRequireMod(config.commands, "echo")){
                            var splitArr = message.split(" ");
                            var echoing = "";
                            if(splitArr.length<1){
                                break;
                            }
                            for(var i = 2;i<splitArr.length;i++){
                                echoing+= splitArr[i] + " ";
                            }
                            sendMessage(channel, echoing);
                        }
                        else{
                            var tempSentence = "@"+user.username + " you don't have permission for this command";
                            sendMessage(channel, tempSentence);
                        }
                        break;
                    case "backup":
                        if((easyReplyRequireMod(config.commands, 'echo') && bot.isMod(channel, user.username)) || ! easyReplyRequireMod(config.commands, "echo")){
                            var splitArr = message.split(" ");
                            var echoing = "";
                            if(splitArr.length<1){
                                break;
                            }
                            for(var i = 2;i<splitArr.length;i++){
                                echoing+= splitArr[i] + " ";
                            }
                            echoing = "yeah, "+ echoing;
                            sendMessage(channel, echoing);
                        }
                        else{
                            var tempSentence = "@"+user.username + " you don't have permission for this command";
                            sendMessage(channel, tempSentence);
                        }
                        break;
                    default:
                        sendMessage(channel, "Unknown Command :(");
                        break;
                }
            }
      }
    });
    
    // Bot error Handeling
    bot.on('err', function(err){
        console.log(colors.error("Error: "+err));
    });
}

// check if message received is a message intented for the bot
// @pre-condition bot trigger word is the first word
// @argument botName string name of the bot or trigger word
// @argument message string message to look for trigger word in
// @return boolean true if command is contained in message else false
function isBotCommand(botName, message){
    var botTrigger = "$"+botName.toLowerCase();
    var messageArray = message.split(" ");
    if(messageArray[0] == botTrigger)
        return true;
    return false;
}

// get the argument from the message
// pre-condition arguments follow the command, which start from 3 word
// @argument args int the number of argument to get
// @argument message string string to look for arugment in
// @return array of argument from the message
function getArgument(args, message){
    var messageArray = message.split(" ");
    var arr = [];
    for(var i=2;i<2+args;i++){
        arr+= messageArray[i];
    }
    return arr;
}

// get comand contained in message
// pre-condition command is the second word in message
// @argument botName string name of the bot or trigger word
// @argument message string message to look for trigger word in
// @return string command in message empty string if no command found
function getBotCommand(botName, message){
    if(isBotCommand(botName, message))
        return message.split(" ")[1];
    return "";
}

// get a random ism message
// @return string random ism message
function getRandomisms(){
    var postNumber = Math.floor(Math.random()*config.timePosting.post.length);
    return config.timePosting.post[postNumber];
}

// send message to Twitch
// @argument channel String channel posting to
// @argument message String message to post to channel
function sendMessage(channel, message){
    if(message != ""){
        if(MessageLimiter < Date.now()){
          bot.say(channel, message).catch(function(err) {
                console.log(colors.error("Error: "+err));
          });
        }else
            setTimeout(sendMessage(channel,message), config.messageLimit);
    }
}

// check if command is easy reply able
// @argument commandList array list of command located in the config by default
// @argument command string command to look at
// @return boolean true if command is easy reply enabled otherwise false, also false when command is not found
function isEasyReply(commandList, command){
    for(var i=0;i<commandList.length;i++){
        if(commandList[i].command == command)
            return commandList[i].easyReply;
    }
    return false;
}

// get easy reply
// @argument commandList array list of command located in the config by default
// @argument command string command to look at
// @return Easyreply object, if non return empty array
function getEasyReply(commandList, command){
    for(var i=0;i<commandList.length;i++){
        if(commandList[i].command == command){
            return commandList[i];
        }
    }
    return [];
}

// check if this easy reply command require mod
// @pre-condition requireMod exist
// @argument commandList array list of command located in the config by default
// @argument command string command to look at
// @return boolean true if require mod, false if not.
function easyReplyRequireMod(commandList, command){
    for(var i=0;i<commandList.length;i++){
        if(commandList[i].command == command){
            return commandList[i].requireMod;
        }
    }
    return true;
}

// process the easy reply
// @argument commandList array list of command located in the config by default
// @argument channel string the channel to send reply to
// @argument command string command to look at
// @argument sender object object about the message sent
function processEasyReply(commandList, channel, message, senderObj){
    var command = getBotCommand(config.botName, message).toLowerCase();
    
    // check if command needs mod
    var needMod = easyReplyRequireMod(commandList, command);
    
    // check if the sender is mod
    var isMod = bot.isMod(channel, senderObj.username);
    
    // check if the command is easy reply
    if(isEasyReply(commandList, command)){
        
        // check if sender is mod and if they need mod
        if(!(needMod) || (needMod && isMod)){
            
            // get reply object
            var replyObj = getEasyReply(commandList, command);
            try{
                
                // send individual message out at the 2 second delay
                for(var i=0;i<replyObj.reply.length;i++){
                    var cMessage = replyObj.reply[i];
                    sendMessage(channel, cMessage);
                    sleep.sleep(2);
                }
            }
            catch(err){
                
                // log the error if for some reason it is not able to send message
                console.log(colors.warn("Error: badly configed json;    "+err));
                sendMessage(channel, "Warning: check console");
            }
        }
    }
    else{
        sendMessage(channel, "@"+senderObj.username+", you don't have permission for this command");
    }
}