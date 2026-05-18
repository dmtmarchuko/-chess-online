'use client'

import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {getSocket} from '../lib/socket';

const socket = getSocket()

export default function MainPage (){
    const router = useRouter()
    const [gameCode, setGamecode] = useState("")

    const handleCreateGame = () => {
        const randomId = Math.random().toString(36).substring(2,8)
        router.push(`/game/${randomId}`)
    }

    const handleJoinGame = () => {
        socket.emit("checkGame", gameCode, (exists: boolean) => {
            if(!exists){
                console.log("Game not found!")
            return
            }
            router.push(`/game/${gameCode}`)
        })
    }

    return (
        <div className="main-page">
            <button onClick={handleCreateGame}>Create game</button> 
            <button onClick={handleJoinGame}>Join game</button>
            <input
                className='game-code-input'
                placeholder='Enter the id of the game'
                value={gameCode}
                onChange={(e) => setGamecode(e.target.value)}
            />
        </div>
    )
}