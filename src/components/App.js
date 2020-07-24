import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';

import CreateRoom from './CreateRoom';
import Room from './Room';

// import io from'socket.io-client';
// const socket = io.connect('http://localhost:4444');
// socket.emit('joinRoom', '1')
// socket.on('joinExpert', res => console.log(`expert - ${res}`));
// socket.on('success', res => console.log(`success - ${res}`));
// socket.on('err', res => console.log(`err - ${res}`));

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    width: '1200px',
    margin: '0 auto',
  },
  header: {
    borderRadius: '0px',
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    borderRadius: '0px',
  },
  userList: {
    borderRadius: '0px',
    minHeight: '680px',
  },
  videoContent: {
    borderRadius: '0px',
    minHeight: '680px',
  },
  footer: {
    borderRadius: '0px',
  }  
}));

const App = () => {
    const classes = useStyles();
    return (
      <div className={classes.root}>
        <BrowserRouter>
                <Grid container spacing={1}>
                <Grid item xs={12}>
                    <Paper className={classes.header}>WebRTC</Paper>
                </Grid>

                <Grid item xs={4}>
                    <Paper className={classes.userList}>usersListRoom</Paper>
                </Grid>
                <Grid item xs={8}>
                    <Paper className={classes.videoContent}>
                        <Switch>
                            <Route path="/" exact component={CreateRoom} />
                            <Route path="/room/:roomID" component={Room} />
                        </Switch>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper className={classes.footer}>Some info</Paper>
                </Grid>
                </Grid>
        </BrowserRouter>
      </div>
    );
  }

export default App;
