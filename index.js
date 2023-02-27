const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");
const users = [];
const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"]
	}
});

app.use(cors());

const PORT = process.env.PORT || 5000;

app.use(function (req, res, next) {

	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', '*');

	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);

	// Pass to next layer of middleware
	next();
});

app.get('/', (req, res) => {
	res.send('Running');
});

io.on("connection", (socket) => {
	socket.emit("me", socket.id);

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
	});
	socket.on("callUser", ({ signalData, from, name }) => {

		let connectingUser = {};
		for (let i = 0; i < users.length; i++) {
			if (users[i].interest === name) {
				connectingUser = users[i];
				users.splice(i, 1);
				break;
			}
		}
		if (connectingUser.interest) {
			io.to(connectingUser.id).emit("callUser", { signal: signalData, from, name });
		} else {
			users.push({ interest: name, id: from })
		}
		console.log(users);
	});

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", { signal: data.signal, name: data.name })
	});
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
