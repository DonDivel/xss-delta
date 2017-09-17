var express = require('express')  , bodyParser = require('body-parser');
var app = express();
var sqlite = require('sqlite3').verbose();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var ex = false;
var ownerSocket ;
var toret = [];
//sql
var db = new sqlite.Database('blacksails_db');
db.serialize(function(){
	db.run("CREATE TABLE IF NOT EXISTS users (ID INTEGER PRIMARY KEY AUTOINCREMENT,IP TEXT NOT NULL,TIME TEXT NOT NULL,STATUS TEXT NOT NULL,LASTLOGIN TEXT NOT NULL,FIRSTLOGIN TEXT NOT NULL,SITEWEB TEXT NOT NULL,AGENT TEXT NOT NULL)");
});

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/logout',function(req,res){
	db.close();
	res.render('pages/login',{err:""});
});

app.get('/',function(req,res){
	res.render('pages/login',{err:""});
});
app.get('/getusers',function(req,res){
	var data = [{os:"xp",ip:"123.123.123",name:"alo",cnt:"maroc"},{os:"mac",ip:"02.145.894",name:"alo",cnt:"france"}];
	res.send(data);
});
app.post('/login',function(req,res){
	console.log(req.body);
	if(req.body.login == 'alo')
	{

	res.render('pages/index',{login:req.body.login});
	}else
	{
	res.render('pages/login',{err:"pass err"});	
	}
});

users = [];
connections =[];

server.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
io.sockets.on('connection',function(socket){
	//connect
	


	ConnectUser(socket);
	
	//disconnect

	socket.on('disconnect',function(data){
	
	DisconnectUser(socket);


	});

	

});

function ConnectUser(socket)
{
	ownerSocket =socket;
	connections[socket['id']] = socket;
		db.serialize(function(){
	var iptemp =  socket.request.connection.remoteAddress;
	
		db.get("select * from users where IP = '"+iptemp+"' ",function(err,row){
		
		if(row !== undefined)
		{
		db.run("UPDATE users SET LASTLOGIN = datetime() , STATUS = 'Online' where IP = '"+iptemp+"' ");


		}else
		{
		db.run("insert into users values (NULL,'"+iptemp+"','"+socket['handshake']['time']+"','Online',datetime(),datetime(),'"+socket['handshake']['headers']['origin']+"','"+socket['handshake']['headers']['user-agent']+"')");

		}
		getUsers(getUsersCallBack,socket);
	});
		});



}

function DisconnectUser(socket)
{
	delete connections[socket['id']];
		db.serialize(function(){
		

	var iptemp =  socket.request.connection.remoteAddress;
	
		db.get("select * from users where IP = '"+iptemp+"' ",function(err,row){
		
		if(row !== undefined)
		{
		db.run("UPDATE users SET  STATUS = 'offline' where IP = '"+iptemp+"' ");

		}
		getUsers(getUsersCallBack,socket);
	});
		});
		console.log('socket disconnected'+connections.length);
		
			//getUsers(getUsersCallBack,io.sockets);
}

function getUsers(callback,socket)
{	
		db.all("select * from users ", [], (err, data) => {
			 	 if(err){
				        console.log(err);
				    }else{
				        callback(data,socket);
				    }
			});
}

function getUsersCallBack(ph,sk)
{
	var uss = [];
	ph.forEach((data)=>{
		var p = {ip:data.IP,os:data.TIME,name:data.SITEWEB,cnt:data.AGENT,status:data.STATUS};
		uss.push(p);
	});
	io.sockets.emit("users",uss);

	
}

