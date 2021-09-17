const Discord = require('discord.js');
const { GuildChannel } = require('../../models');
const { errLog } = require('../../Functions/erroHandling');

module.exports = {
    name: 'user-log',
    aliases: ["userlog",],

    run: async(client, message, args,prefix) =>{

        if(!message.member.permissions.has("ADMINISTRATOR")){
            return message.author.send('None of your role proccess to use this command')
        }

        const Data = await GuildChannel.findOne({
            guildID: message.guild.id,
            Active: true
        })

        const fetchedData = message.guild.channels.cache.find(c=>c.id === Data.UserLog.UserChannel);

        if(!args.length){
            const expectedArgs = new Discord.MessageEmbed()
                .setAuthor(`${message.author.tag}`, message.author.displayAvatarURL({dynamic: true, size: 1024, type: "png"}))
                .setDescription(`User-log Channel - ${fetchedData ? fetchedData : 'NONE'}
                    **Usage:** \`${prefix}user-log [ enable | disable ] [ Channel ]\``)
                .setColor("#fffafa")
                
            return await message.channel.send({embeds: [expectedArgs]}).then(m=>setTimeout(() => m.delete(), 1000 * 10));
        };

        const { content, guild } = message;
        const option = args[0];

        const Tutorial = new Discord.MessageEmbed()
            .setAuthor(`Command - User-Log`)
            .addField("Usage", `${prefix}user-log [ enable | disable ] [ channel ] \n${prefix}user-log enable #user \n${prefix}user-log disable`)
            .setColor("#fffafa")

        switch(option){
            case "enable":
                async function Database ( value, bool){     
                    try {
                        await GuildChannel.findOneAndUpdate({
                            guildID: message.guild.id,
                            Active: true
                        },{
                            guildName: message.guild.name,
                            UserLog: {
                                UserChannel: value,
                                UserEnabled: bool,
                            }
                        },{
                            upsert: true,
                        })
                    } catch (err) {
                        errLog(err.stack.toString(), "text", "User-log", "Error in Database function");
                    };  
                }

                const valueOfChannel = args[1];
                if(!valueOfChannel){
                    Tutorial.setDescription("Please mention a channel.")
                    try {
                        return message.channel.send({embeds: [Tutorial]}).then(m=>setTimeout(() => m.delete(), 1000 * 10));
                    } catch (err){
                        errLog(err.stack.toString(), "text", "User-log", "Error in ValueOfChannel");
                    }
                }
                const logChan = guild.channels.cache.find(c => c.id == valueOfChannel.replace( '<#' , '' ).replace( '>' , '' )) || 
                    guild.channels.cache.find(r => r.name.toLowerCase() == valueOfChannel.toLowerCase()) || 
                    guild.channels.cache.find(c => c.id == valueOfChannel);

                if(!logChan){
                    Tutorial.setDescription(`Could't find any channel by the name ${valueOfChannel}`)
                    try {
                        return message.channel.send({embeds: [Tutorial]}).then(m=>setTimeout(() => m.delete(), 1000 * 10));
                    } catch (err) {
                        errLog(err.stack.toString(), "text", "User-log", "Error in !logchan");
                    }
                }else if(logChan){
                    try {
                        Database(logChan, true)
    
                        const enabledEmbed = new Discord.MessageEmbed()
                            .setAuthor(`${client.user.username} - User Log`)
                            .setDescription(`User Log channel updated to ${logChan}`)
                            .setColor("#fffafa")
                            .setTimestamp()
                        await message.channel.send({embeds: [enabledEmbed]})
                    } catch (err){
                        errLog(err.stack.toString(), "text", "User-log", "Error in setting up value");
                    }
                }
            break;

            case "disable":
                try {
                    Database(null, false)
                    const disabledEmbed = new Discord.MessageEmbed()
                        .setAuthor(`${client.user.username} - User-Log`)
                        .setDescription(`User Log channel has been disabled`)
                        .setColor("#fffafa")
                        .setTimestamp()
                    await message.channel.send({embeds: [disabledEmbed]})
                }catch(err){
                    errLog(err.stack.toString(), "text", "User-log", "Error in diable value");
                }
            break;

            default: 
                Tutorial.setDescription("Which option you would like to change [ enable | disable ]")
                return message.channel.send({embeds: [Tutorial]}).then(m=>setTimeout(() => m.delete(), 1000 * 10))
        }
    }
}