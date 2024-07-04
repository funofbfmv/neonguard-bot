const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');

const bot = new Telegraf('');

// Логирование ошибок в файл
const logStream = fs.createWriteStream(path.join(__dirname, 'logs.txt'), { flags: 'a' });

// Константы для тарифов с описанием
const tariffs = [
    { 
        name: '📱Тринити \n', 
        price: { usd: 5, rub: 400 }, 
        description: 'Для большинства пользователей, скорость до 500 Мбит/с, базовые серверы.',
        image: path.join(__dirname, 'assets', 'triniti.jpg'), 
        emoji: '🛜'  
    },
    { 
        name: '🔒Морфиус \n', 
        price: { usd: 9, rub: 720 }, 
        description: 'Подойдет геймерам, скорость от 500 Мбит/с, улучшенные серверы.',
        image: path.join(__dirname, 'assets', 'morpheus.jpg'), 
        emoji: '🛜' 
    },
    { 
        name: '💊Нео \n', 
        price: { usd: 13, rub: 1040 }, 
        description: 'Для максимальных возможностей, скорость до 800 Мбит/с, все серверы и протоколы (TCP/UDP), выбор страны.',
        image: path.join(__dirname, 'assets', 'neo.jpg'), 
        emoji: '🛜' 
    }
];

// Запуск бота
bot.launch()
    .then(() => console.log('Бот запущен'))
    .catch(err => {
        console.error('Ошибка запуска бота: ', err);
        logStream.write(`${new Date().toISOString()} - Ошибка запуска бота: ${err}\n`);
    });

// Обработчик команды /start
bot.start((ctx) => {
    const keyboard = Markup.inlineKeyboard([
        Markup.button.callback('Тарифы', 'show_tariffs'),
        Markup.button.callback('Поддержка', 'contact_admin')
    ]);
    return ctx.reply(
    `👋 Добро пожаловать в сервис VPN услуг NeonGuard!\n
🚀 Мы предоставляем высокоскоростные OpenVPN сервера, для обеспечения вашей конфиденциальности и безопасности в интернете, так же мы имеем быстрые сервера для геймеров.\n
Пожалуйста выберите действие:`,
        keyboard
    );
});

// Обработчик команды /tariffs
bot.command('tariffs', (ctx) => {
    const tariffInfo = tariffs.map(tariff => 
        `${tariff.emoji} Тариф: ${tariff.name}\nЦена: ${tariff.price.usd} USD / ${tariff.price.rub} RUB / месяц\nОписание: ${tariff.description}\n`).join('\n');
    const keyboard = Markup.inlineKeyboard(
        tariffs.map(tariff => Markup.button.callback(tariff.name, `tariff_${tariff.name}`))
    );
    ctx.reply(`Тарифы на VPN от NeonGuard:\n\n${tariffInfo}`, keyboard);
});

// Обработчик команды /contacts
bot.command('contacts', (ctx) => {
    const contactInfo = `
Связь с админом:
- Telegram: @neonguard_vpn
`;
    ctx.reply(contactInfo);
});

// Обработчик команды /about
bot.command('about', (ctx) => {
    const aboutInfo = `
Информация о нас:
- WebSite: neonguard.tech

`;
    ctx.reply(aboutInfo);
});

// Обработчик команды /soft
bot.command('soft', (ctx) => {
    const softInfo = `
Ссылки на скачивание OpenVPN софта:

- 📱 [iPhone](https://apps.apple.com/app/id590379981)
- 🤖 [Android](https://play.google.com/store/apps/details?id=net.openvpn.openvpn)
- 💻 [Windows](https://openvpn.net/client-connect-vpn-for-windows/)
- 🍏 [Mac](https://openvpn.net/client-connect-vpn-for-mac-os/)
- 🐧 [Linux](https://openvpn.net/community-downloads/)
    `;
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.url('📱 iPhone', 'https://apps.apple.com/app/id590379981')],
        [Markup.button.url('🤖 Android', 'https://play.google.com/store/apps/details?id=net.openvpn.openvpn')],
        [Markup.button.url('💻 Windows', 'https://openvpn.net/client-connect-vpn-for-windows/')],
        [Markup.button.url('🍏 Mac', 'https://openvpn.net/client-connect-vpn-for-mac-os/')],
        [Markup.button.url('🐧 Linux', 'https://openvpn.net/community-downloads/')]
    ]);
    ctx.replyWithMarkdown(softInfo, keyboard);
});

// Обработчик действия "Показать тарифы"
bot.action('show_tariffs', (ctx) => {
    const tariffInfo = tariffs.map(tariff => 
        `${tariff.emoji} Тариф: ${tariff.name}\nЦена: ${tariff.price.usd} USD / ${tariff.price.rub} RUB / месяц\nОписание: ${tariff.description}\n`).join('\n');
    const keyboard = Markup.inlineKeyboard(
        tariffs.map(tariff => Markup.button.callback(tariff.name, `tariff_${tariff.name}`))
    );
    ctx.editMessageText(`Тарифы на VPN услуги:\n\n${tariffInfo}`, keyboard);
});

// Обработчик действия "Связь с админом"
bot.action('contact_admin', (ctx) => {
    const contactInfo = `
Связь с админом:
- Telegram: @neonguard_vpn
`;
    ctx.editMessageText(contactInfo);
});

