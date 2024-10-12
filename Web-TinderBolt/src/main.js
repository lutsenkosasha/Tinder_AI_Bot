const {HtmlTelegramBot, userInfoToString} = require("./bot");
const ChatGptService = require("./gpt");

class MyTelegramBot extends HtmlTelegramBot {
    constructor(token) {
        super(token);
        this.mode = null;
        this.list = [];
        this.user = {};
        this.count = 0;
    }

    async start(message) {
        this.mode = "main"
        const text = this.loadMessage("main")
        await this.sendImage("main")
        await this.sendText(text)

        // add menu
        await this.showMainMenu({
            "start": "главное меню бота",
            "profile": "генерация Tinder-профиля 😎",
            "opener": "сообщение для знакомства 🥰",
            "message": "переписка от вашего имени 😈",
            "date": "переписка со звездами 🔥",
            "gpt": "задать вопрос чату GPT 🧠",
            "html": "демонстрация HTML"
        })
    }

    async html(message) {
        await this.sendHTML('<h3 style="color: #1558b0">Привет!</h3>')
        const html = this.loadHtml("main")
        await this.sendHTML(html, {theme: "dark"});
    }

    async gpt(message) {
        this.mode = "gpt"
        const text = this.loadMessage("gpt")
        await this.sendImage("gpt")
        await this.sendText(text)
    }

    async gptDialog(message) {
        const text = message.text
        const myMessage = await this.sendText("Ваше сообщение было переслано ChatGPT. Ожидайте...")
        const answer = await chatgpt.sendQuestion("Ответь на вопрос", text)
        await this.editText(myMessage, answer)
    }

    async date(message) {
        this.mode = "date"
        const text = this.loadMessage("date")
        await this.sendImage("date")
        await this.sendTextButtons(text, {
            "date_grande":"Ариана Гранде",
            "date_robbie":"Марго Робби",
            "date_zendaya":"Зендея",
            "date_gosling":"Райан Гослинг",
            "date_hardy":"Том Харди"
        })
    }

    async dateButton(callbackQuery) {
        const query = callbackQuery.data;
        await this.sendImage(query)
        await this.sendText("Отличный выбор! Пригласи девушку/парня на свидание за 5 сообщений: ")
        const prompt = this.loadPrompt(query)
        chatgpt.setPrompt(prompt);
    }

    async dateDialog(message) {
        const text = message.text
        const myMessage = await this.sendText("Девушка набирает текст...")
        const answer = await chatgpt.addMessage(text)
        //await this.sendText(answer)
        await this.editText(myMessage, answer)
    }

    async message(message) {
        this.mode = "message"
        const text = this.loadMessage("message")
        await this.sendImage("message")
        await this.sendTextButtons(text, {
            "message_next":"Продолжить переписку",
            "message_date":"Пригласить на свидание"
        })
        this.list = []
    }

    async messageButton(callbackQuery) {
        const query = callbackQuery.data;
        const prompt = this.loadPrompt(query)
        const userChatHistory = this.list.join("\n\n");

        const myMessage = await this.sendText("ChatGPT думает над вариантами ответа...")
        const answer = await chatgpt.sendQuestion(prompt, userChatHistory) // too long
        await this.editText(myMessage, answer)
    }

    async messageDialog(message) {
        const text = message.text
        this.list.push(text)
    }

    async profile(message) {
        this.mode ="profile"
        const text = this.loadMessage("profile")
        await this.sendImage("profile")
        await this.sendText(text)

        this.user = {}
        this.count = 0;
        await this.sendText("Сколько вам лет?")
    }

