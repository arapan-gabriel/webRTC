import React, { useEffect, useRef, useState } from "react";
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  styledVideo: {
    height: '15%',
    width: '33%'
  }
}));

const CustomVideo = (props) => {
  const [showVideo, setShowVideo] = useState(true);
  const ref = useRef();
  useEffect(() => {
    props.peer.on("stream", stream => {
    ref.current.srcObject = stream;
    })
  }, []);
  const classes = useStyles();
  return (
    showVideo &&
      <video
        className={classes.styledVideo}
        playsInline
        autoPlay
        ref={ref}
        controls
        muted
        id={props.peer._id}
        onSuspend={() => setShowVideo(false)}
      />
  );
}

export default CustomVideo;