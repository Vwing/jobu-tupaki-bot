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

const systemMessage = fs.readFileSync('jobu-system-message.txt', 'utf8');

let chatHistory = [];

function createBot(token) {
	const opts = {
	  identity: {
		username: 'jobutupakibot',
		password: `oauth:${token}`
	  },
	  channels: [
		'mochitupaki'
	  ]
	};

	const client = new tmi.client(opts);

	client.on('message', onMessageHandler);
	client.on('connected', onConnectedHandler);

	client.connect().catch((error) => {
		console.error(error);
	});

	async function onMessageHandler (target, context, msg, self) {
	  if (self) { return; } // Ignore messages from the bot

	  const commandName = msg.trim();

	  if (commandName == '!jobu reset'){
		  resetChat();
	  }
	  else if (commandName.startsWith('!jobu')) {
		await handleChat(target, commandName.slice(5).trim());
	  }
	}

	function onConnectedHandler (addr, port) {
	  console.log(`* Connected to ${addr}:${port}`);
	}

	async function resetChat() {
		chatHistory = [];
		chatHistory.push({role: "system", content: "A user has done the \"!jobu reset\" command, which is when your memory is reset to just the first system message. Any quippy remarks you'd like to add to the default \"{memory reset}\" message?"});
		chatHistory.push({role: "assistant", content: "Jobu: Ah, the old \"!jobu reset\" command, a classic way to wipe the slate clean and plunge us back into the beautiful chaos of the unknown. Well, my friend, with a flick of my multiversal wrist and a hearty chuckle, I present to you..."});

		const botMessage = await fetchChatBotResponse(50);
		client.say(target, botMessage);
		console.log(`* Executed !jobu reset command`);

		chatHistory = [];
	}

	async function handleChat(target, userMessage) {
		chatHistory.push({role: "user", content: userMessage});

		pruneChatHistory();

		const botMessage = await fetchChatBotResponse(96);
		client.say(target, botMessage);

		console.log(`* Executed !jobu command`);

		chatHistory.push({role: "assistant", content: botMessage});

		pruneChatHistory();
	}

	function pruneChatHistory() {
		while (encode(chatHistory.map(m => m.content).join(' ')).length > 4000-encode(systemMessage)) {
		  chatHistory.shift();
		}
	}

	async function fetchChatBotResponse(maxTokens) {
		const response = await openai.createChatCompletion({
		  model: "gpt-3.5-turbo",
		  messages: [
		    {role: "system", content: systemMessage}, // Load system message from file
		    ...chatHistory // Spread the chat history into the messages array
		  ],
		  max_tokens: maxTokens
		});

		return response.data.choices[0].message.content;
	}
}

createBot(oauthToken);
