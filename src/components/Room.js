import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

import CustomVideo from './CustomVideo';
import Switch from '@material-ui/core/Switch';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import { makeStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: '20px',
    width: '90%',
    margin: 'auto',
    flexWrap: 'wrap',
  },
  styledVideoOwner: {
    height: '50%',
    width: '100%',
  },
  selectFormControl: {
    margin: theme.spacing(1),
    minWidth: 210,
  }
}));

const CustomSelect = (props) => {
  const classes = useStyles();
  const {
    inputLabelText,
    selectedDevice,
    devices
  } = props;
  return (
    <FormControl className={classes.selectFormControl}>
      <InputLabel id="demo-simple-select-label">{inputLabelText}</InputLabel>
      <Select
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={selectedDevice}
        onChange={props.handleChange}
      >
        {
          devices.map((device, index) => {
            return (
            <MenuItem key={index} value={device.deviceId}>{device.label}</MenuItem>
            );
          })
        }
      </Select>
    </FormControl>
  )
}

const videoConstraints = {
  height: window.innerHeight / 2,
  width: window.innerWidth / 2
};

const Room = (props) => {
  const [peers, setPeers] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [videoInputLabelText, setVideoInputLabelText] = useState('Select video input device');
  const [audioInputLabelText, setAudioInputLabelText] = useState('Select audio input device');
  const [audioOutputLabelText, setAudioOutputLabelText] = useState('Select audio output device');
  const [videoInputDevices, setVideoInputDevices] = useState([]);
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [checkeFront, setCheckeFront] = useState(true);
  const [checkeRear, setCheckeRear] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState({
    videoInputDevice: '',
    audioInputDevice: '',
    audioOutputDevice: ''
  });
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef([]);
  const roomID = props.match.params.roomID;

  useEffect(() => {
    // socketRef.current = io.connect("http://localhost:8000");
    socketRef.current = io.connect("https://webrtc-node1.herokuapp.com");
    navigator.mediaDevices.getUserMedia({audio: true, video: true})
      .then(() => {
        navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          const audioInDevices = devices.filter(device => device.kind === 'audioinput');
          const audioOutDevices = devices.filter(device => device.kind === 'audiooutput');
          if (!videoDevices.length) {
            setVideoInputLabelText('No video devices')
          }
          if (!audioInDevices.length) {
            setAudioInputLabelText('No input audio devices')
          }
          if (!audioOutDevices.length) {
            setAudioOutputLabelText('No output audio devices')
          }
          setVideoInputDevices(videoDevices);
          setAudioInputDevices(audioInDevices);
          setAudioOutputDevices(audioOutDevices);
        })
        .catch(err => {
          console.log(err.name + ": " + err.message);
        });
      });

      socketRef.current.on("message-to-users", data => {
        console.log('message-data', data);
        console.log('messages: ', messages);
        const messagesData = {
          user: data.user,
          message: data.message
        };

        console.log('messagesData:', messagesData);
        
        
        setMessages(messages => [...messages, messagesData]);
        console.log('messages2: ', messages);
      });
  }, []);

  const connectStream = (videoConstraints) => {
    navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true })
      .then(stream => {
        userVideo.current.srcObject = stream;
        socketRef.current.emit("join room", roomID);
        socketRef.current.on("all users", users => {
          const peers = [];
          users.forEach(userID => {
              const peer = createPeer(userID, socketRef.current.id, stream);
              peersRef.current.push({
                peerID: userID,
                peer,
              })
              peers.push(peer);
          })
          setPeers(peers);
        });

        socketRef.current.on("user joined", payload => {
          const item = peersRef.current.find(p => p.peerID === payload.callerID);
          if(!item) {
            const peer = addPeer(payload.signal, payload.callerID, stream);
            peersRef.current.push({
            peerID: payload.callerID,
            peer,
            })
            setPeers(users => [...users, peer]);
          }

        });

        socketRef.current.on("receiving returned signal", payload => {
            const item = peersRef.current.find(p => p.peerID === payload.id);
            item.peer.signal(payload.signal);
        });

      });
  }

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
        initiator: true,
        trickle: false,
        callerID: callerID,
        stream,
    });

    peer.on("signal", signal => {
      socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
    })

    return peer;
  }

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({
    initiator: false,
    trickle: false,
    callerID,
    stream,
    })

    peer.on("signal", signal => {
        socketRef.current.emit("returning signal", { signal, callerID })
    })

    peer.signal(incomingSignal);

    return peer;
  }
  const classes = useStyles();

  const handleChangeSelectVideoIn = (e) => {
    setSelectedDevices({ ...selectedDevices, videoInputDevice: e.target.value });
    videoConstraints.deviceId = { exact: e.target.value}
    connectStream(videoConstraints);
  };
  const handleChangeSelectAudioIn = (e) => {
    setSelectedDevices({ ...selectedDevices, audioInputDevice: e.target.value });
  };
  const handleChangeSelectAudioOut = (e) => {
    setSelectedDevices({ ...selectedDevices, audioOutputDevice: e.target.value });
  };
  const handleChangeSwitch = (event) => {
    const videoConstraints = {
      height: window.innerHeight / 2,
      width: window.innerWidth / 2
    };
    if(event.target.checked){
      videoConstraints.facingMode = {exact: 'environment'};
    } else {
      videoConstraints.facingMode = 'user';
    }
    
    setCheckeFront(!event.target.checked);
    setCheckeRear(event.target.checked);
    connectStream(videoConstraints)
  };

  const handleBtnClick = (e) => {
    e.preventDefault();
    socketRef.current.emit("message", messageInput);
  }

  const handleInputChange = (e) => {
    setMessageInput(e.target.value)
  }

  return (
    <div className={classes.container}>
      <video
          className={classes.styledVideoOwner}
          controls
          muted
          ref={userVideo}
          autoPlay
          playsInline
      />
      {
        peers.map((peer, index) => {
          return (
            <CustomVideo key={index} peer={peer} />
          );
        })
      }
      <div>
        <label>Switch camera for phone</label>
        <Switch
          checked={checkeRear}
          onChange={handleChangeSwitch}
          color="primary"
          name="checkedB"
          inputProps={{ 'aria-label': 'primary checkbox' }}
        /><br />
        <CustomSelect
          devices={videoInputDevices}
          inputLabelText={videoInputLabelText}
          selectedDevice={selectedDevices.videoInputDevice}
          handleChange={handleChangeSelectVideoIn}
        /><br />
        <CustomSelect
          devices={audioInputDevices}
          inputLabelText={audioInputLabelText}
          selectedDevice={selectedDevices.audioInputDevice}
          handleChange={handleChangeSelectAudioIn}
        /><br />
        <CustomSelect
          devices={audioOutputDevices}
          inputLabelText={audioOutputLabelText}
          selectedDevice={selectedDevices.audioOutputDevice}
          handleChange={handleChangeSelectAudioOut}
        /><br />
        <form id="chat-form">
          <input
            id="msg"
            type="text"
            placeholder="Enter message"
            required
            value={messageInput}
            onChange={handleInputChange}
          />
          <div>
            {
              messages.map((message, index) => {
                return (
                <div key={index}>
                  User: {message.user}
                  <br />
                  Message: {message.message}
                </div>
                );
              })
            }
          </div>
          <button onClick={handleBtnClick}>Send</button>
        </form>
        </div>
    </div>
  );
};

export default Room;
