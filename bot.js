const TelegramBot = require('node-telegram-bot-api');

// BotFather'dan olingan token
const token = '8803575820:AAHt_orQL6XjqPJDJ_0bL6JSxMNtgXNtgYY'; 
const bot = new TelegramBot(token, { polling: true });

// Mavzular va testlar ombori
const tests = {
    'Matematika': [
        { question: '5 + 7 nechaga teng?', options: ['10', '12', '14'], correct: '12' },
        { question: '9 * 9 nechaga teng?', options: ['81', '72', '90'], correct: '81' }
    ],
    'Informatika': [
        { question: 'JavaScriptda o\'zgaruvchi qanday e\'lon qilinadi?', options: ['let', 'dim', 'val'], correct: 'let' }
    ]
};

// Foydalanuvchilar sessiyalarini saqlash
const userSessions = {};

// /start buyrug'i
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userSessions[chatId] = { topic: null, index: 0, score: 0 };

    const topics = Object.keys(tests).map(t => [{ text: t }]);
    bot.sendMessage(chatId, "Xush kelibsiz! Test topshirmoqchi bo'lgan mavzuni tanlang:", {
        reply_markup: { 
            keyboard: topics, 
            resize_keyboard: true, 
            one_time_keyboard: true 
        }
    });
});

// Mavzu tanlanganida
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (tests[text]) {
        userSessions[chatId] = { topic: text, index: 0, score: 0 };
        sendQuestion(chatId);
    }
});

// Savollarni yuborish funksiyasi
function sendQuestion(chatId) {
    const session = userSessions[chatId];
    if (!session || !session.topic) return;

    const currentQuestions = tests[session.topic];
    const currentTest = currentQuestions[session.index];

    if (currentTest) {
        const buttons = currentTest.options.map(opt => [{ text: opt, callback_data: opt }]);
        
        bot.sendMessage(
            chatId, 
            `<b>${session.topic}</b> (${session.index + 1}/${currentQuestions.length}-savol)\n\n${currentTest.question}`, 
            {
                parse_mode: 'HTML',
                reply_markup: { inline_keyboard: buttons }
            }
        );
    } else {
        bot.sendMessage(
            chatId, 
            ` Test yakunlandi!\n\nMavzu: ${session.topic}\nNatijangiz: ${session.score}/${currentQuestions.length} ta to'g'ri javob.`
        );
        delete userSessions[chatId];
    }
}

// Inline tugmalar bosilganda javobni tekshirish
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const session = userSessions[chatId];

    if (!session || !session.topic) {
        bot.answerCallbackQuery(query.id, { text: "Sessiya eskirgan. Qaytadan /start bosing." });
        return;
    }

    const currentTest = tests[session.topic][session.index];

    if (query.data === currentTest.correct) {
        session.score++;
        await bot.answerCallbackQuery(query.id, { text: " To'g'ri!" });
    } else {
        await bot.answerCallbackQuery(query.id, { text: ` Noto'g'ri! To'g'ri javob: ${currentTest.correct}` });
    }

    session.index++;
    
    // Eski xabardagi tugmalarni o'chirib tashlash
    try {
        await bot.deleteMessage(chatId, query.message.message_id);
    } catch (e) {
        // Xabar o'chirishda xatolik bo'lsa e'tiborsiz qoldirish
    }

    sendQuestion(chatId);
});
