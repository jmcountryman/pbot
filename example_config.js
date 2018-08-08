const {Collection} = require('discord.js');

/*
 * An example config file. Rename this to "config.js" and fill in the empty values before running
 * this bot.
 */
module.exports = {
    /*
     * You can find this token in your application's details page, in the "Bot" section.
     * https://discordapp.com/developers/applications/me/
     */
    token: '',

    /*
     * The ID of the bot's owner. This person and the server owner can run chat commands.
     */
    owner: '',

    /*
     * The message prefix this bot will look for to determine if a message is a command.
     * E.g., "!baby" is a command, but "baby" is just a message
     */
    commandPrefix: '!',

    /*
     * The target.
     *
     * This is a Discord.js Collection object where the key is the target's ID and the value is
     * the target's configuration.
     */
    targets: new Collection([
        [
            '', // The target's ID.
            {
                /*
                 * If these two values are set, the bot will change the user's to a "chip" based on
                 * how long it's been since coldTurkeyDate. coldTurkeyDateFormat is used by
                 * moment.js to parse coldTurkeyDate.
                 */
                coldTurkeyDate: '2018-02-26',
                coldTurkeyDateFormat: 'YYYY-MM-DD',

                /*
                 * This audio file will be played when the target joins a voice channel. This can
                 * also be a list of audio files; in that case a random one will be chosen each
                 * time.
                 */
                welcomeClip: './assets/welcome_clip.mp3',

                /*
                 * If these two values are set, the guild owner or bot owner can send "!<command>"
                 * in chat and welcomeClip will be played in the message author's voice channel.
                 * commandReaction has to be the name of a custom emoji on the server.
                 *
                 * E.g., in this case, if the server owner is in the "General" voice channel and
                 * sends "!song", the bot will play assets/welcome_clip.mp3 in that channel.
                 */
                command: 'song',
                commandReaction: 'customemoji',
            },
        ],
        [
            '', // Another target's ID.
            {
                /*
                 * All values are optional.
                 */
                welcomeClip: [
                    './assets/welcome_clip2.mp3',
                    './assets/welcome_clip3.mp3',
                ],
                command: 'song2',
                commandReaction: 'customemoji2',
            },
        ],
    ]),

    /*
     * These are used to determine when the chip should change to a different unit. You probably
     * don't need to change these.
     */
    units: {
        days: {max: 6},
        weeks: {max: 3},
        months: {max: 11},
        years: {max: 100},
    },
};
