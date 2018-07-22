var express = require('express');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);


port = 3000;
server.listen(port, function(){
    console.log('app is listening');
});

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));


app.get('/', function(req, res){
    console.log('the app has started');
    res.render('index');
});

//creating an empty object for users
users = {}

io.sockets.on('connection', function(socket){
    console.log('socket connection is established');

    socket.on('new user', function(data, callback){
        if (data in users){
            console.log('user name already taken');
            callback(false);
        } else{
            console.log('user name available');
            socket.myName = data;
            users[socket.myName] = socket;
            callback(true);
            UpdateUsers();
        }
    });

    function UpdateUsers(){
        io.sockets.emit('userName', Object.keys(users));
    }

    socket.on('send message', function(data, cb){
        var chatMessage = data.trim();        
        console.log('received message from index', chatMessage, socket.myName);
        if(chatMessage.substr(0,1) === '@'){  
            var ind = chatMessage.indexOf(' ');
            if (ind !== -1){
                var name = chatMessage.substring(1,ind);
                var msg = chatMessage.substring(ind+1);
                if (name in  users){
                    users[name].emit('whisper', {msg :chatMessage, nick: socket.myName });
                    console.log('whispering');
                    socket.emit('private', {msg :chatMessage, nick: socket.myName });
                } else {
                    console.log(name + ' is not online');
                    cb(name + ' is not online');
                }
            } else {
                cb('Looks like you forgot to write the message');
            }          
            
        } else {
            io.sockets.emit('new message', {msg : chatMessage, nick : socket.myName});
        }

        
    })


});