    async profileDialog(message) {
        const text = message.text
        this.count++
        if (this.count === 1) {
            this.user["age"] = text;
            await this.sendText("Кем вы работаете?")
        }
        if (this.count === 2) {
            this.user["occupation"] = text;
            await this.sendText("У вас есть хобби?")
        }
        if (this.count === 3) {
            this.user["hobby"] = text;
            await this.sendText("Что вам НЕ нравится в людях?")
        }
        if (this.count === 4) {
            this.user["annoys"] = text;
            await this.sendText("Цели знакомства?")
        }
        if (this.count === 5) {
            this.user["goals"] = text;

            //gpt
            const prompt = this.loadPrompt("profile")
            const info = userInfoToString(this.user);

            const myMessage = await this.sendText("ChatGPT генерирует ваш профиль...")
            const answer = await chatgpt.sendQuestion(prompt, info);
            await this.editText(myMessage, answer)
        }
    }

    async opener(message) {
        this.mode = "opener"
        const text = this.loadMessage("opener")
        await this.sendImage("opener")
        await this.sendText(text)

        this.user = {}
        this.count = 0;
        await this.sendText("Имя девушки?")
    }

    async openerDialog(message) {
        const text = message.text
        this.count++
        if (this.count === 1) {
            this.user["name"] = text;
            await this.sendText("Сколько ей лет?")
        }
        if (this.count === 2) {
            this.user["age"] = text;
            await this.sendText("Оцените ее внешность: 1-10 баллов?")
        }
        if (this.count === 3) {
            this.user["handsome"] = text;
            await this.sendText("Кем она работает?")
        }
        if (this.count === 4) {
            this.user["occupation"] = text;
            await this.sendText("Цель знакомства?")
        }
        if (this.count === 5) {
            this.user["goals"] = text;

            //gpt
            const prompt = this.loadPrompt("opener")
            const info = userInfoToString(this.user);

            const myMessage = await this.sendText("ChatGPT генерирует ваш оупенер...")
            const answer = await chatgpt.sendQuestion(prompt, info);
            await this.editText(myMessage, answer)
        }
    }


    async hello(message) {
        if (this.mode === "gpt")
            await this.gptDialog(message);
        else if (this.mode === "date")
            await this.dateDialog(message)
        else if (this.mode === "message")
            await this.messageDialog(message)
        else if (this.mode === "profile")
            await this.profileDialog(message)
        else if (this.mode === "opener")
            await this.openerDialog(message)
        else {
            const text = message.text;
            await this.sendText("<b>Привет!</b>");
            await this.sendText("<i>Как дела?</i>");
            await this.sendText(`Вы писали: ${text}`);

            await this.sendImage("avatar_main");

            await this.sendTextButtons("Какая у вас тема в Телеграм?", {
                "theme_light": "Светлая",
                "theme_dark": "Темная",
            })
        }
    }

    async helloButton (callbackQuery) {
        const query = callbackQuery.data;
        if (query === "theme_light")
            await this.sendText("У вас светлая тема")
        else if (query === "theme_dark")
            await this.sendText("У вас темная тема")
    }

}

const chatgpt = new ChatGptService("gpt:AI6Jk5emA0osUkc2nivglWTowjq5GNCo2bpddaqxeEU8Jc4C4Zde0k5yHYJFkblB3TZ4vjiZ2EYkjx9hF0XMim3ZuBv5PzgpjMDJRq1trkAElmp9iUdQKCs0HqDc")
const bot = new MyTelegramBot("8070630027:AAH-muD3qmVvyNsZSJy3AEyNEJ6Mnd6OadQ");

bot.onCommand(/\/start/, bot.start) // /start
bot.onCommand(/\/html/, bot.html) // /html
bot.onCommand(/\/gpt/, bot.gpt) // /gpt
bot.onCommand(/\/date/, bot.date) // /date
bot.onCommand(/\/message/, bot.message) // /message
bot.onCommand(/\/profile/, bot.profile) // /profile
bot.onCommand(/\/opener/, bot.opener) // /opener

bot.onTextMessage(bot.hello);
bot.onButtonCallback( /^date_.*/ , bot.dateButton)
bot.onButtonCallback( /^message_.*/ , bot.messageButton)
bot.onButtonCallback( /^.*/ , bot.helloButton) // ^ - начало строки, . - любой символ, * - любое кол-во символов