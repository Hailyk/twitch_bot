'use strict';

// Dependency Declaration
var irc = require("tmi.js");
var colors = require("colors");
var pjson = require('./package.json');
var config = require('./config');
var MessageLimiter = Date.now() + config.messageLimit

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
    
    config.timePosting.interval *= 1000;
}

//runs the bot
function runBot(){
    
    //Random Message Posting
    setInterval(function(err) {
        if(err)console.log(err);
        for(var i=0;i<config.irc.channels.length;i++){
            sendMessage(config.irc.channels[i], getRandomisms());
        }
    }, config.timePosting.interval);
    
    // Message lisenter 
    bot.on('chat', function(channel, user, message, self) {
      if(!self){
          if(isBotCommand(config.botName, message)){
              // check if user is joshxmayhem
              if( user['display-name'] == "joshxmayhem"){
                  sendMessage(channel, "You don't tell me what to do");
              }else{
                  var command = getBotCommand(config.botName, message);
                  console.log(command.toLowerCase());
                  // case switch to determin what command it and excute what to do when command is registered
                  switch(command.toLowerCase()){
                      case "version":
                          sendMessage(channel, "Fep Bot Version: "+pjson.version);
                          break;
                      default:
                          sendMessage(channel, "Unknown Command :(");
                          break;
                  }
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
// @argument message to look for arugment in
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
    if(isBotCommand(botName, message)){
        return message.split(" ")[1];
    }
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
    if(MessageLimiter < Date.now()){
      bot.say(channel, message).catch(function(err) {
            console.log(colors.error("Error: "+err));
      });
    }else{
        setTimeout(sendMessage(channel,message), 500);
    }
}
