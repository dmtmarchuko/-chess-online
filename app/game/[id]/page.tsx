"use client"

import {useParams} from 'next/navigation'
import {useState, useEffect, useRef} from 'react'
import {Chess} from 'chess.js'
import {Chessboard} from 'react-chessboard'
import {getSocket} from '../../../lib/socket'

type SquareStyles = {
    [square: string]: React.CSSProperties
}

type LastMove = {
    from:string, 
    to:string,
} | null

const socket = getSocket()

export default function GamePage () {
    const params = useParams()
    const gameId = params.id as string

    const [game, setGame] = useState<Chess>(new Chess())
    const [fen, setFen] = useState<string>(new Chess().fen())
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
    const [cssSquare, setCssSquare] = useState<SquareStyles>({})
    const [lastMove, setLastMove] = useState<LastMove>(null)
    const [possibleMoves, setPossibleMoves] = useState<string[]>([])
    const [playerColor, setPlayerColor] = useState<string | null>(null)

    const handlePieceClick = (square: string) => {
        if((playerColor === "black" && game.turn() !== "b")||
        (playerColor === "white" && game.turn() !== "w")){
            console.log("Not your turn!")
            return false
        }
        if(selectedSquare){
            const isPosibleMove = possibleMoves.includes(square)
            if(isPosibleMove){
                const gameCopy = new Chess(game.fen())
                const result = gameCopy.move({
                    from: selectedSquare,
                    to: square,
                    promotion: "q",
                })

                if(result){
                    setGame(gameCopy)
                    setFen(gameCopy.fen())
                    socket.emit("move", {
                        gameId,
                        move: {
                            from: selectedSquare,
                            to: square,
                            promotion: "q",
                        }
                    })
                }

                setLastMove({
                    from: selectedSquare,
                    to: square,
                })

                setCssSquare({})
                setSelectedSquare(null)
                setPossibleMoves([])
                return
            }
        }

        const moves = game.moves({
            square: square as any,
            verbose: true
        })

        if(moves.length === 0) return 

        const validMoves = moves.map((m) => m.to)
        setPossibleMoves(validMoves)

        const newSquares: SquareStyles = {}

        moves.forEach((moves) => {
            newSquares[moves.to] = {
                background:"rgba(0,225,0,0.4)"
            }

            newSquares[square] = {
                background:"rgba(225,225,0,0.4)"
            }
        })
        
        setSelectedSquare(square)
        setCssSquare(newSquares)
    }

    const combinedStyles: SquareStyles = {
        ...cssSquare,
    }

    if(lastMove){
        combinedStyles[lastMove.from] = {
            background:'rgba(255,255,0,0.6)'
        }
        combinedStyles[lastMove.to] = {
            background:'rgba(255,255,0,0.6)'
        }
    }
    
    useEffect(() => {
        if(!gameId) return

        let userId = sessionStorage.getItem("userId")

        if(!userId){
            userId = crypto.randomUUID()
            sessionStorage.setItem("userId", userId)
        }

        const joinGame = () => {
            console.log("Joining game:", gameId, "---", userId)
            socket.emit('join-game', {
                gameId,
                userId,
            })
        }

        if(socket.connected){
            joinGame()
        }else{
            socket.on("connect", joinGame)
        }
            
        socket.on("player-color", (color) => {
            console.log("my color:", color)
            setPlayerColor(color)
        })                                             

        socket.on("game-state", (fen) => {
            console.log("RECEIVED GAME FEN:", fen)
            setGame(new Chess(fen))
            setFen(fen)
        })
    
        return () => {
            socket.off("connect")
            socket.off("game-state")
            socket.off("player-color")
        }
    },[gameId])

    return (
        <div className="chess-page">
            <h1>ID: {gameId}</h1>
            <p>Your side is "{playerColor}"</p>
            <h2>{game.turn() === 'w' ? 'White turn' : 'Black turn'}</h2>
            {game.inCheck() && <p>Check!</p>}
            {game.isDraw() && <p>Draw!</p>}

            {game.isCheckmate() && <p>Check Mate!</p>}
            {game.isCheckmate() && <p>Winner: {game.turn() === 'b' ? 'White' : 'Black'}</p>}
            <div style={{
                width: '100%',
                minWidth: '300px',
                margin: '0 auto',
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
            }}>
                <Chessboard
                arePiecesDraggable={game.turn() === (playerColor === "white" ? "w" : "b")}
                    boardOrientation={playerColor === "black"? "black" : "white"}
                    customBoardStyle={{
                        borderRadius: '4px',
                        boxShodow: '0 2px 10px rgba(0,0,0,0.3)'
                    }}

                    customDarkSquareStyle={{
                        backgroundColor: '#779952'
                    }}

                    customLightSquareStyle={{
                        backgroundColor: '#edeed1'
                    }}
                    
                    key={fen} 
                    position={fen}
                    onSquareClick={handlePieceClick}
                    customSquareStyles={combinedStyles}
                    onPieceDrop={(sourceSquare, targetSquare, piece) => {
                        if((playerColor === "black" && game.turn() !== "b")||
                            (playerColor === "white" && game.turn() !== "w")){
                                console.log("Not your turn!")
                                return false
                        }
                        try{
                            const turn = game.turn()

                            if(piece[0] !== turn){ //shows the turn 
                                console.log('not your turn!')
                                return false
                            }

                            const gameCopy = new Chess(game.fen())
                            const result = gameCopy.move({
                                from: sourceSquare,
                                to: targetSquare,
                                promotion: "q",
                            })

                            if(result){
                                setGame(gameCopy)
                                setFen(gameCopy.fen())
                                socket.emit("move", {
                                    gameId,
                                    move: {
                                        from: sourceSquare,
                                        to: targetSquare,
                                        promotion: "q",
                                    }
                                })
                            }

                            setLastMove({
                                from: sourceSquare,
                                to: targetSquare,
                            })

                            setCssSquare({})

                            return true
                        }catch{
                            console.log('system error or invalid turn ')
                            return false
                        }
                    }}  
                />
            </div>
        </div>
    )
}