const execSync = require('child_process').execSync;

const { token, CURRENT_CHANNEL, userId } = require('./config.js');

const Discord = require("discord.js");
const client = new Discord.Client();

class Notifications {
    constructor(timeout = 10) {
        // Stores moment to moment notifs
        this.oldNotifs = [];
        this.curNotifs = [];
        this.timeout = timeout; // Time between checking for notifications
        this.timer = setInterval(() => this.loop(), timeout * 1000);
    }
    getCur() {
        this.curNotifs.forEach(notif => this.oldNotifs.push(notif));
        const toSend = this.curNotifs;
        this.curNotifs = [];
        return toSend;
    }
    add(notifs) {
        // Filter null notifs
        let oldNotifIds = this.oldNotifs.map(notif => (notif.id) ? notif.id : "-1");
        let curNotifs = [];
        notifs.forEach(notif => {
            if (!oldNotifIds.includes(notif.id)) {
                curNotifs.push(notif);
            }
        })

        // Add (and keep) new notifs
        this.curNotifs = curNotifs;
    }
    loop() {
        const allNotifs = this.check();
        this.add(allNotifs);
        const cur = this.getCur();
        cur.forEach(notif => {
            sendMsg(notif.text, CURRENT_CHANNEL);
        });
    }
    check() {
        const output = execSync('adb shell dumpsys notification', { encoding: 'utf-8' });
        const lines = output.split("\n");

        let start = false;
        let notifs = [];
        let curDetails = {};
        for (let i=0; i<lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes("NotificationRecord")) {
                if (!start) start = true;

                if (Object.keys(curDetails).length != 0) {
                    if (curDetails.text != "null") {
                        notifs.push(curDetails);
                    }
                    curDetails = {};
                }

                const id = line.substring(19, 28);
                if (line.includes("com.star.union.planetant")) {
                    curDetails["id"] = id;
                }
            } else if (line == "" && start) {
                // First line after the first 'NotificationRecord' means we've finished
                if (curDetails.text != "null") {
                    notifs.push(curDetails);
                }
                curDetails = {};
                break;
            } else {
                if (line.includes("tickerText") && start) {
                    let notifText = line.split("=")[1];
                    if (notifText == "null") {
                        curDetails["text"] = notifText; // notifText;
                    } else {
                        curDetails["text"] = notifText.substring(5); // Format: tickerText=<br/>content goes here...
                    }
                }
            }
        }
        notifs = notifs.filter(notif => Object.keys(notif).length != 0);
        return notifs;
    }
}

let notifs = new Notifications(timeout=2);

const sendMsg = (msg, channelId) => {
    let fmtMsg = `<@${userId}> ${msg}`;
    //var offTopic = bot.channels.cache.get('448400100591403024'); //.get('448392061415325697');
    //client.channels.fetch(channelId)
    //    .then(channel => channel.send(`<@miscguy#4900> ${msg}`));
    let channel = client.channels.cache.get(channelId);
    //console.log(channel);
    //if (channel === undefined) {
        channel = client.channels.fetch(channelId)
            .then(channel => {
                channel.send(fmtMsg)
            });
    //}
    //try { channel.send('hi'); } catch {}

    //const channel = channel.messages.cache.get(channelId);
    //channel.send('hi');

    //const channel = client.channels.cache.find(ch => ch.name === 'general');
    //console.log('CHANNEL:', channel)
    //channel.send('hi');
}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`)
})

client.login(token);