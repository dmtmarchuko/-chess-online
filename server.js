const http = require("http")
const {Server} = require("socket.io")
const {Chess} = require("chess.js")

const server = http.createServer((res, req) => {
    handler(res, req)
})

const PORT = process.env.PORT || 3002

const io = new Server(server, {
    cors:{
        origin:"*",
    }
})

const games = {}

io.on("connection", (socket) => {

    socket.on("checkGame", (gameId, callback) => {
        const exists = !!games[gameId]
        callback(exists)
    })

    console.log("user connected:", socket.id)

    socket.on("join-game", ({gameId, userId}) => {
        if(!games[gameId]){
            games[gameId] = {
                players: [],
                fen: new Chess().fen(),
            }
        }

        console.log("fen:", games[gameId].fen)
        const game = games[gameId]
        const players = game.players
        let existingPlayer = players.find(p => p.userId === userId) 

        if(existingPlayer){
            console.log("RECONNETED", existingPlayer.color)
            existingPlayer.socketId = socket.id

            socket.join(gameId)

            socket.emit("player-color", existingPlayer.color)
            socket.emit("game-state", game.fen)
            return
        }

        let color = null

        if(players.length === 0){
            color = "white"
        }else if(players.length === 1) {
            color = "black"
        } else {
            color = "spectator"
        }

        players.push({
            userId,
            socketId: socket.id,
            color,
        })

        socket.join(gameId)
        
        console.log("join:", gameId, color, game.fen)
        socket.emit("player-color", color)
        socket.emit("game-state", game.fen)
    })

    socket.on("move", ({ gameId, move}) => {
        const game = games[gameId]
        const chess = new Chess(game.fen)
        const result = chess.move(move)

        if (!result) return 
        game.fen = chess.fen()

        io.to(gameId).emit("game-state", game.fen)

        console.log("move:", move)
    })
})

server.listen(PORT, () => {
    console.log("Socket server running on port 8080")
})