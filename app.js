const { App, ExpressReceiver } = require('@slack/bolt');
const serverlessExpress = require('@vendia/serverless-express')

const expressReceiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  processBeforeResponse: true
});

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: expressReceiver
});

app.event('message', async ({ event, client }) => {
  if (event.channel_type !== 'channel') {
    return;
  }

  if (!!event.bot_id) {
    return;
  }

  if (!!event.thread_ts) {
    return;
  }

  if (!!event.subtype && event.subtype !== 'file_share') {
    return;
  }

  let result_1;
  try {
    result_1 = await client.conversations.info({
      channel: event.channel,
      include_locale: false
    });
  } catch (error) {
    console.log(error);

    throw new Error('Failed get conversations information.');
  }

  if (result_1.channel.name.indexOf('times-') !== 0) {
    return;
  }

  let result_2;
  try {
    result_2 = await client.chat.getPermalink({
      channel: event.channel,
      message_ts: event.ts
    });
  } catch (error) {
    console.log(error);

    throw new Error('Failed getting a message permalink.');
  }

  try {
    await client.chat.postMessage({
      channel: process.env.CHANNEL_TO_NOTIFY,
      text: result_2.permalink,
      unfurl_links: true,
      unfurl_media: true
    });
  } catch (error) {
    console.log(error);

    throw new Error('Failed posting a message.')
  }
});

module.exports.handler = serverlessExpress({
  app: expressReceiver.app
});