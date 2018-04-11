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
     */
    chris: {
        /* 
         * This user's name will be updated when they log in, based on `coldTurkeyDate` below.
         * 
         * Check out "Developer Mode" in Discord's "Appearance" settings—it adds an option
         * to the context menu to copy various objects' IDs.
         */
        id: '',
        /*
         * This is the date on which Chris quit playing WoW cold turkey. Their username gets updated
         * to be an AA-style chip indicating how long it's been. Sorry if that's problematic.
         */
        coldTurkeyDate: '2018-02-26',
        /*
         * This gets passed to moment.js to parse coldTurkeyDate.
         * https://momentjs.com/docs/#/parsing/string-format/
         */
        coldTurkeyDateFormat: 'YYYY-MM-DD', 
        /*
         * This audio file is played when Chris joins a voice channel.
         */
        welcomeClip: './assets/welcome_chris.mp3',
    },

    /*
     * The... other target.
     */
    mitch: {
        id: '',
        welcomeClip: './assets/welcome_mitch.mp3',
    },

    /*
     * The... other other target.
     */
    chase: {
        id: '',
        welcomeClip: './assets/welcome_chase.mp3',
    },

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
