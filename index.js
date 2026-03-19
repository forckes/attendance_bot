require('dotenv').config()

const {
	Client,
	GatewayIntentBits,
	SlashCommandBuilder,
	Routes,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js')

const { REST } = require('@discordjs/rest')

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMembers,
	],
})

const commands = [
	new SlashCommandBuilder()
		.setName('attendance')
		.setDescription('Collect voice channel attendance')
		.addIntegerOption(option =>
			option
				.setName('number')
				.setDescription('Cvičenie number (1-14)')
				.setRequired(true),
		)
		.toJSON(),
]

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)

;(async () => {
	try {
		console.log('Registering global commands...')
		await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
			body: commands,
		})
		console.log('Global commands registered!')
	} catch (err) {
		console.error(err)
	}
})()

client.once('clientReady', () => {
	console.log(`Logged in as ${client.user.tag}`)
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand() && !interaction.isButton()) return

	if (
		interaction.isChatInputCommand() &&
		interaction.commandName === 'attendance'
	) {
		const number = interaction.options.getInteger('number')

		if (number < 1 || number > 14) {
			return interaction.reply({
				content: 'Number must be between 1 and 14',
				ephemeral: true,
			})
		}

		const member = interaction.member
		if (!member.voice.channel) {
			return interaction.reply({
				content: 'You must be in a voice channel!',
				ephemeral: true,
			})
		}

		const channel = member.voice.channel

		const members = channel.members
			.map(m => m.displayName)
			.sort((a, b) => a.localeCompare(b))

		const now = new Date()
		const date = now.toLocaleDateString('en-GB')
		const time = now.toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit',
		})

		const list =
			members.length > 0
				? members.map(name => `${name}`).join('\n')
				: 'No participants'

		const embed = new EmbedBuilder()
			.setColor(0x5865f2)
			.setTitle(`📋 Cvičenie ${number}`)
			.setDescription(
				`📅 Date: ${date}\n Voice channel: ${channel.name}\n👥 Total: ${members.length}\n\n⬇👥 Participants:`,
			)
			.addFields({ name: '\u200B', value: list })
			.setTimestamp()

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('copy_names')
				.setLabel('📋 Copy names')
				.setStyle(ButtonStyle.Primary),
		)

		await interaction.reply({ embeds: [embed], components: [row] })
	}

	if (interaction.isButton() && interaction.customId === 'copy_names') {
		const message = interaction.message.embeds[0]
		if (!message)
			return interaction.reply({ content: 'No names found', ephemeral: true })

		const namesField = message.fields.find(f => f.value)
		const namesList = namesField ? namesField.value : 'No participants'

		await interaction.user.send(`${namesList}`)
		await interaction.reply({
			content: '✅ Names sent to your Direct Messages!',
			ephemeral: true,
		})
	}
})

client.login(process.env.TOKEN)

const express = require('express')
const app = express()

const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
	res.send('Bot is running!')
})

app.listen(PORT, '0.0.0.0', () => {
	console.log(`Server running on port ${PORT}`)
})
