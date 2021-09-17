const { readdirSync } = require("fs");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const cmds = []
module.exports = client => {
  readdirSync("./slashCommands/").forEach(dir => {

    const commands = readdirSync(`./slashCommands/${dir}/`).filter(file =>
      file.endsWith(".js")
    );
    for (let file of commands) {
      let pull = require(`../slashCommands/${dir}/${file}`);

      if (pull.data) {
        client.slash.set(pull.data.name, pull);
        cmds.push(pull.data.toJSON())
      } else {
          console.log('Missing name')
        continue;
      }
    }
  });

const clientId = '874975916592332820';
const guildId = '874975341347762206';

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: cmds },
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();
};