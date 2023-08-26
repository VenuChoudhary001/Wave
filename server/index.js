const express=require('express');
const app=express();
const server = require('http').Server(app);
const {Server}=require("socket.io");

const io=new Server(server,{
    cors:{
        origin:"*"
    }
})

io.on("connection",(socket)=>{
    socket.on("join-room",(roomId,userId)=>{
            socket.join(roomId);
            console.log(roomId,userId)
            socket.to(roomId).emit('user-connected',userId)
            socket.on('disconnect', () => {
                socket.to(roomId).emit('user-disconnected', userId)
            })
    })
    
})
server.listen(3000,()=>{
    console.log("Server is listening on PORT 3000");
})

