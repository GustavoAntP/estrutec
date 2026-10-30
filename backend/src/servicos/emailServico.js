const nodemailer =
  require("nodemailer");

function criarTransportador() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,

    port:
      Number(
        process.env.SMTP_PORT
      ) || 587,

    secure:
      process.env.SMTP_SECURE ===
      "true",

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function enviarEmailRecuperacao({
  destinatario,
  nome,
  link,
}) {
  const transportador =
    criarTransportador();

  await transportador.sendMail({
    from:
      process.env.SMTP_FROM ||
      process.env.SMTP_USER,

    to: destinatario,

    subject:
      "Recuperação de senha - Estrutec",

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 520px;
          margin: 0 auto;
          color: #171717;
        "
      >
        <div
          style="
            border-top: 5px solid #F97316;
            padding-top: 24px;
          "
        >
          <h2>
            Recuperação de senha
          </h2>

          <p>
            Olá, ${nome}.
          </p>

          <p>
            Recebemos uma solicitação
            para redefinir a senha da sua
            conta no Estrutec.
          </p>

          <p>
            Clique no botão abaixo para
            criar uma nova senha.
          </p>

          <a
            href="${link}"
            style="
              display: inline-block;
              margin: 16px 0;
              padding: 12px 20px;
              background: #F97316;
              color: #FFFFFF;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            "
          >
            Redefinir senha
          </a>

          <p
            style="
              color: #737373;
              font-size: 13px;
            "
          >
            Este link é válido por
            30 minutos.
          </p>

          <p
            style="
              color: #737373;
              font-size: 13px;
            "
          >
            Se você não solicitou esta
            alteração, ignore este e-mail.
          </p>
        </div>
      </div>
    `,
  });
}

module.exports = {
  enviarEmailRecuperacao,
};