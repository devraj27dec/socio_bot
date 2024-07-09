require('dotenv').config()
const { Telegraf } = require('telegraf');
const User = require('./models/user.schema');
const Event = require('./models/event.schema.js');
const connectDB = require('./config/db.js');
const { message } = require('telegraf/filters');
const OpenAI = require('openai');
const { model } = require('mongoose');
const bot = new Telegraf(process.env.BOT_TOKEN)



const openai = new OpenAI({
  apiKey: process.env.OPENIAI_SECRET_KEY, // This is the default and can be omitted
});

connectDB();

bot.start(async(ctx) => {
    // console.log('ctx',ctx);

    const from = ctx.update.message.from;

    try {
        await User.findOneAndUpdate({tgId: from.id} , {
            $setOnInsert: {
                firstName: from.first_name,
                lastName: from.last_name,
                isBot: from.is_bot
            }
        }, {upsert: true , new: true});

        await ctx.reply(`Hey ${from.first_name}, Welcome. I will be writing highly engaging social medaia posts for you 🚀 Just keep feeding me with the events throught the day. Let's shine on social media ✨`)
    } catch (error) {
        console.log(error);
        await ctx.reply(`Facing dificulties ☹️`)
    }
    // console.log("from" , from);
    // store user info to db

    await ctx.reply(`welcome to social bot , It's working`)
})



bot.help((ctx)  => {
    ctx.reply(`for support contact @mighty_dev`)
})

// command

bot.command('generate' , async(ctx) => {
    const from = ctx.update.message.from;


    const {message_id: waitigMessageId} = await ctx.reply(`Hey ${from.first_name}, Kindly wait for a reason I am curating posts for you 🚀💻`)

    const {message_id: stickerWaitingId} = await ctx.replyWithSticker(
        `CAACAgIAAxkBAAMsZo0koNy03fibLYnWhWNZ85NVGFMAApAQAAJrXqhIHBpOzJ6ARZg1BA`
    )
    const startofDay = new Date();
    startofDay.setHours(0,0,0,0);

    const endofDay = new Date();
    endofDay.setHours(23,59,59,999);


    const events = await Event.find({
        tgId: from.id,
        createdAt: {
            $gt: startofDay,
            $lt: endofDay
        }
    })

    console.log("events" , events);

    if(events.length === 0) {
        await ctx.deleteMessage(stickerWaitingId)
        await ctx.deleteMessage(waitigMessageId)
        await ctx.reply("No events for the day");
        return;
    }

    try {
        const chatCompletion = await openai.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'Act as a junior Devloper , you write highly engaging posts for linkdin , facebook and twitter using provided throughts/events the day'
                },
                {
                    role: 'user',
                    conent: `Write like a human. Craft three engaging social media posts tailered for linkedIn , and twitter audience . Use single language . use given time lablesls just to understand the order of the event, don't mention the line the posts . Each post should creatively highlight the following events . Ensure the tone is conversational and imapctful . Focus on engaging the respective platform's audience , encouraging interctions , and driving interest in the events.
                    ${events?.map((event) => event.text).join(', ')}
                    `,
                },
            ],
            model: process.env.OPENAI_MODEL,
        });

        console.log("completion" , chatCompletion);

        ctx.reply('Doing things ...')

        // store token cnt

        await User.model.findOneAndUpdate({
            tgId: from.id,

        },
        {
            $inc : {
                promptToken: chatCompletion.usage.prompt_tokens,
                completionToken: chatCompletion.usage.completion_tokens
            }
        })
        await ctx.deleteMessage(stickerWaitingId)

        await ctx.deleteMessage(waitigMessageId)
        await ctx.reply(chatCompletion.choices[0].message.content)

    } catch (error) {
        console.log(error , "facing difficulities");if (error.code === 'insufficient_quota') {
            await ctx.reply(`You've exceeded your API quota. Please check your plan and billing details.`);
          } else {
            console.log(error, 'facing difficulties');
            await ctx.reply(`An error occurred. Please try again later.`);
          }
    }


})

bot.on('sticker' , (ctx) => {
    console.log('sticker ' , ctx.update.message);
} )

bot.on(message('text') , async(ctx) => {

    const from = ctx.update.message.from;
    // console.log('ctx' , ctx);


    try {
        await Event.create({
            text: message,
            tgId: from.id
        })
       
       await ctx.reply(`Note👍 , keep texting me your thoughts , To genrate the posts , just enter the command: /generate`)


    } catch (error) {
        console.log(error);
        ctx.reply("Please try again later")
    }
} )


bot.launch();

process.once('SIGINT' , () => bot.stop('SIGINT'));
process.once('SIGTERM' , () => bot.stop('SIGTERM'))