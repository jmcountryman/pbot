const {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    getVoiceConnection,
    NoSubscriberBehavior,
    VoiceConnectionStatus
} = require('@discordjs/voice');

// Resolves as `true` if the audio was played (which applies the cooldown), or `false` otherwise
const handler = audioFilePath => interaction => new Promise((resolve) =>
{
    // deferReply is required for some reason, otherwise the audio doesn't play
    interaction.deferReply({ ephemeral: true }).then(() =>
    {
        interaction.member.fetch(true).then((member) =>
        {
            const voiceChannelId = member.voice.channelId;

            if (!voiceChannelId)
            {
                interaction.editReply({
                    content: 'You have to be in a voice channel to use this command!',
                    ephemeral: true
                });

                resolve(false);
            }
            else
            {
                // Discord only lets us be in one voice channel per guild, so handle that gracefully
                const existingConnection = getVoiceConnection(interaction.guild.id);
                if (existingConnection)
                {
                    interaction.guild.channels.fetch(existingConnection.joinConfig.channelId)
                        .then(playingInChannel => interaction.editReply({
                            content: `I'm already playing audio in ${playingInChannel.name}, try again in a couple seconds.`,
                            ephemeral: true
                        }))
                        .catch((e) =>
                        {
                            console.log(`Error fetching channel ${existingConnection.joinConfig.channelId}`);
                            console.log(e);

                            interaction.editReply({
                                content: 'I can only play audio in one channel at a time, try again in a couple seconds.',
                                ephemeral: true
                            });
                        });

                    resolve(false);
                }
                else
                {
                    let connection;

                    // Set up the audio player
                    const player = createAudioPlayer({ behaviors: [NoSubscriberBehavior.Pause] });
                    player.play(createAudioResource(audioFilePath));

                    player.on(AudioPlayerStatus.Playing, () =>
                    {
                        interaction.editReply({
                            content: '🔊',
                            ephemeral: true
                        });

                        resolve(true);
                    });

                    // If the player transitioned from Playing to Idle, it finished playing, so clean up
                    player.on(AudioPlayerStatus.Idle, () =>
                    {
                        player.stop();
                        connection.destroy();
                        console.log('Voice connection cleaned up');
                    });

                    console.log(`Joining voice channel ${voiceChannelId} in guild ${interaction.guild.id}`);

                    // Join the voice channel
                    connection = joinVoiceChannel({
                        guildId: interaction.guild.id,
                        channelId: voiceChannelId,
                        adapterCreator: interaction.guild.voiceAdapterCreator,
                        selfMute: false
                    });

                    // When we're connected to the voice channel, play the audio
                    connection.on(VoiceConnectionStatus.Ready, () =>
                    {
                        console.log(`Voice connection ready, playing ${audioFilePath}`);
                        connection.subscribe(player);
                        player.unpause();
                    });

                    // Clean up if an error occurs
                    connection.on(VoiceConnectionStatus.Disconnected, () =>
                    {
                        console.log('Disconnected');
                        player.stop();
                        connection.destroy();
                        resolve(false);
                    });
                }
            }
        });
    });
});

module.exports = handler;
