// bot.js
require('dotenv').config()
const tmi = require('tmi.js');
const { Configuration, OpenAIApi } = require("openai");
const https = require('https');
const fs = require('fs'); // Import fs module for reading files
const {encode} = require('gpt-3-encoder'); // Import encode function

const oauthToken = process.env.TWITCH_ACCESS_TOKEN;

const openaiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_API_ORG,
});
const openai = new OpenAIApi(openaiConfig);

// Read first system message from file
const systemMessage = fs.readFileSync('jobu-system-message.txt', 'utf8');

let chatHistory = []; // To keep track of chat history

function createBot(token) {
	console.log(token);
	// Define configuration options
	const opts = {
	  identity: {
		username: 'jobutupakibot',
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

	  const commandName = msg.trim();

	  // If the command is known, let's execute it
	  if (commandName == '!jobu reset'){
		  chatHistory = [];
		  chatHistory.push({role: "system", content: "A user has done the \"!jobu reset\" command, which is when your memory is reset to just the first system message. Any quippy remarks you'd like to add to the default \"{memory reset}\" message?"});
		  chatHistory.push({role: "assistant", content: "Jobu: Ah, the old \"!jobu reset\" command, a classic way to wipe the slate clean and plunge us back into the beautiful chaos of the unknown. Well, my friend, with a flick of my multiversal wrist and a hearty chuckle, I present to you..."});
		  const response = await openai.createChatCompletion({
		    model: "gpt-3.5-turbo",
		    messages: [
              {role: "system", content: systemMessage}, // Load system message from file
              ...chatHistory // Spread the chat history into the messages array
		    ],
		    max_tokens: 50
		  });
		  const botMessage = response.data.choices[0].message.content;
		  client.say(target, botMessage);
		  console.log(`* Executed ${commandName} command`);
		  chatHistory = [];
	  }
	  else if (commandName.startsWith('!jobu')) {
		const userMessage = commandName.slice(5).trim(); // Remove '!chat' from the message

        // Add the current user's message to the history
        chatHistory.push({role: "user", content: userMessage});
        // Prune the chat history to fit within the token limit
        while (encode(chatHistory.map(m => m.content).join(' ')).length > 4000-encode(systemMessage)) {
          chatHistory.shift();
        }

		const response = await openai.createChatCompletion({
		  model: "gpt-3.5-turbo",
		  messages: [
            {role: "system", content: systemMessage}, // Load system message from file
            ...chatHistory // Spread the chat history into the messages array
		  ],
		  max_tokens: 96
		});
		const botMessage = response.data.choices[0].message.content;
		chatHistory.push({role: "assistant", content: botMessage}); // Add bot's message to the history

        // Prune the chat history again to fit within the token limit
        while (encode(chatHistory.map(m => m.content).join(' ')).length > 4000-encode(systemMessage)) {
          chatHistory.shift();
        }

		client.say(target, botMessage);
		console.log(`* Executed ${commandName} command`);
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