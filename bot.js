require('dotenv').config()
const tmi = require('tmi.js');
const { Configuration, OpenAIApi } = require("openai");
const https = require('https');

const oauthToken = process.env.TWITCH_ACCESS_TOKEN;
/*
// Your app's registered client ID and client secret.
const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const grantType = 'client_credentials';

// Options for the HTTPS POST request to get the OAuth token.
const postOptions = {
  hostname: 'id.twitch.tv',
  path: '/oauth2/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
};

// Scopes required for the bot.
const scopes = 'chat:read+chat:edit';
// Create a new HTTPS POST request.
let req = https.request(postOptions, function(res) {
  let body = '';

  res.on('data', function(chunk) {
    body += chunk;
  });

  res.on('end', function() {
    let twitchResponse = JSON.parse(body);
    let token = twitchResponse.access_token;
    console.log(twitchResponse);
    // Create bot with OAuth token.
	validateToken(token);
  });
});

// Send the POST data (client ID, client secret, and grant type).
req.write(`client_id=${clientId}&client_secret=${clientSecret}&grant_type=${grantType}&scope=${scopes}`);
// End the request.
req.end();

function validateToken(token){
	// Options for the HTTPS POST request to get the OAuth token.
	const postOptions2 = {
	  hostname: 'id.twitch.tv',
	  path: '/oauth2/validate',
	  method: 'GET',
	  headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Authorization': 'OAuth ' + token
	  }
	};

	// Create a new HTTPS POST request.
	let req2 = https.request(postOptions2, function(res) {
	  let body = '';

	  res.on('data', function(chunk) {
		body += chunk;
	  });

	  res.on('end', function() {
		let twitchResponse = JSON.parse(body);
		console.log(twitchResponse);
		createBot(token);
	  });
	});
	req2.end();
}
*/

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_API_ORG,
});

const openai = new OpenAIApi(configuration);

function createBot(token) {
	console.log(token);
	// Define configuration options
	const opts = {
	  identity: {
		username: 'mochitupaki',
		password: `oauth:${token}`
	  },
	  channels: [
		'mochitupaki'
	  ]
	};
	console.log(opts);

	// Create a client with our options
	const client = new tmi.client(opts);

	// Register our event handlers (defined below)
	client.on('message', onMessageHandler);
	client.on('connected', onConnectedHandler);

	// Connect to Twitch:
	client.connect().catch((error) => {
		console.error(error);
	});

	// Called every time a message comes in
	async function onMessageHandler (target, context, msg, self) {
	  if (self) { return; } // Ignore messages from the bot

	  // Remove whitespace from chat message
	  const commandName = msg.trim();

	  // If the command is known, let's execute it
	  if (commandName.startsWith('!jobu')) {
		const userMessage = commandName.slice(5).trim(); // Remove '!chat' from the message
		const response = await openai.createChatCompletion({
		  model: "gpt-3.5-turbo",
		  messages: [
			{role: "user", content: userMessage}
		  ]
		});
		const botMessage = response.data.choices[0].message.content;
		client.say(target, botMessage);
		console.log(`* Executed ${commandName} command`);
	  } else if (commandName === '!dice') {
		const num = rollDice();
		client.say(target, `You rolled a ${num}`);
		console.log(`* Executed ${commandName} command`);
	  } else {
		console.log(`* Unknown command ${commandName}`);
	  }
	}

	// Function called when the "dice" command is issued
	function rollDice () {
	  const sides = 6;
	  return Math.floor(Math.random() * sides) + 1;
	}

	// Called every time the bot connects to Twitch chat
	function onConnectedHandler (addr, port) {
	  console.log(`* Connected to ${addr}:${port}`);
	}
}

createBot(oauthToken);