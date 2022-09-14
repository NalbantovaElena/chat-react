import http from "http";
import path from "path";
import {Server} from "socket.io";
import express from "express";

const app = express();
const _dirname = path.resolve();
app.use(express.static(path.join(_dirname, "frondend/build")));
app.get("*", (req,res) => {
    res.sendFile(path.join(_dirname, "frondend/build/index.html"));
})

const httpServer = http.Server(app);
const io = new Server(httpServer, {cors: {origin:"*"} });
const users = [];
io.on("connection", (socket) => {
   
    socket.on("onLogin", (user) => {
        const updateUser = {
            ...user,
            online: true,
            socketId: socket.id,
            messages: []
        }

        const existUser = users.find((x)=>x.name===updateUser.name);
        if(existUser){
            existUser.socketId = socket.Id;
            existUser.online = true;
        }else{
            users.push(updateUser);
        }

        const admin = users.find((x) =>x.name==='Admin'&& x.online);
        if(admin){
            io.to(admin.socketId).emit("updateUser", updateUser)
        }
        if(updateUser.name === 'Admin'){
            io.to(updateUser.socketId).emit("listUsers",users);
        }
    });
    socket.on("disconnect", () => {
const user = users.find((x) => x.socketId === socket.id);
if(user){
    user.online = false;
    const admin = users.find((x) => x.name ="Admin" && x.online);
    if(admin){
        io.to(admin.socketId).emit("updateUser", user);
    }

}
    });
    socket.on("onUserSelected", (user) => {
        const admin = users.find((x) => x.name ==="Admin" && x.online);
        if(admin){
            const existUser = users.find((x) => x.name === user.name);
            io.to(admin.socketId).emit("selectUser", existUser);
        }
    });
    socket.on("onMessage", (message) => {
        if(message.from ==="Admin"){
            const user = users.find((x) => x.name===message.to && x.online);
        if(user){
            io.to(user.socketId).emit("message",message);
            user.messages.push(message);
        }else{
io.to(socket.id).emit("message",{
    from:"System",
    to:"Admin",
    body:"User Is Not Online"
})
        }
        }else{
            const admin = users.find((x)=> x.name === "Admin" && x.online);
            if(admin){
                io.to(admin.socketId).emit("message",message);
                const user = users.find((x) => x.name === message.from && x.online);
                if(user){
                    user.messages.push(message);
                }
            }else{
                io.to(socket.id).emit("message",{
                    from:"System",
                    to: message.from,
                    body:"Sorry. Admin is not online right now",
                })
            }
        }
    });
})
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
})