import * as express from 'express';
import * as expressHandlebars from 'express-handlebars';
import { Server } from 'http';
import * as socketIO from 'socket.io';
import Authenticator from './Authenticator';
import * as ROLE from './ROLES';
import Lecturer from './Lecturer';
import Student from './Student';

class App {
    public express;
    public http;
    public websocket;

    constructor() {
        this.express = express();
        this.http = new Server(this.express);
        this.websocket = socketIO(this.http);

        this.mountRoutes();
        this.mountViewEngine();

        this.mountWebsocketMiddleware();
        this.mountWebsocketListener();

        this.express.use(express.static('public'));
    }

    private mountRoutes() {
        this.express.get('/', function (req, res) {
            res.sendFile(__dirname + '/index.html');
        });
    }

    private mountViewEngine() {
        this.express.engine('.hbs', expressHandlebars({
            defaultLayout: 'main',
            extname: '.hbs',
        }));
        this.express.set('view engine', '.hbs');
    }

    private mountWebsocketMiddleware() {
        this.websocket.use((socket, next) => {
            let { role, token, user } = socket.handshake.query;
            let remoteAddress = socket.request.connection.remoteAddress;

            if (Authenticator.isValid(role, user, token)) {
                console.log(`New connection from ${remoteAddress} as role "${role}" with username "${user}".`);

                return next();
            }

            console.log(`Authentication error from ${remoteAddress} with "${user}" and "${token}".`);

            next(new Error('authentication error'));
        });
    }

    private mountWebsocketListener() {
        this.websocket.on('connection', (socket) => {
            let { role, user } = socket.handshake.query;

            socket.on('disconnect', (reason) => {
                console.log(`${user} has left the building.`);
            });

            if (role === ROLE.LECTURER) {
                new Lecturer(user, socket, this.websocket);
            } else {
                new Student(user, socket, this.websocket);
            }
        });
    }
}

let app = new App();

export default app;