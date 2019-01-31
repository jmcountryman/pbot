const assert = require('assert');
const mongodb = require('mongodb');

let collection;
let fs;

const url = 'mongodb://mongo:27017';
const configDbName = process.env.CONFIG_DB || 'pbot_development';
const introSoundCollection = 'pbot_intro_sounds';

const client = new mongodb.MongoClient(url);

client.connect((err) =>
{
    assert.ifError(err);

    const db = client.db(configDbName);
    collection = db.collection(introSoundCollection);
    fs = new mongodb.GridFSBucket(db);
});

module.exports.getSoundList = function getSoundList(guildId, userId)
{
    if (fs)
    {
        return collection.find({
            guild_id: guildId,
            target_user: userId,
            enabled: true,
        }).toArray();
    }

    return null;
};

module.exports.getSound = function getSound(soundId)
{
    if (fs)
    {
        return fs.openDownloadStream(mongodb.ObjectId(soundId));
    }

    return null;
};
