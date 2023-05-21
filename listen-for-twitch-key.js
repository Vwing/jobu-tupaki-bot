const express = require('express');
const app = express();
const axios = require('axios');
const qs = require('querystring');

app.get('/oauth2/callback', async (req, res) => {
    const { code } = req.query;

    try {
        const response = await axios({
            method: 'post',
            url: 'https://id.twitch.tv/oauth2/token',
            data: qs.stringify({
                client_id: 'your_client_id',
                client_secret: 'your_client_secret',
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: 'http://localhost:3000/oauth2/callback',
            }),
            headers: {
                'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
            }
        });

        const { access_token } = response.data;

        // Save the access_token for your bot to use
		console.log(access_token);

    } catch (error) {
        // Handle error
		console.log(error);
    }

    res.send('Success!');
});

app.listen(3000, () => console.log('Server listening on port 3000'));
