const nodemailer = require('nodemailer');

const getMailConfig = () => {
	const host = String(process.env.SMTP_HOST || '').trim();
	const port = Number(String(process.env.SMTP_PORT || '').trim());
	const user = String(process.env.SMTP_USER || '').trim();
	// App passwords are often copied with spaces; normalize to 16-char token.
	const pass = String(process.env.SMTP_PASS || '').replace(/\s+/g, '');
	const from = String(process.env.SMTP_FROM || user).trim();

	return { host, port, user, pass, from };
};

const isMailConfigured = () => {
	const { host, port, user, pass } = getMailConfig();
	return Boolean(host && port && user && pass);
};

const createTransport = () => {
	const { host, port, user, pass } = getMailConfig();

	return nodemailer.createTransport({
		host,
		port,
		secure: port === 465,
		requireTLS: port === 587,
		auth: {
			user,
			pass,
		},
	});
};

const verifyMailer = async () => {
	if (!isMailConfigured()) {
		return {
			ok: false,
			reason: 'Mailer not configured. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS.',
		};
	}

	try {
		const transporter = createTransport();
		await transporter.verify();
		return { ok: true };
	} catch (error) {
		return {
			ok: false,
			reason: error.message,
		};
	}
};

const sendEmail = async ({ to, subject, text }) => {
	if (!isMailConfigured()) {
		throw new Error('Mailer not configured. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS.');
	}

	const { from } = getMailConfig();
	const transporter = createTransport();

	await transporter.sendMail({
		from,
		to,
		subject,
		text,
	});

	return { sent: true };
};

module.exports = {
	sendEmail,
	isMailConfigured,
	verifyMailer,
};
