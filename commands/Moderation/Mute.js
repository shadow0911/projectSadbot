const Discord = require('discord.js');
const ms = require('ms');
const { LogsDatabase } = require('../../models');
const { Member, LogManager } = require('../../Functions');
const { saveData, sendLogData, ModStatus } = require('../../Functions/functions');

module.exports = {
    name: 'mute',
    description: "Mute a member to prevent them from texting/speaking",
    permissions: ["MANAGE_MESSAGES"],
    botPermission: ["MANAGE_ROLES", "MANAGE_CHANNELS", "SEND_MESSAGES", "EMBED_LINKS"],
    usage: "mute [ member ] [ duraion ] [ reason ]",
    category: "Moderation",
    delete: true,
    cooldown: 1000,
    run: async(client, message, args, prefix) =>{
        const { author, content, guild, channel } = message;

        if(!args.length){
            return message.channel.send( {embeds: [
                new Discord.MessageEmbed()
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({type: 'png', dynamic: false}))
                    .setDescription( `<:error:921057346891939840> Please mention a member \n\n**Usage**: \`${prefix}mute [ Member ] [ duration ] [ reason ]\`` )
                    .setColor( "#fffafa" )
            ]}).then(m=>setTimeout(() => m.delete(), 1000 * 30))
            .catch(err => {return console.log(err)})
        }
        
        const Data = {
            guildID: message.guild.id, 
            guildName: message.guild.name,
            userID: null, 
            userName: null,
            actionType: "Mute", 
            actionReason: null,
            Expire: null,
            actionLength: null,
            moderator: message.author.tag,
            moderatorID: message.author.id,
        }

        const member = new Member(message, client).getMember({member: args[0]})
        if(member == false ) return
        checkMemberPermission(member);

        function checkMemberPermission(Member){
            if(Member){
                const authorHighestRole = message.guild.members.resolve( client.user ).roles.highest.position;
                const mentionHighestRole = Member.roles.highest.position;

                if(Member.id === message.author.id){
                    return message.channel.send({embeds: [
                        new Discord.MessageEmbed()
                            .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: false, size: 1024, type: 'png'}))
                            .setDescription("You can't mute yourself.")
                            .setColor("RED")
                    ]}).then(m=>setTimeout(() => m.delete(), 1000 * 20))
                    .catch(err => {return console.log(err)})
                }else if(Member.permissions.any(["MANAGE_MESSAGES", "MANAGE_ROLES", "MANAGE_GUILD", "ADMINISTRATOR"], { checkAdmin: true, checkOwner: true })){
                    return message.channel.send({embeds: [
                        new Discord.MessageEmbed()
                            .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: false, size: 1024, type: 'png'}))
                            .setDescription("Can't mute an Admin/Moderator.")
                            .setColor("RED")
                    ]}).then(m=>setTimeout(() => m.delete(), 1000 * 20))
                    .catch(err => {return console.log(err)})
                }else if(mentionHighestRole >= authorHighestRole) {
                    return message.channel.send({embeds: [
                        new Discord.MessageEmbed()
                            .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: false, size: 1024, type: 'png'}))
                            .setDescription("Can't mute a member higher or equal role as me.")
                            .setColor("RED")
                    ]}).then(m=> setTimeout(() => m.delete(), 1000 * 20))
                    .catch(err => {return console.log(err)})
                }else {
                    Data['userID'] = Member.user.id
                    Data['userName'] = Member.user.tag
                    return PreviousMuteCheck(Member)
                }
            }
        }

        function PreviousMuteCheck(Member){
            FindData(Member).then( value => {
                if(value === true){
                    let NotMuted = new Discord.MessageEmbed()
                    .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: false, size: 1024, type: 'png'}))
                    .setDescription(`${Member} is already muted`)
                    .setColor("RED")

                    return message.channel.send({embeds: [NotMuted]}).catch(err => {return console.log(err)})
                }else if(value === false){
                    DurationMaker()
                    findMuteRole(Member)
                }
            })
        }

        async function FindData(Member){
            const previosMute = await LogsDatabase.findOne({
                userID: Member.user.id,
                guildID: message.guild.id,
                Muted: true
            })

            if(previosMute){
                return true
            }else {
                return false
            }
        }

        function DurationMaker(){
            if(!args[1]){
                return
            }
            const duration = args[1]
            const timeex = /[\d*]/g;

            if(!duration.match(timeex)){
                return
            }else if(!duration.match(/^\d/)){
                return
            }else {
                let muteLength = ms( duration );
                const durationFormat = ms(muteLength, { long: true })
                const muteDuration = new Date();
                muteDuration.setMilliseconds(muteDuration.getMilliseconds() + muteLength);

                Data['Expire'] = muteDuration
                Data['actionLength'] = durationFormat
            }
        }

        async function findMuteRole(Member){
            const muteRole = await message.guild.roles.cache.find(r => r.name === 'Muted') || await message.guild.roles.cache.find(r => r.name === 'muted')
            if( !muteRole ){
                if(guild.me.permissions.any(["MANAGE_ROLES", "ADMINISTRATOR"])){
                    try {
                        await message.guild.roles.create({
                                name: 'Muted',
                                color: '#000000',
                                permissions: [],
                                reason: 'sadbot mute role creation'
                        }).then(m => {
                            overWriteChannels(m)
                            MuteMember(Member, m) 
                        }).catch(err => {return console.log(err)})
                        
                    }catch(err){
                        console.log(err)
                        return message.channel.send({embed: [new Discord.MessageEmbed()
                            .setDescription(err.message)
                            .setColor("RED")
                        ]}).catch(err => {return console.log(err)})
                    }
                }else {
                    return channel.send({embeds: [new Discord.MessageEmbed()
                        .setDescription("Missing permission to create **Muted** role. | Please provide permission or create a role called **Muted**")
                        .setColor("#ff303e")
                    ]
                    }).catch(err => {return console.log(err)})
                }
            }else {
                let botRole = message.guild.members.resolve( client.user ).roles.highest.position;
                if(muteRole.position > botRole){
                    return channel.send({embeds: [new Discord.MessageEmbed()
                        .setDescription("Muted role is above my highest role. I can't add a role higher than me")
                        .setColor("RED")
                    ]
                    }).catch(err => {return console.log(err)})
                }
               MuteMember(Member, muteRole) 
            }
        }

        async function MuteMember(Member, muteRole){
            const muteReason = content.split(/\s+/).slice(3).join(" ") || 'No reason provided'
            if(message.content.length >= 250) {
                let failed = new Discord.MessageEmbed()
                .setDescription("Reason can't be longer than 250 characters")
                .setColor('#ff303e')
                return message.channel.send({embeds: [failed]})
                .catch(err => {return console.log(err)})
            }

            if(Member.roles.cache.has(muteRole.id)){
                await Member.roles.remove(muteRole.id).catch(err => {return console.log(err)})
                await Member.roles.add(muteRole.id).catch(err => {return console.log(err)})

                let successEmbed = new Discord.MessageEmbed()
                    .setDescription(`${Member.user} is now Muted | ${muteReason}`)
                    .setColor("#45f766")
                channel.send({embeds: [successEmbed]})
                .then(m =>setTimeout(() => m.delete(), 1000 * 30))
                .catch(err => {return console.log(err)})
                Data['actionReason'] = muteReason
            }else {
                Member.roles.add(muteRole.id).catch(err => {return console.log(err)})
                let successEmbed = new Discord.MessageEmbed()
                    .setDescription(`${Member.user} is now Muted | ${muteReason}`)
                    .setColor("#45f766")
                channel.send({embeds: [successEmbed]})
                .then(m =>setTimeout(() => m.delete(), 1000 * 30))
                .catch(err => {return console.log(err)})
                Data['actionReason'] = muteReason
            }
            CreateLog(Member)
        }

        async function CreateLog(Member){
            try {
                let muteEmbed = new Discord.MessageEmbed()
                .setAuthor({
                    name: "Mute",
                    iconURL: Member.user.displayAvatarURL({format: 'png'})
                })
                .addField("User", `\`\`\` ${Member.user.tag} \`\`\``.toString(), true)
                .addField("Moderator", `\`\`\` ${message.author.tag} \`\`\``.toString(), true)
                .addField("Duration", `\`\`\` ${Data.actionLength} \`\`\``.toString(), true)
                .addField("Reason", `\`\`\` ${Data.actionReason} \`\`\``)
                .setColor("RED")
                .setFooter({
                    text: `User ID: ${Member.user.id}`
                })
                .setTimestamp()

                let logmanager = new LogManager(message.guild, client);
                logmanager.logCreate({data: Data, user: Member});
                logmanager.sendData({type: 'actionlog', data: muteEmbed, client});

                ModStatus({type: "Mute", guild: message.guild, member: message.author, content: content})
            } catch (err) {
                return console.log(err)
            }
        }

        async function overWriteChannels(data){
            if(guild.me.permissions.any(["MANAGE_CHANNELS", "ADMINISTRATOR"])){
                await guild.channels.cache.forEach(channel => {
                    if(channel.permissionsFor(guild.me).has("MANAGE_CHANNELS")){
                        channel.permissionOverwrites.edit(data.id,
                        {
                            'SEND_MESSAGES': false,
                            'ADD_REACTIONS': false,
                            'VIEW_CHANNEL': false,
                        }, "Muted role overWrites")
                    }
                })
            }else {
                let successEmbed = new Discord.MessageEmbed()
                    .setDescription("Missing permission to create ovrride for **Muted** role. | Require **MANAGE CHANNELS** permission to deny **Send Message** permission for Muted roles")
                    .setColor("#ff303e")
                return channel.send({embeds: [successEmbed]}).catch(err => {return console.log(err)})
            }
        }
    }
}