import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"
import IconCallVideo from './img/video-call3.png'
import IconVideoChat from './img/video-chat.jpg'
import IconAnswerCall from './img/answer-call.png'
import IconEndCall from './img/end-call.png'
import IconEndedCall from './img/ended-call.png'


const socket = io.connect('https://video-chat-backend-wxs2.onrender.com')

const VideoCall = () => {

    const [me, setMe] = useState("")
    const [stream, setStream] = useState()
    const [receivingCall, setReceivingCall] = useState(false)
    const [caller, setCaller] = useState("")
    const [callerSignal, setCallerSignal] = useState()
    const [callAccepted, setCallAccepted] = useState(false)
    const [idToCall, setIdToCall] = useState("")
    const [callEnded, setCallEnded] = useState(false)
    const [name, setName] = useState("")
    const myVideo = useRef()
    const userVideo = useRef()
    const connectionRef = useRef()
    const [calling, setCalling] = useState(false)
    const [kuting, setKuting] = useState(false)

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            setStream(stream)
            myVideo.current.srcObject = stream
        })

        socket.on("me", (id) => {
            setMe(id)
        })

        socket.on("callUser", (data) => {
            setReceivingCall(true)
            setCalling(true)
            setCaller(data.from)
            setName(data.name)
            setCallerSignal(data.signal)
        })
    }, [])

    const callUser = (id) => {
        setCalling(true)
        setKuting(true)
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream
        })
        peer.on("signal", (data) => {
            socket.emit("callUser", {
                userToCall: id,
                signalData: data,
                from: me,
                name: name
            })
        })
        peer.on("stream", (stream) => {

            userVideo.current.srcObject = stream

        })
        socket.on("callAccepted", (signal) => {
            setCallAccepted(true)
            setKuting(false)
            peer.signal(signal)
        })

        connectionRef.current = peer
    }

    const answerCall = () => {
        setCallAccepted(true)
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream
        })
        peer.on("signal", (data) => {
            socket.emit("answerCall", { signal: data, to: caller })
        })
        peer.on("stream", (stream) => {
            userVideo.current.srcObject = stream
        })

        peer.signal(callerSignal)
        connectionRef.current = peer
    }

    const leaveCall = () => {
        setCallEnded(true)
        connectionRef.current.destroy()
    }

    return (
        <div className="box">
            <div className="box-title">
                <img className="box-title-icon" src={IconVideoChat} alt="" />
                <h1 className="box-title-item">Video <span>chat</span></h1>
            </div>
            {receivingCall && callAccepted && !callEnded ? "" :
                !calling ?
                    <div div className="input-group">
                        <input
                            type="text"
                            placeholder="Ismingiz"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <CopyToClipboard text={me}>
                            <button className="id-btn">
                                <span className="id-btn-span">
                                    ID ni olish
                                </span>
                            </button>
                        </CopyToClipboard>
                        <input
                            type="text"
                            placeholder="User ID sini kiriting"
                            value={idToCall}
                            onChange={(e) => setIdToCall(e.target.value)}
                        />
                        <h4 className="id-title">Siz qo'ng'iroq qilmoqchi bo'lgan user ID si:</h4>
                        <h5 className="user-id">{idToCall ? idToCall : "User ID sini kiritmadiz...!"}</h5>
                        <button className="call-box" onClick={() => callUser(idToCall)}>
                            <img
                                src={IconCallVideo}
                                className={`${idToCall ? "animation-call" : ''}`}
                                alt="Qo'ng'iroq qilish"
                            />
                            Qo'ng'iroq qilish
                        </button>
                    </div> : null
            }{
                kuting ? <h1 className="kuting">Chaqirmoqda...</h1> : null
            }
            <div className="video-box">
                <div className={`${callAccepted && !callEnded ? "user-video" : "my-video"}`}>
                    {stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "100%", height: "100%" }} />}
                </div>
                <div className={`${callAccepted && !callEnded ? "my-video" : "user-video"}`}>
                    {callAccepted && !callEnded ?
                        <video playsInline ref={userVideo} autoPlay style={{ width: "100%", height: "100%" }} /> :
                        null}
                </div>
            </div>
            {/* <video playsInline ref={userVideo} autoPlay style={{ width: "300px", border: '1px solid black' }} /> : */}
            {
                receivingCall && !callAccepted ? (
                    <div className="call-div">
                        <h1 className="caller-name">..::: {name} :::..</h1>
                        <div className="call">
                            <button className="answer-call" onClick={answerCall}>
                                <img src={IconAnswerCall} alt="" />
                                <h4>Javob berish</h4>
                            </button>
                            <button className="end-call" onClick={leaveCall}>
                                <img src={IconEndCall} alt="" />
                                <h4>Rad qilish</h4>
                            </button>
                        </div>
                    </div>
                ) : null
            }
            {
                callAccepted && !callEnded ?
                    <button className="ended-box" onClick={leaveCall}>
                        <img src={IconEndedCall} alt="" />
                    </button>
                    : null
            }
            {
                callAccepted && !callEnded ?
                    <h1 className="calling-name">Ismoil</h1>
                    : null
            }
        </div >
    )
}

export default VideoCall