// Обработчики выбора тарифа
tariffs.forEach(tariff => {
    bot.action(`tariff_${tariff.name}`, async (ctx) => {
        const userId = ctx.from.id;
        const username = ctx.from.username || 'unknown';
        const paymentId = `${userId}-${Date.now()}`; // Генерация уникального идентификатора платежа

        await ctx.answerCbQuery(`Вы выбрали тариф ${tariff.name}`);
        await ctx.replyWithPhoto({ source: tariff.image }, {
            caption: `${tariff.emoji} Тариф ${tariff.name}\nЦена: ${tariff.price.usd} USD / ${tariff.price.rub} RUB в месяц\nОписание: ${tariff.description}`
        });

        const paymentKeyboard = Markup.inlineKeyboard([
            Markup.button.callback('₿ Binance Pay', `payment_crypto_${tariff.name}_${paymentId}`),
            Markup.button.callback('💳Юmoney', `payment_service_${tariff.name}_${paymentId}`),
            Markup.button.callback('💎 USDT', `payment_usdt_${tariff.name}_${paymentId}`)
        ]);

        await ctx.reply(`Выберите метод оплаты для тарифа ${tariff.name}`, paymentKeyboard);

        // Логирование выбора тарифа
        logStream.write(`${new Date().toISOString()} - User ${userId} (username: ${username}) выбрал тариф ${tariff.name}\n`);
    });

    // Обработчики выбора метода оплаты
    bot.action(new RegExp(`payment_crypto_${tariff.name}_(.+)`), async (ctx) => {
        const match = ctx.match[1];
        const paymentId = match;

        await ctx.answerCbQuery(`Вы выбрали оплату через Binance Pay для тарифа ${tariff.name}`);
        await ctx.reply(`Оплатите ${tariff.price.usd} USDT по следующему QR-коду через Binance Pay:`);
        const qrCodePath = path.join(__dirname, 'assets', 'binance_qr_code.jpg');
        await ctx.replyWithPhoto({ source: qrCodePath });
        await ctx.reply(`После произведения оплаты, пожалуйста свяжитесь с администратором @neonguard_vpn и покажите скриншот с чеком.`);

        // Сохраняем данные о платеже
        logStream.write(`${new Date().toISOString()} - User ${ctx.from.id} (username: ${ctx.from.username || 'unknown'}) выбрал криптовалюту для тарифа ${tariff.name} с paymentId ${paymentId}\n`);
    });

    // Обработчик действия выбора ЮMoney для оплаты
    bot.action(new RegExp(`payment_service_${tariff.name}_(.+)`), async (ctx) => {
        const match = ctx.match[1];
        const paymentId = match;

        await ctx.answerCbQuery(`Вы выбрали платежный сервис Юmoney для тарифа ${tariff.name}`);

        // Ссылка на оплату через ЮMoney
        const yoomoneyPaymentLink = 'https://yoomoney.ru/to/410017430555677';

        // Создаем разметку для кнопки "Открыть ЮMoney" как мини-приложение
        const keyboard = Markup.inlineKeyboard([
            Markup.button.url('Открыть ЮMoney', yoomoneyPaymentLink)
        ]);

        await ctx.reply(`Оплатите ${tariff.price.rub} RUB по ссылке: ${yoomoneyPaymentLink}`, keyboard);
        await ctx.reply(`После произведения оплаты, пожалуйста свяжитесь с администратором @neonguard_vpn и покажите скриншот с чеком.`);
        
        // Логирование выбора метода оплаты
        logStream.write(`${new Date().toISOString()} - User ${ctx.from.id} (username: ${ctx.from.username || 'unknown'}) выбрал платежный сервис для тарифа ${tariff.name} с paymentId ${paymentId}\n`);
    });

    bot.action(new RegExp(`payment_usdt_${tariff.name}_(.+)`), async (ctx) => {
        const match = ctx.match[1];
        const paymentId = match;
    
        await ctx.answerCbQuery(`Вы выбрали оплату через USDT для тарифа ${tariff.name}`);
        await ctx.replyWithMarkdown(
            `Оплатите ${tariff.price.usd} USDT на следующий адрес:\n\`TZAMmgLMqDQF1QaVijqJpD2LgXmPuJzmom\`\n\nСкопируйте адрес тапнув на него \n Выберите сеть TRC-20 при отправке.`
        );
        await ctx.reply(`После произведения оплаты, пожалуйста свяжитесь с администратором @neonguard_vpn и покажите скриншот с чеком.`);
    
        // Сохраняем данные о платеже
        logStream.write(`${new Date().toISOString()} - User ${ctx.from.id} (username: ${ctx.from.username || 'unknown'}) выбрал USDT для тарифа ${tariff.name} с paymentId ${paymentId}\n`);
    });
});

// Логирование ошибок
bot.catch((err, ctx) => {
    const username = ctx.from ? (ctx.from.username || 'unknown') : 'unknown';
    const userId = ctx.from ? ctx.from.id : 'unknown';
    console.error(`Ошибка для пользователя ${ctx.updateType}`, err);
    logStream.write(`${new Date().toISOString()} - Ошибка для пользователя ${userId} (username: ${username}): ${err}\n`);
});